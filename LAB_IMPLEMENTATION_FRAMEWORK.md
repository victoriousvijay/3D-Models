# Lab Implementation Framework

How to take a lab from "planned" in the catalogue to "available", one lab at a time, without touching the core.

## Lifecycle of a lab

```text
catalogued (planned)  →  designed  →  science built & tested  →  world built  →  registered (available)  →  reviewed
```

## Steps

### 1. Design (write it down first)

In the lab's folder README, or in the PR description, capture:

- concept and learning objectives
- model kind: `continuous` (evolves in time), `discrete` (stages), or `static` (state = f(variables))
- variables (SI units, ranges), primary and detail measurements
- environment and objects (MODEL_ECOSYSTEM_GUIDELINES.md)
- assumptions and simplifications
- analytic or reference results that the tests will check

### 2. Science (domain layer, framework-free)

Put reusable science in `src/domains/<domain>/`, for example `physics/optics/interference.ts`. Put shared numerics in `src/lib/numerics`. Test against closed forms or reference data. Lint forbids React and Three.js here.

### 3. Simulation package

```text
src/simulations/<domain>/<lab-id>/
  definition.ts      defineSimulation({...})   variables, measurements, presets, explanations, investigations, model
  model.ts           pure model functions (if not trivial)
  View.tsx           default export; useSimulationRuntime(definition); reads state in useFrame
  Environment.tsx    the lab's world (or a shared domain environment)
  overlays.ts        overlay descriptors and scales
  index.ts           defineSimulationPackage({ definition, loadView, Environment, overlays })
  <lab-id>.test.ts   runtime-level tests against the analytic results
```

Use the platform's building blocks. Don't rebuild them:

- `VectorArrow`, `Trail`, `useSelectable`, `usePlaneDrag`, `useRuntimeStatus` from `@/rendering`
- the panels come automatically from the definition

### 4. Register

- Add the package to `src/simulations/index.ts`.
- Set the catalogue entry to `status: 'available', simulationId: '<id>'` (LAB_CATALOGUE.md).
- Add a `LabGlyph` preview if one is missing.

### 5. Verify (Definition of Done, CLAUDE.md)

- `npm run check`: typecheck, lint (architecture boundaries), unit tests
- an e2e journey: open → configure → run → read the primary result → record
- a phone-size run with no overlap
- zero console errors
- the scene stays within the performance budget (RENDERING_ENGINE.md)
- the docs are updated, and explanations are marked `draft` until reviewed

## What must not change

- `src/engine` and `src/rendering` stay free of lab- and domain-specific code. The exit criterion for every lab is that nothing lab-specific appears there.
- The gold-standard lab's behaviour (GOLD_STANDARD_LAB.md). Its e2e tests must keep passing.
