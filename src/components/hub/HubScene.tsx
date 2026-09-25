import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import type { DivisionId, LabDivision } from '@/catalogue'
import { DivisionEmblem } from './DivisionEmblem'

type Vec3Tuple = [number, number, number]

const BACKGROUND = '#f4f8fd'
const EMBLEM_HEIGHT = 1.55

/** Station positions: an arc on wide screens, a 2×2 block on portrait screens. */
function layoutFor(compact: boolean): Vec3Tuple[] {
  return compact
    ? [
        [-1.75, 0, -1.5],
        [1.75, 0, -1.5],
        [-1.75, 0, 1.8],
        [1.75, 0, 1.8],
      ]
    : [
        [-4.8, 0, -0.4],
        [-1.6, 0, 0.5],
        [1.6, 0, 0.5],
        [4.8, 0, -0.4],
      ]
}

function cameraFor(compact: boolean, aspect: number): { position: Vector3; look: Vector3 } {
  if (compact) {
    // Steeper, more top-down view so the front row does not hide the back row.
    const k = Math.max(1, 1.05 / aspect)
    return { position: new Vector3(0, 11 * k, 9.5 * k), look: new Vector3(0, 0.6, 0.3) }
  }
  const k = Math.max(1, 1.75 / aspect)
  return { position: new Vector3(0, 3.6 * k, 11.5 * k), look: new Vector3(0, 1.1, 0) }
}

interface StationProps {
  division: LabDivision
  position: Vec3Tuple
  active: boolean
  animate: boolean
  onHover: (id: DivisionId | null) => void
  onSelect: (id: DivisionId) => void
}

function Station({ division, position, active, animate, onHover, onSelect }: StationProps) {
  const lift = useRef<Group>(null)
  const pool = useRef<Mesh>(null)
  const phase = useMemo(() => position[0] * 1.7 + position[2], [position])

  useFrame(({ clock }, delta) => {
    const group = lift.current
    if (!group) return
    const targetScale = active ? 1.14 : 1
    const bob = animate ? Math.sin(clock.getElapsedTime() * 1.1 + phase) * 0.08 : 0
    group.position.y +=
      (EMBLEM_HEIGHT + (active ? 0.18 : 0) + bob - group.position.y) * Math.min(1, delta * 6)
    group.scale.setScalar(group.scale.x + (targetScale - group.scale.x) * Math.min(1, delta * 8))
    const material = pool.current?.material as MeshBasicMaterial | undefined
    if (material) material.opacity += ((active ? 0.32 : 0.14) - material.opacity) * Math.min(1, delta * 6)
  })

  const handlers = {
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      onHover(division.id)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      onHover(null)
      document.body.style.cursor = ''
    },
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation()
      onSelect(division.id)
    },
  }

  return (
    <group position={position} {...handlers}>
      {/* Light pool on the floor. */}
      <mesh ref={pool} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[1.7, 48]} />
        <meshBasicMaterial color={division.accent} transparent opacity={0.14} depthWrite={false} />
      </mesh>
      {/* Pedestal. */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[1.02, 1.12, 0.44, 48]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.028, 8, 96]} />
        <meshStandardMaterial
          color={division.accent}
          emissive={division.accent}
          emissiveIntensity={active ? 1.1 : 0.5}
        />
      </mesh>
      {/* The division's emblem, floating above. */}
      <group ref={lift} position={[0, EMBLEM_HEIGHT, 0]}>
        <DivisionEmblem division={division.id} accent={division.accent} active={active} animate={animate} />
      </group>
      {/* Invisible, generous hit area so stations are easy to click or tap. */}
      <mesh position={[0, 1.2, 0]} visible={false}>
        <cylinderGeometry args={[1.3, 1.3, 2.6, 16]} />
      </mesh>
    </group>
  )
}

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[16, 96]} />
        {/* Unlit: a lit floor seen at a grazing angle turns grey; the lab should read bright. */}
        <meshBasicMaterial color="#eaf1fb" />
      </mesh>
      {[3.2, 6.2, 9.5, 13].map((radius) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <ringGeometry args={[radius - 0.015, radius + 0.015, 128]} />
          <meshBasicMaterial color="#c9d8ee" />
        </mesh>
      ))}
    </group>
  )
}

