/**
 * Projectile Motion — scientific model.
 *
 * Without air resistance the state is evaluated from the closed-form solution
 * at each step (exact, including the landing instant). With air resistance the
 * equations of motion are integrated with RK4 and the landing point is found
 * by linear interpolation within the final step.
 */
import {
  degreesToRadians,
  dragConstant,
  flightTime,
  launchVelocity,
  maxHeight,
  positionAt,
  projectileWithDrag,
  SEA_LEVEL_AIR_DENSITY,
  SMOOTH_SPHERE_DRAG_COEFFICIENT,
  velocityAt,
  type LaunchConditions,
} from '@/domains/physics'
import { rk4Step } from '@/lib/numerics/rk4'

/** Physical ball diameter used for air resistance (m). Similar to a size-5 football. */
export const BALL_DIAMETER = 0.22

export interface ProjectileVariables {
  readonly launchSpeed: number
  readonly launchAngle: number
  readonly launchHeight: number
  readonly gravity: number
  readonly airResistance: boolean
  readonly mass: number
}

export interface ProjectileState {
  /** Time since launch (s). */
  readonly t: number
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  /** Highest y reached so far (m). */
  readonly peak: number
  readonly landed: boolean
}

export const launchConditions = (vars: ProjectileVariables): LaunchConditions => ({
  speed: vars.launchSpeed,
  angle: degreesToRadians(vars.launchAngle),
  height: vars.launchHeight,
  gravity: vars.gravity,
})

export const dragConstantFor = (vars: ProjectileVariables): number =>
  dragConstant({
    mass: vars.mass,
    diameter: BALL_DIAMETER,
    dragCoefficient: SMOOTH_SPHERE_DRAG_COEFFICIENT,
    fluidDensity: SEA_LEVEL_AIR_DENSITY,
  })

export function createInitialState(vars: ProjectileVariables): ProjectileState {
  const v0 = launchVelocity(vars.launchSpeed, degreesToRadians(vars.launchAngle))
  return { t: 0, x: 0, y: vars.launchHeight, vx: v0.x, vy: v0.y, peak: vars.launchHeight, landed: false }
}

function stepIdeal(state: ProjectileState, dt: number, vars: ProjectileVariables): ProjectileState {
  const c = launchConditions(vars)
  const landingTime = flightTime(c)
  const t = Math.min(state.t + dt, landingTime)
  const landed = t >= landingTime
  const position = positionAt(c, t)
  const velocity = velocityAt(c, t)
  // Include the analytic apex if it occurred within this step, so the peak is exact.
  const apexTime = launchVelocity(c.speed, c.angle).y / c.gravity
  const apexInStep = apexTime > state.t && apexTime <= t
  return {
    t,
    x: position.x,
    y: landed ? 0 : position.y,
    vx: velocity.x,
    vy: velocity.y,
    peak: apexInStep ? maxHeight(c) : Math.max(state.peak, position.y),
    landed,
  }
}

function stepWithDrag(state: ProjectileState, dt: number, vars: ProjectileVariables): ProjectileState {
  const f = projectileWithDrag(vars.gravity, dragConstantFor(vars))
  const [x = 0, y = 0, vx = 0, vy = 0] = rk4Step(f, state.t, [state.x, state.y, state.vx, state.vy], dt)

  if (y >= 0) return { t: state.t + dt, x, y, vx, vy, peak: Math.max(state.peak, y), landed: false }

  // Crossed the ground during this step: interpolate to y = 0.
  const s = state.y / (state.y - y)
  const lerp = (a: number, b: number) => a + (b - a) * s
  return {
    t: state.t + s * dt,
    x: lerp(state.x, x),
    y: 0,
    vx: lerp(state.vx, vx),
    vy: lerp(state.vy, vy),
    peak: state.peak,
    landed: true,
  }
}

export function step(state: ProjectileState, dt: number, vars: ProjectileVariables): ProjectileState {
  if (state.landed) return state
  return vars.airResistance ? stepWithDrag(state, dt, vars) : stepIdeal(state, dt, vars)
}

/** Total acceleration (m/s²): gravity plus, if enabled, drag. */
export function accelerationOf(state: ProjectileState, vars: ProjectileVariables): { x: number; y: number } {
  if (!vars.airResistance) return { x: 0, y: -vars.gravity }
  const k = dragConstantFor(vars)
  const speed = Math.hypot(state.vx, state.vy)
  return { x: -k * speed * state.vx, y: -k * speed * state.vy - vars.gravity }
}
