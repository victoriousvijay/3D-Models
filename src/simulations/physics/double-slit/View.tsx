import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  type Group,
  type MeshStandardMaterial,
  type ShaderMaterial,
} from 'three'
import type { SimulationRuntime } from '@/engine'
import { fringeWidth, intensityAt } from '@/domains/physics'
import { usePrefersReducedMotion } from '@/lib/useMediaQuery'
import {
  useOverlayVisible,
  usePlaneDrag,
  useRuntimeVariables,
  useSelectable,
  useSimulationRuntime,
} from '@/rendering'
import { wavelengthToRgb } from './color'
import { detectorVariable, doubleSlit } from './definition'
import { REFRACTIVE_INDEX, setupFor, type DoubleSlitVariables } from './model'
import {
  BENCH_UNITS_PER_METRE,
  drawnSlitSeparation,
  drawnWavelength,
  LATERAL_UNITS_PER_METRE,
  SCREEN_HALF,
  SCREEN_HALF_WIDTH_MM,
  SCREEN_HEIGHT,
  screenX,
  SOURCE_X,
  WAVE_SPEED,
} from './scale'
import { FIELD_FRAGMENT, FIELD_VERTEX, SCREEN_FRAGMENT, SCREEN_VERTEX } from './shaders'

type Runtime = SimulationRuntime<typeof doubleSlit>

const HIGHLIGHT = '#7aa9f5'
const SLIT_WIDTH = 0.05
const BARRIER_HALF = 2.6
const BARRIER_HEIGHT = 1.7
const FIELD_HALF = 2.6
const PROFILE_SAMPLES = 1200
const REVEAL_TIME = 0.4

const labelClass =
  'pointer-events-none select-none whitespace-nowrap font-mono text-[10px] text-white/80 drop-shadow'

/** Where along the drawn screen (scene units) a real screen position (m) lies. */
const lateral = (metres: number) => metres * LATERAL_UNITS_PER_METRE

// ─────────────────────────── Visual clock ───────────────────────────

/**
 * The light's travel comes from the simulation's time. Once the pattern has
 * formed (run completed), the ripples keep moving on a visual clock — the
 * steady state is not changing, only the drawing of the waves. Under reduced
 * motion the drawing freezes.
 */
function useVisualTime(runtime: Runtime, animate: boolean) {
  const completedAt = useRef<number | null>(null)
  useEffect(
    () =>
      runtime.events.on('status', ({ current }) => {
        completedAt.current = current === 'completed' ? performance.now() / 1000 : null
      }),
    [runtime],
  )
  return () => {
    if (runtime.status === 'ready') return 0
    const t = runtime.state.t
    if (runtime.status === 'completed' && animate && completedAt.current !== null) {
      return t + (performance.now() / 1000 - completedAt.current) * runtime.timeScale
    }
    return t
  }
}

/** Flips (at most twice per run) when the light reaches the screen, for React-rendered markers. */
function useArrived(runtime: Runtime) {
  const [arrived, setArrived] = useState(false)
  useFrame(() => {
    const now = runtime.state.arrivedAt !== null
    if (now !== arrived) setArrived(now)
  })
  return arrived
}

// ─────────────────────────── Apparatus ───────────────────────────

function Laser({ runtime, vars }: { runtime: Runtime; vars: DoubleSlitVariables }) {
  const { selected, hovered, handlers } = useSelectable('laser')
  const aperture = useRef<MeshStandardMaterial>(null)
  const color = useMemo(() => new Color(...wavelengthToRgb(vars.wavelength)), [vars.wavelength])
  useFrame(() => {
    // The aperture glows only while the light is on.
    if (aperture.current) {
      aperture.current.emissiveIntensity = runtime.status === 'ready' ? 0.15 : 1.6 * vars.sourceIntensity
    }
  })
  const emissive = selected || hovered ? HIGHLIGHT : '#000000'
  return (
    <group position={[SOURCE_X - 0.55, 0, 0]} {...handlers}>
      <mesh>
        <boxGeometry args={[1.1, 0.42, 0.52]} />
        <meshStandardMaterial
          color="#2b3548"
          metalness={0.4}
          roughness={0.4}
          emissive={emissive}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0.56, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 24]} />
        <meshStandardMaterial ref={aperture} color={color} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshStandardMaterial color="#1c2638" />
      </mesh>
    </group>
  )
}