interface RigProps {
  compact: boolean
  animate: boolean
  flyTo: Vec3Tuple | null
  onArrive: () => void
}

/** Frames the facility for the screen shape, sways gently, and flies to a chosen station. */
function CameraRig({ compact, animate, flyTo, onArrive }: RigProps) {
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height))
  const get = useThree((state) => state.get)
  const flying = useRef(false)
  const look = useRef(new Vector3())

  useEffect(() => {
    const { position, look: target } = cameraFor(compact, aspect)
    const { camera } = get()
    camera.position.copy(position)
    look.current.copy(target)
    camera.lookAt(target)
  }, [compact, aspect, get])

  useEffect(() => {
    if (!flyTo) return
    flying.current = true
    const { camera } = get()
    const [x, , z] = flyTo
    const endPosition = new Vector3(x * 0.92, EMBLEM_HEIGHT + 1.1, z + 3.4)
    const endLook = new Vector3(x, EMBLEM_HEIGHT, z)
    const startPosition = camera.position.clone()
    const startLook = look.current.clone()
    const progress = { t: 0 }
    const tween = gsap.to(progress, {
      t: 1,
      duration: 1.05,
      ease: 'power3.inOut',
      onUpdate: () => {
        camera.position.lerpVectors(startPosition, endPosition, progress.t)
        look.current.lerpVectors(startLook, endLook, progress.t)
        camera.lookAt(look.current)
      },
      onComplete: onArrive,
    })
    return () => {
      tween.kill()
    }
  }, [flyTo, get, onArrive])

  useFrame(({ clock, camera }) => {
    if (!animate || flying.current) return
    const base = cameraFor(compact, aspect)
    camera.position.x = base.position.x + Math.sin(clock.getElapsedTime() * 0.15) * 0.45
    camera.lookAt(look.current)
  })

  return null
}

export interface HubSceneProps {
  divisions: readonly LabDivision[]
  hovered: DivisionId | null
  onHover: (id: DivisionId | null) => void
  onSelect: (id: DivisionId) => void
  /** Division the camera should fly to; `onArrive` fires when it gets there. */
  flyTo: DivisionId | null
  onArrive: () => void
  animate: boolean
}

function Facility({ divisions, hovered, onHover, onSelect, flyTo, onArrive, animate }: HubSceneProps) {
  const compact = useThree((state) => state.size.width / Math.max(1, state.size.height) < 1)
  const positions = layoutFor(compact)
  const flyIndex = flyTo ? divisions.findIndex((d) => d.id === flyTo) : -1
  const flyTarget = flyIndex >= 0 ? (positions[flyIndex] ?? null) : null

  return (
    <>
      <CameraRig compact={compact} animate={animate} flyTo={flyTarget} onArrive={onArrive} />
      <Floor />
      {divisions.map((division, i) => (
        <Station
          key={division.id}
          division={division}
          position={positions[i] ?? [0, 0, 0]}
          active={hovered === division.id || flyTo === division.id}
          animate={animate}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

/** The Science Lab Hub: one facility, four divisions, each with its own identity. */
export function HubScene(props: HubSceneProps) {
  return (
    <Canvas
      // Flat (no tone mapping): the facility is a designed, evenly lit space whose
      // whites and division colours must render exactly as specified.
      flat
      frameloop={props.animate || props.flyTo ? 'always' : 'demand'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 3.6, 11.5], fov: 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => {
        props.onHover(null)
      }}
    >
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 14, 30]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 9, 6]} intensity={1.3} />
      <directionalLight position={[-6, 4, -3]} intensity={0.35} />
      <Facility {...props} />
    </Canvas>
  )
}
