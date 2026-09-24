# Scientific Simulation Platform — Claude Code Rules

## Mission

Build an extensible web-based scientific simulation platform, not a 3D model gallery.

Core experience:

3D environment + scientific simulation + interaction + experimentation + measurement + explanation + AI guidance.

The architecture must allow new subjects and simulations to be added without rewriting the core engine.

## Technology

Core:

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber
- Drei
- Rapier
- Zustand
- GSAP
- Tailwind CSS
- shadcn/ui

Scientific:

- mathjs
- Mol* for molecular visualization
- Ketcher for molecular/chemical structure editing

Backend:

- Supabase
- PostgreSQL
- Supabase Storage
- Supabase Auth

Testing:

- Vitest
- Playwright

Deployment:

- Vercel

## Architecture Rules

Separate these concerns:

1. Rendering
2. Simulation
3. State
4. Interaction
5. Education
6. Experiments
7. Measurements
8. AI
9. Persistence

Never put scientific calculations directly inside UI components.

Never hardcode simulation-specific behavior into the core engine.

Never bypass the Simulation SDK when creating a new simulation.

Prefer reusable abstractions over one-off implementations.

## 3D Rules

- Prefer GLB/GLTF.
- Optimize assets before production use.
- Use instancing for repeated geometry.
- Use LOD where appropriate.
- Avoid unnecessarily high-poly assets.
- Monitor draw calls, texture memory and GPU load.
- Keep the 3D scene as the primary learning interface.

## Physics Rules

- Use SI units where applicable.
- Keep equations and scientific calculations independently testable.
- Document scientific assumptions.
- Separate numerical calculations from rendering.
- Validate impossible or invalid parameter values.

## TypeScript Rules

- Strict TypeScript.
- Avoid `any`.
- Prefer explicit interfaces and discriminated unions.
- Keep public engine APIs typed.
- Do not duplicate types across modules.

## UI Rules

The product should feel like an immersive scientific laboratory.

Avoid:

- generic SaaS dashboards
- excessive cards
- excessive gradients
- unnecessary text
- childish interfaces

Use contextual controls rather than permanently displaying every control.

## AI Rules

The AI tutor receives structured simulation context.

AI must not execute arbitrary code.

AI can use safe tools such as:

- getSimulationState
- getMeasurement
- explainObject
- explainConcept
- suggestExperiment
- compareExperiments

## Development Workflow

Before implementing a feature:

1. Inspect the existing architecture.
2. Read relevant documentation.
3. Identify reusable components.
4. Create an implementation plan.
5. Identify affected files.
6. Implement the smallest coherent change.
7. Run TypeScript checks.
8. Run unit tests.
9. Run relevant integration tests.
10. Inspect UI and console errors.
11. Check performance.
12. Update documentation.

Never rewrite working architecture unnecessarily.

## Definition of Done

A feature is not complete until:

- it works
- it is typed
- it is tested
- it integrates with the architecture
- it has no obvious console errors
- performance is acceptable
- documentation is updated
