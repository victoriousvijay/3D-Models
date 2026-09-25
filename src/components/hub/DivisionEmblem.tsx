import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Quaternion, Vector3, type Group, type Mesh } from 'three'
import type { DivisionId } from '@/catalogue'

export interface EmblemProps {
  accent: string
  /** Hovered or focused: the emblem brightens and spins a little faster. */
  active?: boolean
  /** False when the learner prefers reduced motion. */
  animate?: boolean
}

/** Gentle idle rotation shared by every emblem. */
function useSpin(ref: React.RefObject<Group | null>, animate: boolean, active: boolean, speed = 0.35) {
  useFrame((_, delta) => {
    if (!animate || !ref.current) return
    ref.current.rotation.y += delta * speed * (active ? 2.2 : 1)
  })
}

function material(accent: string, active: boolean, emissive = 0.25) {
  return (
    <meshStandardMaterial
      color={accent}
      emissive={accent}
      emissiveIntensity={active ? emissive * 2 : emissive}
      roughness={0.35}
      metalness={0.1}
    />
  )
}

/** Physics: a nucleus with three electron orbits. */
function PhysicsEmblem({ accent, active = false, animate = true }: EmblemProps) {
  const group = useRef<Group>(null)
  const electrons = useRef<(Mesh | null)[]>([])
  useSpin(group, animate, active, 0.25)
  useFrame(({ clock }) => {
    if (!animate) return
    const t = clock.getElapsedTime()
    electrons.current.forEach((electron, i) => {
      if (!electron) return
      const a = t * (1.2 + i * 0.25) + (i * Math.PI * 2) / 3
      electron.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 0.42)
    })
  })
  const tilts = [0, Math.PI / 3, -Math.PI / 3]
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.28, 32, 16]} />
        {material(accent, active, 0.4)}
      </mesh>
      {tilts.map((tilt, i) => (
        <group key={tilt} rotation={[Math.PI / 2.4, 0, tilt]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.38, 1]}>
            <torusGeometry args={[1.1, 0.018, 8, 96]} />
            <meshBasicMaterial color={accent} transparent opacity={0.55} />
          </mesh>
          <mesh
            ref={(mesh) => {
              electrons.current[i] = mesh
            }}
            position={[1.1, 0, 0]}
          >
            <sphereGeometry args={[0.09, 16, 8]} />
            {material(accent, active, 0.6)}
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Chemistry: a tetrahedral molecule (central atom, four bonded atoms). */
function ChemistryEmblem({ accent, active = false, animate = true }: EmblemProps) {
  const group = useRef<Group>(null)
  useSpin(group, animate, active)
  const bonds = useMemo(() => {
    const vertices = [
      new Vector3(1, 1, 1),
      new Vector3(-1, -1, 1),
      new Vector3(-1, 1, -1),
      new Vector3(1, -1, -1),
    ].map((v) => v.normalize().multiplyScalar(1))
    const up = new Vector3(0, 1, 0)
    return vertices.map((end) => ({
      end,
      mid: end.clone().multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(up, end.clone().normalize()),
    }))
  }, [])
  return (
    <group ref={group} rotation={[0.3, 0, 0.2]}>
      <mesh>
        <sphereGeometry args={[0.36, 32, 16]} />
        {material(accent, active, 0.35)}
      </mesh>
      {bonds.map(({ end, mid, quaternion }) => (
        <group key={end.x * 10 + end.y * 3 + end.z}>
          <mesh position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[0.05, 0.05, 1, 12]} />
            <meshStandardMaterial color="#c9d3e3" roughness={0.5} />
          </mesh>
          <mesh position={end}>
            <sphereGeometry args={[0.2, 24, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.4}
              emissive={accent}
              emissiveIntensity={active ? 0.25 : 0.08}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Botany: a young sprout — stem, two leaves and a new bud. */
function BotanyEmblem({ accent, active = false, animate = true }: EmblemProps) {
  const group = useRef<Group>(null)
  useSpin(group, animate, active, 0.3)
  useFrame(({ clock }) => {
    if (!animate || !group.current) return
    group.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.8) * 0.06
  })
  return (
    <group ref={group} position={[0, -0.7, 0]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.4, 12]} />
        <meshStandardMaterial color="#5c8a3a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.42, 0.85, 0]} rotation={[0, 0, Math.PI / 5]} scale={[0.5, 0.16, 0.26]}>
        <sphereGeometry args={[1, 24, 12]} />
        {material(accent, active, 0.2)}
      </mesh>
      <mesh position={[0.4, 1.15, 0]} rotation={[0, 0, -Math.PI / 5]} scale={[0.46, 0.15, 0.24]}>
        <sphereGeometry args={[1, 24, 12]} />
        {material(accent, active, 0.2)}
      </mesh>
      <mesh position={[0, 1.5, 0]} scale={[0.14, 0.2, 0.14]}>
        <sphereGeometry args={[1, 16, 12]} />
        {material(accent, active, 0.45)}
      </mesh>
    </group>
  )
}

/** Zoology: an animal cell — membrane, nucleus and mitochondria. */
function ZoologyEmblem({ accent, active = false, animate = true }: EmblemProps) {
  const group = useRef<Group>(null)
  useSpin(group, animate, active, 0.2)
  const mitochondria: [number, number, number, number][] = [
    [0.55, 0.25, 0.3, 0.6],
    [-0.5, -0.35, 0.25, -0.4],
    [0.2, -0.55, -0.35, 1.2],
  ]
  return (
    <group ref={group}>
      <mesh scale={[1.15, 0.95, 1]}>
        <sphereGeometry args={[1, 40, 24]} />
        <meshStandardMaterial
          color={accent}
          transparent
          opacity={active ? 0.24 : 0.16}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.1, 0.05, 0]}>
        <sphereGeometry args={[0.36, 32, 16]} />
        {material(accent, active, 0.35)}
      </mesh>
      {mitochondria.map(([x, y, z, rot]) => (
        <mesh key={rot} position={[x, y, z]} rotation={[0, 0, rot]}>
          <capsuleGeometry args={[0.08, 0.26, 4, 12]} />
          <meshStandardMaterial
            color="#f2a27a"
            roughness={0.5}
            emissive={accent}
            emissiveIntensity={active ? 0.2 : 0.05}
          />
        </mesh>
      ))}
    </group>
  )
}

const EMBLEMS: Record<DivisionId, (props: EmblemProps) => React.JSX.Element> = {
  physics: PhysicsEmblem,
  chemistry: ChemistryEmblem,
  botany: BotanyEmblem,
  zoology: ZoologyEmblem,
}

/** The 3D emblem that identifies a division in the hub and in its own lab. */
export function DivisionEmblem({ division, ...props }: EmblemProps & { division: DivisionId }) {
  const Emblem = EMBLEMS[division]
  return <Emblem {...props} />
}
