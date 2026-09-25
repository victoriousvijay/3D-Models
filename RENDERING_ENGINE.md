# Rendering Engine Specification

Status: **foundation plus the Phase 1 overlays and interaction are built** (`src/rendering`).
Labels, GLB asset loading, instancing and postprocessing are specified below. They will be built
as simulations need them.

## Responsibility

Turn simulation state into an interactive 3D scene for **any** domain, at interactive frame rates
on ordinary student laptops. The rendering engine never contains scientific calculations and never
references a specific domain or simulation.

## Stack

Three.js · React Three Fiber (v9) · Drei. Postprocessing only when a simulation justifies its cost.

## Built

| Piece                                                           | Purpose                                                                                                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LabCanvas`                                                     | The single WebGL surface. `frameloop="demand"`, adaptive DPR (drops to 1 on low FPS), perspective or orthographic camera from `SceneConfig.camera`, orbit controls |
| `LabEnvironment`                                                | Subject-neutral surroundings: lighting, double-sided reference grid (1 cell = 1 `worldUnit`), orientation gizmo                                                    |
| `SimulationDriver`                                              | Bridges `useFrame` → `runtime.update(delta)`; requests frames only while running or after a change; skips the stale first delta after idle                         |
| `SimulationRuntimeContext` / `useSimulationRuntime(definition)` | Gives a view its runtime, typed via a real identity check, not a cast                                                                                              |
| `SimulationErrorBoundary` (app)                                 | A failing view or lazy load cannot take down the canvas or WebGL context                                                                                           |
| `sceneColors`                                                   | Scene palette, mirrored by the Tailwind `lab-*` tokens                                                                                                             |
| `useRuntimeStatus(runtime)`                                     | Subscribes a component to lifecycle status (human-speed re-renders only)                                                                                           |
| `useSelectable(objectId)`                                       | Click-to-select, hover cursor and highlight state for a declared object; selection focuses its explanation                                                         |
| `usePlaneDrag({ onDrag, enabled })`                             | Generic drag on a plane: pointer capture, suspends orbit controls, reports plane hits. The simulation maps hits to a variable (Phase 1: launcher → angle)          |
| `VectorArrow`                                                   | Draws any vector measurement with a declared scale, updated in the render loop (no React renders)                                                                  |
| `Trail`                                                         | Path trace in a preallocated buffer; clears on reset                                                                                                               |
| `useRuntimeVariables(runtime)`                                  | Subscribes to variable values (`variables`/`reset` events), for views that redraw from live variables                                                              |
| `useOverlayVisible(id)`                                         | Learner-controlled overlay visibility; simulations declare overlays (label, colour, scale note) in their package for the legend                                    |

**Responsive framing.** `FitToAspect`, inside `LabCanvas`, keeps the authored camera framing
visible when the 3D area is narrower than 1.6:1, as on phones or with the mobile bottom sheet
open. It moves a perspective camera back along its view line, or zooms out an orthographic one.
On canvases narrower than 640 px, the orientation gizmo shrinks and hides its negative axes.

Phase 1 scene cost (Projectile Motion): about 20 draw calls and a few thousand triangles, all
primitive geometry. It sits well inside the budgets below.

Double Slit (YDSE) scene cost: about 23 draw calls per frame. The interference map and the
screen are single shader planes that share one GLSL intensity function, with a phase box filter
to avoid moiré. Measured at 60 fps on desktop. The view only renders continuously while the
wavefronts are animating; reduced motion stops it.

`SimulationDriver` also invalidates on `variables`, so live-variable changes redraw a demand
frameloop.

The canvas remounts per simulation (`key` = simulation id). This re-creates the camera and
projection and releases GPU memory from the previous simulation.

## View Contract

A simulation's `View.tsx` is lazy-loaded and receives no props:

```tsx
export default function View() {
  const runtime = useSimulationRuntime(definition) // typed for this simulation
  const mesh = useRef<Mesh>(null)
  useFrame(() => {
    // read state per frame — never setState
    const { position } = runtime.state
    mesh.current?.position.set(...position)
  })
  return <mesh ref={mesh}>…</mesh>
}
```

Rules:

- Read `runtime.state` inside `useFrame` and write to refs. Never mirror per-frame values into
  React or Zustand state.
- Views render; they never compute science. Derived quantities come from the model's `measure()`
  or from domain services.
- Scene space is right-handed, +Y up. One unit equals `scene.worldUnit`. Views must not assume
  metres.

## Planned Capabilities

| Capability             | Design                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Selection & raycasting | R3F pointer events on meshes tagged with `userData.objectId` (matching `SimulationObjectDefinition.id`); selection flows to the Interaction Engine, not directly to state |
| Highlighting           | Shared outline/emissive helper driven by `selectedObjectId`; no per-simulation shaders                                                                                    |
| Labels & annotations   | Drei `Html`/`Text`, anchored to objects, scaled by `worldUnit`; text from the Education Engine                                                                            |
| Measurement overlays   | Reusable vector arrows, rulers, arcs and trails that render `vector`/`scalar` measurements, using the declared unit for labels                                            |
| Grids & axes           | Environment grid today; per-simulation axis/graph components for Mathematics (orthographic)                                                                               |
| GLTF/GLB loading       | `useGLTF` with Draco/Meshopt decoders, preloaded only for the open simulation (ASSET_PIPELINE.md)                                                                         |
| Instancing / LOD       | Drei `Instances`/`Detailed` for repeated or distant geometry (atoms, cells, stars)                                                                                        |
| Postprocessing         | Opt-in per simulation; disabled by `PerformanceMonitor` decline                                                                                                           |
| Domain visuals         | Heavy domain renderers (e.g. Mol* for chemistry) live in `src/domains/<id>/visual/`, loaded with the domain's `initialize()`                                              |

## Performance Budgets (targets, integrated-GPU laptop)

| Metric                   | Budget                  |
| ------------------------ | ----------------------- |
| Frame rate while running | ≥ 50 fps                |
| Draw calls               | < 150                   |
| Triangles on screen      | < 500 k                 |
| Texture memory           | < 128 MB                |
| GPU work while idle      | none (demand frameloop) |

Measure with the browser performance panel and `renderer.info` during development
(PERFORMANCE.md).

## Known Issues

- R3F 9.8 on three r186 logs `THREE.Clock … deprecated`. This is upstream and harmless. It will be
  resolved by an R3F update.
- The initial bundle is about 360 kB gzipped (Three, Drei, React, Base UI). Each simulation view is
  lazy-loaded; Projectile Motion's view chunk is 4 kB gzipped. Vendor chunk splitting for
  long-term caching is still to be tuned.
- The default camera is static. Long flights (e.g. the Moon preset) leave the frame until the
  learner zooms out. A "frame trajectory" camera helper is planned.
