import { createContext, useContext } from 'react'
import type { AnySimulationDefinition, AnySimulationRuntime, SimulationRuntime } from '@/engine'

/** The runtime of the simulation currently open. R3F bridges this context into the canvas. */
export const SimulationRuntimeContext = createContext<AnySimulationRuntime | null>(null)

function isRuntimeOf<D extends AnySimulationDefinition>(
  runtime: AnySimulationRuntime,
  definition: D,
): runtime is SimulationRuntime<D> {
  return runtime.definition === definition
}

/**
 * Returns the open runtime, typed for the given definition. Passing the
 * definition makes the type narrowing a real runtime check rather than a cast.
 */
export function useSimulationRuntime<D extends AnySimulationDefinition>(definition: D): SimulationRuntime<D> {
  const runtime = useContext(SimulationRuntimeContext)
  if (!runtime) throw new Error('useSimulationRuntime must be used inside an open simulation.')
  if (!isRuntimeOf(runtime, definition)) {
    throw new Error(`Runtime belongs to "${runtime.definition.id}", not "${definition.id}".`)
  }
  return runtime
}
