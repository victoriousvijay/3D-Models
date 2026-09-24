import { describe, expect, it, vi } from 'vitest'
import { compareExperiments, ExperimentLog, type ExperimentSource } from './ExperimentLog'

const source = (overrides: Partial<ExperimentSource> = {}): ExperimentSource => ({
  simulationId: 'sim',
  progress: { kind: 'time', seconds: 1.5 },
  variables: { rate: 0.5, catalyst: false },
  measurements: { amount: 100, point: [1, 2], phase: 'decaying' },
  ...overrides,
})

const newLog = () => {
  let n = 0
  return new ExperimentLog({ createId: () => `exp-${++n}`, now: () => new Date('2026-01-01T00:00:00Z') })
}

describe('ExperimentLog', () => {
  it('records an immutable copy and emits an event', () => {
    const log = newLog()
    const onRecorded = vi.fn()
    log.events.on('recorded', onRecorded)
    const input = { rate: 0.5 }

    const record = log.record(source({ variables: input }), 'Baseline')
    input.rate = 99

    expect(record).toMatchObject({ id: 'exp-1', label: 'Baseline', recordedAt: '2026-01-01T00:00:00.000Z' })
    expect(record.variables['rate']).toBe(0.5)
    expect(Object.isFrozen(record.measurements)).toBe(true)
    expect(onRecorded).toHaveBeenCalledWith(record)
  })

  it('lists, filters, gets and removes records', () => {
    const log = newLog()
    log.record(source())
    log.record(source({ simulationId: 'other' }))

    expect(log.list()).toHaveLength(2)
    expect(log.list('other')).toHaveLength(1)
    expect(log.get('exp-1')?.simulationId).toBe('sim')
    expect(log.remove('exp-1')).toBe(true)
    expect(log.remove('exp-1')).toBe(false)
    expect(log.list()).toHaveLength(1)
  })
})

describe('compareExperiments', () => {
  it('diffs scalars, vectors and categories', () => {
    const log = newLog()
    const a = log.record(source())
    const b = log.record(
      source({
        variables: { rate: 1, catalyst: false },
        measurements: { amount: 60, point: [4, 6], phase: 'depleted' },
      }),
    )

    const comparison = compareExperiments(a, b)

    expect(comparison.variables).toEqual([
      { id: 'rate', a: 0.5, b: 1, changed: true },
      { id: 'catalyst', a: false, b: false, changed: false },
    ])
    expect(comparison.measurements).toEqual([
      { id: 'amount', a: 100, b: 60, changed: true, difference: -40 },
      { id: 'point', a: [1, 2], b: [4, 6], changed: true, difference: [3, 4] },
      { id: 'phase', a: 'decaying', b: 'depleted', changed: true, difference: null },
    ])
  })

  it('refuses to compare different simulations', () => {
    const log = newLog()
    const a = log.record(source())
    const b = log.record(source({ simulationId: 'other' }))
    expect(() => compareExperiments(a, b)).toThrow(/Cannot compare/)
  })
})
