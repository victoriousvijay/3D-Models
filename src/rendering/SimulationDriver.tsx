import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { AnySimulationRuntime } from '@/engine'

/**
 * Bridges the render loop to the engine. The canvas runs on demand, so this
 * requests frames only while the simulation is running (or after a change),
 * letting the GPU idle whenever nothing moves.
 */
export function SimulationDriver({ runtime }: { runtime: AnySimulationRuntime }) {
  const invalidate = useThree((state) => state.invalidate)
  // After an idle period the first frame's delta spans the whole pause; skip it.
  const skipNextDelta = useRef(true)

  useEffect(() => {
    const offStatus = runtime.events.on('status', ({ current }) => {
      if (current === 'running') skipNextDelta.current = true
      invalidate()
    })
    const redraw = () => {
      invalidate()
    }
    const offReset = runtime.events.on('reset', redraw)
    const offStepped = runtime.events.on('stepped', redraw)
    return () => {
      offStatus()
      offReset()
      offStepped()
    }
  }, [runtime, invalidate])

  useFrame((_, delta) => {
    if (runtime.status !== 'running') return
    if (skipNextDelta.current) {
      skipNextDelta.current = false
    } else {
      runtime.update(delta)
    }
    invalidate()
  })

  return null
}
