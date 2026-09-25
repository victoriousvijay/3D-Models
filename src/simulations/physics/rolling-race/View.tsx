import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  DoubleSide,
  NearestFilter,
  RepeatWrapping,
  RGBAFormat,
  type Group,
  type Mesh,
} from 'three'
import type { SimulationRuntime } from '@/engine'
import type { RollingShape } from '@/domains/physics'
import {
  useOverlayVisible,
  usePlaneDrag,
  useRuntimeStatus,
  useRuntimeVariables,
  useSelectable,
  useSimulationRuntime,
  VectorArrow,
} from '@/rendering'
import { distanceVariable, rollingRace } from './definition'
import {
  accelerationOf,
  angleOf,
  finishTimeOf,
  FINISH_AT,
  LANES,
  laneState,
  racer,
  RAMP_LENGTH,
  readLane,
  type Lane,
  type RollingRaceVariables,
} from './model'
import { ACCELERATION_SCALE, ANGULAR_VELOCITY_SCALE, colors, laneColors, VELOCITY_SCALE } from './overlays'

type Runtime = SimulationRuntime<typeof rollingRace>

/** The board pivots about its bottom edge, here (m). */
const PIVOT_X = 2.6
const PIVOT_Y = 0.06
const LANE_WIDTH = 0.3
const laneZ: Readonly<Record<Lane, number>> = { 1: LANE_WIDTH, 2: 0, 3: -LANE_WIDTH }
const BOARD_WIDTH = LANE_WIDTH * 3 + 0.06
/** Axial length of cylinders and rings (m); it does not affect the motion. */
const AXIAL_LENGTH = 0.1
/** The gate stands this far downhill of the start line, clear of the largest body. */
const GATE_OFFSET = 0.13
const GATE_LIFT_TIME = 0.12
const HIGHLIGHT = '#1d6fe0'
const NARROW_WIDTH = 640

const useNarrow = () => useThree((state) => state.size.width < NARROW_WIDTH)

/** Local x along the tilted board (0 at the pivot, negative uphill) of slope coordinate u. */
const localX = (u: number) => u - RAMP_LENGTH
const startU = (vars: RollingRaceVariables) => FINISH_AT - vars.distance

const shapeName: Readonly<Record<RollingShape, string>> = {
  'solid-sphere': 'Solid sphere',
  'solid-cylinder': 'Solid cylinder',
  'hollow-sphere': 'Hollow sphere',
  ring: 'Ring',
}

const chipClass =
  'pointer-events-none select-none whitespace-nowrap rounded bg-lab-bg/90 px-1.5 py-0.5 font-mono text-[11px] leading-tight text-lab-strong shadow-sm'

/** Everything on the board lives in its tilted frame: x down the slope, y along the surface normal. */
function TiltedBoard({ runtime, children }: { runtime: Runtime; children: React.ReactNode }) {
  const vars = useRuntimeVariables(runtime)
  return (
    <group position={[PIVOT_X, PIVOT_Y, 0]} rotation={[0, 0, -angleOf(vars)]}>
      {children}
    </group>
  )
}

// ───────────────────────────────── Ramp ─────────────────────────────────

function useCheckerTexture() {
  const texture = useMemo(() => {
    const size = 4
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < size * size; i++) {
      const dark = (Math.floor(i / size) + i) % 2 === 0
      data.set(dark ? [30, 30, 30, 255] : [245, 245, 245, 255], i * 4)
    }
    const t = new DataTexture(data, size, size, RGBAFormat)
    t.magFilter = NearestFilter
    t.minFilter = NearestFilter
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
    t.repeat.set(6, 0.5)
    t.needsUpdate = true
    return t
  }, [])
  useEffect(
    () => () => {
      texture.dispose()
    },
    [texture],
  )
  return texture
}

