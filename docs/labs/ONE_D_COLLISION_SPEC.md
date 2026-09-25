# 1D Collision — Lab Specification

Status: implemented (`/lab/physics/collision-1d`). Physics · _Work, Energy and Power_ (NCERT Class 11, §6.12).

## 1. Concept

Two gliders ride a level air track: essentially no friction, so motion is one-dimensional and uniform until they meet. When they collide, they push on each other through bumpers. Equal and opposite forces act for the same time, so the **total momentum is unchanged**. Whether **kinetic energy** survives depends on the bumpers:

- a steel spring bumper returns nearly all of it (elastic)
- a soft, lossy bumper returns part of it (inelastic)
- a putty pad returns none of the relative motion: the gliders move off together (perfectly inelastic)

The lab makes the collision itself visible. It is not an instantaneous jump: the bumpers compress and recover over a few hundredths of a second. The student can watch momentum stay constant through the contact while kinetic energy dips and recovers (or does not).

## 2. Learning objectives

1. State and verify conservation of linear momentum in a 1D collision with no external horizontal force.
2. Distinguish elastic, inelastic and perfectly inelastic collisions by what happens to kinetic energy.
3. Predict final velocities for special cases: equal masses exchange velocities (elastic); heavy on light; light on heavy; bodies stick together.
4. Use the coefficient of restitution e = (v_B − v_A)/(u_A − u_B) to describe how "bouncy" a collision is.
5. Explain where "lost" kinetic energy goes, and why it is stored temporarily during an elastic contact.

## 3. Equations (SI units)

Glider A on the left, glider B on the right; +x points to the right. u are initial velocities, v final velocities.

| Quantity                 | Equation                                                              |
| ------------------------ | --------------------------------------------------------------------- |
| Momentum                 | p = m v                                                               |
| Kinetic energy           | K = ½ m v²                                                            |
| Conservation of momentum | m_A u_A + m_B u_B = m_A v_A + m_B v_B                                 |
| Restitution              | e = (v_B − v_A)/(u_A − u_B); elastic e = 1, perfectly inelastic e = 0 |
| Final velocities         | v_A = (m_A u_A + m_B u_B − m_B e (u_A − u_B))/(m_A + m_B)             |
|                          | v_B = (m_A u_A + m_B u_B + m_A e (u_A − u_B))/(m_A + m_B)             |
| Centre-of-mass velocity  | V = (m_A u_A + m_B u_B)/(m_A + m_B), unchanged by the collision       |
| Reduced mass             | μ = m_A m_B/(m_A + m_B)                                               |
| KE lost                  | ΔK = ½ μ (1 − e²)(u_A − u_B)²                                         |
| Collision condition      | They meet only if u_A > u_B (A is catching up with B)                 |

## 4. Collision (contact) model

Bumpers are modelled as a linear spring (k = 5000 N/m) with a parallel damper. In the centre-of-mass frame the compression δ obeys μδ̈ + cδ̇ + kδ = 0, with δ(0) = 0 and δ̇(0) = u_A − u_B. It is solved **in closed form**, not numerically:

- ω_n = √(k/μ); damping ratio ζ is chosen from e: ζ = −ln e / √(π² + ln² e), so that the relative velocity after contact is exactly −e (u_A − u_B)
- **0 < e ≤ 1 (underdamped):** δ = (w/ω_d) e^(−ζω_n τ) sin(ω_d τ), where ω_d = ω_n √(1 − ζ²). Contact lasts τ_c = π/ω_d
- **e = 0 (putty pad):** critically damped, δ = w τ e^(−ω_n τ). The pad latches when the relative velocity reaches zero, at τ = 1/ω_n. The dent stays (plastic deformation), and the gliders move on together at V
- Throughout contact, the centre of mass moves uniformly at V, and each glider's position follows from V and δ
- Consequences, all exact:
  - total momentum is constant at every instant
  - kinetic energy dips during contact, because energy is stored in the spring or lost in the damper
  - final velocities equal the formulas in §3
  - contact time grows with mass: heavier gliders take longer to turn around, since τ_c ∝ √μ

