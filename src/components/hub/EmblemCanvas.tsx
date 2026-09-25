import { Canvas } from '@react-three/fiber'
import type { LabDivision } from '@/catalogue'
import { DivisionEmblem } from './DivisionEmblem'

/** A small transparent canvas showing one division's emblem (division headers). */
export function EmblemCanvas({ division, animate }: { division: LabDivision; animate: boolean }) {
  return (
    <Canvas
      flat
      frameloop={animate ? 'always' : 'demand'}
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 4.2], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      aria-hidden
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <DivisionEmblem division={division.id} accent={division.accent} animate={animate} />
    </Canvas>
  )
}
