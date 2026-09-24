import { EventBus } from '../events/EventBus'
import type {
  MeasurementValue,
  MeasurementValues,
  RunProgress,
  VariableValue,
  VariableValues,
} from '../types'

/** One recorded trial: the initial conditions and the observed outcome. */
export interface ExperimentRecord {
  readonly id: string
  readonly simulationId: string
  readonly label?: string
  /** ISO-8601 wall-clock timestamp. */
  readonly recordedAt: string
  /** How far the run had progressed when the observations were taken. */
  readonly progress: RunProgress
  readonly variables: VariableValues
  readonly measurements: MeasurementValues
}

/** The parts of a runtime snapshot an experiment needs. */
export interface ExperimentSource {
  readonly simulationId: string
  readonly progress: RunProgress
  readonly variables: VariableValues
  readonly measurements: MeasurementValues
}

export interface ExperimentLogEvents {
  recorded: ExperimentRecord
  removed: { readonly id: string }
}

export interface ExperimentLogOptions {
  createId?: () => string
  now?: () => Date
}

const copyValue = (value: MeasurementValue): MeasurementValue =>
  typeof value === 'object' ? (Object.freeze([...value]) as MeasurementValue) : value

/**
 * In-memory list of experiments for the current session. Persistence and
 * the AI tutor observe it through `events` rather than being called directly.
 */
export class ExperimentLog {
  readonly events = new EventBus<ExperimentLogEvents>()
  readonly #records: ExperimentRecord[] = []
  readonly #createId: () => string
  readonly #now: () => Date

  constructor(options: ExperimentLogOptions = {}) {
    this.#createId = options.createId ?? (() => crypto.randomUUID())
    this.#now = options.now ?? (() => new Date())
  }

  record(source: ExperimentSource, label?: string): ExperimentRecord {
    const measurements = Object.fromEntries(
      Object.entries(source.measurements).map(([id, value]) => [id, copyValue(value)]),
    )
    const record: ExperimentRecord = Object.freeze({
      id: this.#createId(),
      simulationId: source.simulationId,
      ...(label === undefined ? {} : { label }),
      recordedAt: this.#now().toISOString(),
      progress: Object.freeze({ ...source.progress }),
      variables: Object.freeze({ ...source.variables }),
      measurements: Object.freeze(measurements),
    })
    this.#records.push(record)
    this.events.emit('recorded', record)
    return record
  }

  list(simulationId?: string): readonly ExperimentRecord[] {
    return simulationId === undefined
      ? [...this.#records]
      : this.#records.filter((r) => r.simulationId === simulationId)
  }

  get(id: string): ExperimentRecord | undefined {
    return this.#records.find((r) => r.id === id)
  }

  remove(id: string): boolean {
    const index = this.#records.findIndex((r) => r.id === id)
    if (index === -1) return false
    this.#records.splice(index, 1)
    this.events.emit('removed', { id })
    return true
  }
}

export interface ExperimentComparison {
  readonly variables: readonly {
    readonly id: string
    readonly a: VariableValue | undefined
    readonly b: VariableValue | undefined
    readonly changed: boolean
  }[]
  readonly measurements: readonly {
    readonly id: string
    readonly a: MeasurementValue | undefined
    readonly b: MeasurementValue | undefined
    readonly changed: boolean
    /**
     * b − a for scalars, component-wise for equal-length vectors,
     * `null` for categories or when either side is missing.
     */
    readonly difference: number | readonly number[] | null
  }[]
}

function difference(
  a: MeasurementValue | undefined,
  b: MeasurementValue | undefined,
): number | readonly number[] | null {
  if (typeof a === 'number' && typeof b === 'number') return b - a
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.map((component, i) => (b[i] ?? component) - component)
  }
  return null
}

function sameValue(a: MeasurementValue | undefined, b: MeasurementValue | undefined): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((c, i) => c === b[i])
  return a === b
}

/**
 * Structured diff of two trials of the same simulation. Backs the AI tutor's
 * `compareExperiments` tool and any comparison UI, in any domain.
 */
export function compareExperiments(a: ExperimentRecord, b: ExperimentRecord): ExperimentComparison {
  if (a.simulationId !== b.simulationId) {
    throw new Error(`Cannot compare experiments from "${a.simulationId}" and "${b.simulationId}".`)
  }
  const union = (x: object, y: object) => [...new Set([...Object.keys(x), ...Object.keys(y)])]

  return {
    variables: union(a.variables, b.variables).map((id) => {
      const va = a.variables[id]
      const vb = b.variables[id]
      return { id, a: va, b: vb, changed: va !== vb }
    }),
    measurements: union(a.measurements, b.measurements).map((id) => {
      const ma = a.measurements[id]
      const mb = b.measurements[id]
      return { id, a: ma, b: mb, changed: !sameValue(ma, mb), difference: difference(ma, mb) }
    }),
  }
}