## 5. Numerical method

There is no numerical integration. `stateAt(vars, t)` evaluates the closed-form timeline in three phases: uniform approach → contact → uniform separation. The runtime's fixed step (1/240 s) only decides how often the state is sampled, so results do not depend on frame rate or step size. The contact start time is found analytically: t₀ = gap/(u_A − u_B).

## 6. Variables

| id            | Label                    | Unit | Range                                     | Default | Notes                      |
| ------------- | ------------------------ | ---- | ----------------------------------------- | ------- | -------------------------- |
| massA         | Mass of A                | kg   | 0.10–2.00, step 0.05                      | 0.50    |                            |
| massB         | Mass of B                | kg   | 0.10–2.00, step 0.05                      | 0.50    |                            |
| velocityA     | Initial velocity of A    | m/s  | −1.50–1.50, step 0.05                     | 1.00    | sign = direction (+ right) |
| velocityB     | Initial velocity of B    | m/s  | −1.50–1.50, step 0.05                     | 0.00    |                            |
| collisionType | Collision type           | —    | elastic / inelastic / perfectly inelastic | elastic | selects the bumper         |
| restitution   | Bounciness e (inelastic) | 1    | 0.05–0.95, step 0.05                      | 0.50    | used only for "inelastic"  |

All variables are initial conditions: changing any of them resets the run (no live variables).

## 7. Assumptions

1. Level, frictionless air track; no air drag and no external horizontal force. Momentum is exactly conserved.
2. The gliders are rigid bodies. Only the bumper deforms, as a linear spring and damper (k = 5000 N/m).
3. Motion is purely along the track (1D); rotation and vibration are ignored.
4. Perfectly inelastic: a putty pad deforms permanently and locks the gliders together once they move at the same velocity.
5. The run ends when a glider reaches an end stop. End-stop bounces are not modelled.
6. Starting positions are fixed (A at 0.90 m, B at 2.10 m; gliders 0.30 m long including 35 mm bumpers) so trials are comparable. Position never changes the outcome.
7. Bumper compression is drawn at true scale (a few millimetres to centimetres).

## 8. Environment — "Air-track bench" (distinct from the Projectile range and the Optics darkroom)

- Light, cool physics-lab room; a matte bench top; no ground grid or orientation gizmo
- A 3 m aluminium air track, with its rows of air holes drawn as **one instanced mesh**
- A metre ruler along the track (cm ticks, labels every 0.5 m); end stops; a +x axis arrow at the left end
- Camera: side-on and slightly raised, the natural view for 1D motion; the track fills the gap between the panels

## 9. Objects and interactions

| Object                  | Look                                                                               | Interaction                                                      |
| ----------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Glider A                | blue glider, labelled with its mass; brass mass discs whose number grows with mass | select (explanation); **drag its velocity arrow tip** to set u_A |
| Glider B                | orange glider                                                                      | select; drag its velocity arrow tip to set u_B                   |
| Bumpers                 | spring coil (elastic), soft block (inelastic) or putty pad, depending on the type  | compress visibly during contact                                  |
| Track                   | air track with ruler                                                               | select (explanation)                                             |
| Momentum & energy board | bars for p_A, p_B, Σp and K_A, K_B, ΣK, with "before" outlines                     | read-only                                                        |

Dragging is enabled only while the lab is ready (not running), like the Projectile launcher.

## 10. Measurements

Primary:

- velocity of A (m/s)
- velocity of B (m/s)
- total momentum (kg·m/s)

Detail:

- momentum of A and of B
- kinetic energy of A and of B, and total kinetic energy (J)
- total momentum before and total kinetic energy before
- change in total KE (J)
- KE after ÷ KE before
- contact time (s)
- time (s)
- stage: ready / approaching / in contact / after the collision / no collision

The values are live throughout the run. At the end they are the final values, which is what a recorded trial stores.

