import { EventBus } from '../events/EventBus'
import { findInvalidMeasurements } from '../measurements/measurements'
import type {
  AnySimulationDefinition,
  MeasurementsFor,
  MeasurementValues,
  RunProgress,
  StateOf,
  VariableIssue,
  VariableResolution,
  VariableValues,
  VarsOf,
} from '../types'
import { resolveVariables } from '../variables/variables'

/**
 * Lifecycle (continuous and discrete models):
 *
 *   ready ──start──▶ running ──pause──▶ paused
 *                      ▲  │               │
 *                      └──┼────resume─────┘
 *                         ▼
 *             completed / faulted
 *
 * `stepOnce()` moves ready/paused → paused one step at a time.
 * `reset()` returns any non-destroyed runtime to `ready`; `destroy()` is terminal.
 * Static models stay `ready`: their state changes only through variables.
 */
export type SimulationStatus = 'ready' | 'running' | 'paused' | 'completed' | 'faulted' | 'destroyed'

export interface RuntimeEvents<D extends AnySimulationDefinition> {
  status: { readonly previous: SimulationStatus; readonly current: SimulationStatus }
  variables: { readonly values: VarsOf<D> }
  reset: { readonly variables: VarsOf<D> }
  fault: { readonly message: string }
  /** Emitted by `stepOnce()` only; continuous `update()` deliberately emits nothing per frame. */
  stepped: { readonly progress: RunProgress }
}

/** Serialisable view of a runtime, suitable for UI, experiment records and AI context. */
export interface RuntimeSnapshot<D extends AnySimulationDefinition> {
  readonly simulationId: string
  readonly domain: string
  readonly status: SimulationStatus
  readonly progress: RunProgress
  readonly variables: VarsOf<D>
  readonly measurements: MeasurementsFor<D>
}

export interface RuntimeOptions {
  initialVariables?: Readonly<Record<string, unknown>>
}

export class VariableValidationError extends Error {
  readonly issues: readonly VariableIssue[]

  constructor(issues: readonly VariableIssue[]) {
    super(`Invalid variables: ${issues.map((i) => `${i.variableId}: ${i.message}`).join('; ')}`)
    this.name = 'VariableValidationError'
    this.issues = issues
  }
}

/**
 * Real-time delta cap. Larger frame gaps (tab switches, breakpoints) are
 * dropped rather than simulated, so the model never "jumps" through time.
 */
export const MAX_FRAME_DELTA = 0.1
export const MIN_TIME_SCALE = 0.05
export const MAX_TIME_SCALE = 8
/** Relative tolerance when comparing accumulated real time with a step interval. */
const ACCUMULATOR_TOLERANCE = 1e-9

type Model = AnySimulationDefinition['model']

/**
 * Runs one simulation instance of any domain. Owns lifecycle, validated
 * variables and progression; delegates all science to the definition's pure
 * model.
 *
 * Continuous models advance with a fixed-step accumulator and discrete models
 * with a fixed real-time interval, so results never depend on frame rate.
 */
export class SimulationRuntime<D extends AnySimulationDefinition> {
  readonly definition: D
  readonly events = new EventBus<RuntimeEvents<D>>()

  #status: SimulationStatus = 'ready'
  #variables: VarsOf<D>
  #state: StateOf<D>
  #measurements: MeasurementsFor<D>
  #stepCount = 0
  #accumulator = 0
  #timeScale = 1

  constructor(definition: D, options: RuntimeOptions = {}) {
    this.definition = definition
    const resolution = resolveVariables(definition.variables, options.initialVariables)
    if (!resolution.ok) throw new VariableValidationError(resolution.issues)
    this.#variables = resolution.values as VarsOf<D>
    try {
      this.#state = this.#createInitialState()
      this.#measurements = this.#measure()
    } catch (error) {
      throw new Error(`Simulation "${definition.id}" has an invalid initial state.`, { cause: error })
    }
  }

  get status(): SimulationStatus {
    return this.#status
  }

