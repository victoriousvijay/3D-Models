import { describe, expect, it } from 'vitest'
import { DomainRegistry, SimulationRuntime, validateSimulationDefinition } from '@/engine'
import { physicsDomain, rollingTime } from '@/domains/physics'
import { rollingRace } from './definition'
import { finishTimeOf, readLane, stateAt, type RollingRaceVariables } from './model'

type Overrides = Parameters<SimulationRuntime<typeof rollingRace>['setVariables']>[0]

const deg = (d: number) => (d * Math.PI) / 180

/** Runs the race to the end at 60 fps. */
function raced(overrides: Overrides = {}) {
  const runtime = new SimulationRuntime(rollingRace, { initialVariables: overrides })
  runtime.start()
  for (let i = 0; i < 10_000 && runtime.status === 'running'; i++) runtime.update(1 / 60)
  expect(runtime.status).toBe('completed')
  return runtime
}

const defaults = new SimulationRuntime(rollingRace).variables as RollingRaceVariables

describe('rolling-race definition', () => {
  it('is valid and uses only units available to the physics domain', () => {
    const domains = new DomainRegistry()
    domains.register(physicsDomain)
    expect(validateSimulationDefinition(rollingRace, domains.unitsAvailableTo('physics'))).toEqual([])
  })
})

describe('the race', () => {
  it('default race: sphere 1.81 s, cylinder 1.88 s, ring 2.17 s — lane 1 wins', () => {
    const { measurements } = raced()
    expect(measurements.time1).toBeCloseTo(1.8131, 4)
    expect(measurements.time2).toBeCloseTo(1.8767, 4)
    expect(measurements.time3).toBeCloseTo(2.1671, 4)
    expect(measurements.winner).toBe('lane1')
  })

  it('race times are exact (closed form), not rounded to the time step', () => {
    const { measurements } = raced()
    expect(measurements.time1).toBeCloseTo(rollingTime('solid-sphere', 2, deg(10), 9.81), 12)
  })

  it('same shape, different radii: a tie', () => {
    const { measurements } = raced({
      shape1: 'solid-sphere',
      shape2: 'solid-sphere',
      shape3: 'solid-sphere',
      radius1: 20,
      radius2: 60,
      radius3: 120,
    })
    expect(measurements.time1).toBeCloseTo(measurements.time2, 12)
    expect(measurements.time2).toBeCloseTo(measurements.time3, 12)
    expect(measurements.winner).toBe('tie')
  })

  it('same shape, different masses: a tie, with more energy for the heavier ring', () => {
    const { measurements } = raced({
      shape1: 'ring',
      shape2: 'ring',
      shape3: 'ring',
      mass1: 0.1,
      mass2: 1,
      mass3: 5,
    })
    expect(measurements.time1).toBeCloseTo(measurements.time3, 12)
    expect(measurements.winner).toBe('tie')
    expect(measurements.translationalEnergy3 / measurements.translationalEnergy1).toBeCloseTo(50, 9)
  })

  it('solid beats hollow: sphere < cylinder < hollow sphere < ring', () => {
    const vars = { ...defaults, shape1: 'solid-sphere', shape2: 'hollow-sphere', shape3: 'ring' } as const
    const t = [finishTimeOf(vars, 1), finishTimeOf(vars, 2), finishTimeOf(vars, 3)]
    expect(t[0]).toBeLessThan(t[1] ?? 0)
    expect(t[1]).toBeLessThan(t[2] ?? 0)
    expect(finishTimeOf({ ...defaults, shape1: 'solid-cylinder' }, 1)).toBeLessThan(t[1] ?? 0)
  })

  it.each([2, 10, 30, 45])('the order is the same at %s°; time ratio ring/sphere = √(2/1.4)', (angle) => {
    const { measurements } = raced({ angle })
    expect(measurements.time1).toBeLessThan(measurements.time2)
    expect(measurements.time2).toBeLessThan(measurements.time3)
    expect(measurements.time3 / measurements.time1).toBeCloseTo(Math.sqrt(2 / 1.4), 12)
  })

  it('a steeper ramp is faster: t ∝ 1/√(sin θ)', () => {
    const shallow = raced({ angle: 10 }).measurements.time1
    const steep = raced({ angle: 30 }).measurements.time1
    expect(shallow / steep).toBeCloseTo(Math.sqrt(Math.sin(deg(30)) / Math.sin(deg(10))), 12)
  })
})

