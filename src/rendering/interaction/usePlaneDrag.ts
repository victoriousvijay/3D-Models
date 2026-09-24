import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Plane, Vector3 } from 'three'
import type { Vec3 } from '@/engine'

interface PlaneDragOptions {
  /** Plane normal in scene space; the pointer ray is intersected with this plane. Default: +Z (the XY plane). */
  normal?: Vec3
  /** Plane offset along its normal. Default 0. */
  offset?: number
  /** Whether dragging is currently allowed. */
  enabled: boolean
  /** Called with the pointer's position on the plane while dragging. */
  onDrag: (point: Vec3) => void
}

interface OrbitLike {
  enabled: boolean
}

const isOrbitLike = (value: unknown): value is OrbitLike =>
  typeof value === 'object' && value !== null && 'enabled' in value

/** Enables or suspends whatever camera controls are installed (they are external, imperative objects). */
function setControlsEnabled(controls: unknown, value: boolean): void {
  if (isOrbitLike(controls)) controls.enabled = value
}

/**
 * Generic drag-on-a-plane interaction: captures the pointer, suspends camera
 * controls while dragging and reports plane intersections. What the point
 * *means* (an angle, a radius, a coefficient) is decided by the simulation.
 */
export function usePlaneDrag({ normal = [0, 0, 1], offset = 0, enabled, onDrag }: PlaneDragOptions) {
  // Read controls at event time rather than mutating a value returned by a hook.
  const getState = useThree((state) => state.get)
  const dragging = useRef(false)
  const [nx, ny, nz] = normal
  const plane = useMemo(() => new Plane(new Vector3(nx, ny, nz), -offset), [nx, ny, nz, offset])
  const hit = useMemo(() => new Vector3(), [])

  return {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      if (!enabled) return
      event.stopPropagation()
      // R3F routes captured pointer events to this object while dragging.
      ;(event.target as Element).setPointerCapture(event.pointerId)
      dragging.current = true
      setControlsEnabled(getState().controls, false)
    },
    onPointerMove: (event: ThreeEvent<PointerEvent>) => {
      if (!dragging.current) return
      event.stopPropagation()
      if (event.ray.intersectPlane(plane, hit)) onDrag([hit.x, hit.y, hit.z])
    },
    onPointerUp: (event: ThreeEvent<PointerEvent>) => {
      if (!dragging.current) return
      ;(event.target as Element).releasePointerCapture(event.pointerId)
      dragging.current = false
      setControlsEnabled(getState().controls, true)
    },
  }
}
