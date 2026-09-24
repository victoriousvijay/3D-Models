import { radiansToDegrees } from '@/domains/physics'

/**
 * Maps a pointer position on the launch plane (z = 0, metres) to a launch
 * angle in degrees, measured from the launch point at (0, launchHeight).
 * Clamped to [min, max] and rounded to `step`.
 */
export function angleFromPointer(
  point: { readonly x: number; readonly y: number },
  launchHeight: number,
  limits: { readonly min: number; readonly max: number; readonly step: number },
): number {
  const dx = point.x
  const dy = point.y - launchHeight
  // Behind the launcher, aim straight up (if above) or flat (if below).
  const raw = dx <= 0 ? (dy > 0 ? 90 : 0) : radiansToDegrees(Math.atan2(dy, dx))
  const stepped = Math.round(raw / limits.step) * limits.step
  return Math.min(limits.max, Math.max(limits.min, stepped))
}
