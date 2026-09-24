/** Rendering layer: subject-agnostic R3F building blocks shared by every simulation view. */
export { LabCanvas } from './LabCanvas'
export { LabEnvironment } from './LabEnvironment'
export { SimulationDriver } from './SimulationDriver'
export { SimulationRuntimeContext, useSimulationRuntime } from './runtimeContext'
export { sceneColors } from './theme'
export { useRuntimeStatus } from './useRuntimeStatus'

export { useSelectable } from './interaction/useSelectable'
export { usePlaneDrag } from './interaction/usePlaneDrag'
export { VectorArrow } from './overlays/VectorArrow'
export { Trail } from './overlays/Trail'
export { useOverlayVisible } from './overlays/useOverlayVisible'
