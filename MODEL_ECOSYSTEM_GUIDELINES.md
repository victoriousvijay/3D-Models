# Model Ecosystem Guidelines

**Same platform + same interaction language + different scientific worlds.**

Every lab is its own world. Opening a lab never shows a generic 3D viewer: it enters an environment built for that concept.

## What is common and what is the lab's own

| Common (platform provides)                               | Model-specific (the lab provides)                     |
| -------------------------------------------------------- | ----------------------------------------------------- |
| Navigation, header, page shell                           | 3D **environment**: space, lighting, ground, backdrop |
| Canvas, camera controls, camera fit                      | Scientific **objects** and their geometry/assets      |
| Simulation controls (run, pause, step, reset, speed)     | Scientific **model**: equations, state, stepping      |
| Variable controls (slider + typed entry)                 | **Variables** and their ranges, units, presets        |
| Measurement readouts and formatting                      | **Measurements** meaningful for the concept           |
| Experiment recording and comparison                      | Visualisations: fields, waves, particles, processes   |
| Selection, highlighting, drag-on-plane                   | Gestures and what they mean (drag → angle, radius…)   |
| Explanations, "Try this", objectives, assumptions panels | The teaching **content** for those panels             |
| Error containment, performance systems                   | Performance budget of its own scene                   |

## The Environment is required

`defineSimulationPackage({ definition, loadView, Environment, overlays })`

`Environment` is a required R3F component rendered inside the canvas, before the view. It owns the world's lighting, ground, backdrop and reference aids. There is intentionally no default.

| Lab                       | Environment                                                     | Key objects                                                                                   |
| ------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Projectile Motion ✅      | Testing range: open light, metre grid, axes (`LabEnvironment`)  | Launcher, ball, trajectory, range marker, vectors                                             |
| Double Slit (YDSE) ✅     | Optics darkroom (`OpticsDarkroom`): navy room, bench, no grid   | Laser source, slit plate, screen, wavefronts, fringes                                         |
| Electric Flux — Cube      | Electrostatics bench: neutral void, subtle depth cues           | Point charge, Gaussian cube, field lines, face flux readouts                                  |
| 1D Collision ✅           | Air-track bench (`AirTrackBench`): bright lab, bench, no grid   | Air track, two gliders with bumpers, ruler, p/K board                                         |
| EM Wave                   | Field space: axis rails for E and B, propagation direction      | E and B vectors along the wave, wavefront planes                                              |
| Rolling Race ✅           | Rolling workshop (`RollingWorkshop`): warm room, concrete floor | Three-lane pivoting ramp, start gate, photogate finish, sphere, cylinder, hollow sphere, ring |
| Cell/organ labs (Zoology) | Tissue/cell interior, soft volumetric light                     | Organelles with parent–child hierarchy, isolate mode                                          |
| Molecule labs (Chemistry) | Molecular space in Å, orthographic option                       | Atoms, bonds, orbitals                                                                        |

Rules:

- Pick `scene.worldUnit` to match the world (m, Å, AU, 1). Never assume metres.
- Dark environments set `sceneTone: 'dark'` in the package. The header text turns light, and the
  floating panels become near-opaque so they stay legible over the scene.
- The environment must not compete with the science: low contrast, few draw calls, no unrelated decoration.
- If two labs genuinely share a world, such as two mechanics-bench labs, share the environment component through the domain's `visual/` folder. Don't copy it.

## Designing a new lab's world

1. **Concept first.** Decide what the learner must see change: a fringe spacing, a flux total, a race order.
2. **Environment** that frames that change: scale, lighting and a camera that keeps it in view.
3. **Objects** that are scientifically meaningful and selectable, each with an explanation.
4. **Variables** that map to the concept's real parameters, in SI units, with honest limits.
5. **Measurements**: one to three `primary` headline results, the rest as details.
6. **Visualisations** that show the invisible: fields, waves, vectors, with stated scales.
7. **Investigations** that ask, and never tell.