## 11. Overlays

- velocity arrows (1 m of arrow = 2 m/s)
- momentum arrows (1 m of arrow = 2 kg·m/s)
- momentum & energy board
- live value labels on the gliders
- collision marker: the point and time of first contact

## 12. Experiments (investigations)

1. Equal masses, elastic, B at rest: A stops and B leaves with A's velocity.
2. Change the mass of B (heavy target vs light target): does A bounce back?
3. Change the initial velocity of A: the final velocities scale in proportion.
4. Elastic vs inelastic vs perfectly inelastic at the same initial conditions: momentum is the same, kinetic energy is not.
5. Momentum conservation: head-on with opposite velocities; the total momentum can be zero before and after.
6. Kinetic energy: watch ΣK dip during an elastic contact and recover.

Presets:

- equal masses
- heavy target
- light target
- head-on
- sticky (perfectly inelastic)
- bouncy vs soft (inelastic with e = 0.5)
- chase (both moving right)

## 13. Expected observations (default and presets)

| Case                                    | Result                                                    |
| --------------------------------------- | --------------------------------------------------------- |
| Default: 0.5/0.5 kg, 1.0/0 m/s, elastic | v_A = 0, v_B = 1.00 m/s; Σp = 0.50 kg·m/s; K stays 0.25 J |
| Sticky, same masses                     | v = 0.50 m/s for both; K 0.25 → 0.125 J (half lost)       |
| Heavy target (B 2 kg), elastic          | v_A = −0.60 m/s, v_B = +0.40 m/s                          |
| Head-on 0.5 kg, ±1 m/s, elastic         | velocities exchange: −1 and +1; Σp = 0 throughout         |

## 14. Edge cases

| Case                                                      | Behaviour                                                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| u_A ≤ u_B                                                 | Never meet. Stage "No collision"; the run ends when a glider reaches an end stop, or after 1 s if nothing moves |
| Both at rest                                              | Completes after 1 s with everything at 0                                                                        |
| A glider reaches an end stop before contact               | Run ends; stage "No collision"                                                                                  |
| Perfectly inelastic with Σp = 0                           | Both stop after the collision; the run ends 1 s later                                                           |
| Invalid input (mass ≤ 0, NaN, out of range, unknown type) | Rejected by variable validation; the run is untouched                                                           |
| Floating-point residue                                    | Values below 1e-9 are shown as 0                                                                                |
| Dragging a velocity arrow                                 | Snaps to 0.05 m/s and clamps to ±1.50 m/s, the same as the slider; only before a run                            |

## 15. Platform changes

None required. The lab uses the existing SDK:

- continuous model, choice variables
- `usePlaneDrag`, `useSelectable`, `VectorArrow`, `useOverlayVisible`, `useRuntimeStatus`
- light `sceneTone`, the `kg·m/s` and `J` units

The physics service `src/domains/physics/mechanics/collision1d.ts` is new.

## 16. Performance

- About 45 draw calls while running (budget < 150), at 60 fps: the 194 air holes are one instanced mesh, ruler ticks are one `lineSegments`, and bar meshes are updated through refs
- Demand frame loop; no React renders per frame (labels update through DOM refs)
- On canvases narrower than 640 px (phones), scene text shrinks to the glider letters and the board's p/K headings; the bars stay, and the numbers are in the Results tab

## 17. Tests

- **Domain:** momentum conservation for all e, elastic energy conservation, perfectly inelastic common velocity, ΔK formula, special cases (equal masses, heavy/light), restitution recovery, invalid input
- **Model:**
  - closed-form timeline: momentum constant at every sample, including during contact
  - contact time π/ω_d and 1/ω_n
  - no collision when u_A ≤ u_B
  - zero velocities; opposite directions; unequal masses
  - end-stop completion
  - reset behaviour
  - frame-rate independence
- **E2E:** desktop journey (open from the Physics Lab → run → v_A = 0.00, v_B = 1.00 → sticky preset → record → compare) and a phone run; no console errors
