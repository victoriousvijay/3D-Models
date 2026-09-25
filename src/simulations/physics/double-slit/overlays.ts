import type { OverlayDescriptor } from '@/simulations/types'

export const doubleSlitOverlays: readonly OverlayDescriptor[] = [
  {
    id: 'map',
    label: 'Interference map',
    color: '#f5c542',
    note: 'Bright and dark bands from the true path difference; meets the screen at the fringes',
  },
  {
    id: 'ripples',
    label: 'Wavefronts',
    color: '#7aa9f5',
    note: 'Each slit as a new source; wavelength drawn enlarged',
  },
  {
    id: 'fringeLines',
    label: 'Fringe lines',
    color: '#e8edf2',
    note: 'Solid: constructive (Δ = nλ). Faint: destructive (Δ = (n + ½)λ)',
  },
  {
    id: 'profile',
    label: 'Intensity graph',
    color: '#f08c4a',
    note: 'I(y) across the screen: the cos² shape',
  },
  { id: 'markers', label: 'Screen markers', color: '#a9b5c1', note: 'Ruler (mm), fringe orders and β' },
]
