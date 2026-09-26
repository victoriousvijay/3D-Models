import { describe, expect, it } from 'vitest'
import { ghostFontSize, roleOf, stepIndex } from './carousel'

describe('landing carousel', () => {
  it('steps forward and back, wrapping around', () => {
    expect(stepIndex(0, 'next', 4)).toBe(1)
    expect(stepIndex(3, 'next', 4)).toBe(0)
    expect(stepIndex(0, 'prev', 4)).toBe(3)
  })

  it('gives every slide a role: front, left, right and back', () => {
    expect([0, 1, 2, 3].map((i) => roleOf(i, 0, 4))).toEqual(['center', 'right', 'back', 'left'])
    expect([0, 1, 2, 3].map((i) => roleOf(i, 2, 4))).toEqual(['back', 'left', 'center', 'right'])
  })

  it('shrinks long ghost words so they fit', () => {
    expect(ghostFontSize('PHYSICS')).toBe('clamp(72px, 28.57vw, 380px)')
    expect(ghostFontSize('CHEMISTRY')).toBe('clamp(72px, 22.22vw, 380px)')
  })
})
