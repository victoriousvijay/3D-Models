import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Object3D,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import type { SimulationRuntime } from '@/engine'
import { kineticEnergy, momentum } from '@/domains/physics'
import {
  useOverlayVisible,
  usePlaneDrag,
  useRuntimeStatus,
  useRuntimeVariables,
  useSelectable,
  useSimulationRuntime,
  VectorArrow,
} from '@/rendering'
import { collision1d, velocityAVariable, velocityBVariable } from './definition'
import { BENCH_TOP } from './Environment'
import {
  BUMPER_LENGTH,
  buildTimeline,
  GLIDER_LENGTH,
  START_A,
  START_B,
  TRACK_LENGTH,
  type CollisionTimeline,
  type CollisionVariables,
} from './model'
import { colors, MOMENTUM_SCALE, VELOCITY_SCALE } from './overlays'

type Runtime = SimulationRuntime<typeof collision1d>
type Body = 'A' | 'B'

/** Half-diagonal of the square track beam, i.e. the height of its ridge above its axis (m). */
const BEAM = 0.07
const RIDGE = BEAM / Math.SQRT2
const BODY_HALF = GLIDER_LENGTH / 2 - BUMPER_LENGTH
const BODY_Y = RIDGE + 0.029
const VELOCITY_Y = 0.25
const MOMENTUM_Y = 0.33
const LABEL_Y = 0.47
const HIGHLIGHT = '#1d6fe0'
const RULER_Z = 0.3
/** Below this canvas width (phones) text in the scene is reduced to what stays legible. */
const NARROW_WIDTH = 640

const useNarrow = () => useThree((state) => state.size.width < NARROW_WIDTH)

const labelClass =
  'pointer-events-none select-none whitespace-nowrap rounded bg-lab-bg/85 px-1.5 py-0.5 font-mono text-[11px] leading-tight text-lab-strong shadow-sm'

/** "0.00" rather than "-0.00". */
const fixed = (x: number, digits = 2): string => {
  const text = x.toFixed(digits)
  return /^-0\.0+$/.test(text) ? text.slice(1) : text
}

const positionOf = (runtime: Runtime, body: Body) => (body === 'A' ? runtime.state.xA : runtime.state.xB)
const velocityOf = (runtime: Runtime, body: Body) => (body === 'A' ? runtime.state.vA : runtime.state.vB)
const massOf = (vars: CollisionVariables, body: Body) => (body === 'A' ? vars.massA : vars.massB)

// ───────────────────────────────── Track ─────────────────────────────────

function AirHoles() {
  const mesh = useRef<InstancedMesh>(null)
  const spacing = 0.03
  const perRow = Math.floor((TRACK_LENGTH - 0.12) / spacing) + 1
  useLayoutEffect(() => {
    const holes = mesh.current
    if (!holes) return
    const dummy = new Object3D()
    const offset = RIDGE / 2 + 0.0006
    let i = 0
    for (const side of [1, -1]) {
      for (let n = 0; n < perRow; n++) {
        // Centre line of each upper face, lifted a hair off the surface.
        dummy.position.set(0.06 + n * spacing, offset, side * offset)
        dummy.rotation.set(side === 1 ? -Math.PI / 4 : (-3 * Math.PI) / 4, 0, 0)
        dummy.updateMatrix()
        holes.setMatrixAt(i++, dummy.matrix)
      }
    }
    holes.instanceMatrix.needsUpdate = true
  }, [perRow])
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, perRow * 2]}>
      <circleGeometry args={[0.0035, 8]} />
      <meshBasicMaterial color="#5c6773" />
    </instancedMesh>
  )
}

