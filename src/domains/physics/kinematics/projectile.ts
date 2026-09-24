/**
 * Ideal projectile motion (no air resistance) — closed-form solutions.
 *
 * Coordinate system: x horizontal (downrange), y vertical (up), origin on the
 * ground directly below the launch point. Uniform gravity of magnitude g acts
 * in −y. SI units throughout.
 *
 *   x(t) = vx₀·t                 vx(t) = vx₀
 *   y(t) = h + vy₀·t − ½·g·t²    vy(t) = vy₀ − g·t
 *   vx₀ = v₀·cos θ               vy₀ = v₀·sin θ
 */

export interface PlanarVector {
  readonly x: number
  readonly y: number
}

export interface LaunchConditions {
  /** Launch speed v₀ (m/s), ≥ 0. */
  readonly speed: number
  /** Launch angle θ above the horizontal (rad). */
  readonly angle: number
  /** Launch height h above the ground (m), ≥ 0. */
  readonly height: number
  /** Magnitude of gravitational acceleration g (m/s²), > 0. */
  readonly gravity: number
}

/** Throws `RangeError` for physically meaningless launch conditions. */
export function assertValidLaunch(c: LaunchConditions): void {
  const { speed, angle, height, gravity } = c
  if (![speed, angle, height, gravity].every(Number.isFinite))
    throw new RangeError('Launch values must be finite.')
  if (speed < 0) throw new RangeError('Launch speed must not be negative.')
  if (height < 0) throw new RangeError('Launch height must not be negative.')
  if (gravity <= 0) throw new RangeError('Gravity must be positive for the projectile to land.')
}

export function launchVelocity(speed: number, angle: number): PlanarVector {
  return { x: speed * Math.cos(angle), y: speed * Math.sin(angle) }
}

export function positionAt(c: LaunchConditions, t: number): PlanarVector {
  const v0 = launchVelocity(c.speed, c.angle)
  return { x: v0.x * t, y: c.height + v0.y * t - 0.5 * c.gravity * t * t }
}

export function velocityAt(c: LaunchConditions, t: number): PlanarVector {
  const v0 = launchVelocity(c.speed, c.angle)
  return { x: v0.x, y: v0.y - c.gravity * t }
}

/**
 * Time until the projectile returns to y = 0: the positive root of
 * h + vy₀·t − ½·g·t² = 0, i.e. t = (vy₀ + √(vy₀² + 2gh)) / g.
 */
export function flightTime(c: LaunchConditions): number {
  assertValidLaunch(c)
  const vy = launchVelocity(c.speed, c.angle).y
  return (vy + Math.sqrt(vy * vy + 2 * c.gravity * c.height)) / c.gravity
}

/** Highest point above the ground: h + vy₀²/(2g) when launched upward, else h. */
export function maxHeight(c: LaunchConditions): number {
  assertValidLaunch(c)
  const vy = Math.max(launchVelocity(c.speed, c.angle).y, 0)
  return c.height + (vy * vy) / (2 * c.gravity)
}

/** Horizontal distance travelled before landing. */
export function range(c: LaunchConditions): number {
  return launchVelocity(c.speed, c.angle).x * flightTime(c)
}

/** Speed at impact, from conservation of mechanical energy: √(v₀² + 2gh). */
export function impactSpeed(c: LaunchConditions): number {
  assertValidLaunch(c)
  return Math.sqrt(c.speed * c.speed + 2 * c.gravity * c.height)
}

/** Mechanical energy per unit mass, g·y + ½|v|² (J/kg). Conserved without drag. */
export function specificMechanicalEnergy(
  position: PlanarVector,
  velocity: PlanarVector,
  gravity: number,
): number {
  return gravity * position.y + 0.5 * (velocity.x * velocity.x + velocity.y * velocity.y)
}
