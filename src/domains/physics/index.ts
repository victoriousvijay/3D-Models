import { defineDomain } from '@/engine'
import { PHYSICS_UNITS } from './units'

/**
 * Physics domain engine — the first domain implementation.
 *
 * Scientific services are pure, framework-free and tested against analytic
 * solutions. A Rapier-backed rigid-body service will be loaded through
 * `initialize()` when a simulation first needs collisions; analytic and
 * ODE-based models do not need it.
 *
 * See PHYSICS_ENGINE.md.
 */
export const physicsDomain = defineDomain({
  id: 'physics',
  title: 'Physics',
  description: 'Motion, forces, energy, waves and optics.',
  units: PHYSICS_UNITS,
})

export { PHYSICS_UNITS } from './units'
export * from './constants'
export * from './kinematics/projectile'
export * from './dynamics/drag'
export * from './optics/interference'
export * from './mechanics/collision1d'
