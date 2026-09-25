import { create } from 'zustand'
import type { Annotation, AnnotationTool } from '@/lib/annotation'

export const ANNOTATION_COLORS = [
  '#e03131',
  '#f08c00',
  '#fcc419',
  '#2f9e44',
  '#1d6fe0',
  '#7048e8',
  '#212529',
  '#ffffff',
] as const
export const ANNOTATION_WIDTHS = [2, 4, 8] as const

/**
 * Screen annotations over the lab: whether the annotation bar is open, the
 * chosen tool, colour and width, and the drawings with an undo history.
 * Drawings stay visible when the bar closes, until cleared or the lab changes.
 */
interface AnnotationState {
  active: boolean
  tool: AnnotationTool
  color: string
  width: number
  annotations: readonly Annotation[]
  /** Earlier versions of `annotations`, newest last. */
  history: readonly (readonly Annotation[])[]

  toggle: () => void
  close: () => void
  setTool: (tool: AnnotationTool) => void
  setColor: (color: string) => void
  setWidth: (width: number) => void
  add: (annotation: Annotation) => void
  /** Removes the given drawings as one undoable step. */
  erase: (ids: readonly string[]) => void
  undo: () => void
  clear: () => void
  /** Forget everything (a different lab was opened). */
  reset: () => void
}

const HISTORY_LIMIT = 100

const initial = {
  active: false,
  tool: 'pen' as AnnotationTool,
  color: ANNOTATION_COLORS[0] as string,
  width: ANNOTATION_WIDTHS[1] as number,
  annotations: [] as readonly Annotation[],
  history: [] as readonly (readonly Annotation[])[],
}

const remember = (history: readonly (readonly Annotation[])[], current: readonly Annotation[]) =>
  [...history, current].slice(-HISTORY_LIMIT)

export const useAnnotationStore = create<AnnotationState>()((set) => ({
  ...initial,
  toggle: () => {
    set(({ active }) => ({ active: !active }))
  },
  close: () => {
    set({ active: false })
  },
  setTool: (tool) => {
    set({ tool })
  },
  setColor: (color) => {
    // Picking a colour while erasing means the learner wants to draw again.
    set(({ tool }) => ({ color, tool: tool === 'eraser' ? 'pen' : tool }))
  },
  setWidth: (width) => {
    set({ width })
  },
  add: (annotation) => {
    set(({ annotations, history }) => ({
      annotations: [...annotations, annotation],
      history: remember(history, annotations),
    }))
  },
  erase: (ids) => {
    if (ids.length === 0) return
    set(({ annotations, history }) => ({
      annotations: annotations.filter((a) => !ids.includes(a.id)),
      history: remember(history, annotations),
    }))
  },
  undo: () => {
    set(({ history }) => {
      const previous = history.at(-1)
      return previous ? { annotations: previous, history: history.slice(0, -1) } : {}
    })
  },
  clear: () => {
    set(({ annotations, history }) =>
      annotations.length === 0 ? {} : { annotations: [], history: remember(history, annotations) },
    )
  },
  reset: () => {
    set(initial)
  },
}))
