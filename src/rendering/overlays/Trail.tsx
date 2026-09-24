import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial } from 'three'
import type { AnySimulationRuntime, Vec3 } from '@/engine'

interface TrailProps {
  runtime: AnySimulationRuntime
  /** Current point to trace, read every frame. */
  getPoint: () => Vec3
  color: string
  /** Maximum number of points kept (preallocated; no per-frame allocation). */
  capacity?: number
  /** Minimum spacing between recorded points, in scene units. */
  minSpacing?: number
}

/**
 * Traces the path of a moving point as the simulation runs, and clears on
 * reset. Uses a fixed-size buffer so long runs cost no allocations.
 */
export function Trail({ runtime, getPoint, color, capacity = 4096, minSpacing = 0.05 }: TrailProps) {
  const line = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(capacity * 3), 3))
    geometry.setDrawRange(0, 0)
    return new Line(geometry, new LineBasicMaterial({ color, transparent: true, opacity: 0.85 }))
  }, [capacity, color])

  useEffect(() => {
    const clear = () => {
      line.geometry.setDrawRange(0, 0)
    }
    const off = runtime.events.on('reset', clear)
    return () => {
      off()
      line.geometry.dispose()
      line.material.dispose()
    }
  }, [runtime, line])

  useFrame(() => {
    if (runtime.status === 'ready') return
    const attribute = line.geometry.getAttribute('position')
    const count = line.geometry.drawRange.count
    if (!(attribute instanceof BufferAttribute) || count >= capacity) return

    const [x, y, z] = getPoint()
    if (count > 0) {
      const i = (count - 1) * 3
      const array = attribute.array
      const dx = x - (array[i] ?? 0)
      const dy = y - (array[i + 1] ?? 0)
      const dz = z - (array[i + 2] ?? 0)
      if (dx * dx + dy * dy + dz * dz < minSpacing * minSpacing) return
    }
    attribute.setXYZ(count, x, y, z)
    attribute.needsUpdate = true
    line.geometry.setDrawRange(0, count + 1)
    line.geometry.computeBoundingSphere()
  })

  return <primitive object={line} />
}
