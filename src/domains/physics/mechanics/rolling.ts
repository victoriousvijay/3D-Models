/**
 * Rolling without slipping down an incline.
 *
 * Every body considered has I = k·m·r², with the dimensionless shape factor k
 * fixed by how its mass is distributed about the axle. Mass and radius cancel
 * from the motion: only k, the angle and g decide how fast a body rolls.
 * SI units throughout (kg, m, s, rad, J).
 */

export type RollingShape = 'solid-sphere' | 'solid-cylinder' | 'hollow-sphere' | 'ring'

/** k = I / (m r²) about the rolling axis through the centre of mass. */
export const SHAPE_FACTOR: Readonly<Record<RollingShape, number>> = {
  'solid-sphere': 2 / 5,
  'solid-cylinder': 1 / 2,
  'hollow-sphere': 2 / 3,
  /** Thin ring or thin-walled hollow cylinder: all the mass at the rim. */
  ring: 1,
}

export function assertValidRolling(mass: number, radius: number, angle: number, gravity: number): void {
  if (!(Number.isFinite(mass) && mass > 0)) throw new RangeError('Mass must be a positive finite number.')
  if (!(Number.isFinite(radius) && radius > 0))
    throw new RangeError('Radius must be a positive finite number.')
  if (!(Number.isFinite(angle) && angle > 0 && angle < Math.PI / 2)) {
    throw new RangeError('The incline angle must be between 0 and 90°.')
  }
  if (!(Number.isFinite(gravity) && gravity > 0)) throw new RangeError('Gravity must be positive.')
}

/** I = k m r² (kg·m²). */
export function momentOfInertia(shape: RollingShape, mass: number, radius: number): number {
  return SHAPE_FACTOR[shape] * mass * radius * radius
}

/** a = g sin θ / (1 + k): acceleration of the centre of mass along the slope (m/s²). `angle` in radians. */
export function rollingAcceleration(shape: RollingShape, angle: number, gravity: number): number {
  return (gravity * Math.sin(angle)) / (1 + SHAPE_FACTOR[shape])
}

/** Time to roll a distance L from rest: t = √(2L/a) (s). */
export function rollingTime(shape: RollingShape, distance: number, angle: number, gravity: number): number {
  if (!(Number.isFinite(distance) && distance >= 0)) throw new RangeError('Distance must be ≥ 0.')
  return Math.sqrt((2 * distance) / rollingAcceleration(shape, angle, gravity))
}

/** Speed after dropping a height h from rest: v = √(2gh / (1 + k)) (m/s). */
export function rollingSpeedAfterDrop(shape: RollingShape, height: number, gravity: number): number {
  return Math.sqrt((2 * gravity * height) / (1 + SHAPE_FACTOR[shape]))
}

/** Rolling condition: ω = v / r (rad/s). */
export const angularVelocityOf = (speed: number, radius: number): number => speed / radius

export const translationalKineticEnergy = (mass: number, speed: number): number => 0.5 * mass * speed * speed

/** ½ I ω², which for rolling equals k · ½ m v². */
export function rotationalKineticEnergy(
  shape: RollingShape,
  mass: number,
  radius: number,
  angularVelocity: number,
): number {
  return 0.5 * momentOfInertia(shape, mass, radius) * angularVelocity * angularVelocity
}

/** Share of the kinetic energy that is rotational: k / (1 + k). */
export const rotationalShare = (shape: RollingShape): number =>
  SHAPE_FACTOR[shape] / (1 + SHAPE_FACTOR[shape])

/** Minimum coefficient of static friction for rolling without slipping: μ = k tan θ / (1 + k). */
export const frictionNeededToRoll = (shape: RollingShape, angle: number): number =>
  (SHAPE_FACTOR[shape] * Math.tan(angle)) / (1 + SHAPE_FACTOR[shape])