function Barrier({ vars, showLabels }: { vars: DoubleSlitVariables; showLabels: boolean }) {
  const { selected, hovered, handlers } = useSelectable('slits')
  const half = drawnSlitSeparation(vars.slitSeparation) / 2
  const inner = half - SLIT_WIDTH / 2
  const outerStart = half + SLIT_WIDTH / 2
  const sideLength = BARRIER_HALF - outerStart
  const emissive = selected || hovered ? HIGHLIGHT : '#000000'
  const material = (
    <meshStandardMaterial
      color="#39465c"
      metalness={0.5}
      roughness={0.35}
      emissive={emissive}
      emissiveIntensity={0.4}
    />
  )
  return (
    <group {...handlers}>
      {/* Centre bar between the slits, and the two outer plates. */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.06, BARRIER_HEIGHT, inner * 2]} />
        {material}
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, 0, side * (outerStart + sideLength / 2)]}>
          <boxGeometry args={[0.06, BARRIER_HEIGHT, sideLength]} />
          {material}
        </mesh>
      ))}
      <mesh position={[0, -BARRIER_HEIGHT / 2 - 0.2, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.5]} />
        <meshStandardMaterial color="#1c2638" />
      </mesh>
      {showLabels ? (
        <>
          <Html position={[0, BARRIER_HEIGHT / 2 + 0.14, half]} center className={labelClass}>
            S₁
          </Html>
          <Html position={[0, BARRIER_HEIGHT / 2 + 0.14, -half]} center className={labelClass}>
            S₂
          </Html>
        </>
      ) : null}
    </group>
  )
}

// ─────────────────────────── Wave field ───────────────────────────

