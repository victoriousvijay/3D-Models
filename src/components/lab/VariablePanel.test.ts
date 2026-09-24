import { describe, expect, it } from 'vitest'
import { formatInputValue, parseInputValue } from './format'

describe('typed number entry', () => {
  it('parses plain numbers, decimals and a decimal comma', () => {
    expect(parseInputValue('25')).toBe(25)
    expect(parseInputValue(' 9.8 ')).toBe(9.8)
    expect(parseInputValue('1,62')).toBe(1.62)
    expect(parseInputValue('-3')).toBe(-3)
  })

  it('rejects empty and non-numeric text', () => {
    expect(parseInputValue('')).toBeNull()
    expect(parseInputValue('abc')).toBeNull()
    expect(parseInputValue('Infinity')).toBeNull()
  })

  it('shows the step precision, or more when the learner typed more', () => {
    expect(formatInputValue(20, 0.5)).toBe('20.0')
    expect(formatInputValue(45, 1)).toBe('45')
    expect(formatInputValue(9.81, 0.01)).toBe('9.81')
    expect(formatInputValue(9.815, 0.01)).toBe('9.815')
    expect(formatInputValue(0.1 + 0.2, 0.01)).toBe('0.3')
  })
})
