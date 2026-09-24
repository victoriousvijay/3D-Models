/**
 * Simulation SDK public API. Everything outside `src/engine` imports from here.
 *
 * This layer is framework-free and subject-agnostic (both enforced by ESLint):
 * it knows nothing about React, Three.js, or any scientific domain.
 */
export type * from './types'

export { EventBus } from './events/EventBus'
export type { HandlerErrorReporter } from './events/EventBus'

export { CORE_UNITS, toSI, unitsAreEquivalent } from './units/coreUnits'
export { vec2, vec3 } from './units/vectors'
export { checkVariableValue, resolveVariables, validateVariableDefinitions } from './variables/variables'
export { checkMeasurementValue, findInvalidMeasurements } from './measurements/measurements'

export { explanationsFor, validateExplanations, validateInvestigations } from './education/explanations'
export { defineDomain } from './domains/defineDomain'
export { DomainRegistrationError, DomainRegistry } from './domains/DomainRegistry'

export { defineSimulation } from './simulation/defineSimulation'
export { SimulationRegistry } from './simulation/SimulationRegistry'
export { SimulationDefinitionError, validateSimulationDefinition } from './simulation/validateDefinition'

export {
  MAX_FRAME_DELTA,
  MAX_TIME_SCALE,
  MIN_TIME_SCALE,
  SimulationRuntime,
  VariableValidationError,
} from './core/SimulationRuntime'
export type {
  AnySimulationRuntime,
  RuntimeEvents,
  RuntimeOptions,
  RuntimeSnapshot,
  SimulationStatus,
} from './core/SimulationRuntime'

export { compareExperiments, ExperimentLog } from './experiments/ExperimentLog'
export type {
  ExperimentComparison,
  ExperimentLogEvents,
  ExperimentLogOptions,
  ExperimentRecord,
  ExperimentSource,
} from './experiments/ExperimentLog'
