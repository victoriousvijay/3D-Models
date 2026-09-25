# Physics Engine Specification

## Domain Module

Physics is the **first domain engine**, not the platform foundation (ARCHITECTURE.md). It
implements the `DomainEngine` contract in `src/domains/physics/` and contributes its own units
(`m/s`, `m/s²`, `kg·m/s`, `N·m`, `deg`) through the `UnitCatalog` extension point. Nothing in
`src/engine` or `src/rendering` may assume physics. Other domains use physics only by declaring
`dependsOn: ['physics']`.

Rapier (WASM) is loaded through `physicsDomain.initialize()` only when a simulation first needs
rigid-body collisions. Analytic models, such as projectile motion without air resistance, run as
pure TypeScript `continuous` models and do not need Rapier.

## Technology

Primary physics engine:

`@react-three/rapier`

Scientific calculations may also use custom TypeScript/mathjs implementations when Rapier is not appropriate.

## Architecture

```text
Physics Simulation
      |
      +-- Scientific Model
      |
      +-- Physics State
      |
      +-- Rapier World
      |
      +-- Visualization
```

## Principles

Use SI units where applicable.

Keep mathematical formulas separate from visual components.

Every important formula must have tests.

## Reusable Components

Potential reusable abstractions:

- RigidBody
- Collider
- Force
- Gravity
- Velocity
- Acceleration
- Joint
- Constraint
- Spring
- Projectile
- Pendulum

## Projectile Motion

Core equations without air resistance:

```text
x(t) = x0 + vx0 * t

y(t) = y0 + vy0 * t - 0.5 * g * t²

vx(t) = vx0

vy(t) = vy0 - g * t

vx0 = v0 cos(theta)

vy0 = v0 sin(theta)
```

Derived measurements:

- maximum height
- flight time
- range
- impact velocity

## Implemented Services (Phase 1)

| Module                             | Contents                                                                                                                                                                                                                                                        | Tests                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `constants.ts`                     | `STANDARD_GRAVITY` (9.80665, CGPM 1901), `SEA_LEVEL_AIR_DENSITY` (1.225, ISA), `SMOOTH_SPHERE_DRAG_COEFFICIENT` (0.47), degree/radian conversion                                                                                                                | via services                                                                                                              |
| `kinematics/projectile.ts`         | `positionAt`, `velocityAt`, `flightTime`, `maxHeight`, `range`, `impactSpeed`, `specificMechanicalEnergy`, input validation                                                                                                                                     | textbook closed forms, complementary angles, 45° optimum, energy conservation, invalid inputs                             |
| `dynamics/drag.ts`                 | `dragConstant` k = ρC_dA/2m, `dragAcceleration`, `projectileWithDrag` ODE for RK4                                                                                                                                                                               | k → 0 converges to ideal; more drag → shorter range; optimum angle < 45°                                                  |
| `optics/interference.ts`           | Two-source interference: `fringeWidth` β = λD/(nd), `pathDifference` (exact, cancellation-free 2yd/(r₁+r₂)), `phaseDifference`, `intensityAt` I₁ + I₂ + 2√(I₁I₂)cos φ, `fringeVisibility`, bright/dark positions, `classifyFringe`                              | central max, nβ bright / (n+½)β dark, proportionalities, water, unequal slits, small-angle agreement, invalid inputs      |
| `mechanics/collision1d.ts`         | 1D two-body collisions: `finalVelocities` (any e), `kineticEnergyLoss` ½μ(1−e²)w², `restitutionFrom`, `reducedMass`, `centreOfMassVelocity`; bumper contact as a spring–damper solved in closed form (`bumperContact`, `contactCompression`, `dampingRatioFor`) | momentum for all e, elastic energy, ΔK formula, special cases, e recovered, contact end state −e·w, τ ∝ √μ, invalid input |
| `src/lib/numerics/rk4.ts` (shared) | Classical RK4 step, domain-neutral                                                                                                                                                                                                                              | exponential decay, harmonic oscillator, measured 4th-order convergence                                                    |

### Projectile Motion model (`src/simulations/physics/projectile-motion`)

| Aspect            | Choice                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coordinate system | x downrange, y up, origin on the ground below the launcher; motion in the z = 0 plane                                                                             |
| Units             | SI; launch angle entered in degrees (`deg`) and converted to radians before calculation                                                                           |
| Ideal case        | Closed-form evaluation each step. Landing clamped to the exact flight time; apex captured analytically. Results equal the closed forms to ≈1e-10 (tested)         |
| Air resistance    | Quadratic drag on a 22 cm smooth sphere (C_d 0.47), still sea-level air, no spin, wind or buoyancy                                                                |
| Numerical method  | RK4, fixed Δt = 1/240 s; landing point linearly interpolated within the final step (O(Δt²) local error); peak taken from step samples (error ≈ gΔt²/8 ≈ 2×10⁻⁵ m) |
| Termination       | First ground contact (no bounce); safety limit 120 s                                                                                                              |
| Limits            | speed 1–40 m/s, angle 0–90°, height 0–30 m, g 1.6–25 m/s², mass 0.05–5 kg                                                                                         |

### Double Slit (YDSE) model (`src/simulations/physics/double-slit`)

Full spec: `docs/labs/DOUBLE_SLIT_YDSE_SPEC.md`.

| Aspect       | Choice                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Units        | λ entered in nm, d and y in mm, D in m. All converted to SI before calculation (`nm`, `mm` units added to the physics catalog) |
| Model        | Continuous: light travels from the laser to the screen, and the run completes once the pattern forms (`arrivedAt` remembered)  |
| Science      | Monochromatic, coherent, narrow slits (no single-slit envelope), scalar waves, far-field screen. Exact path difference used    |
| Live         | All seven variables are live. Changing them updates the pattern without restarting                                             |
| Not to scale | Lateral screen axis magnified ≈133× relative to the bench; wavefront spacing drawn enlarged (stated in the lab's assumptions)  |

### 1D Collision model (`src/simulations/physics/collision-1d`)

Full spec: `docs/labs/ONE_D_COLLISION_SPEC.md`.

| Aspect           | Choice                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Coordinates      | x along a 3 m track, + to the right; A on the left. Signed velocities                                                            |
| Contact          | Linear spring k = 5000 N/m with a damper tuned so the rebound gives e exactly; e = 0 is a critically damped putty pad that locks |
| Numerical method | None: approach, contact (centre-of-mass frame) and separation are evaluated in closed form. Momentum is exact at every sample    |
| Termination      | A glider reaches an end stop; otherwise 1 s after motion stops. No end-stop bounce                                               |
| Limits           | mass 0.10–2.00 kg, velocity ±1.50 m/s, e 0.05–0.95 (inelastic)                                                                   |

## Scientific Integrity

Document:

- assumptions
- coordinate system
- units
- approximations
- numerical method

Do not imply a simulation is scientifically exact when it uses simplifications.
