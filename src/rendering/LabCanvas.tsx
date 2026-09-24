import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useState, type ReactNode } from 'react'
import { OrthographicCamera } from 'three'
import type { SceneConfig } from '@/engine'
import { sceneColors } from './theme'

const DEFAULT_CAMERA: SceneConfig['camera'] = {
  position: [6, 4, 8],
  target: [0, 0, 0],
  projection: 'perspective',
}
const MAX_DPR = 2
const ORTHOGRAPHIC_ZOOM = 50
/** Width/height ratio scene framings are authored for. Narrower views pull the camera back. */
const REFERENCE_ASPECT = 1.6

interface Updatable {
  update: () => void
}
const isUpdatable = (value: unknown): value is Updatable =>
  typeof value === 'object' && value !== null && 'update' in value && typeof value.update === 'function'

/**
 * Keeps the authored framing visible on narrow or portrait viewports (phones,
 * split screens) by moving the camera back along its view direction — or
 * zooming out an orthographic camera — in proportion to the lost width.
 */
function FitToAspect({ camera: config }: { camera: SceneConfig['camera'] }) {
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const get = useThree((state) => state.get)
  const [px, py, pz] = config.position
  const [tx, ty, tz] = config.target

  useEffect(() => {
    if (width === 0 || height === 0) return
    const factor = Math.max(1, REFERENCE_ASPECT / (width / height))
    const { camera, controls, invalidate } = get()
    if (camera instanceof OrthographicCamera) {
      camera.zoom = ORTHOGRAPHIC_ZOOM / factor
      camera.updateProjectionMatrix()
    } else {
      camera.position.set(tx + (px - tx) * factor, ty + (py - ty) * factor, tz + (pz - tz) * factor)
      camera.lookAt(tx, ty, tz)
    }
    if (isUpdatable(controls)) controls.update()
    invalidate()
  }, [width, height, get, px, py, pz, tx, ty, tz])

  return null
}

interface LabCanvasProps {
  /** Framing for the open simulation; the neutral lab view when absent. */
  camera?: SceneConfig['camera']
  children: ReactNode
}

/**
 * The single WebGL surface of the application.
 *
 * - `frameloop="demand"`: frames render only when something changes
 *   (see `SimulationDriver`), which keeps laptops cool and batteries alive.
 * - Resolution drops automatically when frame rate declines.
 */
export function LabCanvas({ camera = DEFAULT_CAMERA, children }: LabCanvasProps) {
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, MAX_DPR))
  const orthographic = camera.projection === 'orthographic'
  const [px, py, pz] = camera.position
  const [tx, ty, tz] = camera.target

  return (
    <Canvas
      frameloop="demand"
      dpr={dpr}
      orthographic={orthographic}
      camera={
        orthographic
          ? { position: [px, py, pz], zoom: ORTHOGRAPHIC_ZOOM }
          : { position: [px, py, pz], fov: camera.fov ?? 50 }
      }
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-label="3D laboratory"
    >
      <color attach="background" args={[sceneColors.background]} />
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1)
        }}
        onIncline={() => {
          setDpr(Math.min(window.devicePixelRatio, MAX_DPR))
        }}
      />
      <OrbitControls makeDefault target={[tx, ty, tz]} enableDamping />
      <FitToAspect camera={camera} />
      {children}
    </Canvas>
  )
}
