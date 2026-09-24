# Interaction Engine Specification

Status: **first slice built** (Phase 1). Contracts (`InteractionDefinition`,
`SimulationObjectDefinition`) are validated at registration. **Select** and **drag** work through
generic rendering hooks: `useSelectable` and `usePlaneDrag` in `src/rendering/interaction`.
Gesture mapping is supplied by the simulation (`projectile-motion/aiming.ts`: pointer → launch
angle, unit-tested). Dragging goes through `runtime.setVariables`, so it obeys the same limits and
validation as the slider. It is disabled while a run is in progress.

Not yet built: `resolveInteraction` (dispatch from the declared definitions rather than per-view
wiring), `isolate`, `rotate`, keyboard-driven object focus.

## Responsibility

Translate learner input on 3D objects into **validated** changes, the same way for every domain.
Dragging a launcher, rotating a lens, isolating an organelle and selecting an atom all use one
pipeline.

## Declarations (built)

```ts
type InteractionKind = 'click' | 'hover' | 'select' | 'drag' | 'rotate' | 'isolate' | 'manipulate'

interface InteractionDefinition {
  id: string
  kind: InteractionKind
  targetObjectId: string // must reference a declared object
  variableId?: string // the variable it changes, if any (must exist)
}
```

Objects may form hierarchies via `parentId` (heart → left ventricle; molecule → atom). This
supports isolate/explode views.

Sliders and toggles are not interactions. They are generated from variable definitions.

## Pipeline

```text
pointer / keyboard / AI tool
        │
        ▼
 hit test (rendering)  ── mesh.userData.objectId ──▶ object id
        │
        ▼
 resolve interaction   ── which InteractionDefinition applies to (object, gesture)?
        │
        ▼
 map gesture → intent  ── e.g. drag delta → new angle value (simulation-provided mapper)
        │
        ▼
 validated application ── runtime.setVariables() | selection store | view-only state (isolate)
        │
        ▼
 events               ── UI, Education and AI observe; nothing is mutated directly
```

- Rendering owns **hit testing** only. Resolution and mapping are framework-free and testable.
- A simulation supplies gesture mappers (e.g. `dragToAngle(delta, current) → degrees`). The engine
  never knows what "angle" means.
- All state changes go through the same validated APIs used by sliders and the AI tutor. Invalid
  values are clamped or rejected with the variable's message, never applied silently.
- View-only interactions (hover, isolate, camera focus) do not touch simulation state or reset a
  run.

## Planned Core Additions

| Addition                                                             | Layer                            |
| -------------------------------------------------------------------- | -------------------------------- |
| `resolveInteraction(defs, objectId, gesture)`                        | `src/engine/interactions` (pure) |
| `InteractionMapper` type for simulation-supplied mappers             | `src/engine/types`               |
| `useInteractive(objectId)` hook: pointer handlers, cursor, highlight | `src/rendering`                  |
| Selection/isolation state                                            | `src/state` (Zustand)            |

## Accessibility

Every pointer interaction needs a keyboard or control-panel equivalent, typically the variable's
slider. Focusable object list for selection; visible focus states; no interaction that relies
on hover alone.

## Domain Examples (for design validation, not content)

| Domain        | Object         | Kind       | Effect                                |
| ------------- | -------------- | ---------- | ------------------------------------- |
| Physics       | launcher       | drag       | changes launch angle variable         |
| Chemistry     | bond           | select     | shows bond measurements               |
| Biology       | mitochondrion  | isolate    | hides siblings (view-only)            |
| Astronomy     | planet         | drag       | changes orbital radius variable       |
| Earth Science | tectonic plate | manipulate | changes plate velocity variable       |
| Mathematics   | control point  | drag       | changes function coefficient variable |
