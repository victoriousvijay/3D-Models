# Product Roadmap

Physics is the first domain delivered, not the foundation. Every phase after Phase 0 builds on
subject-agnostic contracts (see ARCHITECTURE.md).

## Phase 0 — Foundation ✅ (2026-09-24)

- [x] Repository setup: Vite, React 19, TypeScript (strict), Tailwind v4
- [x] Linting (typescript-eslint strict, architectural import boundaries) and Prettier
- [x] Vitest unit tests; Playwright end-to-end smoke test
- [x] Simulation SDK: definitions, three model kinds, runtime lifecycle, variables, measurements,
      events, experiment log, domain and simulation registries
- [x] Domain-engine contract with unit scoping; Physics registered as the first domain module
- [x] Rendering foundation: on-demand canvas, lab environment, render-loop driver, runtime context,
      error containment
- [x] Application shell with domain/simulation catalog
- [x] Architecture, engine, domain and security specifications

Carried forward: git repository location (SECURITY.md), bundle splitting, Supabase project.
(shadcn/ui was set up in Phase 1.)

## Phase 1 — Physics Vertical Slice: Projectile Motion ✅ (2026-09-24)

Built as a **physics domain module + simulation package**:

- [x] physics domain services: analytic kinematics, quadratic drag (RK4 via shared
      `src/lib/numerics`), with analytic regression tests
- [~] 3D environment, launcher and projectile — **primitive geometry**; GLB assets per
  ASSET_PIPELINE.md still to be produced
- [x] variables: speed, angle, height, gravity, air resistance, mass; presets
- [x] vectors (velocity, acceleration, gravity), trajectory trace, range marker, overlay legend/toggles
- [x] measurements: flight time, horizontal distance/range, maximum height, height, speed
      (= impact speed at landing), velocity, acceleration, phase
- [x] start / pause / resume / step / reset, playback speed 0.25–2×
- [x] interaction: select launcher/ball (highlight + explanation), drag launcher to aim
- [x] experiment recording, deletion and two-trial comparison
- [x] contextual explanations, learning objectives, assumptions (content marked **draft** pending
      subject-expert review)
- [x] tests: unit (science, runtime, formatting), e2e (TESTING.md journey, comparison, explanations)

Exit criterion met: `src/engine` and `src/rendering` contain no projectile-specific code (only
multi-domain doc examples); rendering imports no domain or simulation (lint-enforced).

Follow-up (same day): **responsive and student-friendly UI**.

- Below 1024 px: a bottom sheet with key results, large run controls, and Controls / Results /
  Learn / Trials tabs. At 1024 px and wider: floating panels.
- Automatic camera fit.
- Headline results, plain-language helper text, and "Try this" investigations.
- A phone-sized e2e journey.
- A fix for a stale "could not be loaded" message.

Carried forward: GLB assets; expert review of explanations and investigations; camera "follow/frame trajectory" for
long flights (e.g. Moon preset); a drag-to-aim e2e test (verified manually with a real mouse).

## Lab 2 — Double Slit (YDSE) ✅ (2026-09-25)

- [x] Spec first: `docs/labs/DOUBLE_SLIT_YDSE_SPEC.md`
- [x] Optics service `src/domains/physics/optics/interference.ts` (40 tests)
- [x] Optics darkroom environment, laser, S₁/S₂ barrier, screen, draggable detector, ruler, orders, β marker
- [x] Shader interference map and screen from one formula; conceptual wavefronts; I(y) graph
- [x] Live parameters without restart. Smallest platform change: `liveVariables` in the engine
- [x] Measurements, 7 presets, 6 investigations, 13 explanations (draft, awaiting expert review)
- [x] Desktop and phone e2e; Projectile Motion suites unchanged and passing
- [x] Platform additions: `sceneTone` for dark scenes, `useRuntimeVariables`, `nm`/`mm` units

Carried forward: expert review of the learning content; a single-slit diffraction envelope as an
optional overlay (the spec assumes narrow slits).

## Lab 3 — 1D Collision ✅ (2026-09-25)

- [x] Spec first: `docs/labs/ONE_D_COLLISION_SPEC.md`
- [x] Mechanics service `src/domains/physics/mechanics/collision1d.ts` (52 tests)
- [x] Air-track bench environment; air track with instanced air holes, ruler, end stops, +x axis
- [x] Gliders with type-specific bumpers (spring, rubber, putty) that compress to scale during contact
- [x] Closed-form model: approach → spring–damper contact → separation; momentum exact at every instant
- [x] Drag the velocity arrows to set initial velocities; velocity and momentum arrows; live p/K board with start ticks; collision marker
- [x] 16 measurements, 7 presets, 6 investigations, 11 explanations (draft, awaiting expert review)
- [x] Desktop and phone e2e; Projectile Motion and Double Slit suites unchanged and passing
- [x] No platform changes needed

## Phase 2 — Physics Library

Pendulum, Newton's Laws, Optics, Gravity. Introduce Rapier through `physicsDomain.initialize()`
only when a simulation needs collisions.

## Phase 3 — Platform UX

Domain explorer, simulation explorer, experiment history, progress, accounts (Supabase Auth),
persistence (DATABASE.md), polished navigation.

## Phase 4 — AI Tutor

Structured context from `RuntimeSnapshot` and experiment records, safe tools, contextual
explanations and experiment suggestions (AI_TUTOR.md, SECURITY.md).

## Phase 5 — Chemistry Domain

Chemistry domain engine (CHEMISTRY_ENGINE.md): units, molecular data model, Mol* and Ketcher via
`initialize()` and a visual layer. First: one static molecular-geometry simulation, then one
continuous kinetics simulation.

## Phase 6 — Biology Domain

Biology domain engine (BIOLOGY_ENGINE.md). Start with a static Cell Explorer (object hierarchy,
isolate), then discrete processes (cell cycle), then Heart, Lungs, DNA and organ systems.

## Phase 7 — Astronomy, Earth Science, Mathematics

Each as an independent domain module following its specification. Astronomy may declare
`dependsOn: ['physics']` for gravitation; Earth Science and Mathematics start independent.

## Phase 8 — Scale

Content authoring system (data-only definitions, see SECURITY.md), teacher accounts, classrooms,
assignments, analytics, assessments, additional subjects.

## Domain Onboarding Checklist

1. Write or refresh `<DOMAIN>_ENGINE.md`.
2. `src/domains/<id>/`: `defineDomain`, `UnitCatalog` augmentation, `UnitDefinition`s.
3. Pure scientific services with analytic or reference-data tests.
4. Optional `visual/` components and `initialize()` for heavy libraries.
5. Register in `src/domains/index.ts` (after its dependencies).
6. First simulation package; confirm no core changes were required.
