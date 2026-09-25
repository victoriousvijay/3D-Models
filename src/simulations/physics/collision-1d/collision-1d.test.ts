import { describe, expect, it } from 'vitest'
import { DomainRegistry, SimulationRuntime, validateSimulationDefinition } from '@/engine'
import { physicsDomain } from '@/domains/physics'
import { collision1d } from './definition'
import {
  buildTimeline,
  GLIDER_LENGTH,
  START_A,
  START_B,
  stateAt,
  TRACK_LENGTH,
  type CollisionVariables,
} from './model'

type Overrides = Parameters<SimulationRuntime<typeof collision1d>['setVariables']>[0]

const defaults: CollisionVariables = {
  massA: 0.5,
  massB: 0.5,
  velocityA: 1,
  velocityB: 0,
  collisionType: 'elastic',
  restitution: 0.5,
}

/** Runs to completion at 60 fps. */
function finished(overrides: Overrides = {}) {
  const runtime = new SimulationRuntime(collision1d, { initialVariables: overrides })
  runtime.start()
  for (let i = 0; i < 20_000 && runtime.status === 'running'; i++) runtime.update(1 / 60)
  expect(runtime.status).toBe('completed')
  return runtime
}

describe('collision-1d definition', () => {
  it('is valid and uses only units available to the physics domain', () => {
    const domains = new DomainRegistry()
    domains.register(physicsDomain)
    expect(validateSimulationDefinition(collision1d, domains.unitsAvailableTo('physics'))).toEqual([])
  })
})

describe('closed-form timeline', () => {
  it('first contact happens when the gap closes: t₀ = gap / (u_A − u_B)', () => {
    const timeline = buildTimeline(defaults)
    const gap = START_B - START_A - GLIDER_LENGTH
    expect(timeline.collision?.start).toBeCloseTo(gap / 1, 12)
    const touching = stateAt(defaults, gap)
    expect(touching.xB - touching.xA).toBeCloseTo(GLIDER_LENGTH, 12)
  })

  it.each([
    ['elastic', 1],
    ['inelastic', 0.3],
    ['perfectly-inelastic', 0.5],
  ] as const)('total momentum is constant at every sample, including during contact (%s)', (type, e) => {
    const vars: CollisionVariables = {
      ...defaults,
      massA: 0.35,
      massB: 1.4,
      velocityA: 1.3,
      velocityB: -0.6,
      collisionType: type,
      restitution: e,
    }
    const timeline = buildTimeline(vars)
    const p0 = vars.massA * vars.velocityA + vars.massB * vars.velocityB
    const c = timeline.collision
    expect(c).not.toBeNull()
    if (!c) return
    for (let i = 0; i <= 200; i++) {
      const t = c.start - 0.05 + ((c.end - c.start + 0.1) * i) / 200
      const s = stateAt(vars, t, timeline)
      expect(vars.massA * s.vA + vars.massB * s.vB).toBeCloseTo(p0, 12)
    }
  })

  it('elastic: kinetic energy dips while the bumpers are squashed and fully recovers', () => {
    const timeline = buildTimeline(defaults)
    const c = timeline.collision
    if (!c) throw new Error('expected a collision')
    const k = (t: number) => {
      const s = stateAt(defaults, t, timeline)
      return 0.5 * defaults.massA * s.vA ** 2 + 0.5 * defaults.massB * s.vB ** 2
    }
    const mid = stateAt(defaults, (c.start + c.end) / 2, timeline)
    expect(mid.stage).toBe('contact')
    expect(k((c.start + c.end) / 2)).toBeCloseTo(0.125, 6) // half stored in the springs at max compression
    expect(k(c.end + 0.01)).toBeCloseTo(0.25, 12)
  })

  it('contact time is π√(μ/k) for springs and grows with mass', () => {
    const light = buildTimeline(defaults).collision?.contact.duration ?? 0
    expect(light).toBeCloseTo(Math.PI * Math.sqrt(0.25 / 5000), 12)
    const heavy = buildTimeline({ ...defaults, massA: 2, massB: 2 }).collision?.contact.duration ?? 0
    expect(heavy / light).toBeCloseTo(2, 12)
  })

  it('results do not depend on the time step (closed form)', () => {
    const coarse = new SimulationRuntime(collision1d)
    const fine = new SimulationRuntime(collision1d)
    coarse.start()
    fine.start()
    for (let i = 0; i < 200 && coarse.status === 'running'; i++) coarse.update(1 / 30)
    for (let i = 0; i < 2000 && fine.status === 'running'; i++) fine.update(1 / 144)
    expect(coarse.measurements.velocityB).toBeCloseTo(fine.measurements.velocityB, 12)
    expect(coarse.state.xB).toBeCloseTo(fine.state.xB, 12)
  })
})

