import { useCallback, useSyncExternalStore } from 'react'
import type { AnySimulationDefinition, SimulationRuntime, VarsOf } from '@/engine'

/**
 * Subscribes a view to a runtime's variables. Re-renders only when a variable
 * changes (human speed), so views can lay out geometry that depends on
 * conditions — never per frame.
 */
export function useRuntimeVariables<D extends AnySimulationDefinition>(
  runtime: SimulationRuntime<D>,
): VarsOf<D> {
  const subscribe = useCallback(
    (notify: () => void) => {
      const offVariables = runtime.events.on('variables', notify)
      const offReset = runtime.events.on('reset', notify)
      return () => {
        offVariables()
        offReset()
      }
    },
    [runtime],
  )
  return useSyncExternalStore(subscribe, () => runtime.variables)
}
