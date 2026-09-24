import { describe, expect, it } from 'vitest'
import type { MeasurementDefinition } from '../types'
import { checkMeasurementValue, findInvalidMeasurements } from './measurements'

const scalar: MeasurementDefinition = { kind: 'scalar', id: 'ph', label: 'pH', unit: '1' }
const vector: MeasurementDefinition = { kind: 'vector', id: 'v', label: 'Velocity', unit: 'm', dimensions: 3 }
const category: MeasurementDefinition = {
  kind: 'category',
  id: 'phase',
  label: 'Phase',
  options: [
    { value: 'interphase', label: 'Interphase' },
    { value: 'mitosis', label: 'Mitosis' },
  ],
}

describe('checkMeasurementValue', () => {
  it.each([
    [scalar, 7],
    [vector, [1, 2, 3]],
    [category, 'mitosis'],
  ] as const)('accepts a valid %s.kind value', (def, value) => {
    expect(checkMeasurementValue(def, value)).toBeNull()
  })

  it.each([
    [scalar, Number.NaN],
    [scalar, Number.POSITIVE_INFINITY],
    [scalar, '7'],
    [vector, [1, 2]],
    [vector, [1, Number.NaN, 3]],
    [category, 'anaphase'],
    [scalar, undefined],
  ] as const)('rejects an invalid %s.kind value (%s)', (def, value) => {
    expect(checkMeasurementValue(def, value)).not.toBeNull()
  })
})

describe('findInvalidMeasurements', () => {
  it('reports only invalid or missing values', () => {
    const messages = findInvalidMeasurements([scalar, vector, category], { ph: 7, v: [0, 0, Number.NaN] })
    expect(messages).toHaveLength(2)
  })
})
