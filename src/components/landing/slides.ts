import type { DivisionId } from '@/catalogue'

/**
 * The landing carousel: one character per division, in display order.
 *
 * ⚠ The images are PLACEHOLDERS hot-linked from a third-party demo (TOONHUB).
 * Replace `src` with your own transparent PNGs (portrait, figure standing at
 * the bottom edge, roughly 0.6 : 1) before a public launch — ideally files in
 * `public/landing/`, e.g. `src: '/landing/physics.png'`. Nothing else changes.
 */
export interface LandingSlide {
  readonly division: DivisionId
  readonly src: string
  /** Page background while this slide is in front. */
  readonly bg: string
  readonly panel: string
}

const PLACEHOLDER =
  'https://fifth-gentle-45902158.figma.site/_components/v2/4de492f6d9cf8244ad5293233e5c6f52407d42fc'

export const LANDING_SLIDES: readonly LandingSlide[] = [
  { division: 'physics', src: `${PLACEHOLDER}/4.4457fbce.png`, bg: '#6EB5FF', panel: '#8DC4FF' },
  { division: 'chemistry', src: `${PLACEHOLDER}/3.4df853b4.png`, bg: '#E882B4', panel: '#ED9DC4' },
  { division: 'botany', src: `${PLACEHOLDER}/2.b977faab.png`, bg: '#6BBF7A', panel: '#85CC92' },
  { division: 'zoology', src: `${PLACEHOLDER}/1.02464a56.png`, bg: '#F4845F', panel: '#F79B7F' },
]
