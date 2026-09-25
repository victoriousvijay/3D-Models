import type { OverlayDescriptor } from '@/simulations/types'
import type { Lane } from './model'

/** Scene metres drawn per unit of each vector quantity. */
export const VELOCITY_SCALE = 0.15 // m per (m/s)
export const ACCELERATION_SCALE = 0.1 // m per (m/s²)
export const ANGULAR_VELOCITY_SCALE = 0.006 // m per (rad/s)

export const laneColors: Readonly<Record<Lane, string>> = { 1: '#1f6feb', 2: '#e8590c', 3: '#2b8a3e' }

export const colors = {
  velocity: '#0b7285',
  acceleration: '#c2255c',
  angular: '#7048e8',
  potential: '#adb5bd',
} as const

export const rollingOverlays: readonly OverlayDescriptor[] = [
  {
    id: 'velocity',
    label: 'Velocity',
    color: colors.velocity,
    note: `1 m of arrow = ${(1 / VELOCITY_SCALE).toFixed(1)} m/s`,
  },
  {
    id: 'progress',
    label: 'Race progress',
    color: laneColors[1],
    note: 'Distance covered in each lane; place and time at the finish',
  },
  {
    id: 'markers',
    label: 'Distance markers',
    color: '#495057',
    note: 'Every 0.25 m, measured from the finish',
  },
  {
    id: 'com',
    label: 'Centre of mass',
    color: '#212529',
    note: 'The point whose distance and speed are measured',
    defaultVisible: false,
  },
  {
    id: 'acceleration',
    label: 'Acceleration',
    color: colors.acceleration,
    note: `1 m of arrow = ${(1 / ACCELERATION_SCALE).toFixed(0)} m/s²`,
    defaultVisible: false,
  },
  {
    id: 'angular',
    label: 'Angular velocity ω',
    color: colors.angular,
    note: `Along the axle (right-hand rule); 1 m = ${(1 / ANGULAR_VELOCITY_SCALE).toFixed(0)} rad/s`,
    defaultVisible: false,
  },
  {
    id: 'energy',
    label: 'Energy columns',
    color: colors.potential,
    note: 'Each lane’s starting energy: grey PE, solid ½mv², light ½Iω²',
    defaultVisible: false,
  },
]
