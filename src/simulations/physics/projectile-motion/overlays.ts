import type { OverlayDescriptor } from '@/simulations/types'

/** Scene metres drawn per unit of each vector quantity. */
export const VELOCITY_SCALE = 0.2 // m per (m/s)
export const ACCELERATION_SCALE = 0.3 // m per (m/s²)

export const overlayColors = {
  velocity: '#1d6fe0',
  acceleration: '#e8590c',
  gravity: '#2f9e44',
  trajectory: '#5b6b80',
} as const

export const projectileOverlays: readonly OverlayDescriptor[] = [
  {
    id: 'velocity',
    label: 'Velocity',
    color: overlayColors.velocity,
    note: `1 m of arrow = ${1 / VELOCITY_SCALE} m/s`,
  },
  {
    id: 'acceleration',
    label: 'Acceleration',
    color: overlayColors.acceleration,
    note: `1 m of arrow = ${(1 / ACCELERATION_SCALE).toFixed(2)} m/s²`,
  },
  {
    id: 'gravity',
    label: 'Gravitational acceleration',
    color: overlayColors.gravity,
    note: 'Drawn beside the ball, same scale as acceleration',
  },
  { id: 'trajectory', label: 'Trajectory', color: overlayColors.trajectory },
]
