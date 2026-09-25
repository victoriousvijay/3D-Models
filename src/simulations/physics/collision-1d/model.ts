/**
 * 1D Collision — scientific model.
 *
 * Two gliders on a frictionless air track. Motion is evaluated in closed form
 * in three phases: uniform approach, bumper contact (a spring–damper solved
 * exactly in the centre-of-mass frame) and uniform separation. There is no
 * numerical integration, so every sample — including those during the
 * contact — conserves momentum to rounding error, independent of step size.
 *
 * Positions are glider centres along the track (m, from the left end stop).
 * See docs/labs/ONE_D_COLLISION_SPEC.md.
 */
import {
  bumperContact,
  contactCompression,
  finalVelocities,
  willCollide,
  type BumperContact,
  type CollisionBodies,
} from '@/domains/physics'

export const TRACK_LENGTH = 3
/** Glider length including both bumpers (m): centres are this far apart at first contact. */
export const GLIDER_LENGTH = 0.3
/** Uncompressed bumper length on each glider's facing side (m). */
export const BUMPER_LENGTH = 0.035
export const START_A = 0.9
export const START_B = 2.1
/** Bumper spring stiffness (N/m). */
export const BUMPER_STIFFNESS = 5000
/** How long a run continues once nothing will reach an end stop (s). */
export const REST_TIME = 1

const MIN_CENTRE = GLIDER_LENGTH / 2
const MAX_CENTRE = TRACK_LENGTH - GLIDER_LENGTH / 2

export type CollisionType = 'elastic' | 'inelastic' | 'perfectly-inelastic'

export interface CollisionVariables {
  readonly massA: number
  readonly massB: number
  readonly velocityA: number
  readonly velocityB: number
  readonly collisionType: CollisionType
  readonly restitution: number
}

export type CollisionStage = 'ready' | 'before' | 'contact' | 'after' | 'missed'

export interface CollisionState {
  /** Time since the start (s). */
  readonly t: number
  readonly xA: number
  readonly xB: number
  readonly vA: number
  readonly vB: number
  /** Total bumper compression (m); a putty pad keeps its dent after the contact. */
  readonly compression: number
  /** Time spent in contact so far (s). */
  readonly contactTime: number
  readonly stage: CollisionStage
  readonly finished: boolean
}

/** The coefficient of restitution the chosen bumpers give. */
export function restitutionOf(vars: CollisionVariables): number {
  switch (vars.collisionType) {
    case 'elastic':
      return 1
    case 'inelastic':
      return vars.restitution
    case 'perfectly-inelastic':
      return 0
  }
}

export const bodiesOf = (vars: CollisionVariables): CollisionBodies => ({
  massA: vars.massA,
  massB: vars.massB,
  velocityA: vars.velocityA,
  velocityB: vars.velocityB,
})

/** Time for a glider starting at `x` with velocity `v` to reach an end stop, if it moves towards one. */
function timeToEnd(body: 'A' | 'B', x: number, v: number): number {
  // A can only reach the left stop and B the right one: the other way is blocked
  // by the other glider (a collision) or the other glider reaches its stop first.
  if (body === 'A') return v < 0 ? (x - MIN_CENTRE) / -v : Number.POSITIVE_INFINITY
  return v > 0 ? (MAX_CENTRE - x) / v : Number.POSITIVE_INFINITY
}

interface Collision {
  readonly start: number
  readonly contact: BumperContact
  readonly end: number
  /** Positions and velocities when the contact ends. */
  readonly xA: number
  readonly xB: number
  readonly vA: number
  readonly vB: number
  /** Permanent dent left by a putty pad (m), 0 otherwise. */
  readonly dent: number
}

/** The whole run, derived once from the initial conditions. */
export interface CollisionTimeline {
  readonly collision: Collision | null
  /** When the run ends (s): a glider reaches an end stop, or everything has come to rest. */
  readonly endTime: number
  readonly centreOfMassVelocity: number
}

