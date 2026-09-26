# System Architecture

## Principle

The platform is **subject-agnostic**. The core knows how to host, run, measure, record and explain a
scientific simulation, but nothing about any particular science. Physics is the first **domain
module**, not the foundation: Chemistry, Biology, Astronomy, Earth Science and Mathematics plug in
through the same contracts, and no domain may impose its assumptions on another.

## Product Layer: the Scientific Universe

```text
Platform
├── Landing Experience                 /                     LandingPage (hero 3D, portal transition)
├── Science Lab Hub                    /lab                  LabHubPage (division character carousel)
├── Division Labs                      /lab/:division        DivisionPage (labs by chapter)
│   ├── Physics   (16)  → physics domain engine
│   ├── Chemistry (30)  → chemistry domain engine
│   ├── Botany    (12)  → biology domain engine
│   └── Zoology   (15)  → biology domain engine
└── Labs                               /lab/:division/:lab   SimulationPage → the lab's own world
```

The **catalogue** (`src/catalogue`, LAB_CATALOGUE.md) describes what exists: divisions and labs,
with their status. The **simulation packages** (`src/simulations`) are what runs. Validation at
startup keeps the two consistent. Each package brings its own **Environment** (MODEL_ECOSYSTEM_GUIDELINES.md),
so labs share one interaction language but not one world. See LAB_NAVIGATION_ARCHITECTURE.md,
SCIENCE_LAB_UX.md, GOLD_STANDARD_LAB.md and LAB_IMPLEMENTATION_FRAMEWORK.md.

## High-Level Architecture

