import { defineSimulationPackage } from '@/simulations/types'
import { collision1d } from './definition'
import { AirTrackBench } from './Environment'
import { collisionOverlays } from './overlays'

export const collision1dPackage = defineSimulationPackage({
  definition: collision1d,
  loadView: () => import('./View'),
  // A frictionless air track on a lab bench: motion along one line.
  Environment: AirTrackBench,
  overlays: collisionOverlays,
})
