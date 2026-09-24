import { projectileMotionPackage } from './physics/projectile-motion'
import type { SimulationPackage } from './types'

/**
 * Every simulation the platform ships, across all domains.
 *
 * To add one, create `src/simulations/<domain>/<simulation-id>/` containing:
 *   definition.ts  — `defineSimulation({...})`: variables, measurements, pure model
 *   View.tsx       — default-exported R3F view using `useSimulationRuntime(definition)`
 *   index.ts       — `defineSimulationPackage({ definition, loadView: () => import('./View') })`
 * then add the package to this list. No engine changes are required.
 */
export const simulationPackages: readonly SimulationPackage[] = [projectileMotionPackage]

export { defineSimulationPackage } from './types'
export type { OverlayDescriptor, SimulationPackage } from './types'
