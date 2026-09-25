import { create } from 'zustand'
import type { ExplanationAnchor, SimulationStatus } from '@/engine'

/**
 * Application-level state that changes at human speed (selection, which
 * simulation is open, lifecycle status, overlay visibility). Per-frame
 * simulation values are deliberately NOT stored here: views read them from
 * the runtime inside `useFrame`, which avoids a React render per frame.
 */
interface LabState {
  activeSimulationId: string | null
  status: SimulationStatus | null
  selectedObjectId: string | null
  /** Set when the open simulation failed to load or render. */
  loadError: string | null
  /** Overlays the learner has hidden, by overlay id. Overlays are visible unless listed. */
  hiddenOverlays: readonly string[]
  /**
   * What the explanation panel is focused on. Selecting an object focuses it;
   * info buttons focus a variable or measurement; `null` shows the overview.
   */
  explanationFocus: ExplanationAnchor | null
  /** Grab mode: a left drag moves (pans) the view instead of rotating it; objects ignore clicks. */
  grabMode: boolean
  /** All floating panels hidden, leaving the scene and the toolbar. */
  panelsHidden: boolean
  /** Incremented to ask the canvas to return to the simulation's authored camera framing. */
  viewResetToken: number

  /** `hiddenOverlays`: overlays that start switched off for this simulation. */
  openSimulation: (id: string, hiddenOverlays?: readonly string[]) => void
  closeSimulation: () => void
  setStatus: (status: SimulationStatus | null) => void
  selectObject: (id: string | null) => void
  setLoadError: (message: string | null) => void
  toggleOverlay: (id: string) => void
  focusExplanation: (anchor: ExplanationAnchor | null) => void
  toggleGrabMode: () => void
  togglePanels: () => void
  resetView: () => void
}

const cleared = {
  selectedObjectId: null,
  loadError: null,
  hiddenOverlays: [],
  explanationFocus: null,
  grabMode: false,
  panelsHidden: false,
}

export const useLabStore = create<LabState>()((set) => ({
  activeSimulationId: null,
  status: null,
  viewResetToken: 0,
  ...cleared,

  openSimulation: (id, hiddenOverlays = []) => {
    set({ activeSimulationId: id, ...cleared, hiddenOverlays })
  },
  closeSimulation: () => {
    set({ activeSimulationId: null, status: null, ...cleared })
  },
  setStatus: (status) => {
    set({ status })
  },
  selectObject: (id) => {
    set({ selectedObjectId: id, explanationFocus: id === null ? null : { kind: 'object', id } })
  },
  focusExplanation: (anchor) => {
    set({ explanationFocus: anchor })
  },
  setLoadError: (message) => {
    set({ loadError: message })
  },
  toggleGrabMode: () => {
    set(({ grabMode }) => ({ grabMode: !grabMode }))
  },
  togglePanels: () => {
    set(({ panelsHidden }) => ({ panelsHidden: !panelsHidden }))
  },
  resetView: () => {
    set(({ viewResetToken }) => ({ viewResetToken: viewResetToken + 1 }))
  },
  toggleOverlay: (id) => {
    set(({ hiddenOverlays }) => ({
      hiddenOverlays: hiddenOverlays.includes(id)
        ? hiddenOverlays.filter((hidden) => hidden !== id)
        : [...hiddenOverlays, id],
    }))
  },
}))
