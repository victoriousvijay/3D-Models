import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { DECAY_TIME_STEP, decayFixture, pointFixture, stagesFixture } from '../__fixtures__/fixtures'
import type { AnySimulationDefinition, Vec2 } from '../types'
import { MAX_FRAME_DELTA, SimulationRuntime, VariableValidationError } from './SimulationRuntime'

const seconds = (runtime: SimulationRuntime<AnySimulationDefinition>) => {
  const progress = runtime.progress
  if (progress.kind !== 'time') throw new Error('expected a continuous model')
  return progress.seconds
}

/** Feeds `totalSeconds` of real time to the runtime in frames of `frameSeconds`. */
const play = (
  runtime: SimulationRuntime<AnySimulationDefinition>,
  totalSeconds: number,
  frameSeconds: number,
) => {
  const frames = Math.round(totalSeconds / frameSeconds)
  for (let i = 0; i < frames; i++) runtime.update(frameSeconds)
}

describe('SimulationRuntime — typing', () => {
  it('infers variable, measurement and state types from the definition', () => {
    const runtime = new SimulationRuntime(pointFixture)
    expectTypeOf(runtime.variables).toEqualTypeOf<{ readonly x: number; readonly y: number }>()
    expectTypeOf(runtime.measurements.point).toEqualTypeOf<Vec2>()
    expectTypeOf(new SimulationRuntime(decayFixture).measurements.phase).toEqualTypeOf<
      'decaying' | 'depleted'
    >()
  })
})

describe('SimulationRuntime — lifecycle', () => {
  it('starts ready with valid initial measurements', () => {
    const runtime = new SimulationRuntime(decayFixture)
    expect(runtime.status).toBe('ready')
    expect(runtime.measurements.amount).toBe(1000)
    expect(runtime.measurements.halfLife).toBeCloseTo(Math.LN2 / 0.5, 12)
  })

  it('follows ready → running → paused → running and rejects invalid transitions', () => {
    const runtime = new SimulationRuntime(decayFixture)
    const statuses: string[] = []
    runtime.events.on('status', ({ current }) => statuses.push(current))

    expect(runtime.pause()).toBe(false)
    expect(runtime.resume()).toBe(false)
    expect(runtime.start()).toBe(true)
    expect(runtime.start()).toBe(false)
    expect(runtime.pause()).toBe(true)
    expect(runtime.resume()).toBe(true)

    expect(statuses).toEqual(['running', 'paused', 'running'])
  })

  it('does not advance unless running', () => {
    const runtime = new SimulationRuntime(decayFixture)
    runtime.update(0.05)
    expect(seconds(runtime)).toBe(0)
    runtime.start()
    runtime.pause()
    runtime.update(0.05)
    expect(seconds(runtime)).toBe(0)
  })

  it('reset() returns to the initial state', () => {
    const runtime = new SimulationRuntime(decayFixture)
    runtime.start()
    play(runtime, 1, 1 / 60)
    const reset = vi.fn()
    runtime.events.on('reset', reset)

    expect(runtime.reset()).toBe(true)
    expect(runtime.status).toBe('ready')
    expect(seconds(runtime)).toBe(0)
    expect(runtime.measurements.amount).toBe(1000)
    expect(reset).toHaveBeenCalledOnce()
  })

  it('destroy() is terminal', () => {
    const runtime = new SimulationRuntime(decayFixture)
    runtime.destroy()
    expect(runtime.status).toBe('destroyed')
    expect(runtime.start()).toBe(false)
    expect(runtime.reset()).toBe(false)
    expect(runtime.setVariables({ rate: 1 }).ok).toBe(false)
  })
})

describe('SimulationRuntime — continuous models', () => {
  it('matches the analytical solution', () => {
    const runtime = new SimulationRuntime(decayFixture)
    runtime.start()
    play(runtime, 2, 1 / 60)
    const t = seconds(runtime)
    expect(t).toBeCloseTo(2, 2)
    expect(runtime.measurements.amount).toBeCloseTo(1000 * Math.exp(-0.5 * t), 9)
  })

  it('is independent of the display frame rate', () => {
    const at30 = new SimulationRuntime(decayFixture)
    const at144 = new SimulationRuntime(decayFixture)
    at30.start()
    at144.start()
    play(at30, 1, 1 / 30)
    play(at144, 1, 1 / 144)

    // Both advance whole fixed steps; they may differ by at most one step of accumulator rounding.
    expect(Math.abs(seconds(at30) - seconds(at144))).toBeLessThanOrEqual(DECAY_TIME_STEP + 1e-12)
    for (const runtime of [at30, at144]) {
      expect(runtime.measurements.amount).toBeCloseTo(1000 * Math.exp(-0.5 * seconds(runtime)), 9)
    }
  })

  it('caps a large frame gap instead of jumping through time', () => {
    const runtime = new SimulationRuntime(decayFixture)
    runtime.start()
    runtime.update(5)
    expect(seconds(runtime)).toBeLessThanOrEqual(MAX_FRAME_DELTA + 1e-9)
  })

  it('applies time scale without changing the step size', () => {
    const runtime = new SimulationRuntime(decayFixture)
    expect(runtime.setTimeScale(0)).toBe(false)
    expect(runtime.setTimeScale(0.5)).toBe(true)
    runtime.start()
    play(runtime, 1, 1 / 60)
    expect(seconds(runtime)).toBeCloseTo(0.5, 2)
  })

  it('completes when the model reports completion', () => {
    const runtime = new SimulationRuntime(decayFixture, { initialVariables: { initialAmount: 2, rate: 10 } })
    runtime.start()
    play(runtime, 1, 1 / 60)
    expect(runtime.status).toBe('completed')
    expect(runtime.measurements.phase).toBe('depleted')
    // ln(2)/10 ≈ 0.0693 s, reached within one fixed step.
    expect(seconds(runtime)).toBeCloseTo(Math.LN2 / 10, 2)
  })

  it('stepOnce() advances exactly one fixed step and pauses', () => {
    const runtime = new SimulationRuntime(decayFixture)
    expect(runtime.stepOnce()).toBe(true)
    expect(runtime.status).toBe('paused')
    expect(seconds(runtime)).toBe(DECAY_TIME_STEP)
  })
})

