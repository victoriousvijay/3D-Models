import { GizmoHelper, GizmoViewport, Grid } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { DoubleSide } from 'three'
import { sceneColors } from './theme'

/** Below this canvas width the orientation gizmo is shrunk so it does not compete with the scene. */
const COMPACT_WIDTH = 640

/**
 * Subject-neutral lab surroundings: lighting, a reference grid with one cell
 * per scene unit (see `SceneConfig.worldUnit`), and an orientation gizmo.
 */
export function LabEnvironment() {
  const compact = useThree((state) => state.size.width < COMPACT_WIDTH)
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 4]} intensity={1.4} />
      <Grid
        infiniteGrid
        cellSize={1}
        sectionSize={10}
        cellThickness={0.6}
        sectionThickness={1}
        cellColor={sceneColors.gridCell}
        sectionColor={sceneColors.gridSection}
        fadeDistance={80}
        fadeStrength={1.5}
        // Visible from below too: molecular and orbital scenes orbit freely, so
        // the reference plane must never disappear.
        side={DoubleSide}
      />
      <GizmoHelper alignment="bottom-right" margin={compact ? [36, 36] : [64, 64]}>
        <GizmoViewport
          // drei's default is 40; passing `scale` replaces it rather than multiplying.
          scale={compact ? 24 : 40}
          hideNegativeAxes={compact}
          axisColors={[sceneColors.axisX, sceneColors.axisY, sceneColors.axisZ]}
          labelColor={sceneColors.axisLabel}
        />
      </GizmoHelper>
    </>
  )
}
