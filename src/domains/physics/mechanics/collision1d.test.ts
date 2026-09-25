import { describe, expect, it } from 'vitest'
import {
  bumperContact,
  centreOfMassVelocity,
  contactCompression,
  dampingRatioFor,
  finalVelocities,
  kineticEnergy,
  kineticEnergyLoss,
  momentum,
  reducedMass,
  restitutionFrom,
  totalKineticEnergy,
  totalMomentum,
  willCollide,
  type CollisionBodies,
} from './collision1d'

const bodies = (massA: number, velocityA: number, massB: number, velocityB: number): CollisionBodies => ({
  massA,
  massB,
  velocityA,
  velocityB,
})

const after = (b: CollisionBodies, e: number): CollisionBodies => {
  const v = finalVelocities(b, e)
  return { ...b, velocityA: v.velocityA, velocityB: v.velocityB }
}

const cases: readonly CollisionBodies[] = [
  bodies(0.5, 1, 0.5, 0),
  bodies(0.5, 1, 2, 0),
  bodies(2, 1, 0.5, 0),
  bodies(0.5, 1, 0.5, -1),
  bodies(1.2, 0.8, 0.3, 0.2),
  bodies(0.1, 1.5, 2, -1.5),
  bodies(0.7, -0.2, 0.4, -1.1),
]

describe('basic quantities', () => {
  it('p = mv and K = ½mv², with sign giving direction', () => {
    expect(momentum(0.5, -2)).toBe(-1)
    expect(kineticEnergy(0.5, -2)).toBe(1)
    expect(totalMomentum(bodies(0.5, 1, 2, -0.5))).toBeCloseTo(-0.5, 15)
    expect(totalKineticEnergy(bodies(0.5, 1, 2, -0.5))).toBeCloseTo(0.5, 15)
    expect(reducedMass(0.5, 0.5)).toBe(0.25)
    expect(centreOfMassVelocity(bodies(0.5, 1, 0.5, 0))).toBe(0.5)
  })

  it('bodies meet only when A is catching up with B', () => {
    expect(willCollide(bodies(1, 1, 1, 0))).toBe(true)
    expect(willCollide(bodies(1, 0, 1, 0))).toBe(false)
    expect(willCollide(bodies(1, 0.5, 1, 0.5))).toBe(false)
    expect(willCollide(bodies(1, -0.2, 1, 0.3))).toBe(false)
    expect(willCollide(bodies(1, -0.2, 1, -1))).toBe(true)
  })
})

describe('conservation laws', () => {
  it.each(cases)('momentum is conserved for every e (%o)', (b) => {
    for (const e of [0, 0.25, 0.5, 0.9, 1]) {
      expect(totalMomentum(after(b, e))).toBeCloseTo(totalMomentum(b), 12)
    }
  })

  it.each(cases)('kinetic energy is conserved only when e = 1 (%o)', (b) => {
    expect(totalKineticEnergy(after(b, 1))).toBeCloseTo(totalKineticEnergy(b), 12)
    expect(totalKineticEnergy(after(b, 0.5))).toBeLessThan(totalKineticEnergy(b))
  })

  it.each(cases)('ΔK = ½μ(1 − e²)(u_A − u_B)² matches K before − K after (%o)', (b) => {
    for (const e of [0, 0.3, 0.8, 1]) {
      expect(totalKineticEnergy(b) - totalKineticEnergy(after(b, e))).toBeCloseTo(kineticEnergyLoss(b, e), 12)
    }
  })

  it.each(cases)('restitution is recovered from the final velocities (%o)', (b) => {
    for (const e of [0, 0.4, 1]) {
      const v = finalVelocities(b, e)
      expect(restitutionFrom(b, v.velocityA, v.velocityB)).toBeCloseTo(e, 12)
    }
  })
})

