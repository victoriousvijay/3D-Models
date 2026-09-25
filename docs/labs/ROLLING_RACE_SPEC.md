# Rolling Race — Lab Specification

Status: implemented (`/lab/physics/rolling-race`). Physics · _System of Particles and Rotational Motion_ (NCERT Class 11, §7.14 Rolling motion).

## 1. Scientific concept

Release a solid sphere, a solid cylinder and a ring together from the same line on the same slope. Most students expect a tie, or expect the heaviest to win. The sphere wins, and the ring comes last, **whatever their masses and radii**.

The reason is the moment of inertia. A rolling body has to spend part of its lost potential energy on spinning. The further its mass sits from the axle, the larger that share, and the less energy is left for moving forward.

Every rolling body has I = k m r², with k fixed by its shape. Mass and radius cancel out of the motion, so only k decides the race.

## 2. Learning objectives

1. State the rolling condition v = ωr and explain why a rolling body has both translational and rotational kinetic energy.
2. Derive and use a = g sin θ / (1 + I/(m r²)) for rolling down an incline.
3. Explain why the order is solid sphere → solid cylinder → hollow sphere → ring, using mass distribution.
4. Show that mass and radius do not change the race for a given shape, and that the incline angle and g do.
5. Use energy conservation, mgh = ½mv² + ½Iω², to predict the speed at the finish and the share of energy that is rotational.

## 3. Equations (SI)

| Quantity                     | Equation                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Moment of inertia            | I = k m r². Solid sphere k = 2/5, solid cylinder k = 1/2, hollow sphere k = 2/3, ring (thin-walled hollow cylinder) k = 1 |
| Rolling condition            | v = ω r; a = α r                                                                                                          |
| Acceleration along the slope | a = g sin θ / (1 + k)                                                                                                     |
| Distance and time from rest  | s = ½ a t²; race time t = √(2L/a)                                                                                         |
| Speed after distance s       | v = √(2 a s) = √(2 g h / (1 + k)), with h = s sin θ                                                                       |
| Energies                     | PE = m g h (measured from the finish height); KE_trans = ½ m v²; KE_rot = ½ I ω² = k · KE_trans                           |
| Energy split                 | KE_rot / KE_total = k / (1 + k): sphere 29 %, cylinder 33 %, hollow sphere 40 %, ring 50 %                                |
| Friction needed to roll      | μ_min = k tan θ / (1 + k)                                                                                                 |

## 4. Assumptions

1. Rigid bodies of ideal shape: a uniform solid sphere, a uniform solid cylinder, a thin-shelled hollow sphere and a thin-walled ring (hollow cylinder).
2. Rolling without slipping. The rubber-coated lanes have μ_s = 0.80, more than the maximum μ_min in the allowed range (the ring at 45° needs 0.50). Static friction does no work, so mechanical energy is conserved.
3. No rolling resistance, air drag or bearing losses.
4. Each body starts at rest with its centre of mass on the start line. Race distance L and all timing refer to the centre of mass.
5. The lanes are flat, rigid and at exactly the set angle; g is uniform.
6. Motion is evaluated in closed form (uniform acceleration), so there is no numerical error.
7. A body's run ends when its centre of mass crosses the finish line. A foam catcher stops it; what happens after the line is not modelled.
8. Everything is drawn to true scale (metres).

## 5. Variables

| id          | Label                        | Unit | Range                                                | Default                  |
| ----------- | ---------------------------- | ---- | ---------------------------------------------------- | ------------------------ |
| angle       | Incline angle θ              | °    | 2–45, step 0.5                                       | 10                       |
| distance    | Race distance L (start line) | m    | 0.5–2.5, step 0.05                                   | 2.0                      |
| gravity     | Gravity g                    | m/s² | 1.6–25, step 0.01                                    | 9.81                     |
| shape1/2/3  | Lane n body                  | —    | solid sphere / solid cylinder / hollow sphere / ring | sphere / cylinder / ring |
| mass1/2/3   | Lane n mass                  | kg   | 0.1–5.0, step 0.1                                    | 1.0                      |
| radius1/2/3 | Lane n radius                | mm   | 20–120, step 1                                       | 50                       |

All variables are initial conditions: changing one resets the race. There are three lanes so that one race compares three bodies. Per-lane mass and radius make it possible to race two spheres of different size or mass side by side.

## 6. Units

Input in degrees and mm for readability; models convert to radians and metres (`deg` and `mm` already exist in the physics domain). Outputs are in SI: s, m, m/s, m/s², rad/s, J and kg·m². `rad/s` and `kg·m²` were added to the physics domain's units for this lab.

## 7. 3D environment — "Rolling-race workshop" (new; distinct from the range, darkroom and air-track bench)

- Warm, light workshop room with a warm concrete floor; no grid or orientation gizmo
- A 3 m, three-lane inclined board that pivots at its bottom end, so changing θ tips it. Dark rubber lanes, raised dividers, and distance markers every 0.25 m measured from the finish
- A **start gate** across the lanes that lifts straight up (like a sluice) when the race starts
- A checkered **finish line** with a photogate arch, and a foam catcher behind it
- An angle arc at the pivot showing θ
- Side-on, raised camera looking along the lanes

## 8. Scientific objects

