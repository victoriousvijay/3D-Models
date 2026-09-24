import { useLabStore } from '@/state/labStore'

/** Whether the learner has left an overlay (vector, trail, marker) switched on. */
export function useOverlayVisible(id: string): boolean {
  return useLabStore((state) => !state.hiddenOverlays.includes(id))
}