function DistanceMarkers() {
  const narrow = useNarrow()
  const marks = useMemo(() => {
    const list: number[] = []
    for (let d = 0.25; d <= FINISH_AT - 0.1; d += 0.25) list.push(Number(d.toFixed(2)))
    return list
  }, [])
  const ticks = useMemo(() => {
    const positions: number[] = []
    for (const d of marks) {
      const x = localX(FINISH_AT - d)
      const long = d % 0.5 === 0
      positions.push(x, 0.002, BOARD_WIDTH / 2, x, 0.002, BOARD_WIDTH / 2 - (long ? 0.12 : 0.06))
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    return geometry
  }, [marks])
  return (
    <>
      <lineSegments geometry={ticks}>
        <lineBasicMaterial color="#f1f3f5" />
      </lineSegments>
      {narrow
        ? null
        : marks
            .filter((d) => d % 0.5 === 0)
            .map((d) => (
              <Html
                key={d}
                position={[localX(FINISH_AT - d), 0.01, BOARD_WIDTH / 2 + 0.07]}
                center
                className="pointer-events-none select-none"
              >
                <span className="font-mono text-[10px] whitespace-nowrap text-lab-muted">
                  {d.toFixed(1)} m
                </span>
              </Html>
            ))}
    </>
  )
}

function Ramp() {
  const { selected, hovered, handlers } = useSelectable('ramp')
  const checker = useCheckerTexture()
  const showMarkers = useOverlayVisible('markers')
  const emissive = selected || hovered ? HIGHLIGHT : '#000000'
  return (
    <>
      <mesh {...handlers} position={[-RAMP_LENGTH / 2, -0.02, 0]}>
        <boxGeometry args={[RAMP_LENGTH, 0.04, BOARD_WIDTH]} />
        <meshStandardMaterial color="#3b3f45" roughness={0.9} emissive={emissive} emissiveIntensity={0.25} />
      </mesh>
      {/* Lane dividers */}
      {[-1.5, -0.5, 0.5, 1.5].map((k) => (
        <mesh key={k} position={[-RAMP_LENGTH / 2, 0.012, k * LANE_WIDTH]}>
          <boxGeometry args={[RAMP_LENGTH, 0.024, 0.012]} />
          <meshStandardMaterial color="#d7dbe0" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      {/* Finish line */}
      <mesh position={[localX(FINISH_AT), 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, BOARD_WIDTH - 0.02]} />
        <meshBasicMaterial map={checker} />
      </mesh>
      {/* Photogate arch at the finish */}
      {[1, -1].map((side) => (
        <mesh key={side} position={[localX(FINISH_AT), 0.17, side * (BOARD_WIDTH / 2 + 0.02)]}>
          <boxGeometry args={[0.03, 0.34, 0.03]} />
          <meshStandardMaterial color="#343a40" />
        </mesh>
      ))}
      <mesh position={[localX(FINISH_AT), 0.35, 0]}>
        <boxGeometry args={[0.04, 0.04, BOARD_WIDTH + 0.07]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>
      {/* Foam catcher */}
      <mesh position={[localX(FINISH_AT) + 0.18, 0.13, 0]}>
        <boxGeometry args={[0.1, 0.26, BOARD_WIDTH]} />
        <meshStandardMaterial color="#f08c6a" roughness={1} />
      </mesh>
      {showMarkers ? <DistanceMarkers /> : null}
    </>
  )
}

/** Posts that hold the top of the board; their height follows the angle. */
function Supports({ runtime }: { runtime: Runtime }) {
  const vars = useRuntimeVariables(runtime)
  const u = 0.25
  const along = RAMP_LENGTH - u
  const theta = angleOf(vars)
  const x = PIVOT_X - along * Math.cos(theta)
  const height = PIVOT_Y + along * Math.sin(theta) - 0.04
  return (
    <>
      {[1, -1].map((side) => (
        <mesh key={side} position={[x, height / 2, side * (BOARD_WIDTH / 2 - 0.05)]}>
          <boxGeometry args={[0.05, Math.max(height, 0.01), 0.05]} />
          <meshStandardMaterial color="#6c757d" />
        </mesh>
      ))}
      <mesh position={[PIVOT_X, PIVOT_Y / 2, 0]}>
        <boxGeometry args={[0.1, PIVOT_Y, BOARD_WIDTH]} />
        <meshStandardMaterial color="#6c757d" />
      </mesh>
    </>
  )
}

function AngleArc({ runtime }: { runtime: Runtime }) {
  const vars = useRuntimeVariables(runtime)
  const theta = angleOf(vars)
  const radius = 0.55
  const mid = Math.PI - theta / 2
  return (
    <group position={[PIVOT_X, PIVOT_Y, BOARD_WIDTH / 2 + 0.05]}>
      <mesh>
        <ringGeometry args={[radius - 0.012, radius, 48, 1, Math.PI - theta, theta]} />
        <meshBasicMaterial color="#495057" side={DoubleSide} />
      </mesh>
      <mesh position={[-radius / 2 - 0.1, 0, 0]}>
        <planeGeometry args={[radius + 0.2, 0.008]} />
        <meshBasicMaterial color="#495057" />
      </mesh>
      <Html
        position={[Math.cos(mid) * (radius + 0.14), Math.sin(mid) * (radius + 0.14) + 0.02, 0]}
        center
        className="pointer-events-none select-none"
      >
        <span className="font-mono text-[11px] whitespace-nowrap text-lab-strong">θ = {vars.angle}°</span>
      </Html>
    </group>
  )
}

// ─────────────────────────────── Start gate ───────────────────────────────

function StartGate({ runtime }: { runtime: Runtime }) {
  const vars = useRuntimeVariables(runtime)
  const status = useRuntimeStatus(runtime)
  const { selected, hovered, handlers } = useSelectable('startGate')
  const plate = useRef<Mesh>(null)

  const drag = usePlaneDrag({
    enabled: status === 'ready',
    onDrag: ([x, y]) => {
      // Project the pointer onto the slope: local x = q · (cos θ, −sin θ).
      const theta = angleOf(runtime.variables)
      const along = (x - PIVOT_X) * Math.cos(theta) - (y - PIVOT_Y) * Math.sin(theta)
      const start = RAMP_LENGTH + along - GATE_OFFSET
      const raw = FINISH_AT - start
      const snapped = Math.round(raw / distanceVariable.step) * distanceVariable.step
      const distance = Number(
        Math.min(distanceVariable.max, Math.max(distanceVariable.min, snapped)).toFixed(2),
      )
      if (distance !== runtime.variables.distance) runtime.setVariables({ distance })
    },
  })

  useFrame(() => {
    const lift = Math.min(runtime.state.t / GATE_LIFT_TIME, 1) * 0.3
    plate.current?.position.set(localX(startU(runtime.variables) + GATE_OFFSET), 0.09 + lift, 0)
  })

  const emissive = selected || hovered ? HIGHLIGHT : '#000000'
  return (
    <mesh ref={plate} {...handlers} {...drag} position={[localX(startU(vars) + GATE_OFFSET), 0.09, 0]}>
      <boxGeometry args={[0.02, 0.16, BOARD_WIDTH - 0.02]} />
      <meshStandardMaterial color="#fab005" roughness={0.6} emissive={emissive} emissiveIntensity={0.3} />
    </mesh>
  )
}

// ───────────────────────────────── Bodies ─────────────────────────────────

function BodyShape({
  shape,
  radius,
  color,
  emissive,
}: {
  shape: RollingShape
  radius: number
  color: string
  emissive: string
}) {
  const band = (
    <mesh rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[radius * 1.002, Math.max(radius * 0.07, 0.003), 8, 48]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
  )
  switch (shape) {
    case 'solid-sphere':
      return (
        <>
          <mesh>
            <sphereGeometry args={[radius, 32, 20]} />
            <meshStandardMaterial
              color={color}
              roughness={0.45}
              emissive={emissive}
              emissiveIntensity={0.3}
            />
          </mesh>
          {band}
        </>
      )
    case 'hollow-sphere':
      return (
        <>
          <mesh>
            <sphereGeometry args={[radius, 32, 20]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={0.35}
              depthWrite={false}
              side={DoubleSide}
              emissive={emissive}
              emissiveIntensity={0.3}
            />
          </mesh>
          {band}
        </>
      )
    case 'solid-cylinder':
      return (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[radius, radius, AXIAL_LENGTH, 32]} />
            <meshStandardMaterial
              color={color}
              roughness={0.45}
              emissive={emissive}
              emissiveIntensity={0.3}
            />
          </mesh>
          {[1, -1].map((side) => (
            <mesh key={side} position={[0, 0, side * (AXIAL_LENGTH / 2 + 0.001)]}>
              <boxGeometry args={[radius * 2, Math.max(radius * 0.18, 0.006), 0.002]} />
              <meshStandardMaterial color="#f8f9fa" />
            </mesh>
          ))}
        </>
      )
    case 'ring':
      return (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[radius, radius, AXIAL_LENGTH, 40, 1, true]} />
            <meshStandardMaterial
              color={color}
              metalness={0.5}
              roughness={0.35}
              side={DoubleSide}
              emissive={emissive}
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh position={[0, radius, 0]}>
            <boxGeometry args={[0.012, 0.006, AXIAL_LENGTH + 0.004]} />
            <meshStandardMaterial color="#f8f9fa" />
          </mesh>
        </>
      )
  }
}

function Body({ runtime, lane }: { runtime: Runtime; lane: Lane }) {
  const vars = useRuntimeVariables(runtime)
  const { selected, hovered, handlers } = useSelectable(`body${lane}`)
  const showCom = useOverlayVisible('com')
  const group = useRef<Group>(null)
  const spin = useRef<Group>(null)
  const { shape, radius } = racer(vars, lane)

  useFrame(() => {
    const { s } = laneState(runtime.state, lane)
    group.current?.position.set(localX(startU(runtime.variables) + s), radius, laneZ[lane])
    // Rolling without slipping: turned through φ = s / r, clockwise as seen from +z.
    spin.current?.rotation.set(0, 0, -s / radius)
  })

  return (
    <group ref={group} position={[localX(startU(vars)), radius, laneZ[lane]]}>
      <group ref={spin} {...handlers}>
        <BodyShape
          shape={shape}
          radius={radius}
          color={laneColors[lane]}
          emissive={selected || hovered ? HIGHLIGHT : '#000000'}
        />
      </group>
      {showCom ? (
        <mesh renderOrder={2}>
          <sphereGeometry args={[0.012, 12, 8]} />
          <meshBasicMaterial color="#212529" depthTest={false} />
        </mesh>
      ) : null}
    </group>
  )
}

function BodyVectors({ runtime, lane }: { runtime: Runtime; lane: Lane }) {
  const showVelocity = useOverlayVisible('velocity')
  const showAcceleration = useOverlayVisible('acceleration')
  const showAngular = useOverlayVisible('angular')
  const centre = (lift: number) => () => {
    const { radius } = racer(runtime.variables, lane)
    const { s } = laneState(runtime.state, lane)
    return [localX(startU(runtime.variables) + s), 2 * radius + lift, laneZ[lane]] as const
  }
  return (
    <>
      <VectorArrow
        visible={showVelocity}
        getOrigin={centre(0.04)}
        getVector={() => [laneState(runtime.state, lane).v, 0, 0]}
        scale={VELOCITY_SCALE}
        color={colors.velocity}
      />
      <VectorArrow
        visible={showAcceleration && !laneState(runtime.state, lane).finished}
        getOrigin={centre(0.1)}
        getVector={() => [
          laneState(runtime.state, lane).finished ? 0 : accelerationOf(runtime.variables, lane),
          0,
          0,
        ]}
        scale={ACCELERATION_SCALE}
        color={colors.acceleration}
      />
      <VectorArrow
        visible={showAngular}
        getOrigin={() => {
          const { radius } = racer(runtime.variables, lane)
          const { s } = laneState(runtime.state, lane)
          return [localX(startU(runtime.variables) + s), radius, laneZ[lane]]
        }}
        getVector={() => {
          const reading = readLane(runtime.state, runtime.variables, lane)
          // Clockwise seen from +z: by the right-hand rule ω points along −z.
          return [0, 0, -reading.angularVelocity]
        }}
        scale={ANGULAR_VELOCITY_SCALE}
        color={colors.angular}
      />
    </>
  )
}

// ──────────────────────────── Progress and results ────────────────────────────

function placeOf(vars: RollingRaceVariables, lane: Lane): number {
  const mine = finishTimeOf(vars, lane)
  return 1 + LANES.filter((other) => finishTimeOf(vars, other) < mine - 1e-6).length
}

const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : '3rd')

function LaneProgress({ runtime, lane }: { runtime: Runtime; lane: Lane }) {
  const vars = useRuntimeVariables(runtime)
  const narrow = useNarrow()
  const stripe = useRef<Mesh>(null)
  const chip = useRef<HTMLDivElement>(null)

  useFrame(() => {
    const { s, finished } = laneState(runtime.state, lane)
    if (stripe.current) {
      stripe.current.visible = s > 1e-4
      stripe.current.scale.set(Math.max(s, 1e-4), 1, 1)
      stripe.current.position.set(localX(startU(runtime.variables)) + s / 2, 0.0015, laneZ[lane])
    }
    if (chip.current) chip.current.style.visibility = finished ? 'visible' : 'hidden'
  })

  const { shape } = racer(vars, lane)
  return (
    <>
      <mesh ref={stripe} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[1, LANE_WIDTH * 0.35]} />
        <meshBasicMaterial color={laneColors[lane]} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* Lane label at the top of the board */}
      <Html position={[localX(0.08), 0.02, laneZ[lane]]} center className="pointer-events-none select-none">
        <span
          className="font-mono text-[11px] font-semibold whitespace-nowrap"
          style={{ color: laneColors[lane] }}
        >
          {narrow ? lane : `${lane} · ${shapeName[shape]}`}
        </span>
      </Html>
      {/* Result at the finish. Phones show it in the Results cards instead: the lanes are too close. */}
      {narrow ? null : (
        <Html position={[localX(FINISH_AT) + 0.34, 0.1, laneZ[lane]]} className="pointer-events-none">
          <div
            ref={chip}
            className={chipClass}
            style={{ visibility: 'hidden', transform: 'translate(0, -50%)' }}
          >
            <span style={{ color: laneColors[lane] }}>{ordinal(placeOf(vars, lane))}</span>
            {` · ${finishTimeOf(vars, lane).toFixed(2)} s`}
          </div>
        </Html>
      )}
    </>
  )
}

// ─────────────────────────────── Energy columns ───────────────────────────────

const COLUMN_HEIGHT = 0.8
const COLUMN_WIDTH = 0.12

function EnergyColumn({ runtime, lane, x }: { runtime: Runtime; lane: Lane; x: number }) {
  const pe = useRef<Mesh>(null)
  const kt = useRef<Mesh>(null)
  const kr = useRef<Mesh>(null)

  useFrame(() => {
    const r = readLane(runtime.state, runtime.variables, lane)
    const total = r.potentialEnergy + r.translationalEnergy + r.rotationalEnergy
    const parts = [
      [pe, r.potentialEnergy],
      [kt, r.translationalEnergy],
      [kr, r.rotationalEnergy],
    ] as const
    let base = 0
    for (const [ref, value] of parts) {
      const h = total > 0 ? (value / total) * COLUMN_HEIGHT : 0
      if (ref.current) {
        ref.current.visible = h > 1e-4
        ref.current.scale.set(1, Math.max(h, 1e-4), 1)
        ref.current.position.set(x, base + h / 2, 0)
      }
      base += h
    }
  })

  return (
    <>
      <mesh ref={pe}>
        <boxGeometry args={[COLUMN_WIDTH, 1, COLUMN_WIDTH]} />
        <meshStandardMaterial color={colors.potential} />
      </mesh>
      <mesh ref={kt}>
        <boxGeometry args={[COLUMN_WIDTH, 1, COLUMN_WIDTH]} />
        <meshStandardMaterial color={laneColors[lane]} />
      </mesh>
      <mesh ref={kr}>
        <boxGeometry args={[COLUMN_WIDTH, 1, COLUMN_WIDTH]} />
        <meshStandardMaterial color={laneColors[lane]} transparent opacity={0.45} />
      </mesh>
    </>
  )
}

function EnergyColumns({ runtime }: { runtime: Runtime }) {
  const narrow = useNarrow()
  return (
    <group position={[2.05, 0, -0.95]}>
      {LANES.map((lane, i) => (
        <group key={lane}>
          <EnergyColumn runtime={runtime} lane={lane} x={i * 0.2} />
          <Html position={[i * 0.2, -0.06, 0]} center className="pointer-events-none select-none">
            <span className="font-mono text-[10px] font-semibold" style={{ color: laneColors[lane] }}>
              {lane}
            </span>
          </Html>
        </group>
      ))}
      {narrow ? null : (
        <Html position={[0.2, COLUMN_HEIGHT + 0.08, 0]} center className="pointer-events-none select-none">
          <span className="font-mono text-[10px] whitespace-nowrap text-lab-muted">
            energy: PE · ½mv² · ½Iω²
          </span>
        </Html>
      )}
    </group>
  )
}

export default function RollingRaceView() {
  const runtime = useSimulationRuntime(rollingRace)
  const showProgress = useOverlayVisible('progress')
  const showEnergy = useOverlayVisible('energy')

  // A hover cursor must not stick if the view unmounts mid-hover.
  useEffect(() => () => void (document.body.style.cursor = ''), [])

  return (
    <>
      <Supports runtime={runtime} />
      <AngleArc runtime={runtime} />
      <TiltedBoard runtime={runtime}>
        <Ramp />
        <StartGate runtime={runtime} />
        {LANES.map((lane) => (
          <group key={lane}>
            <Body runtime={runtime} lane={lane} />
            <BodyVectors runtime={runtime} lane={lane} />
            {showProgress ? <LaneProgress runtime={runtime} lane={lane} /> : null}
          </group>
        ))}
      </TiltedBoard>
      {showEnergy ? <EnergyColumns runtime={runtime} /> : null}
    </>
  )
}
