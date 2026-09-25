import { beforeEach, describe, expect, it } from 'vitest'
import type { Annotation } from '@/lib/annotation'
import { useAnnotationStore } from './annotationStore'

const line = (id: string): Annotation => ({
  id,
  kind: 'line',
  color: '#000',
  width: 4,
  from: { x: 0, y: 0 },
  to: { x: 10, y: 10 },
})

const store = () => useAnnotationStore.getState()

describe('annotation store', () => {
  beforeEach(() => {
    store().reset()
  })

  it('adds drawings and undoes them one step at a time', () => {
    store().add(line('a'))
    store().add(line('b'))
    expect(store().annotations.map((a) => a.id)).toEqual(['a', 'b'])
    store().undo()
    expect(store().annotations.map((a) => a.id)).toEqual(['a'])
    store().undo()
    store().undo() // nothing left to undo: no change, no error
    expect(store().annotations).toEqual([])
  })

  it('erasing and clearing can be undone', () => {
    store().add(line('a'))
    store().add(line('b'))
    store().erase(['a'])
    expect(store().annotations.map((a) => a.id)).toEqual(['b'])
    store().clear()
    expect(store().annotations).toEqual([])
    store().undo()
    store().undo()
    expect(store().annotations.map((a) => a.id)).toEqual(['a', 'b'])
  })

  it('choosing a colour while erasing switches back to the pen', () => {
    store().setTool('eraser')
    store().setColor('#2f9e44')
    expect(store().tool).toBe('pen')
    expect(store().color).toBe('#2f9e44')
  })

  it('closing the bar keeps the drawings; reset forgets them', () => {
    store().toggle()
    store().add(line('a'))
    store().close()
    expect(store().active).toBe(false)
    expect(store().annotations).toHaveLength(1)
    store().reset()
    expect(store().annotations).toHaveLength(0)
  })
})
