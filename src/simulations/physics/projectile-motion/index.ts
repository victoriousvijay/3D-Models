import { defineSimulationPackage } from '@/simulations/types'
import { projectileMotion } from './definition'
import { projectileOverlays } from './overlays'

export const projectileMotionPackage = defineSimulationPackage({
  definition: projectileMotion,
  loadView: () => import('./View'),
  overlays: projectileOverlays,
})
