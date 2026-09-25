/**
 * Double Slit (YDSE) — scientific model.
 *
 * The interference pattern is the steady state computed by the physics
 * domain's optics service. The only thing that evolves is the light itself:
 * after "Start" it travels (in extreme slow motion) from the laser to the
 * slits and on to the screen, and the pattern forms once it arrives.
 */
import {
  angularFringeWidth,
  brightFringesWithin,
  classifyFringe,
  fringeOrder,
  fringeVisibility,
  fringeWidth,
  intensityAt,
  maxIntensity,
  minIntensity,
  pathDifference,
  phaseDifference,
  wavelengthInMedium,
  type DoubleSlitSetup,
} from '@/domains/physics'
import { PATTERN_SETTLE_TIME, SCREEN_HALF_WIDTH_MM, timeToScreen } from './scale'

export const REFRACTIVE_INDEX = { air: 1.0, water: 1.33 } as const
export type Medium = keyof typeof REFRACTIVE_INDEX

export interface DoubleSlitVariables {
  /** Vacuum wavelength (nm). */
  readonly wavelength: number
  /** Slit separation (mm). */
  readonly slitSeparation: number
  /** Slit-to-screen distance (m). */
  readonly screenDistance: number
  /** Source brightness, relative (0–1). */
  readonly sourceIntensity: number
  /** Slit 2's brightness relative to slit 1 (0–1). */
  readonly slit2Intensity: number
  readonly medium: Medium
  /** Detector position on the screen (mm). */
  readonly detectorPosition: number
}

export interface DoubleSlitState {
  /** Simulated seconds since the light was switched on. */
  readonly t: number
  /**
   * When the light first reached the screen (s), or null. Remembered so that
   * moving the screen further away afterwards (a live change) does not
   * "un-form" the steady pattern.
   */
  readonly arrivedAt: number | null
}

export type LightPhase = 'off' | 'travelling' | 'formed'
export type DetectorReading = 'none' | 'bright' | 'dark' | 'between'

/** Converts learner units (nm, mm) to the SI setup used by the physics service. Intensities are in units of I₀. */
export function setupFor(vars: DoubleSlitVariables): DoubleSlitSetup {
  return {
    wavelength: vars.wavelength * 1e-9,
    slitSeparation: vars.slitSeparation * 1e-3,
    screenDistance: vars.screenDistance,
    refractiveIndex: REFRACTIVE_INDEX[vars.medium],
    intensity1: vars.sourceIntensity,
    intensity2: vars.sourceIntensity * vars.slit2Intensity,
  }
}

export function lightPhase(state: DoubleSlitState): LightPhase {
  if (state.t <= 0) return 'off'
  return state.arrivedAt === null ? 'travelling' : 'formed'
}

export const createInitialState = (): DoubleSlitState => ({ t: 0, arrivedAt: null })

export function step(state: DoubleSlitState, dt: number, vars: DoubleSlitVariables): DoubleSlitState {
  const t = state.t + dt
  const arrivedAt = state.arrivedAt ?? (t >= timeToScreen(vars.screenDistance) ? t : null)
  return { t, arrivedAt }
}

/** The run completes once the pattern has settled after the light's arrival. */
export const isComplete = (state: DoubleSlitState): boolean =>
  state.arrivedAt !== null && state.t >= state.arrivedAt + PATTERN_SETTLE_TIME

export function measure(state: DoubleSlitState, vars: DoubleSlitVariables) {
  const setup = setupFor(vars)
  const y = vars.detectorPosition * 1e-3
  const lit = lightPhase(state) === 'formed'
  const reading: DetectorReading = lit ? classifyFringe(setup, y) : 'none'
  return {
    fringeWidth: fringeWidth(setup) * 1e3,
    detectorIntensity: lit ? intensityAt(setup, y) : 0,
    detectorFringe: reading,
    pathDifference: pathDifference(setup, y) * 1e9,
    fringeOrder: fringeOrder(setup, y),
    phaseDifference: phaseDifference(setup, y),
    wavelengthInMedium: wavelengthInMedium(setup) * 1e9,
    angularFringeWidth: angularFringeWidth(setup),
    maxIntensity: maxIntensity(setup),
    minIntensity: minIntensity(setup),
    visibility: fringeVisibility(setup),
    brightFringesOnScreen: brightFringesWithin(setup, SCREEN_HALF_WIDTH_MM * 1e-3),
    phase: lightPhase(state),
  }
}