describe('SimulationRuntime — discrete models', () => {
  it('advances one stage per interval and completes', () => {
    const runtime = new SimulationRuntime(stagesFixture)
    runtime.start()
    // Regression: 10 × 0.05 s sums to 0.49999… in floating point, yet the stage is due.
    play(runtime, 0.5, 0.05)
    expect(runtime.progress).toEqual({ kind: 'stages', count: 1 })
    play(runtime, 5, 0.05)
    expect(runtime.status).toBe('completed')
    expect(runtime.measurements.stage).toBe(3)
  })

  it('supports manual stepping', () => {
    const runtime = new SimulationRuntime(stagesFixture)
    runtime.stepOnce()
    runtime.stepOnce()
    expect(runtime.measurements.stage).toBe(2)
    expect(runtime.status).toBe('paused')
  })
})

describe('SimulationRuntime — static models', () => {
  it('cannot be started and reports no progress', () => {
    const runtime = new SimulationRuntime(pointFixture)
    expect(runtime.isDynamic).toBe(false)
    expect(runtime.start()).toBe(false)
    expect(runtime.stepOnce()).toBe(false)
    expect(runtime.progress).toEqual({ kind: 'none' })
  })

  it('recomputes state when variables change', () => {
    const runtime = new SimulationRuntime(pointFixture)
    expect(runtime.measurements.distance).toBe(5)
    runtime.setVariables({ x: 6, y: 8 })
    expect(runtime.measurements.point).toEqual([6, 8])
    expect(runtime.measurements.distance).toBe(10)
  })
})

describe('SimulationRuntime — variables', () => {
  it('rejects invalid initial variables', () => {
    expect(() => new SimulationRuntime(decayFixture, { initialVariables: { rate: -1 } })).toThrow(
      VariableValidationError,
    )
  })

  it('applies valid changes, emits, and resets the run', () => {
    const runtime = new SimulationRuntime(decayFixture)
    const onVariables = vi.fn()
    runtime.events.on('variables', onVariables)
    runtime.start()
    play(runtime, 0.5, 1 / 60)

    const result = runtime.setVariables({ rate: 1 })

    expect(result.ok).toBe(true)
    expect(runtime.variables.rate).toBe(1)
    expect(runtime.status).toBe('ready')
    expect(seconds(runtime)).toBe(0)
    expect(onVariables).toHaveBeenCalledOnce()
  })

  it('leaves state untouched when a change is invalid', () => {
    const runtime = new SimulationRuntime(decayFixture)
    const result = runtime.setVariables({ rate: 100 })
    expect(result.ok).toBe(false)
    expect(runtime.variables.rate).toBe(0.5)
  })
})

describe('SimulationRuntime — faults', () => {
  const faulty = (failAfter: number): AnySimulationDefinition => ({
    ...decayFixture,
    model: {
      ...decayFixture.model,
      measure: (state: unknown) => {
        const { t, amount } = state as { t: number; amount: number }
        return { amount: t > failAfter ? Number.NaN : amount, halfLife: 1, phase: 'decaying' }
      },
    },
  })

  it('faults instead of exposing a non-finite measurement', () => {
    const runtime = new SimulationRuntime(faulty(0.1))
    const faults: string[] = []
    runtime.events.on('fault', ({ message }) => faults.push(message))
    runtime.start()
    play(runtime, 0.5, 1 / 60)

    expect(runtime.status).toBe('faulted')
    expect(faults).toHaveLength(1)
    expect(faults[0]).toMatch(/amount must be a finite number/)
    expect(Number.isFinite(runtime.measurements['amount'])).toBe(true)
  })

  it('refuses to construct with an invalid initial state', () => {
    expect(() => new SimulationRuntime(faulty(-1))).toThrow(/invalid initial state/)
  })

  it('snapshots are serialisable', () => {
    const snapshot = new SimulationRuntime(pointFixture).getSnapshot()
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
    expect(snapshot.domain).toBe('fixture')
  })
})