export function buildTimeline(vars: CollisionVariables): CollisionTimeline {
  const { massA, massB, velocityA: uA, velocityB: uB } = vars
  const total = massA + massB
  const V = (massA * uA + massB * uB) / total
  const bodies = bodiesOf(vars)
  const reachesEnd = Math.min(timeToEnd('A', START_A, uA), timeToEnd('B', START_B, uB))
  const gap = START_B - START_A - GLIDER_LENGTH
  const start = willCollide(bodies) ? gap / (uA - uB) : Number.POSITIVE_INFINITY

  if (!(start < reachesEnd)) {
    const endTime = Number.isFinite(reachesEnd) ? reachesEnd : REST_TIME
    return { collision: null, endTime, centreOfMassVelocity: V }
  }

  const e = restitutionOf(vars)
  const contact = bumperContact(massA, massB, BUMPER_STIFFNESS, e, uA - uB)
  const end = start + contact.duration
  const dent = e === 0 ? contactCompression(contact, contact.duration).compression : 0
  const separation = GLIDER_LENGTH - dent
  const centre = (massA * START_A + massB * START_B) / total + V * end
  const final = finalVelocities(bodies, e)
  const collision: Collision = {
    start,
    contact,
    end,
    xA: centre - (massB / total) * separation,
    xB: centre + (massA / total) * separation,
    vA: final.velocityA,
    vB: final.velocityB,
    dent,
  }
  const afterwards = Math.min(
    timeToEnd('A', collision.xA, collision.vA),
    timeToEnd('B', collision.xB, collision.vB),
  )
  const endTime = end + (Number.isFinite(afterwards) ? afterwards : REST_TIME)
  return { collision, endTime, centreOfMassVelocity: V }
}

/** Values smaller than this are floating-point residue and reported as exactly zero. */
export const clean = (x: number): number => (Math.abs(x) < 1e-9 ? 0 : x)

/** The state at time `t`, evaluated in closed form. */
export function stateAt(vars: CollisionVariables, t: number, timeline = buildTimeline(vars)): CollisionState {
  const time = Math.min(Math.max(t, 0), timeline.endTime)
  const finished = time >= timeline.endTime
  const { collision } = timeline
  const { massA, massB, velocityA: uA, velocityB: uB } = vars
  const state = (
    xA: number,
    xB: number,
    vA: number,
    vB: number,
    compression: number,
    contactTime: number,
    stage: CollisionStage,
  ): CollisionState => ({
    t: time,
    xA,
    xB,
    vA: clean(vA),
    vB: clean(vB),
    compression,
    contactTime,
    stage,
    finished,
  })

  if (!collision || time < collision.start) {
    const stage: CollisionStage = time === 0 ? 'ready' : !collision && finished ? 'missed' : 'before'
    return state(START_A + uA * time, START_B + uB * time, uA, uB, 0, 0, stage)
  }

  if (time < collision.end) {
    const total = massA + massB
    const tau = time - collision.start
    const { compression, rate } = contactCompression(collision.contact, tau)
    const centre = (massA * START_A + massB * START_B) / total + timeline.centreOfMassVelocity * time
    const separation = GLIDER_LENGTH - compression
    const V = timeline.centreOfMassVelocity
    return state(
      centre - (massB / total) * separation,
      centre + (massA / total) * separation,
      V + (massB / total) * rate,
      V - (massA / total) * rate,
      compression,
      tau,
      'contact',
    )
  }

  const since = time - collision.end
  return state(
    collision.xA + collision.vA * since,
    collision.xB + collision.vB * since,
    collision.vA,
    collision.vB,
    collision.dent,
    collision.contact.duration,
    'after',
  )
}

export const createInitialState = (vars: CollisionVariables): CollisionState => stateAt(vars, 0)

export function step(state: CollisionState, dt: number, vars: CollisionVariables): CollisionState {
  if (state.finished) return state
  return stateAt(vars, state.t + dt)
}