function Track() {
  const { selected, hovered, handlers } = useSelectable('track')
  const emissive = selected || hovered ? HIGHLIGHT : '#000000'
  const supportHeight = -RIDGE - BENCH_TOP
  return (
    <group>
      <mesh {...handlers} position={[TRACK_LENGTH / 2, 0, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[TRACK_LENGTH, BEAM, BEAM]} />
        <meshStandardMaterial
          color="#c9ced6"
          metalness={0.55}
          roughness={0.35}
          emissive={emissive}
          emissiveIntensity={0.2}
        />
      </mesh>
      <AirHoles />
      <Ruler />
      {[0.35, TRACK_LENGTH - 0.35].map((x) => (
        <mesh key={x} position={[x, BENCH_TOP + supportHeight / 2, 0]}>
          <boxGeometry args={[0.05, supportHeight, 0.06]} />
          <meshStandardMaterial color="#6c7784" />
        </mesh>
      ))}
      {/* End stops */}
      {[-0.012, TRACK_LENGTH + 0.012].map((x) => (
        <mesh key={x} position={[x, 0.03, 0]}>
          <boxGeometry args={[0.024, 0.16, 0.16]} />
          <meshStandardMaterial color="#495361" />
        </mesh>
      ))}
      {/* +x axis */}
      <group position={[-0.05, 0.2, 0.18]}>
        <VectorArrow getOrigin={() => [0, 0, 0]} getVector={() => [1, 0, 0]} scale={0.3} color="#39424e" />
        <Html position={[0.36, 0, 0]} center className="pointer-events-none select-none">
          <span className="font-mono text-[11px] text-lab-muted">+x</span>
        </Html>
      </group>
    </group>
  )
}

/** Metre ruler on the bench along the track (cm ticks, labels every 0.5 m). */
function Ruler() {
  const ticks = useMemo(() => {
    const positions: number[] = []
    for (let cm = 0; cm <= TRACK_LENGTH * 100; cm++) {
      const x = cm / 100
      const length = cm % 50 === 0 ? 0.05 : cm % 10 === 0 ? 0.032 : 0.016
      positions.push(x, 0, -0.03, x, 0, -0.03 + length)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    return geometry
  }, [])

  return (
    <group position={[0, BENCH_TOP + 0.002, RULER_Z]}>
      <mesh position={[TRACK_LENGTH / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TRACK_LENGTH + 0.06, 0.08]} />
        <meshStandardMaterial color="#fbfaf5" roughness={0.9} />
      </mesh>
      <lineSegments geometry={ticks} position={[0, 0.001, 0]}>
        <lineBasicMaterial color="#39424e" />
      </lineSegments>
      {[0, 0.5, 1, 1.5, 2, 2.5, 3].map((x) => (
        <Html key={x} position={[x, 0.01, 0.07]} center className="pointer-events-none select-none">
          <span className="font-mono text-[10px] whitespace-nowrap text-lab-muted">
            {x === 0 ? '0 m' : x.toFixed(1)}
          </span>
        </Html>
      ))}
    </group>
  )
}

// ──────────────────────────────── Gliders ────────────────────────────────

const springGeometry = (() => {
  const turns = 5
  const points: Vector3[] = []
  for (let i = 0; i <= turns * 16; i++) {
    const a = (i / 16) * Math.PI * 2
    points.push(
      new Vector3(
        -BUMPER_LENGTH / 2 + (i / (turns * 16)) * BUMPER_LENGTH,
        Math.cos(a) * 0.013,
        Math.sin(a) * 0.013,
      ),
    )
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 160, 0.0022, 6, false)
})()

/** The facing bumper. It shortens by half the total compression (both bumpers squash equally). */
function Bumper({ runtime, body }: { runtime: Runtime; body: Body }) {
  const vars = useRuntimeVariables(runtime)
  const group = useRef<Group>(null)
  const plate = useRef<Mesh>(null)
  const direction = body === 'A' ? 1 : -1

  useFrame(() => {
    const length = Math.max(BUMPER_LENGTH - runtime.state.compression / 2, 0.002)
    group.current?.scale.set(length / BUMPER_LENGTH, 1, 1)
    group.current?.position.set(direction * (BODY_HALF + length / 2), 0, 0)
    plate.current?.position.set(direction * (BODY_HALF + length - 0.002), 0, 0)
  })

  return (
    <>
      <group ref={group}>
        {vars.collisionType === 'elastic' ? (
          <mesh geometry={springGeometry}>
            <meshStandardMaterial color="#8a939e" metalness={0.8} roughness={0.3} />
          </mesh>
        ) : vars.collisionType === 'inelastic' ? (
          <mesh>
            <boxGeometry args={[BUMPER_LENGTH, 0.03, 0.034]} />
            <meshStandardMaterial color="#3d434a" roughness={0.9} />
          </mesh>
        ) : (
          <mesh scale={[BUMPER_LENGTH / 2, 0.021, 0.024]}>
            <sphereGeometry args={[1, 20, 12]} />
            <meshStandardMaterial color="#b8895a" roughness={1} />
          </mesh>
        )}
      </group>
      {vars.collisionType === 'elastic' ? (
        <mesh ref={plate} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.017, 0.017, 0.004, 20]} />
          <meshStandardMaterial color="#aab2bc" metalness={0.8} roughness={0.25} />
        </mesh>
      ) : null}
    </>
  )
}

