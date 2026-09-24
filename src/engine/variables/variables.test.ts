import { describe, expect, it } from 'vitest'
import type { VariableDefinition } from '../types'
import { resolveVariables, validateVariableDefinitions } from './variables'

const definitions = [
  { kind: 'number', id: 'amount', label: 'Amount', unit: 'mol', defaultValue: 1, min: 0, max: 10, step: 0.1 },
  { kind: 'boolean', id: 'catalyst', label: 'Catalyst', defaultValue: false },
  {
    kind: 'choice',
    id: 'medium',
    label: 'Medium',
    defaultValue: 'water',
    options: [
      { value: 'water', label: 'Water' },
      { value: 'air', label: 'Air' },
    ],
  },
] as const satisfies readonly VariableDefinition[]

describe('resolveVariables', () => {
  it('returns defaults when no overrides are given', () => {
    const result = resolveVariables(definitions)
    expect(result).toEqual({ ok: true, values: { amount: 1, catalyst: false, medium: 'water' } })
  })

  it('applies valid overrides', () => {
    const result = resolveVariables(definitions, { amount: 2.5, catalyst: true, medium: 'air' })
    expect(result.ok && result.values).toEqual({ amount: 2.5, catalyst: true, medium: 'air' })
  })

  it.each([
    ['below minimum', { amount: -1 }],
    ['above maximum', { amount: 11 }],
    ['NaN', { amount: Number.NaN }],
    ['Infinity', { amount: Number.POSITIVE_INFINITY }],
    ['wrong type', { amount: '5' }],
    ['non-boolean toggle', { catalyst: 1 }],
    ['unknown choice', { medium: 'vacuum' }],
    ['unknown variable', { temperature: 300 }],
  ])('rejects %s', (_, overrides) => {
    const result = resolveVariables(definitions, overrides)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues).toHaveLength(1)
  })

  it('accepts values exactly at the bounds', () => {
    expect(resolveVariables(definitions, { amount: 0 }).ok).toBe(true)
    expect(resolveVariables(definitions, { amount: 10 }).ok).toBe(true)
  })

  it('runs cross-variable validators once individual values are valid', () => {
    const defs = [
      { kind: 'number', id: 'low', label: 'Low', unit: 'K', defaultValue: 1, min: 0, max: 100, step: 1 },
      {
        kind: 'number',
        id: 'high',
        label: 'High',
        unit: 'K',
        defaultValue: 2,
        min: 0,
        max: 100,
        step: 1,
        validate: (value, all) => (value > Number(all['low']) ? null : 'High must exceed Low.'),
      },
    ] as const satisfies readonly VariableDefinition[]

    expect(resolveVariables(defs).ok).toBe(true)
    const result = resolveVariables(defs, { low: 50, high: 10 })
    expect(result).toEqual({ ok: false, issues: [{ variableId: 'high', message: 'High must exceed Low.' }] })
  })
})

describe('validateVariableDefinitions', () => {
  it('accepts consistent definitions', () => {
    expect(validateVariableDefinitions(definitions)).toEqual([])
  })

  it('reports inconsistent definitions', () => {
    const issues = validateVariableDefinitions([
      { kind: 'number', id: 'a', label: 'A', unit: '1', defaultValue: 5, min: 10, max: 0, step: 0 },
      { kind: 'boolean', id: 'a', label: 'Duplicate', defaultValue: true },
      { kind: 'choice', id: 'c', label: 'C', defaultValue: 'x', options: [] },
    ])
    const messages = issues.map((issue) => issue.message).join('\n')
    expect(messages).toMatch(/min \(10\) must not exceed max/)
    expect(messages).toMatch(/step \(0\) must be positive/)
    expect(messages).toMatch(/defaultValue \(5\) must lie within/)
    expect(messages).toMatch(/Duplicate variable id "a"/)
    expect(messages).toMatch(/at least one option/)
  })
})
