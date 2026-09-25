/**
 * Screen annotations drawn over the 3D lab (pen, highlighter, shapes) and the
 * geometry the annotation layer needs: SVG path data and eraser hit-testing.
 * Framework-free; coordinates are CSS pixels relative to the drawing layer.
 */

export interface Point {
  readonly x: number
  readonly y: number
}

export type AnnotationTool = 'pen' | 'highlighter' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'eraser'
export type DrawingTool = Exclude<AnnotationTool, 'eraser'>

export type Annotation =
  | {
      readonly id: string
      readonly kind: 'pen' | 'highlighter'
      readonly color: string
      readonly width: number
      readonly points: readonly Point[]
    }
  | {
      readonly id: string
      readonly kind: 'line' | 'arrow' | 'rect' | 'ellipse'
      readonly color: string
      readonly width: number
      readonly from: Point
      readonly to: Point
    }

/** Highlighter strokes are this much wider than the chosen width, and translucent. */
export const HIGHLIGHTER_SCALE = 4
export const HIGHLIGHTER_OPACITY = 0.35

export const isFreehand = (tool: DrawingTool): tool is 'pen' | 'highlighter' =>
  tool === 'pen' || tool === 'highlighter'

/** The drawn stroke width in pixels. */
export const strokeWidthOf = (annotation: Annotation): number =>
  annotation.kind === 'highlighter' ? annotation.width * HIGHLIGHTER_SCALE : annotation.width

/** The two barbs of an arrowhead at `to`, sized with the stroke. */
export function arrowHead(from: Point, to: Point, width: number): readonly [Point, Point] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const length = Math.max(10, width * 4)
  const spread = Math.PI / 7
  const barb = (sign: number): Point => ({
    x: to.x - length * Math.cos(angle + sign * spread),
    y: to.y - length * Math.sin(angle + sign * spread),
  })
  return [barb(1), barb(-1)]
}

const round = (n: number) => Math.round(n * 10) / 10
const move = (p: Point) => `M${round(p.x)} ${round(p.y)}`
const lineTo = (p: Point) => `L${round(p.x)} ${round(p.y)}`

/** SVG path data for an annotation (stroked, never filled). */
export function pathOf(annotation: Annotation): string {
  switch (annotation.kind) {
    case 'pen':
    case 'highlighter': {
      const [first, ...rest] = annotation.points
      if (!first) return ''
      // A single tap still leaves a visible dot.
      if (rest.length === 0) return `${move(first)} ${lineTo({ x: first.x + 0.1, y: first.y })}`
      return [move(first), ...rest.map(lineTo)].join(' ')
    }
    case 'line':
      return `${move(annotation.from)} ${lineTo(annotation.to)}`
    case 'arrow': {
      const [a, b] = arrowHead(annotation.from, annotation.to, annotation.width)
      return `${move(annotation.from)} ${lineTo(annotation.to)} ${move(a)} ${lineTo(annotation.to)} ${lineTo(b)}`
    }
    case 'rect': {
      const { from, to } = annotation
      return `${move(from)} ${lineTo({ x: to.x, y: from.y })} ${lineTo(to)} ${lineTo({ x: from.x, y: to.y })} Z`
    }
    case 'ellipse': {
      const cx = (annotation.from.x + annotation.to.x) / 2
      const cy = (annotation.from.y + annotation.to.y) / 2
      const rx = Math.abs(annotation.to.x - annotation.from.x) / 2
      const ry = Math.abs(annotation.to.y - annotation.from.y) / 2
      return `M${round(cx - rx)} ${round(cy)} a${round(rx)} ${round(ry)} 0 1 0 ${round(2 * rx)} 0 a${round(rx)} ${round(ry)} 0 1 0 ${round(-2 * rx)} 0`
    }
  }
}

/** The annotation as polylines, for hit-testing. */
export function outlineOf(annotation: Annotation): readonly (readonly Point[])[] {
  switch (annotation.kind) {
    case 'pen':
    case 'highlighter':
      return [annotation.points]
    case 'line':
      return [[annotation.from, annotation.to]]
    case 'arrow': {
      const [a, b] = arrowHead(annotation.from, annotation.to, annotation.width)
      return [
        [annotation.from, annotation.to],
        [a, annotation.to, b],
      ]
    }
    case 'rect': {
      const { from, to } = annotation
      return [[from, { x: to.x, y: from.y }, to, { x: from.x, y: to.y }, from]]
    }
    case 'ellipse': {
      const cx = (annotation.from.x + annotation.to.x) / 2
      const cy = (annotation.from.y + annotation.to.y) / 2
      const rx = Math.abs(annotation.to.x - annotation.from.x) / 2
      const ry = Math.abs(annotation.to.y - annotation.from.y) / 2
      const points: Point[] = []
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2
        points.push({ x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) })
      }
      return [points]
    }
  }
}

/** Shortest distance from p to the segment ab. */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** True when the eraser at `p` (radius in px) touches the drawn stroke. */
export function hits(annotation: Annotation, p: Point, radius: number): boolean {
  const reach = radius + strokeWidthOf(annotation) / 2
  return outlineOf(annotation).some((line) => {
    if (line.length === 1) {
      const [only] = line
      return only !== undefined && Math.hypot(p.x - only.x, p.y - only.y) <= reach
    }
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1]
      const b = line[i]
      if (a && b && distanceToSegment(p, a, b) <= reach) return true
    }
    return false
  })
}

/** Shapes need a real drag; a click without movement adds nothing. */
export function isMeaningful(annotation: Annotation): boolean {
  if ('points' in annotation) return annotation.points.length > 0
  return Math.hypot(annotation.to.x - annotation.from.x, annotation.to.y - annotation.from.y) >= 3
}
