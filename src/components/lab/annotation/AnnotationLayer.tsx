import { useEffect, useRef, useState } from 'react'
import {
  HIGHLIGHTER_OPACITY,
  hits,
  isFreehand,
  isMeaningful,
  pathOf,
  strokeWidthOf,
  type Annotation,
  type Point,
} from '@/lib/annotation'
import { useAnnotationStore } from '@/state/annotationStore'

/** Eraser radius in CSS pixels. */
const ERASER_RADIUS = 10

let nextId = 0
const newId = () => `a${String(++nextId)}`

function Drawing({ annotation }: { annotation: Annotation }) {
  return (
    <path
      d={pathOf(annotation)}
      fill="none"
      stroke={annotation.color}
      strokeWidth={strokeWidthOf(annotation)}
      strokeOpacity={annotation.kind === 'highlighter' ? HIGHLIGHTER_OPACITY : 1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

/**
 * Transparent drawing layer over the 3D lab. While the annotation bar is open
 * it captures the pointer (so the scene does not rotate); otherwise drawings
 * stay visible but let every pointer event through to the scene.
 */
export function AnnotationLayer() {
  const active = useAnnotationStore((s) => s.active)
  const tool = useAnnotationStore((s) => s.tool)
  const color = useAnnotationStore((s) => s.color)
  const width = useAnnotationStore((s) => s.width)
  const annotations = useAnnotationStore((s) => s.annotations)
  const add = useAnnotationStore((s) => s.add)
  const erase = useAnnotationStore((s) => s.erase)
  const reset = useAnnotationStore((s) => s.reset)
  const [draft, setDraft] = useState<Annotation | null>(null)
  const [eraserAt, setEraserAt] = useState<Point | null>(null)
  const [erasing, setErasing] = useState<readonly string[]>([])
  const svg = useRef<SVGSVGElement>(null)

  // Drawings belong to the lab they were made on.
  useEffect(() => reset, [reset])

  const pointOf = (event: React.PointerEvent): Point => {
    const box = svg.current?.getBoundingClientRect()
    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) }
  }

  const eraseAt = (p: Point) => {
    const touched = annotations.filter((a) => hits(a, p, ERASER_RADIUS)).map((a) => a.id)
    if (touched.length > 0) setErasing((current) => [...new Set([...current, ...touched])])
  }

  return (
    <svg
      ref={svg}
      role={active ? 'application' : undefined}
      aria-label={active ? 'Annotation canvas' : undefined}
      aria-hidden={active ? undefined : true}
      data-annotations={annotations.length}
      className="absolute inset-0 h-full w-full touch-none"
      style={{
        pointerEvents: active ? 'auto' : 'none',
        cursor: active ? (tool === 'eraser' ? 'none' : 'crosshair') : undefined,
      }}
      onPointerDown={(event) => {
        if (!active || event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        const p = pointOf(event)
        if (tool === 'eraser') {
          setErasing([])
          eraseAt(p)
          setEraserAt(p)
          return
        }
        const id = newId()
        setDraft(
          isFreehand(tool)
            ? { id, kind: tool, color, width, points: [p] }
            : { id, kind: tool, color, width, from: p, to: p },
        )
      }}
      onPointerMove={(event) => {
        if (!active) return
        const p = pointOf(event)
        if (tool === 'eraser') {
          setEraserAt(p)
          if (event.buttons & 1) eraseAt(p)
          return
        }
        setDraft((current) => {
          if (!current) return current
          return 'points' in current ? { ...current, points: [...current.points, p] } : { ...current, to: p }
        })
      }}
      onPointerUp={() => {
        if (tool === 'eraser') {
          erase(erasing)
          setErasing([])
          return
        }
        if (draft && isMeaningful(draft)) add(draft)
        setDraft(null)
      }}
      onPointerLeave={() => {
        setEraserAt(null)
      }}
    >
      {annotations.map((annotation) => (
        <g
          key={annotation.id}
          // Strokes being erased fade until the pointer is released.
          opacity={erasing.includes(annotation.id) ? 0.25 : 1}
        >
          <Drawing annotation={annotation} />
        </g>
      ))}
      {draft ? <Drawing annotation={draft} /> : null}
      {active && tool === 'eraser' && eraserAt ? (
        <circle
          cx={eraserAt.x}
          cy={eraserAt.y}
          r={ERASER_RADIUS}
          fill="rgba(255,255,255,0.5)"
          stroke="#495057"
          strokeWidth={1}
        />
      ) : null}
    </svg>
  )
}
