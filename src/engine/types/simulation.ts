import type { Explanation, Investigation } from './education'
import type { MeasurementDefinition, MeasurementsOf } from './measurements'
import type { InteractionDefinition, SceneConfig, SimulationObjectDefinition } from './scene'
import type { ValuesOf, VariableDefinition } from './variables'

/**
 * Behaviour shared by every model, whatever the domain. All functions are
 * pure: no rendering, React, wall-clock time or mutation of inputs, so the
 * science is unit-testable in Node. State should be plain serialisable data.
 */
interface ModelBase<TVars, TState, TMeasurements> {
  /** Builds the starting state from validated variable values. */
  createInitialState(vars: TVars): TState
  /** Derives measurements (in the units declared by the definitions) from the state. */
  measure(state: TState, vars: TVars): TMeasurements
}

/**
 * Evolves in continuous time: motion, orbits, reaction kinetics, heartbeat,
 * atmospheric circulation. Integrated with a fixed step for reproducibility.
 */
export interface ContinuousModel<TVars, TState, TMeasurements> extends ModelBase<
  TVars,
  TState,
  TMeasurements
> {
  readonly kind: 'continuous'
  /** Integration step in simulated seconds. Smaller is more accurate but costs more CPU. */
  readonly fixedTimeStep: number
  /** Simulated seconds after which a run completes automatically. */
  readonly maxDuration?: number
  /** Advances the state by `dt` simulated seconds. */
  step(state: TState, dt: number, vars: TVars): TState
  /** True when the run has naturally finished (projectile landed, reaction reached equilibrium). */
  isComplete?(state: TState, vars: TVars): boolean
}

/**
 * Progresses through distinct stages: cell-cycle phases, reaction-mechanism
 * steps, geological eras, iterations of a numerical method.
 */
export interface DiscreteModel<TVars, TState, TMeasurements> extends ModelBase<TVars, TState, TMeasurements> {
  readonly kind: 'discrete'
  /** Real seconds between stages while playing. Omit for manual stepping only. */
  readonly autoAdvanceInterval?: number
  advance(state: TState, vars: TVars): TState
  isComplete?(state: TState, vars: TVars): boolean
}

/**
 * Has no time evolution; state is a pure function of the variables:
 * molecular geometry, anatomy exploration, a function graph, a crystal lattice.
 */
export interface StaticModel<TVars, TState, TMeasurements> extends ModelBase<TVars, TState, TMeasurements> {
  readonly kind: 'static'
}

export type SimulationModel<TVars, TState, TMeasurements> =
  | ContinuousModel<TVars, TState, TMeasurements>
  | DiscreteModel<TVars, TState, TMeasurements>
  | StaticModel<TVars, TState, TMeasurements>

export type ModelKind = SimulationModel<unknown, unknown, unknown>['kind']

/** A reproducible starting configuration offered to the learner. */
export interface ExperimentPreset<TVars> {
  readonly id: string
  readonly title: string
  readonly description?: string
  readonly variables: Partial<TVars>
}

export interface SimulationDefinition<
  TVarDefs extends readonly VariableDefinition[],
  TMeasDefs extends readonly MeasurementDefinition[],
  TState,
> {
  /** Stable kebab-case identifier, e.g. `projectile-motion`. */
  readonly id: string
  /** Id of the registered domain engine this simulation belongs to, e.g. `physics`. */
  readonly domain: string
  readonly title: string
  readonly description: string
  readonly learningObjectives: readonly string[]
  /** Simplifications the model makes. Shown to learners and passed to the AI tutor. */
  readonly assumptions: readonly string[]
  readonly scene: SceneConfig
  readonly variables: TVarDefs
  readonly measurements: TMeasDefs
  readonly objects: readonly SimulationObjectDefinition[]
  readonly interactions: readonly InteractionDefinition[]
  readonly presets: readonly ExperimentPreset<ValuesOf<TVarDefs>>[]
  /**
   * Variables that describe steady conditions rather than initial conditions
   * (a screen's distance, a wavelength, a detector's position). Changing only
   * these updates the run in place — new values, re-measured — instead of
   * resetting it, and they stay adjustable while it runs. Omit for labs where
   * every result must come from one set of initial conditions.
   */
  readonly liveVariables?: readonly TVarDefs[number]['id'][]
  /** Contextual teaching content anchored to this simulation's objects, variables and measurements. */
  readonly explanations: readonly Explanation[]
  /** Questions that guide learners into experimenting ("Try this"). */
  readonly investigations: readonly Investigation[]
  readonly model: SimulationModel<ValuesOf<TVarDefs>, TState, MeasurementsOf<TMeasDefs>>
}

/** A simulation definition whose concrete variable/state types have been erased. */
export type AnySimulationDefinition = SimulationDefinition<
  readonly VariableDefinition[],
  readonly MeasurementDefinition[],
  unknown
>

export type VarsOf<D extends AnySimulationDefinition> = ValuesOf<D['variables']>
export type MeasurementsFor<D extends AnySimulationDefinition> = MeasurementsOf<D['measurements']>
export type StateOf<D extends AnySimulationDefinition> = ReturnType<D['model']['createInitialState']>

/**
 * How far a run has progressed, in the terms that make sense for its model:
 * simulated seconds, completed stages, or nothing for static models.
 */
export type RunProgress =
  | { readonly kind: 'time'; readonly seconds: number }
  | { readonly kind: 'stages'; readonly count: number }
  | { readonly kind: 'none' }
