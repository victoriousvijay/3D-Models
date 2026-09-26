/**
 * Carousel positions for the landing page. With four slides every slide has a
 * role: the active one in front, its neighbours to the left and right, and the
 * opposite one small at the back.
 */
export type SlideRole = 'center' | 'left' | 'right' | 'back'

export type Direction = 'next' | 'prev'

/** The index that becomes active after one step. */
export function stepIndex(active: number, direction: Direction, count: number): number {
  return direction === 'next' ? (active + 1) % count : (active + count - 1) % count
}

/** The role of slide `index` when `active` is in front (four slides). */
export function roleOf(index: number, active: number, count: number): SlideRole {
  const offset = (index - active + count) % count
  if (offset === 0) return 'center'
  if (offset === 1) return 'right'
  if (offset === count - 1) return 'left'
  return 'back'
}

/** The duration of every transition in the carousel (ms). */
export const SLIDE_DURATION = 650
export const SLIDE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

/**
 * Font size for the giant word behind the character: long words shrink so
 * "CHEMISTRY" fits as well as "BOTANY".
 */
export function ghostFontSize(word: string): string {
  return `clamp(72px, ${(200 / Math.max(word.length, 4)).toFixed(2)}vw, 380px)`
}
