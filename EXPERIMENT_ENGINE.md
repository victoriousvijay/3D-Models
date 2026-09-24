# Experiment Engine Specification

Status: **core and UI built** (Phase 1).

- Presets appear as one-click buttons. Each is applied on top of the defaults, so a preset always
  gives the same conditions.
- The generic `ExperimentPanel` records trials, deletes them, and compares any two. The comparison
  shows the changed conditions and the difference in each scalar measurement.
- The log lives on the platform (`platform.experiments`) for the session. Persistence and guided
  experiments come in later phases.

## Responsibility

Make scientific inquiry reproducible in every domain: set initial conditions, run, observe, record
and compare.

## Concepts

| Concept               | Definition                                                                                                        | Status    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | --------- |
| **Preset**            | Named, reproducible starting variables declared by the simulation, validated at registration                      | built     |
| **Record**            | Immutable snapshot: simulation id, variables, measurements, `RunProgress`, timestamp, optional label              | built     |
| **Comparison**        | Structured diff of two records: changed variables; scalar and vector differences; category changes                | built     |
| **Guided experiment** | Ordered steps (set variable → run → observe measurement → answer) authored as data; owned by the Education Engine | specified |
| **Series / sweep**    | Repeat a run across a range of one variable, collecting a measurement per run                                     | specified |

## Built API

```ts
const log = new ExperimentLog()
const record = log.record(runtime.getSnapshot(), 'Steeper angle')
log.list(simulationId) · log.get(id) · log.remove(id)
log.events.on('recorded' | 'removed', …)       // persistence & AI subscribe here
compareExperiments(a, b)                        // backs the AI tool compareExperiments
```

Records deep-copy and freeze their data, so later changes to the runtime can never alter recorded
results.

## Reproducibility Rules

- `setVariables` always resets the run. A result therefore corresponds to exactly one set of
  initial conditions.
- Continuous models integrate with a fixed step, so a replay produces identical results regardless
  of frame rate.
- **Planned:** records will carry a `modelVersion` so results from an older model are never
  silently compared with a newer one.

## Persistence

Only meaningful events are persisted (DATABASE.md): experiment recorded or removed, and
comparisons the learner saves. Never per-frame data. Persistence subscribes to `log.events`; the
engine never calls the database.

## Domain Neutrality

Records hold `MeasurementValue`s of any kind, so the same log serves a projectile's range, a
reaction's equilibrium constant, a cell's phase or a function's root.
