/**
 * The rolling-race workshop: a warm, light room with a concrete floor. No
 * grid or orientation gizmo — the ramp's distance markers and angle arc are
 * the references, drawn by the view because they move with the ramp.
 */
const ROOM = '#f3efe8'

export function RollingWorkshop() {
  return (
    <>
      <color attach="background" args={[ROOM]} />
      <fog attach="fog" args={[ROOM, 10, 26]} />
      <hemisphereLight args={['#fffaf2', '#c9bfb0', 1]} />
      <directionalLight position={[2, 7, 5]} intensity={1.25} color="#fff6e8" />
      <directionalLight position={[-5, 3, -2]} intensity={0.25} />
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.3, 0, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color="#ddd5c9" roughness={0.95} />
      </mesh>
      {/* Back wall */}
      <mesh position={[1.3, 2.5, -3]}>
        <planeGeometry args={[16, 5]} />
        <meshBasicMaterial color="#ece6dc" toneMapped={false} />
      </mesh>
    </>
  )
}
