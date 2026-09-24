# Mathematics Domain Engine Specification

Status: **specified — not implemented** (Roadmap Phase 7). Implements the `DomainEngine` contract;
no mathematics-teaching concept may enter the core.

## Scope

Geometry (2D/3D solids, transformations), vectors and matrices, functions and graphs, calculus
(limits, derivatives, integrals as area/accumulation), probability and statistics, sequences.

## Distinction From Shared Numerics

- `src/lib/numerics` (planned) is **infrastructure**: vector algebra, ODE integrators and root
  finding used by any domain. It is not a domain and teaches nothing.
- The **Mathematics domain** is a subject that learners study. It may use `src/lib/numerics`, but
  other domains never depend on the Mathematics domain to do their calculations.

## Model Kinds Used

| Kind         | Examples                                                            |
| ------------ | ------------------------------------------------------------------- |
| `static`     | function graphs, geometric solids, vector addition, transformations |
| `discrete`   | Riemann sums refining step by step, iterative methods, sequences    |
| `continuous` | parametric curves traced over time, rates of change                 |

## Units

Mostly dimensionless (`1`) and `rad` (core). Mathematics contributes `deg` for angles, declared
identically to Physics' definition. The registry accepts identical duplicates, so neither domain
depends on the other.

## Rendering Considerations

- **Orthographic** projection (`scene.camera.projection`) for 2D graphs; axes with ticks and
  labels scaled to the function domain, not metres
- Curves via line geometry; surfaces via parametric meshes
- Draggable control points (INTERACTION_ENGINE.md) mapped to coefficient variables

## Domain Services (pure, `src/domains/mathematics/`)

- Safe expression evaluation for learner-entered functions: mathjs with a restricted scope, never
  `eval` (SECURITY.md)
- Sampling functions over a domain with discontinuity detection
- Numerical derivative/integral with error estimates, tested against closed forms
- Geometry: areas, volumes, transformations with exact tests

## Dependencies

None.

## Integrity

Numerical approximations (sampling resolution, Riemann sum `n`) are shown to the learner as part
of the lesson, not hidden.
