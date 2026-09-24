import { useCallback, useSyncExternalStore } from 'react'
import type { AnySimulationRuntime, SimulationStatus } from '@/engine'

/** Subscribes a component to a runtime's lifecycle status (changes at human speed, not per frame). */
export function useRuntimeStatus(runtime: AnySimulationRuntime): SimulationStatus {
  const subscribe = useCallback((notify: () => void) => runtime.events.on('status', notify), [runtime])
  return useSyncExternalStore(subscribe, () => runtime.status)
}
