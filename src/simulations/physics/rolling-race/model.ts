/**
 * Rolling Race — scientific model.
 *
 * Three bodies start from rest on the same line and roll without slipping
 * down the same incline. Each moves with constant acceleration
 * a = g sin θ / (1 + k), so its motion is evaluated in closed form: there is
 * no numerical integration, and results do not depend on frame rate.
 * See docs/labs/ROLLING_RACE_SPEC.md.
 */
import {
  angularVelocityOf,
  degreesToRadians,
  momentOfInertia,
  rollingAcceleration,
  rollingTime,
  rotationalKineticEnergy,
  translationalKineticEnergy,
  type RollingShape,
} from '@/domains/physics'

export const LANES = [1, 2, 3] as const
export type Lane = (typeof LANES)[number]

/** Length of the inclined board along the slope (m). */
export const RAMP_LENGTH = 3
/** The finish line, measured along the slope from the top of the board (m). */
export const FINISH_AT = 2.75
/** Static friction of the rubber-coated lanes. Above every μ_min in the allowed range. */
export const LANE_FRICTION = 0.8

export interface RollingRaceVariables {
  readonly angle: number
  readonly distance: number
  readonly gravity: number
  readonly shape1: RollingShape
  readonly shape2: RollingShape
  readonly shape3: RollingShape
  readonly mass1: number
  readonly mass2: number
  readonly mass3: number
  /** mm */
  readonly radius1: number
  readonly radius2: number
  readonly radius3: number
}

export interface Racer {
  readonly shape: RollingShape
  readonly mass: number
  /** m */
  readonly radius: number
}

export function racer(vars: RollingRaceVariables, lane: Lane): Racer {
  switch (lane) {
    case 1:
      return { shape: vars.shape1, mass: vars.mass1, radius: vars.radius1 / 1000 }
    case 2:
      return { shape: vars.shape2, mass: vars.mass2, radius: vars.radius2 / 1000 }
    case 3:
      return { shape: vars.shape3, mass: vars.mass3, radius: vars.radius3 / 1000 }
  }
}

export interface LaneState {
  /** Distance rolled from the start line (m). */
  readonly s: number
  /** Speed of the centre of mass (m/s). */
  readonly v: number
  /** Time on this lane's clock: stops at the finish (s). */
  readonly time: number
  readonly finished: boolean
}

export interface RollingRaceState {
  readonly t: number
  readonly lanes: readonly [LaneState, LaneState, LaneState]
}

export const angleOf = (vars: RollingRaceVariables): number => degreesToRadians(vars.angle)

export const accelerationOf = (vars: RollingRaceVariables, lane: Lane): number =>
  rollingAcceleration(racer(vars, lane).shape, angleOf(vars), vars.gravity)

export const finishTimeOf = (vars: RollingRaceVariables, lane: Lane): number =>
  rollingTime(racer(vars, lane).shape, vars.distance, angleOf(vars), vars.gravity)

function laneAt(vars: RollingRaceVariables, lane: Lane, t: number): LaneState {
  const a = accelerationOf(vars, lane)
  const finish = finishTimeOf(vars, lane)
  const time = Math.min(t, finish)
  const finished = t >= finish
  // At the finish, use the exact distance rather than ½at² (which rounds).
  return { s: finished ? vars.distance : 0.5 * a * time * time, v: a * time, time, finished }
}

/** The race at time `t`, in closed form. */
export function stateAt(vars: RollingRaceVariables, t: number): RollingRaceState {
  const time = Math.max(t, 0)
  return { t: time, lanes: [laneAt(vars, 1, time), laneAt(vars, 2, time), laneAt(vars, 3, time)] }
}

export const createInitialState = (vars: RollingRaceVariables): RollingRaceState => stateAt(vars, 0)

export function step(state: RollingRaceState, dt: number, vars: RollingRaceVariables): RollingRaceState {
  return stateAt(vars, state.t + dt)
}

export function laneState(state: RollingRaceState, lane: Lane): LaneState {
  const [one, two, three] = state.lanes
  return lane === 1 ? one : lane === 2 ? two : three
}

export const isRaceOver = (state: RollingRaceState): boolean => state.lanes.every((lane) => lane.finished)

export type Winner = 'ready' | 'racing' | 'lane1' | 'lane2' | 'lane3' | 'tie'

/** The first lane across the line; a tie if the fastest times are equal to 1 µs. */
export function winnerOf(state: RollingRaceState, vars: RollingRaceVariables): Winner {
  if (state.t === 0) return 'ready'
  if (!state.lanes.some((lane) => lane.finished)) return 'racing'
  const times = LANES.map((lane) => finishTimeOf(vars, lane))
  const best = Math.min(...times)
  const leaders = LANES.filter((_, i) => (times[i] ?? Number.POSITIVE_INFINITY) - best < 1e-6)
  if (leaders.length > 1) return 'tie'
  return `lane${leaders[0] ?? 1}`
}

export interface LaneReading {
  readonly distance: number
  readonly speed: number
  readonly acceleration: number
  readonly angularVelocity: number
  readonly translationalEnergy: number
  readonly rotationalEnergy: number
  /** Measured from the height of the finish line (J). */
  readonly potentialEnergy: number
  readonly momentOfInertia: number
}

export function readLane(state: RollingRaceState, vars: RollingRaceVariables, lane: Lane): LaneReading {
  const body = racer(vars, lane)
  // After the line, readings stay frozen at the moment of crossing (like a photogate).
  const { s, v } = laneState(state, lane)
  const omega = angularVelocityOf(v, body.radius)
  return {
    distance: s,
    speed: v,
    acceleration: accelerationOf(vars, lane),
    angularVelocity: omega,
    translationalEnergy: translationalKineticEnergy(body.mass, v),
    rotationalEnergy: rotationalKineticEnergy(body.shape, body.mass, body.radius, omega),
    potentialEnergy: body.mass * vars.gravity * (vars.distance - s) * Math.sin(angleOf(vars)),
    momentOfInertia: momentOfInertia(body.shape, body.mass, body.radius),
  }
}
