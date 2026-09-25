import { TRACK_LENGTH } from './model'

/**
 * The air-track bench: a bright, quiet physics-lab room with a matte bench.
 * No ground grid or orientation gizmo — the motion is one-dimensional, and
 * the track's metre ruler (drawn by the view) is the reference.
 */
const ROOM = '#eef2f6'
export const BENCH_TOP = -0.25

export function AirTrackBench() {
  return (
    <>
      <color attach="background" args={[ROOM]} />
      <fog attach="fog" args={[ROOM, 9, 22]} />
      <hemisphereLight args={['#ffffff', '#b8c2cf', 0.9]} />
      <directionalLight position={[1, 6, 5]} intensity={1.3} />
      <directionalLight position={[-4, 3, -3]} intensity={0.3} />

      {/* Bench top */}
      <mesh position={[TRACK_LENGTH / 2, BENCH_TOP - 0.03, 0]}>
        <boxGeometry args={[TRACK_LENGTH + 1.4, 0.06, 1.3]} />
        <meshStandardMaterial color="#d9dfe7" roughness={0.95} />
      </mesh>
      {/* Back wall with a dado stripe, for depth */}
      <mesh position={[TRACK_LENGTH / 2, 1, -2.2]}>
        <planeGeometry args={[14, 5]} />
        <meshBasicMaterial color="#e6ebf1" toneMapped={false} />
      </mesh>
      <mesh position={[TRACK_LENGTH / 2, 0.15, -2.19]}>
        <planeGeometry args={[14, 0.04]} />
        <meshBasicMaterial color="#cfd7e1" toneMapped={false} />
      </mesh>
    </>
  )
}