function MassDiscs({ mass }: { mass: number }) {
  const count = Math.round(mass / 0.25)
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, BODY_Y + 0.024 + i * 0.013, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 0.011, 24]} />
          <meshStandardMaterial color="#b58b35" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </>
  )
}

function ValuesLabel({ runtime, body, showValues }: { runtime: Runtime; body: Body; showValues: boolean }) {
  const vars = useRuntimeVariables(runtime)
  const line = useRef<HTMLSpanElement>(null)
  const mass = massOf(vars, body)
  const narrow = useNarrow()
  const describe = () => {
    const v = velocityOf(runtime, body)
    return `v ${fixed(v)} m/s · p ${fixed(momentum(mass, v))} kg·m/s`
  }
  useFrame(() => {
    const text = describe()
    if (line.current && line.current.textContent !== text) line.current.textContent = text
  })
  return (
    // A's label extends to the left and B's to the right, so they never overlap when the gliders meet.
    <Html position={[body === 'A' ? 0.03 : -0.03, LABEL_Y, 0]} className="pointer-events-none">
      <div
        className={labelClass}
        style={{ transform: body === 'A' ? 'translate(-100%, -50%)' : 'translate(0, -50%)' }}
      >
        <span className="font-semibold" style={{ color: body === 'A' ? colors.gliderA : colors.gliderB }}>
          {body}
        </span>
        {narrow ? null : ` · ${mass.toFixed(2)} kg`}
        {showValues && !narrow ? (
          <span ref={line} className="block text-[10px] text-lab-muted">
            {describe()}
          </span>
        ) : null}
      </div>
    </Html>
  )
}

