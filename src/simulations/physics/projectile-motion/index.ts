import { LabEnvironment } from '@/rendering'
import { defineSimulationPackage } from '@/simulations/types'
import { projectileMotion } from './definition'
import { projectileOverlays } from './overlays'

export const projectileMotionPackage = defineSimulationPackage({
  definition: projectileMotion,
  loadView: () => import('./View'),
  // The projectile testing range: level ground with a metre grid, open lighting
  // and orientation axes — the environment this lab has always used.
  Environment: LabEnvironment,
  overlays: projectileOverlays,
})