describe('textbook special cases', () => {
  it('equal masses, elastic, B at rest: velocities are exchanged', () => {
    const v = finalVelocities(bodies(0.5, 1, 0.5, 0), 1)
    expect(v.velocityA).toBeCloseTo(0, 15)
    expect(v.velocityB).toBeCloseTo(1, 15)
  })

  it('equal masses head-on, elastic: each bounces back with the other’s velocity', () => {
    const v = finalVelocities(bodies(0.5, 1, 0.5, -1), 1)
    expect(v.velocityA).toBeCloseTo(-1, 15)
    expect(v.velocityB).toBeCloseTo(1, 15)
  })

  it('light on heavy (elastic): A bounces back; heavy on light: A keeps going', () => {
    const light = finalVelocities(bodies(0.5, 1, 2, 0), 1)
    expect(light.velocityA).toBeCloseTo(-0.6, 15)
    expect(light.velocityB).toBeCloseTo(0.4, 15)
    const heavy = finalVelocities(bodies(2, 1, 0.5, 0), 1)
    expect(heavy.velocityA).toBeCloseTo(0.6, 15)
    expect(heavy.velocityB).toBeCloseTo(1.6, 15)
  })

  it('perfectly inelastic: both move at the centre-of-mass velocity; half the KE is lost for equal masses', () => {
    const b = bodies(0.5, 1, 0.5, 0)
    const v = finalVelocities(b, 0)
    expect(v.velocityA).toBe(0.5)
    expect(v.velocityB).toBe(0.5)
    expect(kineticEnergyLoss(b, 0)).toBeCloseTo(totalKineticEnergy(b) / 2, 15)
  })

  it('perfectly inelastic head-on with zero total momentum: both stop, all KE is lost', () => {
    const b = bodies(0.5, 1, 0.5, -1)
    const v = finalVelocities(b, 0)
    expect(v.velocityA).toBeCloseTo(0, 15)
    expect(v.velocityB).toBeCloseTo(0, 15)
    expect(kineticEnergyLoss(b, 0)).toBeCloseTo(totalKineticEnergy(b), 15)
  })

  it('a body at rest that is not hit stays at rest (zero approach: nothing changes)', () => {
    const v = finalVelocities(bodies(0.5, 0, 0.5, 0), 1)
    expect(v).toEqual({ velocityA: 0, velocityB: 0 })
  })
})

describe('bumper contact (closed form)', () => {
  const m = 0.5
  const k = 5000

  it('an elastic spring contact lasts half a period, π√(μ/k)', () => {
    const contact = bumperContact(m, m, k, 1, 1)
    expect(contact.dampingRatio).toBe(0)
    expect(contact.duration).toBeCloseTo(Math.PI * Math.sqrt(reducedMass(m, m) / k), 15)
  })

  it.each([1, 0.8, 0.5, 0.1])(
    'at the end of contact the relative velocity is −e·w and compression is 0 (e = %s)',
    (e) => {
      const contact = bumperContact(m, 2, k, e, 1.3)
      const end = contactCompression(contact, contact.duration)
      expect(end.compression).toBeCloseTo(0, 12)
      expect(end.rate).toBeCloseTo(-e * 1.3, 12)
    },
  )

  it('damping ratio from e: 0 for e = 1, rising as e falls', () => {
    expect(dampingRatioFor(1)).toBeCloseTo(0, 15)
    expect(dampingRatioFor(0.5)).toBeGreaterThan(dampingRatioFor(0.9))
    expect(dampingRatioFor(0.01)).toBeLessThan(1)
  })

  it('putty pad (e = 0): locks at maximum compression, w/(e·ω_n), after 1/ω_n', () => {
    const contact = bumperContact(m, m, k, 0, 1)
    const end = contactCompression(contact, contact.duration)
    expect(end.rate).toBeCloseTo(0, 15)
    expect(end.compression).toBeCloseTo(1 / (Math.E * contact.naturalFrequency), 15)
  })

  it('heavier bodies stay in contact longer (τ ∝ √μ)', () => {
    const light = bumperContact(0.2, 0.2, k, 1, 1).duration
    const heavy = bumperContact(0.8, 0.8, k, 1, 1).duration
    expect(heavy / light).toBeCloseTo(2, 12)
  })

  it('compression is never negative during an underdamped contact', () => {
    const contact = bumperContact(0.3, 1.7, k, 0.3, 2)
    for (let i = 0; i <= 100; i++) {
      expect(contactCompression(contact, (contact.duration * i) / 100).compression).toBeGreaterThanOrEqual(
        -1e-15,
      )
    }
  })
})

describe('invalid input', () => {
  it.each([
    [bodies(0, 1, 1, 0), 1],
    [bodies(1, 1, -1, 0), 1],
    [bodies(1, Number.NaN, 1, 0), 1],
    [bodies(1, 1, 1, Number.POSITIVE_INFINITY), 1],
    [bodies(1, 1, 1, 0), 1.2],
    [bodies(1, 1, 1, 0), -0.1],
  ])('rejects %o with e = %s', (b, e) => {
    expect(() => finalVelocities(b, e)).toThrow(RangeError)
  })

  it('rejects contacts that cannot happen', () => {
    expect(() => bumperContact(1, 1, 5000, 1, 0)).toThrow(RangeError)
    expect(() => bumperContact(1, 1, 0, 1, 1)).toThrow(RangeError)
    expect(() => restitutionFrom(bodies(1, 0, 1, 0), 0, 0)).toThrow(RangeError)
  })
})
