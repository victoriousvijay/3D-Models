# Measurement Engine Specification

Status: **core and readout built** (`src/engine/types/measurements.ts`,
`src/engine/measurements`).

The generic `MeasurementPanel` shows every declared measurement at 10 Hz. Formatting lives in
`src/components/lab/format.ts` and is tested:

- 2 decimals below 100, and 1 decimal below 10⁶
- scientific notation for |x| < 0.01 or ≥ 10⁶
- never "−0"
- unit symbols, with ° for degrees
- category labels

Vector measurements render as arrows through `VectorArrow`.

**Emphasis.** A measurement declared with `emphasis: 'primary'` is a headline result. `KeyResults`
shows these large and always visible, with a one-line prompt about what to do next. All other
measurements sit under "More details", so a learner is not met with vectors first.

Still planned: time-series sampling, learner-selectable display units and measurement tools.

## Responsibility

Represent observations as structured, typed, unit-bearing data, and guarantee that no impossible
value is ever presented to a learner.

## Measurement Kinds (built)

| Kind       | Value                     | Examples                                                           |
| ---------- | ------------------------- | ------------------------------------------------------------------ |
| `scalar`   | finite number + unit      | range (m), pH (1), heart rate (s⁻¹), orbital period (s), slope (1) |
| `vector`   | 2D/3D finite tuple + unit | velocity, dipole moment, a point on a graph                        |
| `category` | one declared option       | bond type, cell-cycle phase, rock type, function parity            |

Values are typed per simulation. `measure()` must return exactly the declared ids, and category
literals are type-checked. Use `vec2`/`vec3` to build vector values.

## Validation (built)

After every update, `findInvalidMeasurements` checks each declared value:

- scalars and vector components must be finite
- vectors must have the declared dimension
- categories must be declared options

If any check fails, the runtime **faults**: status becomes `faulted`, a `fault` event fires and
the last valid measurements are kept. This is how "division by zero" or numerical blow-up is caught
in any domain.

## Units

Every scalar/vector measurement declares a `UnitId`. Units must be available to the simulation's
domain (SIMULATION_ENGINE.md). `toSI(value, unit)` converts to the coherent SI unit for comparison
across simulations.

## Planned

| Capability                 | Design                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sampling / time series** | `MeasurementRecorder` samples chosen measurements at a fixed _simulated_ interval into a bounded ring buffer, feeding graphs without per-frame React renders |
| **Display formatting**     | Significant figures from variable `step` precision; unit symbols from `UnitDefinition`; learner-selectable display units via `toSI`                          |
| **Uncertainty**            | Optional `uncertainty` on scalar definitions for simulations that model measurement error                                                                    |
| **Measurement tools**      | Ruler, protractor, stopwatch as interactions producing measurements, reusable across domains                                                                 |
| **Derived measurements**   | Measurements computed from other measurements, declared rather than hand-written in views                                                                    |

## Rules

- Measurements are computed by the model or domain services, never inside UI components.
- A measurement shown to a learner has always passed validation.
- Do not persist per-frame samples. Persist records (EXPERIMENT_ENGINE.md).
