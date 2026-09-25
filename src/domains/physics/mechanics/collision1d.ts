/**
 * One-dimensional two-body collisions.
 *
 * Bodies A and B move along one axis (+x to the right), with A on the left.
 * Velocities are signed. All quantities are SI: kg, m/s, kg·m/s, J, s.
 *
 * The impulse relations (final velocities from the coefficient of
 * restitution) hold for any contact that has no external impulse. The contact
 * functions below describe *how* the bumpers get there: a linear spring with a
 * parallel damper, solved in closed form in the centre-of-mass frame.
 */

export interface CollisionBodies {
  /** Mass of A (kg), > 0. */
  readonly massA: number
  /** Mass of B (kg), > 0. */
  readonly massB: number
  /** Initial velocity of A (m/s). */
  readonly velocityA: number
  /** Initial velocity of B (m/s). */
  readonly velocityB: number
}

export function assertValidCollision(bodies: CollisionBodies, restitution: number): void {
  const { massA, massB, velocityA, velocityB } = bodies
  if (!(Number.isFinite(massA) && massA > 0)) throw new RangeError('massA must be a positive finite number.')
  if (!(Number.isFinite(massB) && massB > 0)) throw new RangeError('massB must be a positive finite number.')
  if (!Number.isFinite(velocityA) || !Number.isFinite(velocityB)) {
    throw new RangeError('Velocities must be finite numbers.')
  }
  if (!(Number.isFinite(restitution) && restitution >= 0 && restitution <= 1)) {
    throw new RangeError('The coefficient of restitution must be between 0 and 1.')
  }
}

export const momentum = (mass: number, velocity: number): number => mass * velocity

export const kineticEnergy = (mass: number, velocity: number): number => 0.5 * mass * velocity * velocity

export const totalMomentum = ({ massA, massB, velocityA, velocityB }: CollisionBodies): number =>
  massA * velocityA + massB * velocityB

export const totalKineticEnergy = ({ massA, massB, velocityA, velocityB }: CollisionBodies): number =>
  kineticEnergy(massA, velocityA) + kineticEnergy(massB, velocityB)

/** μ = m_A m_B / (m_A + m_B): the effective mass of the relative motion (kg). */
export const reducedMass = (massA: number, massB: number): number => (massA * massB) / (massA + massB)

/** V = Σp / Σm: unchanged by any collision without external force (m/s). */
export const centreOfMassVelocity = (bodies: CollisionBodies): number =>
  totalMomentum(bodies) / (bodies.massA + bodies.massB)

/** Closing speed u_A − u_B. The bodies can only meet if it is positive. */
export const approachSpeed = ({ velocityA, velocityB }: CollisionBodies): number => velocityA - velocityB

export const willCollide = (bodies: CollisionBodies): boolean => approachSpeed(bodies) > 0

/**
 * Final velocities after a collision with coefficient of restitution e:
 * v_A = (Σp − m_B e (u_A − u_B)) / Σm,  v_B = (Σp + m_A e (u_A − u_B)) / Σm.
 * Conserves momentum for every e; conserves kinetic energy only for e = 1.
 */
export function finalVelocities(
  bodies: CollisionBodies,
  restitution: number,
): { velocityA: number; velocityB: number } {
  assertValidCollision(bodies, restitution)
  const { massA, massB } = bodies
  const total = massA + massB
  const p = totalMomentum(bodies)
  const w = approachSpeed(bodies)
  return {
    velocityA: (p - massB * restitution * w) / total,
    velocityB: (p + massA * restitution * w) / total,
  }
}

/** ΔK = ½ μ (1 − e²)(u_A − u_B)²: kinetic energy converted to other forms (J). */
export function kineticEnergyLoss(bodies: CollisionBodies, restitution: number): number {
  assertValidCollision(bodies, restitution)
  const w = approachSpeed(bodies)
  return 0.5 * reducedMass(bodies.massA, bodies.massB) * (1 - restitution * restitution) * w * w
}

/** e = (v_B − v_A) / (u_A − u_B), from measured velocities. */
export function restitutionFrom(initial: CollisionBodies, finalA: number, finalB: number): number {
  const w = approachSpeed(initial)
  if (w === 0) throw new RangeError('The bodies do not approach each other, so e is undefined.')
  return (finalB - finalA) / w
}

/** Damping ratio ζ of a spring–damper contact whose rebound gives restitution e (0 < e ≤ 1). */
export function dampingRatioFor(restitution: number): number {
  if (!(restitution > 0 && restitution <= 1)) throw new RangeError('Restitution must be in (0, 1].')
  const l = Math.log(restitution)
  // ln e ≤ 0; abs() also avoids returning -0 for e = 1.
  return Math.abs(l) / Math.sqrt(Math.PI * Math.PI + l * l)
}

/**
 * A bumper contact: linear spring k with a damper tuned to give restitution e.
 * For e > 0 the contact is underdamped and ends when the compression returns
 * to zero. For e = 0 it is critically damped and the (putty) pad locks when
 * the relative velocity reaches zero, leaving a permanent dent.
 */
export interface BumperContact {
  readonly restitution: number
  readonly naturalFrequency: number
  readonly dampingRatio: number
  /** Contact duration (s): π/ω_d for e > 0, 1/ω_n for e = 0. */
  readonly duration: number
  /** Closing speed at first contact (m/s), > 0. */
  readonly approachSpeed: number
}

export function bumperContact(
  massA: number,
  massB: number,
  stiffness: number,
  restitution: number,
  closingSpeed: number,
): BumperContact {
  if (!(Number.isFinite(stiffness) && stiffness > 0)) throw new RangeError('Stiffness must be positive.')
  if (!(closingSpeed > 0)) throw new RangeError('A contact needs a positive closing speed.')
  const naturalFrequency = Math.sqrt(stiffness / reducedMass(massA, massB))
  if (restitution === 0) {
    return {
      restitution,
      naturalFrequency,
      dampingRatio: 1,
      duration: 1 / naturalFrequency,
      approachSpeed: closingSpeed,
    }
  }
  const dampingRatio = dampingRatioFor(restitution)
  const damped = naturalFrequency * Math.sqrt(1 - dampingRatio * dampingRatio)
  return {
    restitution,
    naturalFrequency,
    dampingRatio,
    duration: Math.PI / damped,
    approachSpeed: closingSpeed,
  }
}

/**
 * Bumper compression δ (m) and its rate dδ/dt (m/s) at time τ into the contact
 * (0 ≤ τ ≤ duration). Positive rate means the bodies are still closing.
 */
export function contactCompression(
  contact: BumperContact,
  tau: number,
): { compression: number; rate: number } {
  const t = Math.min(Math.max(tau, 0), contact.duration)
  const w = contact.approachSpeed
  const wn = contact.naturalFrequency
  if (contact.restitution === 0) {
    const decay = Math.exp(-wn * t)
    return { compression: w * t * decay, rate: w * decay * (1 - wn * t) }
  }
  const zeta = contact.dampingRatio
  const wd = wn * Math.sqrt(1 - zeta * zeta)
  const decay = Math.exp(-zeta * wn * t)
  const s = Math.sin(wd * t)
  const c = Math.cos(wd * t)
  return {
    compression: (w / wd) * decay * s,
    rate: w * decay * (c - ((zeta * wn) / wd) * s),
  }
}
