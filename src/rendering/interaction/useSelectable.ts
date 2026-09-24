import type { ThreeEvent } from '@react-three/fiber'
import { useState } from 'react'
import { useLabStore } from '@/state/labStore'

/**
 * Pointer handlers that make a mesh selectable. `objectId` must match a
 * `SimulationObjectDefinition.id`; selection drives highlighting and
 * contextual explanations. Re-renders only when this object's selection
 * or hover state changes.
 */
export function useSelectable(objectId: string) {
  const selected = useLabStore((state) => state.selectedObjectId === objectId)
  const selectObject = useLabStore((state) => state.selectObject)
  const [hovered, setHovered] = useState(false)

  const handlers = {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation()
      selectObject(selected ? null : objectId)
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      setHovered(true)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      setHovered(false)
      document.body.style.cursor = ''
    },
  }

  return { selected, hovered, handlers }
}
