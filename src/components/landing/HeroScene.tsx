import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  type Group,
  type Points,
} from 'three'

/** A soft round sprite so points render as dots, not squares. */
function makeDotTexture(): CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.85)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, size, size)
  }
  return new CanvasTexture(canvas)
}

/** Deterministic pseudo-random numbers, so the constellation is identical on every visit. */
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const PALETTE = ['#1d6fe0', '#4f8ff0', '#7aa9f5', '#0f3f99', '#7048e8'].map((c) => new Color(c))

function buildShells(): BufferGeometry {
  const rand = random(7)
  const shells = [
    { radius: 2.2, count: 420, tilt: 0.35, spread: 0.06 },
    { radius: 3.3, count: 520, tilt: -0.55, spread: 0.08 },
    { radius: 4.6, count: 560, tilt: 1.1, spread: 0.12 },
  ]
  const total = shells.reduce((n, s) => n + s.count, 0) + 700
  const positions = new Float32Array(total * 3)
  const colors = new Float32Array(total * 3)
  let i = 0
  const push = (x: number, y: number, z: number) => {
    const color = PALETTE[Math.floor(rand() * PALETTE.length)] ?? PALETTE[0]
    positions.set([x, y, z], i * 3)
    if (color) colors.set([color.r, color.g, color.b], i * 3)
    i += 1
  }
  for (const shell of shells) {
    for (let k = 0; k < shell.count; k++) {
      const a = rand() * Math.PI * 2
      const r = shell.radius * (1 + (rand() - 0.5) * shell.spread)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      const y = (rand() - 0.5) * shell.spread * 4
      // Tilt the ring about the X axis.
      push(
        x,
        y * Math.cos(shell.tilt) - z * Math.sin(shell.tilt),
        y * Math.sin(shell.tilt) + z * Math.cos(shell.tilt),
      )
    }
  }
  // Sparse dust filling the volume.
  for (let k = 0; k < 700; k++) {
    const r = 3 + rand() * 7
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(2 * rand() - 1)
    push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.6, r * Math.sin(phi) * Math.sin(theta))
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

function Constellation({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null)
  const points = useRef<Points>(null)
  const core = useRef<Group>(null)
  const geometry = useMemo(() => buildShells(), [])
  const dot = useMemo(() => makeDotTexture(), [])

  useFrame(({ pointer }, delta) => {
    if (!animate) return
    if (points.current) points.current.rotation.y += delta * 0.05
    if (core.current) {
      core.current.rotation.y += delta * 0.25
      core.current.rotation.x += delta * 0.1
    }
    if (group.current) {
      // Gentle parallax toward the pointer.
      group.current.rotation.x += (pointer.y * 0.12 - group.current.rotation.x) * 0.04
      group.current.rotation.z += (-pointer.x * 0.08 - group.current.rotation.z) * 0.04
    }
  })

  return (
    <group ref={group}>
      <points ref={points} geometry={geometry}>
        <pointsMaterial
          size={0.075}
          map={dot}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#1d6fe0" wireframe transparent opacity={0.45} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.55, 3]} />
          <meshStandardMaterial color="#e6f0fd" emissive="#1d6fe0" emissiveIntensity={0.35} roughness={0.2} />
        </mesh>
        <mesh scale={1.5}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial
            color="#4f8ff0"
            transparent
            opacity={0.08}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}

/** Full-bleed WebGL background for the landing hero. */
export function HeroScene({ animate }: { animate: boolean }) {
  return (
    <Canvas
      frameloop={animate ? 'always' : 'demand'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 10], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <group position={[2.6, 0, 0]}>
        <Constellation animate={animate} />
      </group>
    </Canvas>
  )
}
