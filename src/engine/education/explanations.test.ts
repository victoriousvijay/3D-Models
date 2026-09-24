import { describe, expect, it } from 'vitest'
import { decayFixture } from '../__fixtures__/fixtures'
import type { AnySimulationDefinition } from '../types'
import { explanationsFor, validateExplanations, validateInvestigations } from './explanations'

describe('explanationsFor', () => {
  it('returns explanations for the matching anchor only', () => {
    expect(explanationsFor(decayFixture, { kind: 'variable', id: 'rate' }).map((e) => e.id)).toEqual(['rate'])
    expect(explanationsFor(decayFixture, { kind: 'simulation' }).map((e) => e.id)).toEqual(['about'])
    expect(explanationsFor(decayFixture, { kind: 'object', id: 'rate' })).toEqual([])
  })
})

describe('validateExplanations', () => {
  it('accepts valid anchors', () => {
    expect(validateExplanations(decayFixture)).toEqual([])
  })

  it('reports unknown anchors, duplicates and empty text', () => {
    const broken: AnySimulationDefinition = {
      ...decayFixture,
      explanations: [
        { id: 'a', anchor: { kind: 'measurement', id: 'nope' }, title: 'T', body: 'B', review: 'draft' },
        { id: 'a', anchor: { kind: 'simulation' }, title: ' ', body: 'B', review: 'draft' },
      ],
    }
    const issues = validateExplanations(broken).join('\n')
    expect(issues).toMatch(/unknown measurement "nope"/)
    expect(issues).toMatch(/Duplicate explanation id "a"/)
    expect(issues).toMatch(/needs a title and body/)
  })
})

describe('validateInvestigations', () => {
  it('accepts investigations that reference existing presets', () => {
    expect(validateInvestigations(decayFixture)).toEqual([])
  })

  it('reports unknown presets, duplicates and empty text', () => {
    const broken: AnySimulationDefinition = {
      ...decayFixture,
      investigations: [
        { id: 'q', question: 'Why?', hint: 'Try.', presetId: 'missing', review: 'draft' },
        { id: 'q', question: ' ', hint: 'Try.', review: 'draft' },
      ],
    }
    const issues = validateInvestigations(broken).join('\n')
    expect(issues).toMatch(/unknown preset "missing"/)
    expect(issues).toMatch(/Duplicate investigation id "q"/)
    expect(issues).toMatch(/needs a question and a hint/)
  })
})
