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

`e2e/shell.spec.ts` covers the application shell.

Playwright runs against the production build (`npm run e2e`). Headless Chromium supplies real
animation frames. Note that an embedded or hidden browser pane may not run
`requestAnimationFrame`, so simulations appear frozen there.

## Scientific Tests

For known scenarios, compare results against expected analytical solutions within a documented tolerance.

| Suite                                                 | Reference                                                          | Tolerance     |
| ----------------------------------------------------- | ------------------------------------------------------------------ | ------------- |
| `src/domains/physics/kinematics/projectile.test.ts`   | closed-form range, flight time, peak, energy                       | 1e-9 – 1e-10  |
| `src/domains/physics/dynamics/drag.test.ts`           | k → 0 limit equals the ideal range; monotonic effects              | 1e-4 m        |
| `src/lib/numerics/rk4.test.ts`                        | exp(−t), cos t, measured 4th-order convergence                     | 1e-9 – 1e-10  |
| `src/simulations/physics/projectile-motion/*.test.ts` | runtime results vs closed forms; frame-rate independence with drag | 1e-9 / 1e-3 m |

## Regression

Every bug that affects scientific behavior should result in a regression test.

## Completion

Do not mark a feature complete if:

- tests fail
- TypeScript fails
- console has unexpected errors
- primary interaction is broken
