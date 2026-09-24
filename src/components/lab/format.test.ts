import { describe, expect, it } from 'vitest'
import type { MeasurementDefinition, VariableDefinition } from '@/engine'
import { decimalsForStep, formatMeasurement, formatNumber, formatVariable, unitSymbol } from './format'

describe('formatNumber', () => {
  it.each([
    [40.7747, '40.77'],
    [123.456, '123.5'],
    [0, '0.00'],
    [-0.001, '-1.00e-3'],
    [-0.004, '-4.00e-3'],
    [2_500_000, '2.50e+6'],
    [-1e-12, '-1.00e-12'],
  ])('%s → %s', (value, text) => {
    expect(formatNumber(value)).toBe(text)
  })

  it('never shows negative zero', () => {
    expect(formatNumber(-0)).toBe('0.00')
  })
})

describe('units and variables', () => {
  it('uses the degree sign and hides dimensionless units', () => {
    expect(unitSymbol('deg')).toBe('°')
    expect(unitSymbol('1')).toBe('')
  })

  it('formats variables with the precision of their step', () => {
    expect(decimalsForStep(0.5)).toBe(1)
    expect(decimalsForStep(1)).toBe(0)
    const angle: VariableDefinition = {
      kind: 'number',
      id: 'a',
      label: 'A',
      unit: 'deg',
      defaultValue: 0,
      min: 0,
      max: 90,
      step: 1,
    }
    const speed: VariableDefinition = {
      kind: 'number',
      id: 's',
      label: 'S',
      unit: 'm/s',
      defaultValue: 0,
      min: 0,
      max: 9,
      step: 0.5,
    }
    expect(formatVariable(angle, 45)).toBe('45°')
    expect(formatVariable(speed, 20)).toBe('20.0 m/s')
    expect(formatVariable({ kind: 'boolean', id: 'b', label: 'B', defaultValue: false }, true)).toBe('On')
  })
})

describe('formatMeasurement', () => {
  it('formats each measurement kind', () => {
    const scalar: MeasurementDefinition = { kind: 'scalar', id: 'r', label: 'R', unit: 'm' }
    const vector: MeasurementDefinition = { kind: 'vector', id: 'v', label: 'V', unit: 'm/s', dimensions: 3 }
    const category: MeasurementDefinition = {
      kind: 'category',
      id: 'p',
      label: 'P',
      options: [{ value: 'landed', label: 'Landed' }],
    }
    expect(formatMeasurement(scalar, 40.7747)).toBe('40.77 m')
    expect(formatMeasurement(vector, [14.14, -0, 0])).toBe('(14.14, 0.00, 0.00) m/s')
    expect(formatMeasurement(category, 'landed')).toBe('Landed')
    expect(formatMeasurement(scalar, undefined)).toBe('—')
  })
})