  get progress(): RunProgress {
    const model = this.#model
    switch (model.kind) {
      case 'continuous':
        return { kind: 'time', seconds: this.#stepCount * model.fixedTimeStep }
      case 'discrete':
        return { kind: 'stages', count: this.#stepCount }
      case 'static':
        return { kind: 'none' }
    }
  }

  get variables(): VarsOf<D> {
    return this.#variables
  }

  /** Current model state. Read-only by contract; views read this every frame. */
  get state(): StateOf<D> {
    return this.#state
  }

  get measurements(): MeasurementsFor<D> {
    return this.#measurements
  }

  get timeScale(): number {
    return this.#timeScale
  }

  /** True when the model evolves (continuous or discrete) and so can be started. */
  get isDynamic(): boolean {
    return this.#model.kind !== 'static'
  }

  /** Slow motion (< 1) or fast forward (> 1). Never changes the model's step size. */
  setTimeScale(scale: number): boolean {
    if (!Number.isFinite(scale) || scale < MIN_TIME_SCALE || scale > MAX_TIME_SCALE) return false
    this.#timeScale = scale
    return true
  }

  start(): boolean {
    return this.isDynamic && this.#transition(['ready'], 'running')
  }

  pause(): boolean {
    return this.#transition(['running'], 'paused')
  }

  resume(): boolean {
    return this.#transition(['paused'], 'running')
  }

  /** Advances exactly one step or stage, for frame-by-frame study. */
  stepOnce(): boolean {
    if (!this.isDynamic || (this.#status !== 'ready' && this.#status !== 'paused')) return false
    this.#setStatus('paused')
    this.#safely(() => {
      if (this.#advanceOnce()) this.#setStatus('completed')
      this.#measurements = this.#measure()
    })
    this.events.emit('stepped', { progress: this.progress })
    return true
  }

  /**
   * Advances by a real-time delta in seconds, typically called once per
   * rendered frame. No-op unless running.
   */
  update(deltaSeconds: number): void {
    if (this.#status !== 'running' || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return

    const model = this.#model
    const interval =
      model.kind === 'continuous'
        ? model.fixedTimeStep
        : model.kind === 'discrete'
          ? model.autoAdvanceInterval
          : undefined
    if (interval === undefined) return

    this.#accumulator += Math.min(deltaSeconds, MAX_FRAME_DELTA) * this.#timeScale
    // Summed frame deltas carry rounding error (10 × 0.05 = 0.49999…); without a
    // tolerance a step due exactly on a frame boundary would slip a frame.
    const threshold = interval * (1 - ACCUMULATOR_TOLERANCE)
    this.#safely(() => {
      while (this.#accumulator >= threshold) {
        this.#accumulator -= interval
        if (this.#advanceOnce()) {
          this.#accumulator = 0
          this.#setStatus('completed')
          break
        }
      }
      this.#measurements = this.#measure()
    })
  }

  /**
   * Validates and applies variable changes, then resets the run so every
   * result corresponds to exactly one set of initial conditions.
   */
  setVariables(changes: Readonly<Record<string, unknown>>): VariableResolution<VarsOf<D>> {
    if (this.#status === 'destroyed') {
      return { ok: false, issues: [{ variableId: '*', message: 'Simulation has been destroyed.' }] }
    }
    const resolution = resolveVariables(this.definition.variables, { ...this.#variables, ...changes })
    if (!resolution.ok) return resolution

    const values = resolution.values as VarsOf<D>
    const previous = this.#vars
    const changed = Object.keys(changes).filter((id) => previous[id] !== (values as VariableValues)[id])
    const live = new Set<string>(this.definition.liveVariables ?? [])
    // Labs with live variables treat an unchanged value as a no-op rather than a restart.
    if (changed.length === 0 && live.size > 0) return { ok: true, values: this.#variables }
    this.#variables = values

    if (changed.length > 0 && changed.every((id) => live.has(id))) {
      // Steady conditions changed: keep the run and its progress, re-measure in place,
      // then notify, so listeners never read measurements from the old values.
      this.#safely(() => {
        this.#measurements = this.#measure()
      })
      this.events.emit('variables', { values })
      return { ok: true, values }
    }
    this.events.emit('variables', { values })
    this.reset()
    return { ok: true, values }
  }

  /** True when `id` names a live variable (adjustable while running; see `liveVariables`). */
  isLiveVariable(id: string): boolean {
    return this.definition.liveVariables?.includes(id) ?? false
  }

  /** Returns to the initial state with the current variables. */
  reset(): boolean {
    if (this.#status === 'destroyed') return false
    this.#stepCount = 0
    this.#accumulator = 0
    const ok = this.#safely(() => {
      this.#state = this.#createInitialState()
      this.#measurements = this.#measure()
    })
    if (!ok) return false
    this.#setStatus('ready')
    this.events.emit('reset', { variables: this.#variables })
    return true
  }

  destroy(): void {
    if (this.#status === 'destroyed') return
    this.#setStatus('destroyed')
    this.events.clear()
  }

  getSnapshot(): RuntimeSnapshot<D> {
    return {
      simulationId: this.definition.id,
      domain: this.definition.domain,
      status: this.#status,
      progress: this.progress,
      variables: this.#variables,
      measurements: this.#measurements,
    }
  }

  /** The model with its concrete types erased, so its `kind` can be narrowed. */
  get #model(): Model {
    return this.definition.model
  }

  get #vars(): VariableValues {
    return this.#variables
  }

  /** Performs one step or stage. Returns true when the run has finished. */
  #advanceOnce(): boolean {
    const model = this.#model
    switch (model.kind) {
      case 'continuous': {
        this.#state = model.step(this.#state, model.fixedTimeStep, this.#vars) as StateOf<D>
        this.#stepCount += 1
        const elapsed = this.#stepCount * model.fixedTimeStep
        return (
          model.isComplete?.(this.#state, this.#vars) === true ||
          (model.maxDuration !== undefined && elapsed >= model.maxDuration)
        )
      }
      case 'discrete':
        this.#state = model.advance(this.#state, this.#vars) as StateOf<D>
        this.#stepCount += 1
        return model.isComplete?.(this.#state, this.#vars) === true
      case 'static':
        return true
    }
  }

  #createInitialState(): StateOf<D> {
    return this.#model.createInitialState(this.#vars) as StateOf<D>
  }

  #measure(): MeasurementsFor<D> {
    const values: MeasurementValues = this.#model.measure(this.#state, this.#vars)
    const invalid = findInvalidMeasurements(this.definition.measurements, values)
    if (invalid.length > 0) throw new Error(`Model produced invalid measurements: ${invalid.join(' ')}`)
    return values as MeasurementsFor<D>
  }

  /** Runs model code; any exception or invalid result faults the run instead of crashing the app. */
  #safely(action: () => void): boolean {
    try {
      action()
      return true
    } catch (error) {
      this.#accumulator = 0
      this.#setStatus('faulted')
      this.events.emit('fault', { message: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  #transition(from: readonly SimulationStatus[], to: SimulationStatus): boolean {
    if (!from.includes(this.#status)) return false
    this.#setStatus(to)
    return true
  }

  #setStatus(next: SimulationStatus): void {
    const previous = this.#status
    if (previous === next) return
    this.#status = next
    this.events.emit('status', { previous, current: next })
  }
}

/** A runtime whose concrete simulation type has been erased. */
export type AnySimulationRuntime = SimulationRuntime<AnySimulationDefinition>
