import type { MeasurementDefinition, SimulationDefinition, VariableDefinition } from '../types'

/**
 * Identity helper that gives simulation authors full type inference:
 * variable ids become typed keys of `vars`, and `measure()` must return
 * exactly the declared measurement ids.
 *
 * @example
 * export const pendulum = defineSimulation({
 *   variables: [{ kind: 'number', id: 'length', unit: 'm', ... }],
 *   model: { createInitialState: (vars) => ({ theta: 0, omega: 0, length: vars.length }), ... },
 *   ...
 * })
 */
export function defineSimulation<
  const TVarDefs extends readonly VariableDefinition[],
  const TMeasDefs extends readonly MeasurementDefinition[],
  TState,
>(
  definition: SimulationDefinition<TVarDefs, TMeasDefs, TState>,
): SimulationDefinition<TVarDefs, TMeasDefs, TState> {
  return definition
}
