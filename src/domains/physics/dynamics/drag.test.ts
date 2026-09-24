import { describe, expect, it } from 'vitest'
import { rk4Step } from '@/lib/numerics/rk4'
import { degreesToRadians, SEA_LEVEL_AIR_DENSITY, SMOOTH_SPHERE_DRAG_COEFFICIENT } from '../constants'
import { launchVelocity, range } from '../kinematics/projectile'
import { dragAcceleration, dragConstant, projectileWithDrag } from './drag'

/** Integrates until the projectile returns to y = 0; returns the landing x (linear interpolation). */
function simulateRange(speed: number, angleDeg: number, gravity: number, k: number, h = 1e-3): number {
  const v0 = launchVelocity(speed, degreesToRadians(angleDeg))
  const f = projectileWithDrag(gravity, k)
  let state = [0, 0, v0.x, v0.y]
  for (let t = 0; t < 1000; t += h) {
    const next = rk4Step(f, t, state, h)
    if ((next[1] ?? 0) < 0) {
      const [x0 = 0, y0 = 0] = state
      const [x1 = 0, y1 = 0] = next
      return x0 + ((x1 - x0) * y0) / (y0 - y1)
    }
    state = next
  }
  throw new Error('did not land')
}

describe('quadratic drag', () => {
  it('k = ρ·C_d·A / 2m for a known sphere', () => {
    const k = dragConstant({ mass: 0.45, diameter: 0.22, dragCoefficient: 0.47, fluidDensity: 1.225 })
    expect(k).toBeCloseTo((1.225 * 0.47 * Math.PI * 0.11 ** 2) / (2 * 0.45), 12)
  })

  it('opposes velocity with magnitude k·|v|²', () => {
    const a = dragAcceleration({ x: 3, y: 4 }, 0.1)
    expect(Math.hypot(a.x, a.y)).toBeCloseTo(0.1 * 25, 12)
    expect(a.x / 3).toBeCloseTo(a.y / 4, 12) // antiparallel
    expect(a.x).toBeLessThan(0)
  })

  it('reduces to the ideal solution as k → 0', () => {
    const ideal = range({ speed: 20, angle: degreesToRadians(40), height: 0, gravity: 9.81 })
    expect(simulateRange(20, 40, 9.81, 0)).toBeCloseTo(ideal, 4)
  })

  it('shortens the range, and more drag shortens it further', () => {
    const k = dragConstant({
      mass: 0.45,
      diameter: 0.22,
      dragCoefficient: SMOOTH_SPHERE_DRAG_COEFFICIENT,
      fluidDensity: SEA_LEVEL_AIR_DENSITY,
    })
    const ideal = simulateRange(25, 45, 9.81, 0)
    const light = simulateRange(25, 45, 9.81, k)
    const heavy = simulateRange(25, 45, 9.81, 4 * k)
    expect(light).toBeLessThan(ideal)
    expect(heavy).toBeLessThan(light)
  })

  it('makes the optimal launch angle lower than 45°', () => {
    const k = 0.02
    expect(simulateRange(30, 40, 9.81, k)).toBeGreaterThan(simulateRange(30, 45, 9.81, k))
  })

  it('rejects non-physical properties', () => {
    expect(() => dragConstant({ mass: 0, diameter: 0.2, dragCoefficient: 0.47, fluidDensity: 1.2 })).toThrow(
      RangeError,
    )
  })
})
