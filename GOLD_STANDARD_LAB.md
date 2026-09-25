# Gold Standard Lab: Projectile Motion

Projectile Motion (`/lab/physics/projectile-motion`) is the **quality bar** for every lab. Future labs match its quality, **not** its scientific structure: a double-slit lab is not a projectile lab with different sliders.

## The quality bar

| Area                 | What Projectile Motion does                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scientific integrity | Exact closed-form ideal model; RK4 drag model; results verified against analytic answers in unit and browser tests. Assumptions are listed for the learner.         |
| Interaction          | Sliders plus typed entry with inline validation; drag the launcher to aim; select objects to learn about them; presets.                                             |
| Simulation control   | Start / pause / resume / step / reset; 0.25–2× playback; controls lock while running.                                                                               |
| Measurement          | Headline results large and always visible; details on demand; vectors drawn to a stated scale; range marker in the scene.                                           |
| Experiment           | Record trials, delete them, compare two with the changes and differences spelled out.                                                                               |
| Learning             | Plain-language helper text, contextual explanations, "Try this" investigations that never give the answer away, objectives, assumptions. Draft content is labelled. |
| Visual polish        | Light lab theme; the scene is the primary interface; no clutter.                                                                                                    |
| Responsiveness       | Floating panels on wide screens; a bottom sheet with tabs on phones; the camera fits the screen.                                                                    |
| Robustness           | Invalid values rejected with a reason; the model faults instead of showing impossible numbers; a failing view can't crash the app.                                  |
| Tests                | Unit (science and runtime), e2e journeys on desktop and phone, and zero console errors asserted.                                                                    |

## Component analysis

The Phase-1 analysis sorted Projectile Motion's code into three layers. Only genuinely reusable parts were extracted.

### A. Platform-wide (every lab, every division)

| Component                                                                                                            | Location                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Simulation SDK: runtime, lifecycle, variables, measurements, experiments, education, events                          | `src/engine`                                                                     |
| Canvas, render-loop driver, camera fit, selection, plane drag, vector arrows, trails, overlay visibility             | `src/rendering`                                                                  |
| Instrument panels: conditions, results, run controls, trials, explanations, overlay legend; bottom sheet; formatting | `src/components/lab`                                                             |
| Simulation page shell and header, error containment                                                                  | `src/pages/SimulationPage.tsx`, `src/components/SimulationHeader.tsx`, `src/app` |

### B. Physics domain (any physics lab)

| Component                               | Location                                     |
| --------------------------------------- | -------------------------------------------- |
| Units, constants (g₀, air density, C_d) | `src/domains/physics`                        |
| Kinematics, quadratic drag              | `src/domains/physics/kinematics`, `dynamics` |
| RK4 integrator (shared by all domains)  | `src/lib/numerics`                           |

### C. Projectile-specific

| Component                                                                   | Location                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Definition (variables, measurements, presets, explanations, investigations) | `src/simulations/physics/projectile-motion/definition.ts` |
| Model (ideal and drag stepping, landing)                                    | `model.ts`                                                |
| Aiming gesture (pointer → angle)                                            | `aiming.ts`                                               |
| 3D view (launcher, ball, range marker) and overlay scales                   | `View.tsx`, `overlays.ts`                                 |
| Environment choice: the testing range (`LabEnvironment`)                    | `index.ts`                                                |

## Changes made when integrating it into the lab architecture

Only what integration required:

1. The environment moved from the app into the package: `Environment: LabEnvironment`. The appearance is identical.
2. The page is chosen by URL (`/lab/physics/projectile-motion`), not by store state.
3. The header's back link says "← Physics Lab" and returns there. It used to say "← All simulations".

Its definition, model, view, controls, panels and behaviour are unchanged, and the pre-existing e2e journeys pass unmodified apart from their start URL.
