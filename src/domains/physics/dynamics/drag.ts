/**
 * Quadratic air resistance on a sphere.
 *
 *   F_drag = −½·ρ·C_d·A·|v|·v          A = π·(d/2)²
 *   a_drag = −k·|v|·v,   k = ρ·C_d·A / (2m)   [1/m]
 *
 * Assumptions: still air of uniform density, constant drag coefficient
 * (no dependence on Reynolds number), no spin (no Magnus lift), no buoyancy.
 */
import type { Derivative } from '@/lib/numerics/rk4'
import type { PlanarVector } from '../kinematics/projectile'

export interface DragProperties {
  /** Body mass (kg), > 0. */
  readonly mass: number
  /** Sphere diameter (m), > 0. */
  readonly diameter: number
  /** Dimensionless drag coefficient C_d, ≥ 0. */
  readonly dragCoefficient: number
  /** Fluid density ρ (kg/m³), ≥ 0. */
  readonly fluidDensity: number
}

/** The drag constant k = ρ·C_d·A / (2m) in 1/m. */
export function dragConstant(p: DragProperties): number {
  if (!(p.mass > 0) || !(p.diameter > 0)) throw new RangeError('Mass and diameter must be positive.')
  if (p.dragCoefficient < 0 || p.fluidDensity < 0)
    throw new RangeError('Drag coefficient and density must not be negative.')
  const area = Math.PI * (p.diameter / 2) ** 2
  return (p.fluidDensity * p.dragCoefficient * area) / (2 * p.mass)
}

/** Acceleration due to quadratic drag, opposing the velocity. */
export function dragAcceleration(velocity: PlanarVector, k: number): PlanarVector {
  const speed = Math.hypot(velocity.x, velocity.y)
  return { x: -k * speed * velocity.x, y: -k * speed * velocity.y }
}

/**
 * Equations of motion for a projectile with quadratic drag in uniform
 * gravity, for state vector [x, y, vx, vy]. Suitable for `rk4Step`.
 */
export function projectileWithDrag(gravity: number, k: number): Derivative {
  return (_t, [, , vx = 0, vy = 0]) => {
    const drag = dragAcceleration({ x: vx, y: vy }, k)
    return [vx, vy, drag.x, drag.y - gravity]
  }
}
