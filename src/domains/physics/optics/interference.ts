/**
 * Two-source interference (Young's double-slit experiment).
 *
 * Geometry: two narrow slits separated by d, centred on the optical axis; a
 * screen at distance D; y is the position on the screen measured from the
 * axis, perpendicular to the slits. SI units throughout.
 *
 *   Δ(y) = S₂P − S₁P = √(D² + (y + d/2)²) − √(D² + (y − d/2)²)
 *   φ    = 2πΔ / λₘ,              λₘ = λ / n
 *   I    = I₁ + I₂ + 2√(I₁I₂) cos φ
 *   β    = λₘD / d                (small-angle fringe width)
 *
 * Assumptions: monochromatic, coherent, in-phase slits; slits narrow enough
 * that the single-slit envelope is ignored; intensities are the values each
 * slit alone produces at the screen, taken as uniform across it.
 */

export interface DoubleSlitSetup {
  /** Vacuum wavelength λ (m), > 0. */
  readonly wavelength: number
  /** Slit separation d, centre to centre (m), > 0. */
  readonly slitSeparation: number
  /** Slit-to-screen distance D (m), > 0. */
  readonly screenDistance: number
  /** Refractive index n of the medium filling the apparatus, ≥ 1. */
  readonly refractiveIndex: number
  /** Intensity at the screen from slit 1 alone (any unit), ≥ 0. */
  readonly intensity1: number
  /** Intensity at the screen from slit 2 alone (same unit), ≥ 0. */
  readonly intensity2: number
}

export type FringeKind = 'bright' | 'dark' | 'between'

/** Throws `RangeError` for physically meaningless setups. */
export function assertValidDoubleSlit(s: DoubleSlitSetup): void {
  const values = [
    s.wavelength,
    s.slitSeparation,
    s.screenDistance,
    s.refractiveIndex,
    s.intensity1,
    s.intensity2,
  ]
  if (!values.every(Number.isFinite)) throw new RangeError('Double-slit values must be finite.')
  if (!(s.wavelength > 0) || !(s.slitSeparation > 0) || !(s.screenDistance > 0)) {
    throw new RangeError('Wavelength, slit separation and screen distance must be positive.')
  }
  if (s.refractiveIndex < 1) throw new RangeError('Refractive index must be at least 1.')
  if (s.intensity1 < 0 || s.intensity2 < 0) throw new RangeError('Intensities must not be negative.')
}

/** Wavelength inside the medium, λₘ = λ / n. */
export function wavelengthInMedium(s: DoubleSlitSetup): number {
  return s.wavelength / s.refractiveIndex
}

/** Fringe width β = λₘD/d: spacing between adjacent bright (or dark) fringes. */
export function fringeWidth(s: DoubleSlitSetup): number {
  assertValidDoubleSlit(s)
  return (wavelengthInMedium(s) * s.screenDistance) / s.slitSeparation
}

/** Angular fringe width θ = λₘ/d (rad). */
export function angularFringeWidth(s: DoubleSlitSetup): number {
  assertValidDoubleSlit(s)
  return wavelengthInMedium(s) / s.slitSeparation
}

/**
 * Exact path difference Δ = S₂P − S₁P at screen position y, in the
 * cancellation-free form Δ = 2yd / (r₁ + r₂). (Subtracting the two
 * near-equal distances directly loses precision when D ≫ Δ.)
 */
export function pathDifference(s: DoubleSlitSetup, y: number): number {
  const half = s.slitSeparation / 2
  const r1 = Math.hypot(s.screenDistance, y - half)
  const r2 = Math.hypot(s.screenDistance, y + half)
  return (2 * y * s.slitSeparation) / (r1 + r2)
}

/** Small-angle path difference Δ ≈ yd/D. */
export function pathDifferenceSmallAngle(s: DoubleSlitSetup, y: number): number {
  return (y * s.slitSeparation) / s.screenDistance
}

/** Phase difference φ = 2πΔ/λₘ at y (rad). */
export function phaseDifference(s: DoubleSlitSetup, y: number): number {
  return (2 * Math.PI * pathDifference(s, y)) / wavelengthInMedium(s)
}

/** Interference order Δ/λₘ at y: integers are bright, half-integers dark. */
export function fringeOrder(s: DoubleSlitSetup, y: number): number {
  return pathDifference(s, y) / wavelengthInMedium(s)
}

/** Intensity at y: I = I₁ + I₂ + 2√(I₁I₂) cos φ. */
export function intensityAt(s: DoubleSlitSetup, y: number): number {
  assertValidDoubleSlit(s)
  const coherent = 2 * Math.sqrt(s.intensity1 * s.intensity2)
  return s.intensity1 + s.intensity2 + coherent * Math.cos(phaseDifference(s, y))
}

/** I_max = (√I₁ + √I₂)², at bright fringes. */
export function maxIntensity(s: DoubleSlitSetup): number {
  return (Math.sqrt(s.intensity1) + Math.sqrt(s.intensity2)) ** 2
}

/** I_min = (√I₁ − √I₂)², at dark fringes. */
export function minIntensity(s: DoubleSlitSetup): number {
  return (Math.sqrt(s.intensity1) - Math.sqrt(s.intensity2)) ** 2
}

/** Fringe visibility (contrast) V = (I_max − I_min)/(I_max + I_min); 1 for equal slits. */
export function fringeVisibility(s: DoubleSlitSetup): number {
  const total = maxIntensity(s) + minIntensity(s)
  return total === 0 ? 0 : (maxIntensity(s) - minIntensity(s)) / total
}

/** Small-angle position of the n-th bright fringe, yₙ = nβ (n = 0 is the central maximum). */
export function brightFringePosition(s: DoubleSlitSetup, n: number): number {
  return n * fringeWidth(s)
}

/** Small-angle position of the n-th dark fringe, yₙ = (n + ½)β. */
export function darkFringePosition(s: DoubleSlitSetup, n: number): number {
  return (n + 0.5) * fringeWidth(s)
}

/**
 * Classifies the point y: within `tolerance` (a fraction of one order) of a
 * whole order it is bright, of a half order dark, otherwise between.
 */
export function classifyFringe(s: DoubleSlitSetup, y: number, tolerance = 0.05): FringeKind {
  const order = fringeOrder(s, y)
  const offset = Math.abs(order - Math.round(order))
  if (offset <= tolerance) return 'bright'
  if (Math.abs(offset - 0.5) <= tolerance) return 'dark'
  return 'between'
}

/** Number of bright fringes whose centres lie within |y| ≤ halfWidth (small-angle). */
export function brightFringesWithin(s: DoubleSlitSetup, halfWidth: number): number {
  return 2 * Math.floor(halfWidth / fringeWidth(s) + 1e-9) + 1
}
