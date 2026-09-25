/**
 * The optics darkroom: fringes need darkness. A dim navy room, an optical
 * bench under the beam and nothing else — no ground grid or orientation
 * gizmo; the screen's millimetre ruler is the reference.
 */
const ROOM = '#0a1120'
const BENCH_START = -3.4
const BENCH_END = 8.2

export function OpticsDarkroom() {
  const length = BENCH_END - BENCH_START
  return (
    <>
      <color attach="background" args={[ROOM]} />
      <fog attach="fog" args={[ROOM, 16, 34]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 9, 6]} intensity={0.7} />
      <directionalLight position={[-6, 3, -4]} intensity={0.2} color="#7aa9f5" />

      {/* Optical bench */}
      <mesh position={[(BENCH_START + BENCH_END) / 2, -1.28, 0]}>
        <boxGeometry args={[length, 0.16, 6]} />
        <meshStandardMaterial color="#151f31" roughness={0.8} />
      </mesh>
      {/* Bench rails, along the beam */}
      {[-2.7, 2.7].map((z) => (
        <mesh key={z} position={[(BENCH_START + BENCH_END) / 2, -1.17, z]}>
          <boxGeometry args={[length, 0.06, 0.08]} />
          <meshStandardMaterial color="#2a3a55" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
    </>
  )
}
