import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useState, type ReactNode } from 'react'
import { MOUSE, OrthographicCamera, TOUCH } from 'three'
import { useLabStore } from '@/state/labStore'
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

/** The parts of drei's OrbitControls this file configures. */
interface NavigableControls extends Updatable {
  target: { set: (x: number, y: number, z: number) => void }
  mouseButtons: { LEFT?: MOUSE | null; MIDDLE?: MOUSE | null; RIGHT?: MOUSE | null }
  touches: { ONE?: TOUCH | null; TWO?: TOUCH | null }
  zoomToCursor: boolean
}
const isNavigable = (value: unknown): value is NavigableControls =>
  isUpdatable(value) && 'mouseButtons' in value && 'touches' in value && 'target' in value

const ORBIT_MOUSE = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
const GRAB_MOUSE = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }
const ORBIT_TOUCH = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }
const GRAB_TOUCH = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }

/**
 * Grab mode (toolbar hand button): left drag / one finger pans, the wheel zooms
 * towards the cursor, right drag still rotates, and scene objects ignore the
 * pointer so a drag never selects or moves them by accident.
 */
function NavigationMode() {
  const grab = useLabStore((state) => state.grabMode)
  const get = useThree((state) => state.get)
  // Re-run once drei registers the default controls (after the first render).
  const hasControls = useThree((state) => state.controls !== null)

  useEffect(() => {
    const { controls, setEvents, gl } = get()
    const canvas = gl.domElement
    if (isNavigable(controls)) {
      controls.mouseButtons = grab ? GRAB_MOUSE : ORBIT_MOUSE
      controls.touches = grab ? GRAB_TOUCH : ORBIT_TOUCH
      controls.zoomToCursor = grab
    }
    setEvents({ enabled: !grab })
    if (!grab) {
      canvas.style.cursor = ''
      return
    }
    canvas.style.cursor = 'grab'
    const down = () => {
      canvas.style.cursor = 'grabbing'
    }
    const up = () => {
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      canvas.style.cursor = ''
    }
  }, [grab, get, hasControls])

  return null
}

/**
 * Keeps the authored framing visible on narrow or portrait viewports (phones,
 * split screens) by moving the camera back along its view direction — or
 * zooming out an orthographic camera — in proportion to the lost width.
 */
function FitToAspect({ camera: config }: { camera: SceneConfig['camera'] }) {
  const width = useThree((state) => state.size.width)
  const height = useThree((state) => state.size.height)
  const get = useThree((state) => state.get)
  // "Reset view" re-applies the authored framing, including the orbit target a pan moved.
  const resetToken = useLabStore((state) => state.viewResetToken)
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
    if (isNavigable(controls)) controls.target.set(tx, ty, tz)
    if (isUpdatable(controls)) controls.update()
    invalidate()
  }, [width, height, get, px, py, pz, tx, ty, tz, resetToken])

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
      <NavigationMode />
      {children}
    </Canvas>
  )
}
