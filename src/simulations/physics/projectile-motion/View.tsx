import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import type { SimulationRuntime, Vec3 } from '@/engine'
import { degreesToRadians } from '@/domains/physics'
import {
  Trail,
  useOverlayVisible,
  usePlaneDrag,
  useRuntimeStatus,
  useSelectable,
  useSimulationRuntime,
  VectorArrow,
} from '@/rendering'
import { angleFromPointer } from './aiming'
import { launchAngleVariable, projectileMotion } from './definition'
import { ACCELERATION_SCALE, overlayColors, VELOCITY_SCALE } from './overlays'

/** Drawn radius (m). Larger than the physical 0.11 m so it stays visible — stated in the assumptions. */
const BALL_VISUAL_RADIUS = 0.25
const BARREL_LENGTH = 1.2
const GRAVITY_ARROW_OFFSET = 0.6
const HIGHLIGHT = '#1d6fe0'

type Runtime = SimulationRuntime<typeof projectileMotion>

function Launcher({ runtime }: { runtime: Runtime }) {
  const { selected, hovered, handlers } = useSelectable('launcher')
  const status = useRuntimeStatus(runtime)
  const mount = useRef<Group>(null)
  const barrel = useRef<Group>(null)
  const platform = useRef<Mesh>(null)

  const drag = usePlaneDrag({
    enabled: status !== 'running',
    onDrag: ([x, y]) => {
      const angle = angleFromPointer({ x, y }, runtime.variables.launchHeight, launchAngleVariable)
      if (angle !== runtime.variables.launchAngle) runtime.setVariables({ launchAngle: angle })
    },
  })

  useFrame(() => {
    const { launchHeight, launchAngle } = runtime.variables
    mount.current?.position.set(0, launchHeight, 0)
    barrel.current?.rotation.set(0, 0, degreesToRadians(launchAngle))
    if (platform.current) {
      platform.current.visible = launchHeight > 0
      platform.current.scale.set(1, Math.max(launchHeight, 1e-3), 1)
      platform.current.position.set(0, launchHeight / 2, 0)
    }
  })

  const emissive = selected || hovered ? HIGHLIGHT : '#000000'
  return (
    <group {...handlers} {...drag}>
      <mesh ref={platform}>
        <boxGeometry args={[1.4, 1, 1.4]} />
        <meshStandardMaterial color="#b4c6de" />
      </mesh>
      <group ref={mount}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.45, 0.55, 0.3, 24]} />
          <meshStandardMaterial color="#6b7f99" emissive={emissive} emissiveIntensity={0.25} />
        </mesh>
        <group ref={barrel}>
          <mesh position={[BARREL_LENGTH / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.16, 0.2, BARREL_LENGTH, 20]} />
            <meshStandardMaterial
              color="#33445a"
              metalness={0.4}
              roughness={0.4}
              emissive={emissive}
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Ball({ runtime }: { runtime: Runtime }) {
  const { selected, hovered, handlers } = useSelectable('projectile')
  const mesh = useRef<Mesh>(null)
  useFrame(() => {
    const { x, y } = runtime.state
    mesh.current?.position.set(x, y, 0)
  })
  return (
    <mesh ref={mesh} {...handlers}>
      <sphereGeometry args={[BALL_VISUAL_RADIUS, 24, 16]} />
      <meshStandardMaterial
        color="#0f1f35"
        emissive={selected || hovered ? HIGHLIGHT : '#000000'}
        emissiveIntensity={0.4}
      />
    </mesh>
  )
}

/** Shows the measured range on the ground once the ball has landed. */
function RangeMarker({ runtime }: { runtime: Runtime }) {
  const status = useRuntimeStatus(runtime)
  if (status !== 'completed') return null
  const distance = runtime.measurements.horizontalDistance
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[distance / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[distance, 0.08]} />
        <meshBasicMaterial color={overlayColors.trajectory} transparent opacity={0.6} />
      </mesh>
      <mesh position={[distance, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.45, 32]} />
        <meshBasicMaterial color={overlayColors.trajectory} />
      </mesh>
      <Html position={[distance / 2, 0.4, 0]} center className="pointer-events-none">
        <div className="rounded bg-lab-bg/80 px-2 py-0.5 font-mono text-xs whitespace-nowrap text-lab-strong">
          range {distance.toFixed(2)} m
        </div>
      </Html>
    </group>
  )
}

export default function ProjectileMotionView() {
  const runtime = useSimulationRuntime(projectileMotion)
  const showVelocity = useOverlayVisible('velocity')
  const showAcceleration = useOverlayVisible('acceleration')
  const showGravity = useOverlayVisible('gravity')
  const showTrajectory = useOverlayVisible('trajectory')

  const ballPosition = (): Vec3 => [runtime.state.x, runtime.state.y, 0]

  return (
    <>
      <Launcher runtime={runtime} />
      <Ball runtime={runtime} />
      {showTrajectory ? (
        <Trail runtime={runtime} getPoint={ballPosition} color={overlayColors.trajectory} />
      ) : null}
      <VectorArrow
        visible={showVelocity}
        getOrigin={ballPosition}
        getVector={() => runtime.measurements.velocity}
        scale={VELOCITY_SCALE}
        color={overlayColors.velocity}
      />
      <VectorArrow
        visible={showAcceleration}
        getOrigin={ballPosition}
        getVector={() => runtime.measurements.acceleration}
        scale={ACCELERATION_SCALE}
        color={overlayColors.acceleration}
      />
      <VectorArrow
        visible={showGravity}
        getOrigin={() => [runtime.state.x - GRAVITY_ARROW_OFFSET, runtime.state.y, 0]}
        getVector={() => [0, -runtime.variables.gravity, 0]}
        scale={ACCELERATION_SCALE}
        color={overlayColors.gravity}
      />
      <RangeMarker runtime={runtime} />
    </>
  )
}