describe('outcomes through the runtime', () => {
  it('equal masses, elastic, B at rest: A stops, B leaves at 1.00 m/s, K unchanged', () => {
    const { measurements } = finished()
    expect(measurements.velocityA).toBe(0)
    expect(measurements.velocityB).toBeCloseTo(1, 12)
    expect(measurements.totalMomentum).toBeCloseTo(0.5, 12)
    expect(measurements.kineticEnergyChange).toBe(0)
    expect(measurements.stage).toBe('after')
  })

  it('perfectly inelastic: both move at 0.50 m/s, half the kinetic energy is lost, the pad stays dented', () => {
    const { measurements } = finished({ collisionType: 'perfectly-inelastic' })
    expect(measurements.velocityA).toBeCloseTo(0.5, 12)
    expect(measurements.velocityB).toBeCloseTo(0.5, 12)
    expect(measurements.kineticEnergyChange).toBeCloseTo(-0.125, 12)
    expect(measurements.kineticEnergyRatio).toBeCloseTo(0.5, 12)
    expect(measurements.compression).toBeGreaterThan(0)
  })

  it('inelastic e = 0.5: momentum kept, K ratio = (1 + e²)/2 for equal masses with B at rest', () => {
    const { measurements } = finished({ collisionType: 'inelastic', restitution: 0.5 })
    expect(measurements.totalMomentum).toBeCloseTo(0.5, 12)
    expect(measurements.velocityB - measurements.velocityA).toBeCloseTo(0.5, 12)
    expect(measurements.kineticEnergyRatio).toBeCloseTo(0.625, 12)
  })

  it('unequal masses (elastic): a light glider bounces back off a heavy one', () => {
    const { measurements } = finished({ massB: 2 })
    expect(measurements.velocityA).toBeCloseTo(-0.6, 12)
    expect(measurements.velocityB).toBeCloseTo(0.4, 12)
    expect(measurements.kineticEnergyRatio).toBeCloseTo(1, 12)
  })

  it('opposite directions: head-on equal masses exchange velocities; total momentum is 0 throughout', () => {
    const { measurements } = finished({ velocityB: -1 })
    expect(measurements.velocityA).toBeCloseTo(-1, 12)
    expect(measurements.velocityB).toBeCloseTo(1, 12)
    expect(measurements.totalMomentum).toBe(0)
    expect(measurements.initialMomentum).toBe(0)
  })

  it('opposite directions, sticky: both stop dead and all kinetic energy is lost', () => {
    const runtime = finished({ velocityB: -1, collisionType: 'perfectly-inelastic' })
    expect(runtime.measurements.velocityA).toBe(0)
    expect(runtime.measurements.velocityB).toBe(0)
    expect(runtime.measurements.totalKineticEnergy).toBe(0)
    expect(runtime.state.t).toBeCloseTo(
      (buildTimeline({ ...defaults, velocityB: -1, collisionType: 'perfectly-inelastic' }).collision?.end ??
        0) + 1,
      9,
    )
  })

  it('the run ends when a glider reaches an end stop', () => {
    const runtime = finished()
    expect(runtime.state.xB).toBeCloseTo(TRACK_LENGTH - GLIDER_LENGTH / 2, 12)
  })
})

describe('no collision and zero velocity', () => {
  it('both at rest: nothing moves, the run ends after a second, stage "No collision"', () => {
    const runtime = finished({ velocityA: 0, velocityB: 0 })
    expect(runtime.state.t).toBe(1)
    expect(runtime.state.xA).toBe(START_A)
    expect(runtime.measurements.totalKineticEnergy).toBe(0)
    expect(runtime.measurements.kineticEnergyRatio).toBe(1)
    expect(runtime.measurements.stage).toBe('missed')
  })

  it('moving apart: no collision; velocities unchanged', () => {
    const { measurements } = finished({ velocityA: -0.5, velocityB: 0.5 })
    expect(measurements.stage).toBe('missed')
    expect(measurements.velocityA).toBe(-0.5)
    expect(measurements.velocityB).toBe(0.5)
    expect(measurements.contactTime).toBe(0)
  })

  it('B running away faster than A chases: never meet', () => {
    expect(buildTimeline({ ...defaults, velocityA: 0.5, velocityB: 1 }).collision).toBeNull()
  })

  it('a glider reaching its end stop before contact means no collision', () => {
    // A heads left at 0.5 m/s and reaches its stop at 1.5 s; B would catch it at 1.8 s.
    const timeline = buildTimeline({ ...defaults, velocityA: -0.5, velocityB: -1 })
    expect(timeline.collision).toBeNull()
    expect(timeline.endTime).toBeCloseTo((START_A - GLIDER_LENGTH / 2) / 0.5, 12)
  })

  it('zero velocity for both gliders: no collision', () => {
    expect(buildTimeline({ ...defaults, velocityA: 0 }).collision).toBeNull()
  })
})

describe('reset and invalid input', () => {
  it('reset returns both gliders to the start with their initial velocities', () => {
    const runtime = finished({ massB: 2 })
    runtime.reset()
    expect(runtime.status).toBe('ready')
    expect(runtime.state.t).toBe(0)
    expect(runtime.state.xA).toBe(START_A)
    expect(runtime.state.xB).toBe(START_B)
    expect(runtime.measurements.velocityA).toBe(1)
    expect(runtime.measurements.stage).toBe('ready')
  })

  it('changing a variable resets the run (every variable is an initial condition)', () => {
    const runtime = finished()
    runtime.setVariables({ massA: 1 })
    expect(runtime.status).toBe('ready')
    expect(runtime.state.xB).toBe(START_B)
  })

  it.each([
    [{ massA: 0 }],
    [{ massB: 3 }],
    [{ velocityA: 2 }],
    [{ velocityB: Number.NaN }],
    [{ restitution: 1.5 }],
    [{ collisionType: 'explosive' }],
  ])('rejects %o and keeps the run', (change) => {
    const runtime = finished()
    expect(runtime.setVariables(change).ok).toBe(false)
    expect(runtime.status).toBe('completed')
  })
})
