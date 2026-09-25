import { cn } from 'cn'
import { useEffect } from 'react'
import {
  Circle,
  Eraser,
  Highlighter,
  Minus,
  MoveUpRight,
  Pen,
  Square,
  Trash2,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { AnnotationTool } from '@/lib/annotation'
import { ANNOTATION_COLORS, ANNOTATION_WIDTHS, useAnnotationStore } from '@/state/annotationStore'

const TOOLS: readonly { tool: AnnotationTool; label: string; icon: LucideIcon }[] = [
  { tool: 'pen', label: 'Pen', icon: Pen },
  { tool: 'highlighter', label: 'Highlighter', icon: Highlighter },
  { tool: 'line', label: 'Line', icon: Minus },
  { tool: 'arrow', label: 'Arrow', icon: MoveUpRight },
  { tool: 'rect', label: 'Rectangle', icon: Square },
  { tool: 'ellipse', label: 'Circle', icon: Circle },
  { tool: 'eraser', label: 'Eraser', icon: Eraser },
]

const iconButton =
  'grid size-8 place-items-center rounded-md text-lab-text hover:bg-lab-subtle aria-pressed:bg-lab-accent/15 aria-pressed:text-lab-accent disabled:opacity-40'

const Divider = () => <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-lab-line" />

/** The annotation toolbar: tools, colours (swatches and a picker), stroke width, undo, clear, close. */
export function AnnotationBar() {
  const active = useAnnotationStore((s) => s.active)
  const tool = useAnnotationStore((s) => s.tool)
  const color = useAnnotationStore((s) => s.color)
  const width = useAnnotationStore((s) => s.width)
  const count = useAnnotationStore((s) => s.annotations.length)
  const canUndo = useAnnotationStore((s) => s.history.length > 0)
  const { setTool, setColor, setWidth, undo, clear, close } = useAnnotationStore.getState()

  // Esc closes the tools (drawings stay); Ctrl/⌘+Z undoes the last change.
  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'Escape') close()
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [active, close, undo])

  if (!active) return null

  return (
    <div
      role="toolbar"
      aria-label="Annotation tools"
      className="pointer-events-auto absolute top-16 left-1/2 z-10 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-contain [&>*]:shrink-0 rounded-lg border border-lab-line/70 bg-lab-bg/95 p-1.5 shadow-lg backdrop-blur-sm lg:top-4"
    >
      {TOOLS.map(({ tool: id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          title={label}
          aria-pressed={tool === id}
          className={iconButton}
          onClick={() => {
            setTool(id)
          }}
        >
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
      <Divider />
      <div role="group" aria-label="Colour" className="flex items-center gap-1">
        {ANNOTATION_COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Colour ${swatch}`}
            aria-pressed={color === swatch}
            onClick={() => {
              setColor(swatch)
            }}
            className={cn(
              'size-5 rounded-full border border-black/20 transition-transform',
              color === swatch && 'scale-110 ring-2 ring-lab-accent ring-offset-1',
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
        <label
          title="Pick any colour"
          className="relative grid size-6 cursor-pointer place-items-center rounded-full border border-black/20"
          style={{
            background: 'conic-gradient(#e03131, #fcc419, #2f9e44, #1d6fe0, #7048e8, #e03131)',
          }}
        >
          <span className="sr-only">Pick any colour</span>
          <input
            type="color"
            aria-label="Pick any colour"
            value={color}
            onChange={(event) => {
              setColor(event.target.value)
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
      <Divider />
      <div role="group" aria-label="Thickness" className="flex items-center">
        {ANNOTATION_WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            aria-label={`Thickness ${String(w)}`}
            aria-pressed={width === w}
            className={iconButton}
            onClick={() => {
              setWidth(w)
            }}
          >
            <span className="rounded-full bg-current" style={{ width: w + 3, height: w + 3 }} aria-hidden />
          </button>
        ))}
      </div>
      <Divider />
      <button
        type="button"
        aria-label="Undo"
        title="Undo"
        className={iconButton}
        disabled={!canUndo}
        onClick={undo}
      >
        <Undo2 className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Clear all drawings"
        title="Clear all"
        className={iconButton}
        disabled={count === 0}
        onClick={clear}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Close annotation tools"
        title="Close (drawings stay)"
        className={iconButton}
        onClick={close}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
