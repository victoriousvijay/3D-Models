/**
 * How the (schematic) optics bench maps to scene units. The bench is not to
 * scale; these constants are shared by the model (timing) and the view
 * (geometry) so the light's travel and the drawing always agree.
 *
 *  - Along the beam (x): the barrier is at x = 0, the laser aperture at
 *    `SOURCE_X`, the screen at `BENCH_UNITS_PER_METRE · D`.
 *  - Across the beam (z): the screen spans ±`SCREEN_HALF` scene units, which
 *    represent ±`SCREEN_HALF_WIDTH_MM` on the real screen, a magnification of
 *    `LATERAL_UNITS_PER_METRE`. The interference map uses the same
 *    magnification, so its bands meet the screen exactly at the fringes.
 */

/** Real half-width of the screen window (mm). */
export const SCREEN_HALF_WIDTH_MM = 15
/** Scene half-width of the screen (units). */
export const SCREEN_HALF = 2
/** Scene height of the screen (units). */
export const SCREEN_HEIGHT = 2.2
/** Scene units per real metre across the beam (≈ 133). */
export const LATERAL_UNITS_PER_METRE = SCREEN_HALF / (SCREEN_HALF_WIDTH_MM / 1000)
/** Scene units per real metre along the beam. */
export const BENCH_UNITS_PER_METRE = 2.5
/** Laser aperture position (scene x). */
export const SOURCE_X = -2
/** Conceptual speed of the light in the drawing (scene units per simulated second): extreme slow motion. */
export const WAVE_SPEED = 3

export const screenX = (screenDistanceM: number): number => BENCH_UNITS_PER_METRE * screenDistanceM

/** Drawn slit separation (scene units): grows with d, enlarged so both slits are visible. */
export const drawnSlitSeparation = (slitSeparationMm: number): number =>
  0.3 + ((slitSeparationMm - 0.1) / 1.9) * 1.1

/** Drawn ripple wavelength (scene units): grows with λ; conceptual, ~10⁵× enlarged. */
export const drawnWavelength = (wavelengthNm: number, refractiveIndex: number): number =>
  (0.16 + ((wavelengthNm - 380) / 370) * 0.14) / refractiveIndex

/** Simulated seconds for the light to travel from the laser to the slits. */
export const TIME_TO_SLITS = -SOURCE_X / WAVE_SPEED
/** Simulated seconds for the light to reach the screen. */
export const timeToScreen = (screenDistanceM: number): number =>
  TIME_TO_SLITS + screenX(screenDistanceM) / WAVE_SPEED
/** Extra time for the pattern to settle once the light arrives. */
export const PATTERN_SETTLE_TIME = 0.5
