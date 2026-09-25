# Testing Strategy

## Unit Testing

Use Vitest.

Test:

- equations
- calculations
- variable validation
- measurement calculations
- simulation lifecycle
- state transitions

## Integration Testing

Test:

- simulation start/pause/reset
- variable changes
- interactions
- experiment creation
- measurement updates
- AI context generation

## End-to-End

Use Playwright.

Test critical user journeys:

```text
Open platform
  -> select Physics
  -> select Projectile Motion
  -> change velocity
  -> change angle
  -> run simulation
  -> inspect measurement
  -> record experiment
```

Implemented in `e2e/projectile-motion.spec.ts`:

- **The journey above**, asserting the analytical range (55.17 m) and flight time (2.55 s) for
  25 m/s at 30°.
- **Complementary angles** (30° and 60°) give equal range, and the 60° peak is +10.19 m higher.
- **Explanations** follow the learner's focus.
- **No console errors**, checked in every test.

`e2e/double-slit.spec.ts` and `e2e/double-slit-mobile.spec.ts` cover the second lab:

- **Desktop journey:** open the lab from the Physics Lab and switch the light on. The red laser
  gives β = 1.95 mm, with a bright central maximum. Typing 532 nm updates β live to 1.60 mm
  without a restart. A detector at 0.80 mm reads "Dark fringe". Two trials are recorded and
  compared (Δβ = −0.35 mm). No console errors.
- **Phone:** the pattern forms, and changing d live halves β. The canvas keeps a usable height.

`e2e/collision-1d.spec.ts` and `e2e/collision-1d-mobile.spec.ts` cover the third lab:

- **Elastic vs sticky:** open the lab from the Physics Lab. Equal masses, elastic: A stops and
  B leaves at 1.00 m/s. Sticky: both move at 0.50 m/s. Comparing the trials shows the same
  total momentum and −0.13 J of kinetic energy.
- **Typed values:** a heavy target sends A back at −0.60 m/s. A typed head-on (B at −1 m/s)
  gives a total momentum of 0 and swapped velocities.
- **Phone:** light target (0.60 and 1.60 m/s), then record in the Trials tab.
- Dragging a velocity arrow was verified with a real mouse: dragging B's arrow tip 0.5 m to the
  left set −1.00 m/s.

`e2e/rolling-race.spec.ts` and `e2e/rolling-race-mobile.spec.ts` cover the fourth lab:

- **Shapes vs sizes:** sphere, cylinder and ring at 10° over 2 m take 1.81, 1.88 and 2.17 s, and lane 1
  wins. Three spheres of 30, 60 and 100 mm tie at 1.81 s. Comparing the trials shows the changed bodies
  and a lane 3 difference of −0.35 s.
- **Angle:** at 30° the times are 1.07 s and 1.28 s and the order is unchanged. The energy columns
  toggle on without errors.
- **Phone:** heavy and light rings tie at 2.17 s; then record.
- Dragging the start gate was verified with a real mouse (L 2.00 → 1.25 m).

`e2e/shell.spec.ts` covers the application shell.

Playwright runs against the production build (`npm run e2e`). Headless Chromium supplies real
animation frames. Note that an embedded or hidden browser pane may not run
`requestAnimationFrame`, so simulations appear frozen there.

## Scientific Tests

For known scenarios, compare results against expected analytical solutions within a documented tolerance.

| Suite                                                 | Reference                                                               | Tolerance     |
| ----------------------------------------------------- | ----------------------------------------------------------------------- | ------------- |
| `src/domains/physics/kinematics/projectile.test.ts`   | closed-form range, flight time, peak, energy                            | 1e-9 – 1e-10  |
| `src/domains/physics/dynamics/drag.test.ts`           | k → 0 limit equals the ideal range; monotonic effects                   | 1e-4 m        |
| `src/lib/numerics/rk4.test.ts`                        | exp(−t), cos t, measured 4th-order convergence                          | 1e-9 – 1e-10  |
| `src/simulations/physics/projectile-motion/*.test.ts` | runtime results vs closed forms; frame-rate independence with drag      | 1e-9 / 1e-3 m |
| `src/domains/physics/optics/interference.test.ts`     | β = λD/d, I at nβ and (n+½)β, exact vs small-angle Δ                    | 1e-12 / 1e-3  |
| `src/simulations/physics/double-slit/*.test.ts`       | runtime readings vs closed forms; live variables; extremes              | 1e-10 – 1e-12 |
| `src/domains/physics/mechanics/collision1d.test.ts`   | conservation laws, textbook cases, closed-form contact end state        | 1e-12 – 1e-15 |
| `src/simulations/physics/collision-1d/*.test.ts`      | momentum at every sample incl. contact; outcomes; no-collision cases    | 1e-12         |
| `src/domains/physics/mechanics/rolling.test.ts`       | I per shape, a = g sin θ/(1+k), energy, v = ωr, μ_min                   | 1e-12 – 1e-15 |
| `src/simulations/physics/rolling-race/*.test.ts`      | race times, ties, order at all angles, energy at every sample, extremes | 1e-12         |

## Regression

Every bug that affects scientific behavior should result in a regression test.

## Completion

Do not mark a feature complete if:

- tests fail
- TypeScript fails
- console has unexpected errors
- primary interaction is broken
