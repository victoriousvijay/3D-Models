import type { OverlayDescriptor } from '@/simulations/types'

/** Scene metres drawn per unit of each vector quantity. */
export const VELOCITY_SCALE = 0.5 // m per (m/s)
export const MOMENTUM_SCALE = 0.5 // m per (kg·m/s)

export const colors = {
  gliderA: '#2f5fd0',
  gliderB: '#e8710c',
  total: '#343a40',
  velocity: '#2f9e44',
  momentum: '#7048e8',
  energy: '#d6336c',
  contact: '#e03131',
} as const

export const collisionOverlays: readonly OverlayDescriptor[] = [
  {
    id: 'velocity',
    label: 'Velocity',
    color: colors.velocity,
    note: `1 m of arrow = ${1 / VELOCITY_SCALE} m/s. Drag the tip before starting.`,
  },
  {
    id: 'momentum',
    label: 'Momentum',
    color: colors.momentum,
    note: `1 m of arrow = ${1 / MOMENTUM_SCALE} kg·m/s`,
  },
  {
    id: 'board',
    label: 'Momentum & energy board',
    color: colors.energy,
    note: 'Live bars for A, B and the total; ticks mark the start',
  },
  { id: 'values', label: 'Values on the gliders', color: colors.total, note: 'Mass, velocity and momentum' },
  { id: 'contact', label: 'Collision marker', color: colors.contact, note: 'Where and when the bumpers met' },
]
