import { describe, expect, it } from 'vitest'
import { degreesToRadians } from '../constants'
import {
  flightTime,
  impactSpeed,
  maxHeight,
  positionAt,
  range,
  specificMechanicalEnergy,
  velocityAt,
  type LaunchConditions,
} from './projectile'

const launch = (speed: number, angleDeg: number, height = 0, gravity = 9.81): LaunchConditions => ({
  speed,
  angle: degreesToRadians(angleDeg),
  height,
  gravity,
})

describe('ideal projectile — ground-level launch (textbook closed forms)', () => {
  const c = launch(20, 45)

  it('range R = v²·sin 2θ / g', () => {
    expect(range(c)).toBeCloseTo((20 ** 2 * Math.sin(Math.PI / 2)) / 9.81, 10)
  })

  it('flight time T = 2·v·sin θ / g', () => {
    expect(flightTime(c)).toBeCloseTo((2 * 20 * Math.sin(Math.PI / 4)) / 9.81, 10)
  })

  it('maximum height H = v²·sin²θ / 2g', () => {
    expect(maxHeight(c)).toBeCloseTo((20 ** 2 * Math.sin(Math.PI / 4) ** 2) / (2 * 9.81), 10)
  })

  it('complementary angles give equal range', () => {
    expect(range(launch(25, 30))).toBeCloseTo(range(launch(25, 60)), 10)
  })

  it('45° maximises range on level ground', () => {
    const best = range(launch(25, 45))
    for (const angle of [15, 30, 40, 50, 60, 75]) expect(range(launch(25, angle))).toBeLessThan(best)
  })

  it('lands at y = 0 after exactly the flight time', () => {
    expect(positionAt(c, flightTime(c)).y).toBeCloseTo(0, 10)
  })
})

describe('ideal projectile — elevated launch', () => {
  it('horizontal launch from height h falls for √(2h/g)', () => {
    expect(flightTime(launch(10, 0, 20))).toBeCloseTo(Math.sqrt((2 * 20) / 9.81), 10)
  })

  it('impact speed follows energy conservation', () => {
    const c = launch(15, 35, 12)
    const t = flightTime(c)
    const v = velocityAt(c, t)
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(impactSpeed(c), 10)
  })

  it('conserves mechanical energy along the path', () => {
    const c = launch(18, 50, 5)
    const e0 = specificMechanicalEnergy(positionAt(c, 0), velocityAt(c, 0), c.gravity)
    for (const t of [0.3, 1, 2]) {
      expect(specificMechanicalEnergy(positionAt(c, t), velocityAt(c, t), c.gravity)).toBeCloseTo(e0, 9)
    }
  })

  it('downward launch never rises above the launch height', () => {
    expect(maxHeight(launch(10, -20, 30))).toBe(30)
  })
})

describe('ideal projectile — validation', () => {
  it.each([
    ['zero gravity', launch(10, 45, 0, 0)],
    ['negative height', launch(10, 45, -1)],
    ['negative speed', launch(-1, 45)],
    ['NaN', launch(Number.NaN, 45)],
  ])('rejects %s', (_, c) => {
    expect(() => flightTime(c)).toThrow(RangeError)
  })
})