```text
┌──────────────────────────────── CORE PLATFORM (subject-agnostic) ────────────────────────────────┐
│                                                                                                   │
│  Simulation SDK ─ definitions · pure models (continuous | discrete | static) · runtime lifecycle  │
│                   variables · events · domain & simulation registries      [src/engine]  ✅ built │
│  Measurement Engine ─ scalar | vector | category, units, validation         [src/engine]  ✅ core │
│  Experiment Engine  ─ presets, records, comparison                          [src/engine]  ✅ core │
│  Rendering Engine   ─ canvas, camera, environment, render-loop bridge       [src/rendering] ✅ base│
│  Interaction Engine ─ selection, dragging, manipulation → validated APIs    specified             │
│  Education Engine   ─ objectives, assumptions, explanations, guidance       specified (partial)   │
│  Asset System       ─ GLB pipeline, lazy loading, caching                   ASSET_PIPELINE.md     │
│  AI Tutor           ─ structured context + safe tools                       AI_TUTOR.md           │
│  Persistence        ─ Supabase, meaningful events only                      DATABASE.md           │
│                                                                                                   │
└───────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                                │  DomainEngine contract
┌───────────────────────────────── DOMAIN ENGINES (independent) ────────────────────────────────────┐
│  Physics ✅ registered · Chemistry · Biology · Astronomy · Earth Science · Mathematics (specified)│
└───────────────────────────────────────────────┬───────────────────────────────────────────────────┘
                                                │  defineSimulation + SimulationPackage
┌─────────────────────────────────── SIMULATIONS (content) ─────────────────────────────────────────┐
│  physics/projectile-motion · physics/pendulum · … · chemistry/… · biology/…                       │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Dependency Rules

Arrows point to what a layer may import. Rules marked 🔒 are enforced by ESLint
(`no-restricted-imports` in `eslint.config.js`).

```text
app, pages ──▶ components, catalogue, state, rendering, simulations, domains, engine
components ──▶ catalogue, state, simulations (types), engine   (panels, hub, landing)
catalogue ───▶ engine (types)                            🔒 no React/Three/outer layers
simulations ─▶ rendering, domains, lib/numerics, engine
rendering ───▶ state, engine                             🔒 never a domain, simulation or UI
domains ─────▶ lib/numerics, engine, declared dependency domains   🔒 no React/Three/outer layers
lib/numerics ▶ nothing                                   🔒 no React/Three/domains/outer layers
engine ──────▶ nothing                                   🔒 no React/Three/Zustand/domains/outer layers
```

- A domain's **visual** helpers (`src/domains/<id>/visual/`) may use React/R3F; the rest of a
  domain is framework-free, pure and unit-tested.
- A domain may use another domain only if it lists it in `dependsOn`. Dependencies must be
  registered first, which makes cycles impossible.
- Simulations are content: they compose the engine, one or more domain services and rendering.

## What the Core Must Not Assume

The following were audited out of the core (2026-09-24) and must not return:

| Assumption                                  | Where it now lives                                            |
| ------------------------------------------- | ------------------------------------------------------------- |
| Mechanics units (m/s, m/s², N·m, deg…)      | Contributed by the physics domain via `UnitCatalog` + `units` |
| "1 scene unit = 1 metre"                    | Per simulation: `SceneConfig.worldUnit` (m, Å, AU, 1…)        |
| Every model integrates over continuous time | `model.kind`: `continuous` \| `discrete` \| `static`          |
| A fixed time step is always required        | Only on continuous models                                     |
| Progress is measured in seconds             | `RunProgress`: time \| stages \| none                         |
| Measurements are numbers                    | `scalar` \| `vector` \| `category`                            |
| A closed list of subjects in the core       | Domains register at runtime via `DomainRegistry`              |

The core ships only the **SI system itself** (base units, named derived units, dimensionless, s⁻¹).
That is metrology, not any one science.

## Separation of Concerns

| Concern      | Responsible for                                                  | Location                        |
| ------------ | ---------------------------------------------------------------- | ------------------------------- |
| Simulation   | scientific state, equations, progression, validation             | `src/engine`, `src/domains`     |
| Rendering    | canvas, cameras, meshes, materials, lights, render loop          | `src/rendering`, sim `View.tsx` |
| State        | human-speed app state (open simulation, status, selection)       | `src/state` (Zustand)           |
| Interaction  | click, hover, select, drag, isolate, manipulate                  | INTERACTION_ENGINE.md           |
| Experiments  | presets, records, comparison                                     | `src/engine/experiments`        |
| Measurements | typed observations, units, validity                              | `src/engine/measurements`       |
| Education    | objectives, assumptions, explanations, guided steps, assessments | EDUCATION_ENGINE.md             |
| AI           | contextual tutoring through safe tools                           | AI_TUTOR.md                     |
| Persistence  | experiments, progress, meaningful events                         | DATABASE.md                     |

Per-frame values never enter React state or Zustand. Views read the runtime inside `useFrame`.

## Extension Points

| To add…            | Do this                                                                                              | Core changes |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ------------ |
| A domain           | `src/domains/<id>/` with `defineDomain({...})`, augment `UnitCatalog`, add to `src/domains/index.ts` | none         |
| A unit             | Declare in the owning domain (`UnitCatalog` augmentation + `UnitDefinition`)                         | none         |
| A simulation       | `src/simulations/<domain>/<id>/` (definition, View, index), add to `src/simulations/index.ts`        | none         |
| Async domain setup | Implement `DomainEngine.initialize()` (e.g. load Rapier WASM, Mol*)                                  | none         |
| A model behaviour  | Choose `continuous`, `discrete` or `static`                                                          | none         |

A new _model kind_ or _measurement kind_ is the only change that touches the core. Such changes need
an architecture review.

## Folder Structure

```text
src/
  app/                 composition root (platform.ts), router, SimulationHost, error boundary
  pages/               Landing, LabHub, Division, Simulation (+ LabComingSoon), NotFound
  catalogue/           divisions + 73 lab entries, validation (framework-free)
  components/
    landing/           HeroScene (3D constellation), EnterLabButton
    hub/               DivisionEmblem, EmblemCanvas (division page emblems)
    landing/           slides.ts (hub carousel characters), carousel.ts, EnterLabButton, HeroScene
    catalogue/         LabRow, LabGlyph (concept previews)
    lab/               generic instrument panels: variables, transport, measurements,
                       experiments, explanations, overlay legend; formatting; media queries
    ui/                shadcn/ui primitives (Base UI), adapted in place
    SimulationHeader   back-to-division link and lab title over a simulation
  engine/              Simulation SDK — framework-free, subject-agnostic
    core/              SimulationRuntime (lifecycle, progression, faults)
    domains/           DomainRegistry, defineDomain
    education/         explanation lookup and anchor validation
    events/            typed EventBus
    experiments/       ExperimentLog, compareExperiments
    measurements/      measurement validation
    simulation/        defineSimulation, SimulationRegistry, definition validation
    types/             public contracts (units, variables, measurements, scene, simulation, domain)
    units/             core SI catalog, conversion, vector constructors
    variables/         variable resolution and validation
    __fixtures__/      domain-neutral test models (one per model kind)
  domains/
    physics/           first domain module: units, constants, kinematics, drag
    index.ts           installed domains, in dependency order
  lib/
    numerics/          domain-neutral numerical methods (RK4), shared by all domains
    utils.ts           shadcn class-name helper
  rendering/           LabCanvas, LabEnvironment, SimulationDriver, runtime context, theme,
    interaction/       useSelectable, usePlaneDrag
    overlays/          VectorArrow, Trail, useOverlayVisible
  simulations/
    physics/
      projectile-motion/  definition, model, aiming, View, overlays, tests
    index.ts           installed simulation packages
    types.ts           SimulationPackage (definition + lazy view + Environment + overlays)
  state/               Zustand store (open simulation, status, selection, overlays, explanation focus)
e2e/                   Playwright tests
```

Planned, created when first needed (not as empty placeholders): `src/domains/{chemistry,biology,
astronomy,earth-science,mathematics}`, `src/ai`, `src/persistence`, further
`src/lib/numerics` methods (vector algebra, root finding, symplectic integrators).

## Related Specifications

Product: SCIENCE_LAB_UX.md · LAB_NAVIGATION_ARCHITECTURE.md · LAB_CATALOGUE.md ·
GOLD_STANDARD_LAB.md · LAB_IMPLEMENTATION_FRAMEWORK.md · MODEL_ECOSYSTEM_GUIDELINES.md

Engine: SIMULATION_ENGINE.md · RENDERING_ENGINE.md · INTERACTION_ENGINE.md · EXPERIMENT_ENGINE.md ·
MEASUREMENT_ENGINE.md · EDUCATION_ENGINE.md · ASSET_PIPELINE.md · AI_TUTOR.md · DATABASE.md ·
SECURITY.md · PERFORMANCE.md · TESTING.md

Domains: PHYSICS_ENGINE.md · CHEMISTRY_ENGINE.md · BIOLOGY_ENGINE.md · ASTRONOMY_ENGINE.md ·
EARTH_SCIENCE_ENGINE.md · MATHEMATICS_ENGINE.md
