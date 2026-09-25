import { collision1dPackage } from './physics/collision-1d'
import { doubleSlitPackage } from './physics/double-slit'
import { projectileMotionPackage } from './physics/projectile-motion'
import { rollingRacePackage } from './physics/rolling-race'
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
export const simulationPackages: readonly SimulationPackage[] = [
  projectileMotionPackage,
  doubleSlitPackage,
  collision1dPackage,
  rollingRacePackage,
]

export { defineSimulationPackage } from './types'
export type { OverlayDescriptor, SceneTone, SimulationPackage } from './types'
