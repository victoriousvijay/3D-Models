import { defineSimulationPackage } from '@/simulations/types'
import { rollingRace } from './definition'
import { RollingWorkshop } from './Environment'
import { rollingOverlays } from './overlays'

export const rollingRacePackage = defineSimulationPackage({
  definition: rollingRace,
  loadView: () => import('./View'),
  // A warm workshop with a three-lane incline: a race, not a range or a bench.
  Environment: RollingWorkshop,
  overlays: rollingOverlays,
})
