import { defineSimulationPackage } from '@/simulations/types'
import { doubleSlit } from './definition'
import { OpticsDarkroom } from './Environment'
import { doubleSlitOverlays } from './overlays'

export const doubleSlitPackage = defineSimulationPackage({
  definition: doubleSlit,
  loadView: () => import('./View'),
  // The optics darkroom: fringes need darkness.
  Environment: OpticsDarkroom,
  sceneTone: 'dark',
  overlays: doubleSlitOverlays,
})