function Glider({ runtime, body }: { runtime: Runtime; body: Body }) {
  const id = body === 'A' ? 'gliderA' : 'gliderB'
  const { selected, hovered, handlers } = useSelectable(id)
  const vars = useRuntimeVariables(runtime)
  const showValues = useOverlayVisible('values')
  const group = useRef<Group>(null)
  const color = body === 'A' ? colors.gliderA : colors.gliderB
  const emissive = selected || hovered ? HIGHLIGHT : '#000000'

  useFrame(() => group.current?.position.set(positionOf(runtime, body), 0, 0))

  const plateOffset = RIDGE / 2 + 0.006
  return (
    <group ref={group}>
      <group {...handlers}>
        {[1, -1].map((side) => (
          <mesh
            key={side}
            position={[0, plateOffset, side * plateOffset]}
            rotation={[side * (Math.PI / 4), 0, 0]}
          >
            <boxGeometry args={[BODY_HALF * 2, 0.005, 0.078]} />
            <meshStandardMaterial
              color={color}
              metalness={0.3}
              roughness={0.45}
              emissive={emissive}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
        <mesh position={[0, BODY_Y, 0]}>
          <boxGeometry args={[BODY_HALF * 2, 0.036, 0.1]} />
          <meshStandardMaterial
            color={color}
            metalness={0.3}
            roughness={0.45}
            emissive={emissive}
            emissiveIntensity={0.3}
          />
        </mesh>
        <MassDiscs mass={massOf(vars, body)} />
      </group>
      <group position={[0, BODY_Y, 0]}>
        <Bumper runtime={runtime} body={body} />
      </group>
      <ValuesLabel runtime={runtime} body={body} showValues={showValues} />
    </group>
  )
}

/** Drag the arrow tip to set a glider's initial velocity (before a run only). */
function VelocityHandle({ runtime, body }: { runtime: Runtime; body: Body }) {
  const status = useRuntimeStatus(runtime)
  const mesh = useRef<Mesh>(null)
  const variable = body === 'A' ? velocityAVariable : velocityBVariable
  const start = body === 'A' ? START_A : START_B
  const ready = status === 'ready'

  const drag = usePlaneDrag({
    enabled: ready,
    onDrag: ([x]) => {
      const raw = (x - start) / VELOCITY_SCALE
      const snapped = Math.round(raw / variable.step) * variable.step
      const v = Number(Math.min(variable.max, Math.max(variable.min, snapped)).toFixed(2))
      if (v !== runtime.variables[variable.id]) runtime.setVariables({ [variable.id]: v })
    },
  })

  useFrame(() => {
    mesh.current?.position.set(start + runtime.variables[variable.id] * VELOCITY_SCALE, VELOCITY_Y, 0)
  })

  if (!ready) return null
  return (
    <mesh
      ref={mesh}
      {...drag}
      onPointerOver={() => (document.body.style.cursor = 'ew-resize')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <sphereGeometry args={[0.035, 20, 12]} />
      <meshStandardMaterial color={colors.velocity} transparent opacity={0.85} />
    </mesh>
  )
}

function GliderVectors({ runtime, body }: { runtime: Runtime; body: Body }) {
  const showVelocity = useOverlayVisible('velocity')
  const showMomentum = useOverlayVisible('momentum')
  return (
    <>
      <VectorArrow
        visible={showVelocity}
        getOrigin={() => [positionOf(runtime, body), VELOCITY_Y, 0]}
        getVector={() => [velocityOf(runtime, body), 0, 0]}
        scale={VELOCITY_SCALE}
        color={colors.velocity}
      />
      <VectorArrow
        visible={showMomentum}
        getOrigin={() => [positionOf(runtime, body), MOMENTUM_Y, 0]}
        getVector={() => [momentum(massOf(runtime.variables, body), velocityOf(runtime, body)), 0, 0]}
        scale={MOMENTUM_SCALE}
        color={colors.momentum}
      />
      {showVelocity ? <VelocityHandle runtime={runtime} body={body} /> : null}
    </>
  )
}

// ───────────────────────── Momentum & energy board ─────────────────────────

const BOARD_WIDTH = 2.8
const BAR_HEIGHT = 0.07
const ROWS = [0.12, 0.0, -0.14] as const
const P_ZERO = -0.72
const P_HALF_SPAN = 0.45
const K_BASE = 0.2
const K_SPAN = 0.82

type Row = 'A' | 'B' | 'total'

interface BoardScales {
  readonly p: number
  readonly k: number
}

function boardScales(vars: CollisionVariables, timeline: CollisionTimeline): BoardScales {
  const pA = momentum(vars.massA, vars.velocityA)
  const pB = momentum(vars.massB, vars.velocityB)
  const pValues = [pA, pB, pA + pB]
  if (timeline.collision) {
    pValues.push(momentum(vars.massA, timeline.collision.vA), momentum(vars.massB, timeline.collision.vB))
  }
  // Headroom: a damped contact can overshoot the final velocities slightly.
  const pMax = Math.max(...pValues.map(Math.abs)) * 1.1
  const k0 = kineticEnergy(vars.massA, vars.velocityA) + kineticEnergy(vars.massB, vars.velocityB)
  return { p: pMax > 0 ? P_HALF_SPAN / pMax : 0, k: k0 > 0 ? K_SPAN / k0 : 0 }
}

function readRow(runtime: Runtime, row: Row): { p: number; k: number } {
  const { massA, massB } = runtime.variables
  const { vA, vB } = runtime.state
  const a = { p: momentum(massA, vA), k: kineticEnergy(massA, vA) }
  const b = { p: momentum(massB, vB), k: kineticEnergy(massB, vB) }
  if (row === 'A') return a
  if (row === 'B') return b
  return { p: a.p + b.p, k: a.k + b.k }
}

function initialRow(vars: CollisionVariables, row: Row): { p: number; k: number } {
  const a = { p: momentum(vars.massA, vars.velocityA), k: kineticEnergy(vars.massA, vars.velocityA) }
  const b = { p: momentum(vars.massB, vars.velocityB), k: kineticEnergy(vars.massB, vars.velocityB) }
  if (row === 'A') return a
  if (row === 'B') return b
  return { p: a.p + b.p, k: a.k + b.k }
}

const rowColor = (row: Row) => (row === 'A' ? colors.gliderA : row === 'B' ? colors.gliderB : colors.total)
const rowName = (row: Row) => (row === 'total' ? 'Total' : row)

function BoardRow({
  runtime,
  row,
  y,
  scales,
  labelled,
}: {
  runtime: Runtime
  row: Row
  y: number
  scales: BoardScales
  labelled: boolean
}) {
  const vars = useRuntimeVariables(runtime)
  const pBar = useRef<Mesh>(null)
  const kBar = useRef<Mesh>(null)
  const pText = useRef<HTMLSpanElement>(null)
  const kText = useRef<HTMLSpanElement>(null)
  const start = initialRow(vars, row)
  const now = readRow(runtime, row)

  useFrame(() => {
    const { p, k } = readRow(runtime, row)
    const pw = p * scales.p
    if (pBar.current) {
      pBar.current.visible = Math.abs(pw) > 1e-4
      pBar.current.scale.set(Math.max(Math.abs(pw), 1e-4), 1, 1)
      pBar.current.position.set(P_ZERO + pw / 2, y, 0.002)
    }
    const kw = k * scales.k
    if (kBar.current) {
      kBar.current.visible = kw > 1e-4
      kBar.current.scale.set(Math.max(kw, 1e-4), 1, 1)
      kBar.current.position.set(K_BASE + kw / 2, y, 0.002)
    }
    const pLabel = fixed(p)
    const kLabel = fixed(k, 3)
    if (pText.current && pText.current.textContent !== pLabel) pText.current.textContent = pLabel
    if (kText.current && kText.current.textContent !== kLabel) kText.current.textContent = kLabel
  })

  const color = rowColor(row)
  const tickColor = row === 'total' ? '#212529' : '#868e96'
  return (
    <>
      <mesh ref={pBar}>
        <planeGeometry args={[1, BAR_HEIGHT]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={kBar}>
        <planeGeometry args={[1, BAR_HEIGHT]} />
        <meshBasicMaterial color={color} transparent opacity={row === 'total' ? 1 : 0.8} />
      </mesh>
      {/* Start values */}
      <mesh position={[P_ZERO + start.p * scales.p, y, 0.004]}>
        <planeGeometry args={[0.008, BAR_HEIGHT + 0.03]} />
        <meshBasicMaterial color={tickColor} />
      </mesh>
      <mesh position={[K_BASE + start.k * scales.k, y, 0.004]}>
        <planeGeometry args={[0.008, BAR_HEIGHT + 0.03]} />
        <meshBasicMaterial color={tickColor} />
      </mesh>
      {labelled ? <BoardRowLabels row={row} y={y} now={now} pText={pText} kText={kText} /> : null}
    </>
  )
}

function BoardRowLabels({
  row,
  y,
  now,
  pText,
  kText,
}: {
  row: Row
  y: number
  now: { p: number; k: number }
  pText: RefObject<HTMLSpanElement | null>
  kText: RefObject<HTMLSpanElement | null>
}) {
  const color = rowColor(row)
  return (
    <>
      {[P_ZERO - P_HALF_SPAN - 0.1, K_BASE - 0.07].map((x) => (
        <Html key={x} position={[x, y, 0]} center className="pointer-events-none select-none">
          <span className="font-mono text-[11px] font-semibold" style={{ color }}>
            {rowName(row)}
          </span>
        </Html>
      ))}
      <Html position={[P_ZERO + P_HALF_SPAN + 0.14, y, 0]} center className="pointer-events-none select-none">
        <span ref={pText} className="font-mono text-[11px] text-lab-strong tabular-nums">
          {fixed(now.p)}
        </span>
      </Html>
      <Html position={[K_BASE + K_SPAN + 0.15, y, 0]} center className="pointer-events-none select-none">
        <span ref={kText} className="font-mono text-[11px] text-lab-strong tabular-nums">
          {fixed(now.k, 3)}
        </span>
      </Html>
    </>
  )
}

function Board({ runtime, timeline }: { runtime: Runtime; timeline: CollisionTimeline }) {
  const vars = useRuntimeVariables(runtime)
  const scales = boardScales(vars, timeline)
  const rows: readonly Row[] = ['A', 'B', 'total']
  const narrow = useNarrow()
  return (
    <group position={[TRACK_LENGTH / 2, 0.78, -0.62]}>
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[BOARD_WIDTH + 0.03, 0.56]} />
        <meshBasicMaterial color="#c5ced9" />
      </mesh>
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[BOARD_WIDTH, 0.53]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Zero line for momentum and baseline for energy */}
      <mesh position={[P_ZERO, -0.01, 0]}>
        <planeGeometry args={[0.006, 0.38]} />
        <meshBasicMaterial color="#495057" />
      </mesh>
      <mesh position={[K_BASE, -0.01, 0]}>
        <planeGeometry args={[0.006, 0.38]} />
        <meshBasicMaterial color="#495057" />
      </mesh>
      <Html position={[P_ZERO, 0.22, 0]} center className="pointer-events-none select-none">
        <span className="font-mono text-[11px] whitespace-nowrap" style={{ color: colors.momentum }}>
          {narrow ? 'p' : 'Momentum p (kg·m/s) · ← left | right →'}
        </span>
      </Html>
      <Html position={[K_BASE + K_SPAN / 2, 0.22, 0]} center className="pointer-events-none select-none">
        <span className="font-mono text-[11px] whitespace-nowrap" style={{ color: colors.energy }}>
          {narrow ? 'K' : 'Kinetic energy K (J)'}
        </span>
      </Html>
      {rows.map((row, i) => (
        <BoardRow key={row} runtime={runtime} row={row} y={ROWS[i] ?? 0} scales={scales} labelled={!narrow} />
      ))}
    </group>
  )
}

// ──────────────────────────── Collision marker ────────────────────────────

const BURST_TIME = 0.35

function ContactMarker({ runtime, timeline }: { runtime: Runtime; timeline: CollisionTimeline }) {
  const group = useRef<Group>(null)
  const burst = useRef<Mesh>(null)
  const burstMaterial = useRef<MeshBasicMaterial>(null)
  const label = useRef<HTMLSpanElement>(null)
  const collision = timeline.collision
  const vars = runtime.variables
  const x = collision ? START_A + vars.velocityA * collision.start + GLIDER_LENGTH / 2 : 0

  useFrame(() => {
    const t = runtime.state.t
    const reached = collision !== null && t >= collision.start
    if (group.current) group.current.visible = reached
    if (label.current) label.current.style.visibility = reached ? 'visible' : 'hidden'
    if (!collision || !burst.current || !burstMaterial.current) return
    const age = t - collision.start
    const active = reached && age <= BURST_TIME
    burst.current.visible = active
    if (active) {
      const s = 1 + (age / BURST_TIME) * 5
      burst.current.scale.set(s, s, s)
      burstMaterial.current.opacity = 0.9 * (1 - age / BURST_TIME)
    }
  })

  if (!collision) return null
  return (
    <>
      <mesh ref={burst} position={[x, BODY_Y, 0.08]} visible={false}>
        <ringGeometry args={[0.02, 0.03, 32]} />
        <meshBasicMaterial ref={burstMaterial} color={colors.contact} transparent depthWrite={false} />
      </mesh>
      <group ref={group} position={[x, 0, -0.1]} visible={false}>
        <mesh position={[0, 0.3, 0]}>
          <planeGeometry args={[0.005, 0.5]} />
          <meshBasicMaterial color={colors.contact} transparent opacity={0.6} />
        </mesh>
        <Html position={[0, 0.58, 0]} center className="pointer-events-none select-none">
          <span
            ref={label}
            className="font-mono text-[10px] whitespace-nowrap"
            style={{ color: colors.contact, visibility: 'hidden' }}
          >
            contact · t = {collision.start.toFixed(2)} s
          </span>
        </Html>
      </group>
    </>
  )
}

export default function CollisionView() {
  const runtime = useSimulationRuntime(collision1d)
  const vars = useRuntimeVariables(runtime)
  const timeline = useMemo(() => buildTimeline(vars), [vars])
  const showBoard = useOverlayVisible('board')
  const showContact = useOverlayVisible('contact')

  // Hover cursors set by handles must not stick if the view unmounts mid-hover.
  useEffect(() => () => void (document.body.style.cursor = ''), [])

  return (
    <>
      <Track />
      <Glider runtime={runtime} body="A" />
      <Glider runtime={runtime} body="B" />
      <GliderVectors runtime={runtime} body="A" />
      <GliderVectors runtime={runtime} body="B" />
      {showBoard ? <Board runtime={runtime} timeline={timeline} /> : null}
      {showContact ? <ContactMarker runtime={runtime} timeline={timeline} /> : null}
    </>
  )
}