| Object         | Appearance (mass distribution made visible)                              |
| -------------- | ------------------------------------------------------------------------ |
| Solid sphere   | Opaque sphere with a painted band, so rotation is visible                |
| Hollow sphere  | Translucent thin shell with an opaque band: "the mass is on the outside" |
| Solid cylinder | Opaque disc with a stripe across both faces                              |
| Ring           | Thin metal hoop (all mass at the rim) with a rim marker                  |
| Ramp and lanes | Selectable, with its own explanation                                     |
| Start gate     | Draggable along the ramp before the race: sets L                         |

Lane colours: 1 blue, 2 orange, 3 green.

## 9. Interactions

- Select any body or the ramp to see its explanation (moment of inertia, why it wins or loses)
- **Drag the start gate** up or down the slope to set L. It snaps to 0.05 m, only before a race
- Sliders or typed values for every variable; presets
- Start, pause, reset, replay, speed 0.25×–2×, step
- Orbit, zoom and pan
- Record and compare trials

The angle is not dragged, because a moving ramp under the pointer is awkward; the slider is precise.

## 10. Measurements

- **Primary:** lane 1, 2 and 3 times (s). Each clock stops at that lane's finish, so after the race they are the race times.
- **Detail, per lane:**
  - distance (m)
  - speed v (m/s)
  - acceleration a (m/s²)
  - angular velocity ω (rad/s)
  - translational KE, rotational KE and PE (J)
  - moment of inertia I (kg·m²)
- **Detail, race:** winner (not started / racing / lane 1 / lane 2 / lane 3 / tie)
- After a body crosses the line, its readings freeze at that moment, like a photogate

## 11. Experiments (investigations and presets)

1. **Compare shapes:** sphere vs cylinder vs ring (default).
2. **Change the angle:** does a steeper slope change the finishing order?
3. **Change the radius:** three solid spheres of 30, 60 and 100 mm tie.
4. **Change the mass:** three rings of 0.2, 1 and 5 kg tie.
5. **Energy distribution:** switch on the energy columns and compare the rotational share.
6. **Measure a:** check a = 2L/t² against g sin θ/(1 + k).

Presets:

- Sphere vs cylinder vs ring
- Solid vs hollow
- Big vs small spheres
- Heavy vs light rings
- Steep (30°)
- On the Moon
- Short race (0.5 m)

## 12. Visualizations (overlays)

| Overlay                                                                                  | Default |
| ---------------------------------------------------------------------------------------- | ------- |
| Velocity arrows (along the slope)                                                        | on      |
| Race progress: coloured stripe along each lane, plus place and time at the finish        | on      |
| Distance markers                                                                         | on      |
| Centre-of-mass dots                                                                      | off     |
| Acceleration arrows                                                                      | off     |
| Angular velocity: arrow along the axle (right-hand rule) with an ω label                 | off     |
| Energy columns: PE, translational KE and rotational KE as % of starting energy, per lane | off     |

Advanced overlays start hidden. This uses the new, backwards-compatible `defaultVisible: false` on `OverlayDescriptor`.

## 13. Animations

All motion comes from simulation time, so pause, step and slow motion stay exact:

- Rolling: translation along the slope, plus rotation by φ = s/r about the axle, so the painted markers show rolling without slipping
- The start gate lifts 0.3 m during the first 0.12 s
- Finish chips appear as each body crosses the line

## 14. Edge cases

| Case                                             | Behaviour                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Identical bodies (any mass or radius)            | Exact tie. Winner "Tie"; equal times                                                               |
| Smallest angle 2°, g 1.6, ring, 2.5 m            | Slowest race, 13.4 s (within maxDuration 60 s)                                                     |
| Largest angle 45°, g 25, sphere, 0.5 m           | Fastest race, 0.28 s                                                                               |
| Largest radius 120 mm                            | Fits a 300 mm lane with a 120 mm radius → 240 mm diameter                                          |
| Friction needed at 45°                           | Ring 0.50, hollow sphere 0.40, cylinder 0.33, sphere 0.29; all below 0.80, so no slipping in range |
| Invalid input (NaN, out of range, unknown shape) | Rejected by variable validation; the race is unchanged                                             |
| Reset                                            | Start gate down, bodies on the start line, clocks 0                                                |

## 15. Performance

- Primitive geometry only; the checkered finish is one textured plane; demand frame loop; no per-frame React renders (labels update through DOM refs)
- Measured: 59 draw calls with every overlay on, at 60 fps on desktop (target ≤ 80 and ≥ 55 fps)
- Phones: scene text reduced to lane numbers; the finish chips are hidden because the lanes are too close, and the times are in the Results cards

## 16. Tests

- **Domain (`mechanics/rolling.test.ts`):**
  - I for each shape
  - a for each shape and angle, including the ordering
  - mass and radius independence
  - energy conservation along the slope
  - KE_rot = k·KE_trans; v = ωr
  - race time t = √(2L/a) against sampled motion
  - μ_min, and that it stays below μ_s over the whole range
  - invalid input
- **Model (`rolling-race.test.ts`):**
  - definition validity
  - race order sphere < cylinder < ring with exact times
  - ties for equal shapes
  - winner category
  - energy conserved at every sample
  - v = ωr at every sample
  - different angles
  - extremes (slowest and fastest)
  - reset
  - frame-rate independence
  - invalid values rejected
- **E2E:**
  - desktop: open from the Physics Lab → race → times 1.81 / 1.88 / 2.17 s → winner lane 1 → record → "Big vs small spheres" → tie → compare
  - phone run
  - no console errors
