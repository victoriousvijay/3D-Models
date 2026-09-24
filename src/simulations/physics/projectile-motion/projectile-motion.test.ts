import { describe, expect, it } from 'vitest'
import { DomainRegistry, SimulationRuntime, validateSimulationDefinition } from '@/engine'
import { flightTime, impactSpeed, maxHeight, physicsDomain, range } from '@/domains/physics'
import { angleFromPointer } from './aiming'
import { projectileMotion } from './definition'
import { launchConditions } from './model'

type Overrides = Parameters<SimulationRuntime<typeof projectileMotion>['setVariables']>[0]

/** Runs a projectile to landing and returns the runtime. */
function fly(overrides: Overrides = {}) {
  const runtime = new SimulationRuntime(projectileMotion, { initialVariables: overrides })
  runtime.start()
  for (let i = 0; i < 20_000 && runtime.status === 'running'; i++) runtime.update(1 / 60)
  expect(runtime.status).toBe('completed')
  return runtime
}

describe('projectile-motion definition', () => {
  it('is valid and uses only units available to the physics domain', () => {
    const domains = new DomainRegistry()
    domains.register(physicsDomain)
    expect(validateSimulationDefinition(projectileMotion, domains.unitsAvailableTo('physics'))).toEqual([])
  })

  it('starts on the launcher, ready', () => {
    const { measurements } = new SimulationRuntime(projectileMotion)
    expect(measurements.phase).toBe('ready')
    expect(measurements.flightTime).toBe(0)
    expect(measurements.velocity[0]).toBeCloseTo(20 * Math.cos(Math.PI / 4), 12)
    expect(measurements.acceleration).toEqual([0, -9.81, 0])
  })
})

describe('projectile-motion without air resistance (exact)', () => {
  it.each([
    { launchSpeed: 20, launchAngle: 45, launchHeight: 0, gravity: 9.81 },
    { launchSpeed: 12.5, launchAngle: 70, launchHeight: 8, gravity: 9.81 },
    { launchSpeed: 30, launchAngle: 20, launchHeight: 3, gravity: 1.62 },
  ])('matches the closed-form results for %o', (vars) => {
    const { measurements } = fly(vars)
    const c = launchConditions({ ...vars, airResistance: false, mass: 1 })
    expect(measurements.phase).toBe('landed')
    expect(measurements.flightTime).toBeCloseTo(flightTime(c), 10)
    expect(measurements.horizontalDistance).toBeCloseTo(range(c), 9)
    expect(measurements.maxHeight).toBeCloseTo(maxHeight(c), 10)
    expect(measurements.speed).toBeCloseTo(impactSpeed(c), 9)
    expect(measurements.height).toBe(0)
  })

  it('horizontal launch from a height falls for √(2h/g)', () => {
    const { measurements } = fly({ launchAngle: 0, launchHeight: 20 })
    expect(measurements.flightTime).toBeCloseTo(Math.sqrt((2 * 20) / 9.81), 10)
  })

  it('mass has no effect', () => {
    const light = fly({ mass: 0.1 }).measurements
    const heavy = fly({ mass: 5 }).measurements
    expect(heavy.horizontalDistance).toBe(light.horizontalDistance)
    expect(heavy.flightTime).toBe(light.flightTime)
  })

  it('complementary angles land at the same distance', () => {
    expect(fly({ launchAngle: 30 }).measurements.horizontalDistance).toBeCloseTo(
      fly({ launchAngle: 60 }).measurements.horizontalDistance,
      9,
    )
  })

  it('a flat launch from the ground lands immediately', () => {
    const { measurements } = fly({ launchAngle: 0, launchHeight: 0 })
    expect(measurements.flightTime).toBe(0)
    expect(measurements.horizontalDistance).toBe(0)
  })
})

describe('projectile-motion with air resistance', () => {
  it('lands on the ground, sooner and shorter than the ideal case', () => {
    const ideal = fly({ launchSpeed: 30 }).measurements
    const draggy = fly({ launchSpeed: 30, airResistance: true }).measurements
    expect(draggy.height).toBe(0)
    expect(draggy.horizontalDistance).toBeLessThan(ideal.horizontalDistance)
    expect(draggy.maxHeight).toBeLessThan(ideal.maxHeight)
    expect(draggy.speed).toBeLessThan(ideal.speed)
  })

  it('affects a light ball more than a heavy one of the same size', () => {
    const light = fly({ launchSpeed: 30, airResistance: true, mass: 0.1 }).measurements
    const heavy = fly({ launchSpeed: 30, airResistance: true, mass: 5 }).measurements
    expect(light.horizontalDistance).toBeLessThan(heavy.horizontalDistance)
  })

  it('reports acceleration that includes drag opposing the motion', () => {
    const runtime = new SimulationRuntime(projectileMotion, { initialVariables: { airResistance: true } })
    const [ax, ay] = runtime.measurements.acceleration
    expect(ax).toBeLessThan(0)
    expect(ay).toBeLessThan(-9.81)
  })

  it('converges as the step shrinks: result is insensitive to frame rate', () => {
    const run = (frame: number) => {
      const runtime = new SimulationRuntime(projectileMotion, { initialVariables: { airResistance: true } })
      runtime.start()
      while (runtime.status === 'running') runtime.update(frame)
      return runtime.measurements.horizontalDistance
    }
    expect(run(1 / 30)).toBeCloseTo(run(1 / 144), 3)
  })
})

describe('angleFromPointer', () => {
  const limits = { min: 0, max: 90, step: 1 }

  it('measures the angle from the launch point', () => {
    expect(angleFromPointer({ x: 10, y: 10 }, 0, limits)).toBe(45)
    expect(angleFromPointer({ x: 10, y: 15 }, 5, limits)).toBe(45)
  })

  it('clamps below the horizontal and behind the launcher', () => {
    expect(angleFromPointer({ x: 10, y: -5 }, 0, limits)).toBe(0)
    expect(angleFromPointer({ x: -3, y: 4 }, 0, limits)).toBe(90)
    expect(angleFromPointer({ x: -3, y: -4 }, 0, limits)).toBe(0)
  })

  it('rounds to the variable step', () => {
    expect(angleFromPointer({ x: 1, y: Math.tan((30.4 * Math.PI) / 180) }, 0, limits)).toBe(30)
  })
})
