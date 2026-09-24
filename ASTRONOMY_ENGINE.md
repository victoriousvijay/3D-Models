# Astronomy Domain Engine Specification

Status: **specified — not implemented** (Roadmap Phase 7). Implements the `DomainEngine` contract;
no astronomy concept may enter the core.

## Scope

Orbits and Kepler's laws, the Solar System, moon phases and eclipses, seasons, celestial
coordinates, stellar properties and life cycles, galaxies, scale of the universe.

## Model Kinds Used

| Kind         | Examples                                                        |
| ------------ | --------------------------------------------------------------- |
| `continuous` | orbital motion (N-body or Keplerian), tides, eclipses over time |
| `static`     | sky charts, HR diagram, scale comparisons                       |
| `discrete`   | stellar evolution stages                                        |

## Units Contributed

`AU` (toSI 1.495978707e11), `ly`, `pc`, `M☉` (toSI 1.98841e30), `R☉`, `L☉`, `day`, `yr`, `km/s`.
Scene `worldUnit` is typically `AU` or a scaled unit. The core never assumes metres.

## Rendering Considerations

- **Extreme scale ranges**: logarithmic depth buffer or per-scene scaling, and labelled
  "not to scale" views where distances and sizes are exaggerated. That must be stated as an
  assumption.
- Starfields via instancing/points; skyboxes lazy-loaded.

## Domain Services (pure, `src/domains/astronomy/`)

- Keplerian orbit propagation (analytic) and N-body integration (symplectic integrator for energy
  conservation), tested against analytic two-body solutions
- Ephemeris-lite: simplified planetary elements with documented epoch and accuracy
- Coordinate transforms (ecliptic ↔ equatorial ↔ horizontal)

## Dependencies

May declare `dependsOn: ['physics']` to reuse gravitational services and physics units
(`m/s`, `m/s²`). This must be explicit: Physics must not know Astronomy exists.

## Scientific Integrity

- State whether orbits are Keplerian (two-body) or N-body, and the integrator used.
- Planetary data cites source and epoch. Scale distortions are always disclosed.
