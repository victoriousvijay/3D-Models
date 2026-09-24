import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { ArrowHelper, Color, Vector3 } from 'three'
import type { Vec3 } from '@/engine'

interface VectorArrowProps {
  /** Tail position in scene units, read every frame. */
  getOrigin: () => Vec3
  /** Vector in its physical unit, read every frame. */
  getVector: () => Vec3
  /** Scene units drawn per unit of the vector's quantity (e.g. 0.25 m per m/s). */
  scale: number
  color: string
  visible?: boolean
}

const MIN_LENGTH = 1e-6

/**
 * Draws a vector measurement as an arrow, updated inside the render loop so
 * a moving vector never triggers a React render. Domain-neutral: velocity,
 * force, field, dipole or a mathematical vector all use this.
 */
export function VectorArrow({ getOrigin, getVector, scale, color, visible = true }: VectorArrowProps) {
  const arrow = useMemo(
    () => new ArrowHelper(new Vector3(1, 0, 0), new Vector3(), 1, new Color(color)),
    [color],
  )
  const ref = useRef<ArrowHelper>(null)
  const direction = useMemo(() => new Vector3(), [])

  useEffect(
    () => () => {
      arrow.dispose()
    },
    [arrow],
  )

  useFrame(() => {
    const helper = ref.current
    if (!helper) return
    const [ox, oy, oz] = getOrigin()
    const [vx, vy, vz] = getVector()
    direction.set(vx, vy, vz)
    const length = direction.length() * scale
    helper.visible = visible && length > MIN_LENGTH
    if (!helper.visible) return
    helper.position.set(ox, oy, oz)
    helper.setDirection(direction.normalize())
    // Keep the head proportionate for short arrows and fixed for long ones.
    const head = Math.min(0.5, length * 0.3)
    helper.setLength(length, head, head * 0.6)
  })

  return <primitive ref={ref} object={arrow} />
}
