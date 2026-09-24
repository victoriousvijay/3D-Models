/** Standard acceleration of gravity, g₀ (m/s²). Conventional value adopted by the 3rd CGPM (1901). */
export const STANDARD_GRAVITY = 9.80665

/** Air density at sea level in the International Standard Atmosphere, 15 °C (kg/m³). */
export const SEA_LEVEL_AIR_DENSITY = 1.225

/**
 * Drag coefficient of a smooth sphere in the subcritical Reynolds-number
 * regime (≈10⁴–10⁵). Typical textbook value; real balls vary with surface
 * texture, spin and speed.
 */
export const SMOOTH_SPHERE_DRAG_COEFFICIENT = 0.47

export const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180
export const radiansToDegrees = (radians: number): number => (radians * 180) / Math.PI
