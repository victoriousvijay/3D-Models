# Simulation Engine Specification

## Goal

Provide a reusable, **subject-agnostic** SDK so any scientific domain can add simulations without
changing the core engine.

Implementation: `src/engine` (public API: `src/engine/index.ts`). Framework-free and runnable in
Node. ESLint forbids React, Three.js, Zustand, domain and UI imports here.

## Core Concepts

### Simulation definition

A simulation is data plus a pure model, declared with `defineSimulation`. This gives full type
inference: variable ids become typed keys of `vars`, and `measure()` must return exactly the
declared measurements.

```ts
interface SimulationDefinition {
  id: string // kebab-case, e.g. 'projectile-motion'
  domain: string // a registered DomainEngine id
  title: string
  description: string
  learningObjectives: string[]
  assumptions: string[] // simplifications, shown to learners and the AI tutor
  scene: SceneConfig // worldUnit + camera framing
  variables: VariableDefinition[]
  measurements: MeasurementDefinition[]
  objects: SimulationObjectDefinition[] // may form a hierarchy via parentId
  interactions: InteractionDefinition[]
  presets: ExperimentPreset[] // reproducible starting configurations
  explanations: Explanation[] // anchored teaching content (EDUCATION_ENGINE.md)
  model: SimulationModel
}
```

### Models — three kinds

Science does not all evolve the same way, so the model is a discriminated union:

| `kind`       | Progresses by                   | Examples                                                       |
| ------------ | ------------------------------- | -------------------------------------------------------------- |
| `continuous` | fixed-step simulated time       | projectile, orbits, reaction kinetics, heartbeat, erosion      |
| `discrete`   | stages (manual or auto-advance) | cell-cycle phases, reaction mechanism steps, algorithm steps   |
| `static`     | nothing — state = f(variables)  | molecular geometry, anatomy, function graphs, crystal lattices |

Every model is **pure**. Its functions take and return plain data, never mutate inputs, and never
read the clock or the renderer:

```text
createInitialState(vars) → state
measure(state, vars)     → measurements
continuous: step(state, dt, vars) → state;  fixedTimeStep;  maxDuration?;  isComplete?(state, vars)
discrete:   advance(state, vars)  → state;  autoAdvanceInterval?;          isComplete?(state, vars)
```

### Variables

`number` (unit, default, min, max, step), `boolean` or `choice` (options). There is an optional
cross-variable `validate(value, all)`. Unknown keys, non-finite numbers, out-of-range values and
wrong types are rejected with learner-readable messages. The same validation path serves the UI,
presets, interactions and the AI tutor.

### Measurements

`scalar` (number + unit), `vector` (2D/3D + unit) and `category` (one of declared options). Every
value is validated after each update. A non-finite or undeclared value **faults** the run rather
than being shown as data. See MEASUREMENT_ENGINE.md.

### Units

The core declares the SI system. Domains contribute their own units by augmenting `UnitCatalog`
(compile-time) and listing `UnitDefinition`s (runtime). A simulation may use only units available
to its domain: core, its own and its declared dependencies'. This is validated at registration.

## Runtime Lifecycle

`SimulationRuntime` runs one instance:

```text
ready ──start──▶ running ──pause──▶ paused ──resume──▶ running
                   │
                   ▼
         completed / faulted          reset(): any → ready     destroy(): terminal
```

| Method                  | Behaviour                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `constructor`           | initialise: validate variables, build initial state, validate measurements                                      |
| `start/pause/resume`    | return `false` for invalid transitions (static models cannot start)                                             |
| `update(realDelta)`     | advance by real time: fixed-step accumulator (continuous) or interval (discrete)                                |
| `stepOnce()`            | exactly one step or stage, for frame-by-frame study                                                             |
| `setVariables(changes)` | validate, apply, **reset**, so each result maps to one set of initial conditions (except live variables, below) |
| `setTimeScale(s)`       | slow motion / fast-forward (0.05–8×), never changes the model step                                              |
| `getSnapshot()`         | serialisable `{ simulationId, domain, status, progress, variables, measurements }`                              |

Numerical guarantees:

- **Frame-rate independent.** Identical results at 30 fps and 144 fps (tested).
- **Frame-gap cap.** Real-time deltas are capped at 0.1 s. Tab switches never cause a jump.
- **Rounding tolerance.** The accumulator uses a relative tolerance of 1e-9, so a step due exactly
  on a frame boundary is never skipped (regression tested).
- **Fault containment.** Exceptions in model code fault the run and emit `fault` instead of
  crashing the app.

**Live variables.** A definition can list `liveVariables`. These are conditions that do not
change the initial conditions of a run, such as a double-slit wavelength or a detector position.
If every changed variable is live, the runtime keeps its state and status, recomputes the
measurements and then emits `variables`. It does not reset. The learner can adjust these while
the lab runs or after it completes, and see the result straight away. Setting an unchanged value
is a no-op for such labs. Labs without `liveVariables` behave exactly as before.
`isLiveVariable(id)` lets the UI keep only those controls unlocked while running. Unknown ids
are rejected by `validateSimulationDefinition`.

Events (`runtime.events`): `status`, `variables`, `reset`, `fault`, and `stepped`, which is
emitted only by a manual `stepOnce()`. There is deliberately no per-frame event. Consumers read state inside the render loop, or poll snapshots at their own rate.

## Registries

- `DomainRegistry` registers domain engines, scopes units, and runs `initialize()` once per domain
  with dependencies first. A failed initialisation can be retried.
- `SimulationRegistry<TEntry>` validates each definition (ids, references, presets, timing, unit
  scoping, registered domain) at startup. The composition root is `src/app/platform.ts`.

## Adding a Simulation

```text
src/simulations/<domain>/<simulation-id>/
  definition.ts   defineSimulation({ ... })           pure, unit-tested
  View.tsx        default export; useSimulationRuntime(definition) inside R3F
  index.ts        defineSimulationPackage({ definition, loadView: () => import('./View') })
```

Then append the package to `src/simulations/index.ts`. No engine change is required. Domain science
the model needs (e.g. projectile equations) belongs in `src/domains/<domain>/` with its own tests.

## Rules

- Scientific calculations never depend on React or rendering.
- The engine is testable in Node. Every model kind is covered by domain-neutral fixtures.
- Simulation state is plain, serialisable data.
- The engine exposes events for the UI, persistence and AI. It never calls them.
- Do not add subject-specific concepts to the engine. Put them in a domain.
