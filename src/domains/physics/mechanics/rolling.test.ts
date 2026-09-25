import { describe, expect, it } from 'vitest'
import { degreesToRadians } from '../constants'
import {
  angularVelocityOf,
  assertValidRolling,
  frictionNeededToRoll,
  momentOfInertia,
  rollingAcceleration,
  rollingSpeedAfterDrop,
  rollingTime,
  rotationalKineticEnergy,
  rotationalShare,
  SHAPE_FACTOR,
  translationalKineticEnergy,
  type RollingShape,
} from './rolling'

const shapes: readonly RollingShape[] = ['solid-sphere', 'solid-cylinder', 'hollow-sphere', 'ring']
const g = 9.81
const deg = degreesToRadians

describe('moment of inertia', () => {
  it('uses the textbook shape factors', () => {
    expect(momentOfInertia('solid-sphere', 2, 0.1)).toBeCloseTo((2 / 5) * 2 * 0.01, 15)
    expect(momentOfInertia('solid-cylinder', 2, 0.1)).toBeCloseTo(0.5 * 2 * 0.01, 15)
    expect(momentOfInertia('hollow-sphere', 2, 0.1)).toBeCloseTo((2 / 3) * 2 * 0.01, 15)
    expect(momentOfInertia('ring', 2, 0.1)).toBeCloseTo(2 * 0.01, 15)
  })

  it('scales with m and r²', () => {
    for (const shape of shapes) {
      expect(momentOfInertia(shape, 4, 0.1) / momentOfInertia(shape, 1, 0.1)).toBeCloseTo(4, 12)
      expect(momentOfInertia(shape, 1, 0.3) / momentOfInertia(shape, 1, 0.1)).toBeCloseTo(9, 12)
    }
  })
})

describe('rolling acceleration', () => {
  it('a = g sin θ / (1 + k) for each shape', () => {
    const s = Math.sin(deg(30))
    expect(rollingAcceleration('solid-sphere', deg(30), g)).toBeCloseTo((5 / 7) * g * s, 12)
    expect(rollingAcceleration('solid-cylinder', deg(30), g)).toBeCloseTo((2 / 3) * g * s, 12)
    expect(rollingAcceleration('hollow-sphere', deg(30), g)).toBeCloseTo((3 / 5) * g * s, 12)
    expect(rollingAcceleration('ring', deg(30), g)).toBeCloseTo(0.5 * g * s, 12)
  })

  it.each([2, 10, 30, 45])('orders sphere > cylinder > hollow sphere > ring at %s°', (angle) => {
    const a = shapes.map((shape) => rollingAcceleration(shape, deg(angle), g))
    for (let i = 1; i < a.length; i++) expect(a[i - 1]).toBeGreaterThan(a[i] ?? Number.POSITIVE_INFINITY)
  })

  it('is always less than g sin θ (a frictionless slide)', () => {
    for (const shape of shapes)
      expect(rollingAcceleration(shape, deg(20), g)).toBeLessThan(g * Math.sin(deg(20)))
  })

  it('grows with the angle and with g', () => {
    expect(rollingAcceleration('ring', deg(30), g)).toBeGreaterThan(rollingAcceleration('ring', deg(10), g))
    expect(rollingAcceleration('ring', deg(10), 2 * g)).toBeCloseTo(
      2 * rollingAcceleration('ring', deg(10), g),
      12,
    )
  })
})

describe('race timing', () => {
  it('t = √(2L/a); default race: 1.81, 1.88 and 2.17 s', () => {
    expect(rollingTime('solid-sphere', 2, deg(10), g)).toBeCloseTo(1.8131, 4)
    expect(rollingTime('solid-cylinder', 2, deg(10), g)).toBeCloseTo(1.8767, 4)
    expect(rollingTime('ring', 2, deg(10), g)).toBeCloseTo(2.1671, 4)
  })

  it('time ratios depend only on shape: t ∝ √(1 + k)', () => {
    const ratio = rollingTime('ring', 1.3, deg(25), 3.7) / rollingTime('solid-sphere', 1.3, deg(25), 3.7)
    expect(ratio).toBeCloseTo(Math.sqrt(2 / 1.4), 12)
  })

  it('a sampled uniformly-accelerated motion reaches L at exactly t', () => {
    const a = rollingAcceleration('hollow-sphere', deg(15), g)
    const t = rollingTime('hollow-sphere', 1.7, deg(15), g)
    expect(0.5 * a * t * t).toBeCloseTo(1.7, 12)
  })
})

describe('energy', () => {
  it.each(shapes)('mgh = ½mv² + ½Iω² at the bottom (%s)', (shape) => {
    const m = 1.7
    const r = 0.063
    const h = 0.42
    const v = rollingSpeedAfterDrop(shape, h, g)
    const omega = angularVelocityOf(v, r)
    const total = translationalKineticEnergy(m, v) + rotationalKineticEnergy(shape, m, r, omega)
    expect(total).toBeCloseTo(m * g * h, 12)
  })

  it.each(shapes)('rotational KE = k × translational KE, share k/(1+k) (%s)', (shape) => {
    const v = 1.3
    const r = 0.05
    const kt = translationalKineticEnergy(2, v)
    const kr = rotationalKineticEnergy(shape, 2, r, angularVelocityOf(v, r))
    expect(kr / kt).toBeCloseTo(SHAPE_FACTOR[shape], 12)
    expect(kr / (kr + kt)).toBeCloseTo(rotationalShare(shape), 12)
  })

  it('the finishing speed is independent of mass and radius', () => {
    expect(rollingSpeedAfterDrop('solid-cylinder', 0.5, g)).toBeCloseTo(Math.sqrt((4 / 3) * g * 0.5), 12)
  })

  it('v = ωr', () => {
    expect(angularVelocityOf(1.2, 0.04) * 0.04).toBeCloseTo(1.2, 15)
  })
})

describe('rolling without slipping', () => {
  it('friction needed: μ = k tan θ / (1 + k); the ring at 45° needs 0.5', () => {
    expect(frictionNeededToRoll('ring', deg(45))).toBeCloseTo(0.5, 12)
    expect(frictionNeededToRoll('solid-sphere', deg(45))).toBeCloseTo(2 / 7, 12)
  })

  it('stays below the lanes’ μs = 0.80 over the whole allowed range (≤ 45°)', () => {
    for (const shape of shapes) expect(frictionNeededToRoll(shape, deg(45))).toBeLessThan(0.8)
  })
})

describe('invalid input', () => {
  it.each([
    [0, 0.05, deg(10), g],
    [1, -0.05, deg(10), g],
    [1, 0.05, 0, g],
    [1, 0.05, deg(90), g],
    [1, 0.05, deg(10), Number.NaN],
  ])('rejects m=%s r=%s θ=%s g=%s', (m, r, angle, gravity) => {
    expect(() => {
      assertValidRolling(m, r, angle, gravity)
    }).toThrow(RangeError)
  })

  it('rejects a negative race distance', () => {
    expect(() => rollingTime('ring', -1, deg(10), g)).toThrow(RangeError)
  })
})