describe('physics at every sample', () => {
  it('energy is conserved: PE + KE_trans + KE_rot = m g L sin θ throughout', () => {
    for (const t of [0, 0.3, 0.9, 1.5, 2.0, 2.5]) {
      const state = stateAt(defaults, t)
      for (const lane of [1, 2, 3] as const) {
        const r = readLane(state, defaults, lane)
        const start = 1 * 9.81 * 2 * Math.sin(deg(10))
        expect(r.potentialEnergy + r.translationalEnergy + r.rotationalEnergy).toBeCloseTo(start, 12)
      }
    }
  })

  it('v = ωr and KE_rot = k · KE_trans throughout', () => {
    const vars = { ...defaults, radius2: 83 }
    const state = stateAt(vars, 1.2)
    const r = readLane(state, vars, 2)
    expect(r.angularVelocity * 0.083).toBeCloseTo(r.speed, 12)
    expect(r.rotationalEnergy / r.translationalEnergy).toBeCloseTo(0.5, 12)
  })

  it('each clock stops at its own finish; readings freeze at the line', () => {
    const state = stateAt(defaults, 2.0) // sphere and cylinder finished, ring still rolling
    expect(state.lanes[0].finished).toBe(true)
    expect(state.lanes[2].finished).toBe(false)
    const sphere = readLane(state, defaults, 1)
    expect(sphere.distance).toBe(2)
    expect(sphere.potentialEnergy).toBe(0)
    expect(sphere.speed).toBeCloseTo(Math.sqrt((2 * 9.81 * 2 * Math.sin(deg(10))) / 1.4), 12)
  })

  it('results do not depend on the frame rate', () => {
    const a = new SimulationRuntime(rollingRace)
    const b = new SimulationRuntime(rollingRace)
    a.start()
    b.start()
    for (let i = 0; i < 200 && a.status === 'running'; i++) a.update(1 / 30)
    for (let i = 0; i < 2000 && b.status === 'running'; i++) b.update(1 / 144)
    expect(a.measurements.time3).toBeCloseTo(b.measurements.time3, 12)
    expect(a.measurements.speed3).toBeCloseTo(b.measurements.speed3, 12)
  })
})

describe('extremes, reset and invalid input', () => {
  it('slowest valid race (ring, 2°, g 1.6, 2.5 m) finishes in 13.4 s', () => {
    const { measurements } = raced({ shape3: 'ring', angle: 2, gravity: 1.6, distance: 2.5 })
    expect(measurements.time3).toBeCloseTo(13.38, 2)
  })

  it('fastest valid race (sphere, 45°, g 25, 0.5 m) finishes in 0.28 s', () => {
    const { measurements } = raced({ angle: 45, gravity: 25, distance: 0.5 })
    expect(measurements.time1).toBeCloseTo(0.2814, 4)
  })

  it('winner reads "Not started", then "Racing…" before anyone finishes', () => {
    const runtime = new SimulationRuntime(rollingRace)
    expect(runtime.measurements.winner).toBe('ready')
    runtime.start()
    runtime.update(0.5)
    expect(runtime.measurements.winner).toBe('racing')
  })

  it('reset puts every body back on the start line with clocks at zero', () => {
    const runtime = raced()
    runtime.reset()
    expect(runtime.status).toBe('ready')
    expect(runtime.measurements.time1).toBe(0)
    expect(runtime.measurements.distance3).toBe(0)
    expect(runtime.measurements.speed2).toBe(0)
  })

  it('changing a variable resets the race', () => {
    const runtime = raced()
    runtime.setVariables({ angle: 20 })
    expect(runtime.status).toBe('ready')
    expect(runtime.measurements.time1).toBe(0)
  })

  it.each([
    [{ angle: 0 }],
    [{ angle: 60 }],
    [{ distance: 3 }],
    [{ mass1: 0 }],
    [{ radius2: 200 }],
    [{ gravity: Number.NaN }],
    [{ shape3: 'cube' }],
  ])('rejects %o and keeps the race', (change) => {
    const runtime = raced()
    expect(runtime.setVariables(change).ok).toBe(false)
    expect(runtime.status).toBe('completed')
  })
})