function WaveField({
  runtime,
  vars,
  visualTime,
}: {
  runtime: Runtime
  vars: DoubleSlitVariables
  visualTime: () => number
}) {
  const material = useRef<ShaderMaterial>(null)
  const showMap = useOverlayVisible('map')
  const showRipples = useOverlayVisible('ripples')
  const uniforms = useMemo(
    () => ({
      uLambdaM: { value: 0 },
      uSlitSep: { value: 0 },
      uI1: { value: 1 },
      uI2: { value: 1 },
      uBenchScale: { value: BENCH_UNITS_PER_METRE },
      uLateralScale: { value: LATERAL_UNITS_PER_METRE },
      uScreenX: { value: 0 },
      uSourceX: { value: SOURCE_X },
      uSlitHalf: { value: 0 },
      uBeamHalf: { value: 0 },
      uRippleLambda: { value: 0.2 },
      uTravelled: { value: 0 },
      uArrived: { value: 0 },
      uSource: { value: 1 },
      uSlit2Amp: { value: 1 },
      uShowMap: { value: 1 },
      uShowRipples: { value: 1 },
      uColor: { value: new Color() },
      uColor2: { value: new Color() },
    }),
    [],
  )

  useFrame(() => {
    const u = material.current?.uniforms
    if (!u) return
    const v = runtime.variables
    const setup = setupFor(v)
    const [r, g, b] = wavelengthToRgb(v.wavelength)
    const slitHalf = drawnSlitSeparation(v.slitSeparation) / 2
    set(u, 'uLambdaM', setup.wavelength / setup.refractiveIndex)
    set(u, 'uSlitSep', setup.slitSeparation)
    set(u, 'uI1', setup.intensity1)
    set(u, 'uI2', setup.intensity2)
    set(u, 'uScreenX', screenX(v.screenDistance))
    set(u, 'uSlitHalf', slitHalf)
    set(u, 'uBeamHalf', slitHalf + 0.35)
    set(u, 'uRippleLambda', drawnWavelength(v.wavelength, REFRACTIVE_INDEX[v.medium]))
    set(u, 'uTravelled', visualTime() * WAVE_SPEED)
    set(u, 'uArrived', runtime.state.arrivedAt === null ? 0 : 1)
    set(u, 'uSource', v.sourceIntensity)
    set(u, 'uSlit2Amp', Math.sqrt(v.slit2Intensity))
    set(u, 'uShowMap', showMap ? 1 : 0)
    set(u, 'uShowRipples', showRipples ? 1 : 0)
    ;(u['uColor']?.value as Color | undefined)?.setRGB(r, g, b)
    ;(u['uColor2']?.value as Color | undefined)?.setRGB(r * 0.55 + 0.45, g * 0.55 + 0.45, b * 0.55 + 0.45)
  })

  const sx = screenX(vars.screenDistance)
  const start = SOURCE_X - 0.2
  return (
    <mesh position={[(start + sx) / 2, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[sx - start, FIELD_HALF * 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={FIELD_VERTEX}
        fragmentShader={FIELD_FRAGMENT}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  )
}

function set(uniforms: Record<string, { value: unknown }>, name: string, value: number) {
  const uniform = uniforms[name]
  if (uniform) uniform.value = value
}

// ─────────────────────────── Screen, detector, markers ───────────────────────────

function Screen({
  runtime,
  vars,
  visualTime,
  arrived,
}: {
  runtime: Runtime
  vars: DoubleSlitVariables
  visualTime: () => number
  arrived: boolean
}) {
  const { selected, hovered, handlers } = useSelectable('screen')
  const material = useRef<ShaderMaterial>(null)
  const showProfile = useOverlayVisible('profile')
  const showMarkers = useOverlayVisible('markers')
  const uniforms = useMemo(
    () => ({
      uLambdaM: { value: 0 },
      uSlitSep: { value: 0 },
      uI1: { value: 1 },
      uI2: { value: 1 },
      uDistance: { value: 1 },
      uHalfWidth: { value: SCREEN_HALF_WIDTH_MM / 1000 },
      uReveal: { value: 0 },
      uColor: { value: new Color() },
    }),
    [],
  )

  useFrame(() => {
    const u = material.current?.uniforms
    if (!u) return
    const v = runtime.variables
    const setup = setupFor(v)
    const [r, g, b] = wavelengthToRgb(v.wavelength)
    set(u, 'uLambdaM', setup.wavelength / setup.refractiveIndex)
    set(u, 'uSlitSep', setup.slitSeparation)
    set(u, 'uI1', setup.intensity1)
    set(u, 'uI2', setup.intensity2)
    set(u, 'uDistance', setup.screenDistance)
    const arrivedAt = runtime.state.arrivedAt
    set(
      u,
      'uReveal',
      arrivedAt === null ? 0 : Math.min(1, Math.max(0, (visualTime() - arrivedAt) / REVEAL_TIME)),
    )
    ;(u['uColor']?.value as Color | undefined)?.setRGB(r, g, b)
  })

  const sx = screenX(vars.screenDistance)
  const frameEmissive = selected || hovered ? HIGHLIGHT : '#000000'
  return (
    // Local x runs along world +z (across the beam); the face looks back at the slits (−x).
    <group position={[sx, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <group {...handlers}>
        <mesh>
          <planeGeometry args={[SCREEN_HALF * 2, SCREEN_HEIGHT]} />
          <shaderMaterial
            ref={material}
            uniforms={uniforms}
            vertexShader={SCREEN_VERTEX}
            fragmentShader={SCREEN_FRAGMENT}
          />
        </mesh>
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[SCREEN_HALF * 2 + 0.16, SCREEN_HEIGHT + 0.16, 0.06]} />
          <meshStandardMaterial color="#2b3548" emissive={frameEmissive} emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -SCREEN_HEIGHT / 2 - 0.5, -0.04]}>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#1c2638" />
        </mesh>
      </group>
      <Detector runtime={runtime} vars={vars} />
      {showMarkers ? <ScreenMarkers vars={vars} arrived={arrived} /> : null}
      {showProfile && arrived ? <IntensityProfile vars={vars} /> : null}
    </group>
  )
}

function Detector({ runtime, vars }: { runtime: Runtime; vars: DoubleSlitVariables }) {
  const { selected, hovered, handlers } = useSelectable('detector')
  const sx = screenX(vars.screenDistance)
  const drag = usePlaneDrag({
    normal: [1, 0, 0],
    offset: sx,
    enabled: true,
    onDrag: ([, , z]) => {
      const { min, max, step } = detectorVariable
      const mm = Math.round(((z / LATERAL_UNITS_PER_METRE) * 1000) / step) * step
      const clamped = Math.min(max, Math.max(min, Number(mm.toFixed(2))))
      if (clamped !== runtime.variables.detectorPosition) runtime.setVariables({ detectorPosition: clamped })
    },
  })
  const u = lateral(vars.detectorPosition / 1000)
  const active = selected || hovered
  return (
    <group position={[u, 0, 0.03]} {...handlers} {...drag}>
      <mesh>
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color={active ? HIGHLIGHT : '#ffffff'} />
      </mesh>
      <mesh position={[0, -SCREEN_HEIGHT / 2 + 0.3, 0]}>
        <planeGeometry args={[0.012, SCREEN_HEIGHT - 0.6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>
      {/* Generous invisible handle for dragging on touch screens. */}
      <mesh visible={false}>
        <planeGeometry args={[0.4, SCREEN_HEIGHT]} />
      </mesh>
    </group>
  )
}

function ScreenMarkers({ vars, arrived }: { vars: DoubleSlitVariables; arrived: boolean }) {
  const setup = setupFor(vars)
  const betaMm = fringeWidth(setup) * 1000
  const betaScene = lateral(betaMm / 1000)
  const bottom = -SCREEN_HEIGHT / 2
  // On a phone the screen is only a few hundred pixels wide: label every 10 mm, not every 5.
  const narrow = useThree((state) => state.size.width < 640)
  const rulerLabels = narrow ? [-10, 0, 10] : [-15, -10, -5, 0, 5, 10, 15]

  const ticks = useMemo(() => {
    const positions: number[] = []
    for (let mm = -SCREEN_HALF_WIDTH_MM; mm <= SCREEN_HALF_WIDTH_MM; mm += 1) {
      const u = lateral(mm / 1000)
      const long = mm % 5 === 0
      positions.push(u, bottom - 0.1, 0.01, u, bottom - (long ? 0.26 : 0.18), 0.01)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
    return geometry
  }, [bottom])

  const orders =
    betaScene >= 0.28
      ? [-3, -2, -1, 0, 1, 2, 3].filter((n) => Math.abs(n * betaScene) <= SCREEN_HALF - 0.05)
      : [0]

  return (
    <group>
      <lineSegments geometry={ticks}>
        <lineBasicMaterial color="#a9b5c1" />
      </lineSegments>
      {rulerLabels.map((mm) => (
        <Html key={mm} position={[lateral(mm / 1000), bottom - 0.4, 0.01]} center className={labelClass}>
          {mm === 0 ? '0 mm' : mm}
        </Html>
      ))}
      {arrived
        ? orders.map((n) => (
            <Html
              key={n}
              position={[n * betaScene, SCREEN_HEIGHT / 2 + 0.09, 0.02]}
              center
              className={labelClass}
            >
              {n === 0 ? 'n = 0' : n}
            </Html>
          ))
        : null}
      {arrived && betaScene <= SCREEN_HALF ? (
        <group position={[0, bottom + 0.18, 0.02]}>
          <mesh position={[betaScene / 2, 0, 0]}>
            <planeGeometry args={[betaScene, 0.018]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {[0, betaScene].map((u) => (
            <mesh key={u} position={[u, 0, 0]}>
              <planeGeometry args={[0.018, 0.12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
          <Html position={[betaScene / 2, 0.16, 0]} center className={labelClass}>
            β = {betaMm.toFixed(2)} mm
          </Html>
        </group>
      ) : null}
    </group>
  )
}

/** Graph of I(y) above the screen, from the domain's exact intensity. Recomputed only when conditions change. */
function IntensityProfile({ vars }: { vars: DoubleSlitVariables }) {
  const line = useMemo(() => {
    const setup = setupFor(vars)
    const positions = new Float32Array(PROFILE_SAMPLES * 3)
    for (let i = 0; i < PROFILE_SAMPLES; i++) {
      const u = -SCREEN_HALF + (2 * SCREEN_HALF * i) / (PROFILE_SAMPLES - 1)
      const y = u / LATERAL_UNITS_PER_METRE
      positions.set([u, SCREEN_HEIGHT / 2 + 0.24 + (intensityAt(setup, y) / 4) * 0.8, 0.01], i * 3)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(positions, 3))
    return new Line(g, new LineBasicMaterial({ color: '#f08c4a' }))
  }, [vars])

  useEffect(
    () => () => {
      line.geometry.dispose()
      line.material.dispose()
    },
    [line],
  )

  return (
    <group>
      <primitive object={line} />
      <Html position={[-SCREEN_HALF, SCREEN_HEIGHT / 2 + 1.05, 0]} className={labelClass}>
        I(y)
      </Html>
    </group>
  )
}

function FringeLines({ vars, arrived }: { vars: DoubleSlitVariables; arrived: boolean }) {
  const show = useOverlayVisible('fringeLines')
  const sx = screenX(vars.screenDistance)
  const betaScene = lateral(fringeWidth(setupFor(vars)))
  const [bright, dark] = useMemo(() => {
    const brightPositions: number[] = []
    const darkPositions: number[] = []
    // Too dense to be readable below ~0.15 scene units apart: draw none.
    if (betaScene >= 0.15) {
      const max = Math.floor(SCREEN_HALF / betaScene)
      for (let n = -max; n <= max; n++) brightPositions.push(0.05, 0.004, 0, sx, 0.004, n * betaScene)
      for (let n = -max - 1; n <= max; n++) {
        const z = (n + 0.5) * betaScene
        if (Math.abs(z) <= SCREEN_HALF) darkPositions.push(0.05, 0.004, 0, sx, 0.004, z)
      }
    }
    const make = (p: number[]) => {
      const g = new BufferGeometry()
      g.setAttribute('position', new BufferAttribute(new Float32Array(p), 3))
      return g
    }
    return [make(brightPositions), make(darkPositions)]
  }, [betaScene, sx])

  useEffect(
    () => () => {
      bright.dispose()
      dark.dispose()
    },
    [bright, dark],
  )

  if (!show || !arrived) return null
  return (
    <group>
      <lineSegments geometry={bright}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.55} />
      </lineSegments>
      <lineSegments geometry={dark}>
        <lineBasicMaterial color="#7d8b99" transparent opacity={0.3} />
      </lineSegments>
    </group>
  )
}

// ─────────────────────────── The lab ───────────────────────────

export default function DoubleSlitView() {
  const runtime = useSimulationRuntime(doubleSlit)
  const vars = useRuntimeVariables(runtime)
  const reducedMotion = usePrefersReducedMotion()
  const showRipples = useOverlayVisible('ripples')
  const invalidate = useThree((state) => state.invalidate)
  const visualTime = useVisualTime(runtime, !reducedMotion)
  const arrived = useArrived(runtime)
  const root = useRef<Group>(null)

  // After the pattern forms, keep drawing frames only while ripples are animating.
  useFrame(() => {
    if (runtime.status === 'completed' && showRipples && !reducedMotion) invalidate()
  })

  return (
    <group ref={root}>
      <Laser runtime={runtime} vars={vars} />
      <Barrier vars={vars} showLabels />
      <WaveField runtime={runtime} vars={vars} visualTime={visualTime} />
      <FringeLines vars={vars} arrived={arrived} />
      <Screen runtime={runtime} vars={vars} visualTime={visualTime} arrived={arrived} />
    </group>
  )
}
