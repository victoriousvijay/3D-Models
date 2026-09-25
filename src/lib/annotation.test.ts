import { describe, expect, it } from 'vitest'
import {
  arrowHead,
  distanceToSegment,
  hits,
  isMeaningful,
  outlineOf,
  pathOf,
  strokeWidthOf,
  type Annotation,
} from './annotation'

const pen: Annotation = {
  id: 'p',
  kind: 'pen',
  color: '#000',
  width: 4,
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
}
type ShapeAnnotation = Extract<Annotation, { from: unknown }>
const shape = (kind: ShapeAnnotation['kind']): ShapeAnnotation => ({
  id: kind,
  kind,
  color: '#000',
  width: 4,
  from: { x: 0, y: 0 },
  to: { x: 100, y: 50 },
})

describe('annotation geometry', () => {
  it('distance to a segment: perpendicular, beyond the ends, and degenerate', () => {
    expect(distanceToSegment({ x: 50, y: 10 }, { x: 0, y: 0 }, { x: 100, y: 0 })).toBe(10)
    expect(distanceToSegment({ x: 110, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 })).toBe(10)
    expect(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5)
  })

  it('pen paths join the points; a single tap still draws a dot', () => {
    expect(pathOf(pen)).toBe('M0 0 L100 0')
    expect(pathOf({ ...pen, points: [{ x: 5, y: 5 }] })).toMatch(/^M5 5 L5\.1 5$/)
  })

  it('shapes produce closed or open outlines as expected', () => {
    expect(pathOf(shape('rect'))).toBe('M0 0 L100 0 L100 50 L0 50 Z')
    expect(pathOf(shape('ellipse'))).toContain('a50 25')
    expect(outlineOf(shape('arrow'))).toHaveLength(2)
  })

  it('the arrowhead points back from the tip, symmetric about the shaft', () => {
    const [a, b] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 4)
    expect(a.x).toBeLessThan(100)
    expect(a.y).toBeCloseTo(-b.y, 12)
  })

  it('the highlighter is drawn wider than the chosen width', () => {
    expect(strokeWidthOf({ ...pen, kind: 'highlighter' })).toBe(16)
    expect(strokeWidthOf(pen)).toBe(4)
  })
})

describe('eraser hit-testing', () => {
  it('hits a stroke within the eraser radius plus half the stroke width', () => {
    expect(hits(pen, { x: 50, y: 9 }, 7)).toBe(true) // 7 + 2 = 9
    expect(hits(pen, { x: 50, y: 10 }, 7)).toBe(false)
  })

  it('hits a rectangle only near its edges, not in its empty middle', () => {
    expect(hits(shape('rect'), { x: 100, y: 25 }, 4)).toBe(true)
    expect(hits(shape('rect'), { x: 50, y: 25 }, 4)).toBe(false)
  })

  it('hits an ellipse on its rim', () => {
    expect(hits(shape('ellipse'), { x: 50, y: 0 }, 4)).toBe(true)
    expect(hits(shape('ellipse'), { x: 50, y: 25 }, 4)).toBe(false)
  })

  it('a one-point pen dot can be erased', () => {
    expect(hits({ ...pen, points: [{ x: 10, y: 10 }] }, { x: 13, y: 10 }, 2)).toBe(true)
  })
})

describe('meaningful annotations', () => {
  it('a shape needs a real drag; any pen stroke counts', () => {
    expect(isMeaningful({ ...shape('line'), to: { x: 1, y: 1 } })).toBe(false)
    expect(isMeaningful(shape('line'))).toBe(true)
    expect(isMeaningful({ ...pen, points: [] })).toBe(false)
  })
})
