# Earth Science Domain Engine Specification

Status: **specified — not implemented** (Roadmap Phase 7). Implements the `DomainEngine` contract;
no earth-science concept may enter the core.

## Scope

Plate tectonics, earthquakes and volcanoes, the rock cycle, weathering and erosion, the water
cycle, atmosphere and weather, climate and the carbon cycle, oceans.

## Model Kinds Used

| Kind         | Examples                                                              |
| ------------ | --------------------------------------------------------------------- |
| `continuous` | plate motion, seismic wave propagation, energy-balance climate models |
| `discrete`   | rock cycle transitions, geological eras                               |
| `static`     | Earth's internal structure, atmospheric layers, topographic maps      |

Geological processes span **millions of years**. The runtime's time scale (0.05–8×) is not the
tool for that. Models use a documented simulated-time mapping (e.g. one simulated second
represents 1 Myr), stated in `assumptions`.

## Units Contributed

`km`, `cm/yr` (plate velocity), `Myr`, `hPa`, `mm` (precipitation), `W/m²` (radiative flux),
`ppm` (CO₂), `°C` shared with core. Magnitude scales (Richter/Mw) are dimensionless (`1`) with
their logarithmic nature documented.

## Domain Services (pure, `src/domains/earth-science/`)

- Plate kinematics on a sphere (Euler poles)
- Seismic travel-time curves (simplified layered Earth)
- Zero-dimensional energy-balance climate model with analytic equilibrium tests
- Rock-cycle state machine

## Rendering Considerations

- Terrain as heightfields with LOD; cross-sections via clipping planes
- Globe views with lat/long overlays (a sphere, not the flat lab grid)

## Dependencies

None by default. Atmosphere/ocean fluid models may later declare `dependsOn: ['physics']`
explicitly.

## Scientific Integrity

Climate and geological models are heavily simplified. Each simulation must state which processes
are omitted, and must never be presented as a prediction.
