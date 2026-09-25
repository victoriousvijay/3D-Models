import type { ReactNode } from 'react'
import type { DivisionId } from '@/catalogue'

/**
 * Line-art previews of each lab's concept, drawn in the division's accent
 * colour (via `currentColor`). 64×64 viewBox; decorative (aria-hidden) — the
 * lab's title carries the meaning.
 */
const GLYPHS: Record<string, ReactNode> = {
  'projectile-motion': (
    <>
      <path d="M6 52h52" />
      <path d="M10 50C18 22 34 14 50 50" strokeDasharray="3 3" />
      <circle cx="37" cy="26" r="3.5" fill="currentColor" />
      <path d="M8 50l6-8" />
    </>
  ),
  'matter-waves': (
    <>
      <circle cx="12" cy="32" r="4" fill="currentColor" />
      <path d="M20 32c3-10 5-10 8 0s5 10 8 0 5-10 8 0 5 10 8 0" />
      <path d="M22 44h32" opacity=".45" />
      <path d="M50 41l4 3-4 3" opacity=".45" />
    </>
  ),
  'matter-waves-3d': (
    <>
      <circle cx="32" cy="32" r="3" fill="currentColor" />
      <path d="M32 12c4 2 6 2 9 2 3 3 3 5 5 8 0 4 2 6 4 10-2 4-4 6-4 10-2 3-2 5-5 8-3 0-5 0-9 2-4-2-6-2-9-2-3-3-3-5-5-8 0-4-2-6-4-10 2-4 4-6 4-10 2-3 2-5 5-8 3 0 5 0 9-2z" />
      <circle cx="32" cy="32" r="16" opacity=".3" />
    </>
  ),
  'heisenberg-3d': (
    <>
      <path d="M6 52h52" opacity=".45" />
      <path d="M8 52c10 0 12-34 16-34s6 34 16 34" />
      <path d="M24 52c8 0 12-12 20-12s10 12 16 12" opacity=".6" />
      <path d="M20 12h8M24 8v8" />
    </>
  ),
  'blackbody-radiation': (
    <>
      <path d="M8 54V8M8 54h50" opacity=".45" />
      <path d="M10 54c6-2 8-36 16-36s14 30 30 34" />
      <path d="M10 54c10-1 14-18 22-18s14 14 24 17" opacity=".55" />
      <path d="M26 18v36" strokeDasharray="2 3" opacity=".4" />
    </>
  ),
  'basic-maths-for-physics': (
    <>
      <path d="M10 54V8M10 54h46" opacity=".45" />
      <path d="M10 54L46 18" />
      <path d="M38 18h8v8" />
      <path d="M46 18v36M10 18h36" strokeDasharray="2 3" opacity=".5" />
    </>
  ),
  'electric-flux-cube': (
    <>
      <path d="M18 24l14-8 14 8v18l-14 8-14-8z" />
      <path d="M18 24l14 8 14-8M32 32v18" opacity=".55" />
      <circle cx="32" cy="33" r="3" fill="currentColor" />
      <path d="M32 33L8 44M32 33l24 11M32 33V6" opacity=".5" strokeDasharray="2 3" />
    </>
  ),
  'em-wave': (
    <>
      <path d="M4 32h56" opacity=".45" />
      <path d="M6 32c4-18 8-18 12 0s8 18 12 0 8-18 12 0 8 18 12 0" />
      <path d="M6 32c4 6 8 12 12 12s6-6 12-12 8-12 12-12 8 6 12 12" opacity=".5" />
    </>
  ),
  'collision-1d': (
    <>
      <path d="M4 48h56" />
      <rect x="8" y="34" width="14" height="14" rx="2" />
      <rect x="40" y="38" width="10" height="10" rx="2" fill="currentColor" fillOpacity=".25" />
      <path d="M24 28h10M31 25l3 3-3 3" />
    </>
  ),
  'double-slit': (
    <>
      <path d="M24 8v16M24 28v8M24 40v16" />
      <path d="M28 26c6 0 10 2 12 6M28 38c6 0 10-2 12-6" opacity=".55" />
      <path d="M8 32h12" strokeDasharray="2 3" />
      <path d="M52 10v4M52 18v6M52 28v8M52 40v6M52 50v4" strokeWidth="3" />
    </>
  ),
  'rolling-race': (
    <>
      <path d="M6 54h52L6 18z" opacity=".45" />
      <circle cx="18" cy="30" r="5" fill="currentColor" fillOpacity=".3" />
      <circle cx="32" cy="40" r="5" />
      <circle cx="32" cy="40" r="2.5" />
      <path d="M48 44l6 10" />
    </>
  ),
  'total-internal-reflection': (
    <>
      <path d="M4 34h56" />
      <path d="M4 34h56v24H4z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="M12 56l20-22 20 22" />
      <path d="M32 34V10" strokeDasharray="2 3" opacity=".45" />
    </>
  ),
  'loop-solenoid-field': (
    <>
      <ellipse cx="18" cy="32" rx="4" ry="12" />
      <ellipse cx="28" cy="32" rx="4" ry="12" />
      <ellipse cx="38" cy="32" rx="4" ry="12" />
      <path d="M4 32h56M54 29l4 3-4 3" opacity=".6" />
    </>
  ),
  'lenz-law': (
    <>
      <ellipse cx="42" cy="32" rx="5" ry="14" />
      <ellipse cx="48" cy="32" rx="5" ry="14" opacity=".6" />
      <rect x="6" y="26" width="24" height="12" rx="1.5" />
      <path d="M18 26v12" />
      <text x="10" y="35" fontSize="7" fill="currentColor" stroke="none">
        N
      </text>
      <text x="21" y="35" fontSize="7" fill="currentColor" stroke="none">
        S
      </text>
    </>
  ),
  'escape-velocity': (
    <>
      <path d="M4 60a30 30 0 0 1 30-26 30 30 0 0 1 26 12" opacity=".45" />
      <circle cx="18" cy="60" r="18" fill="currentColor" fillOpacity=".12" />
      <path d="M22 42C28 24 42 12 58 6" strokeDasharray="3 3" />
      <path d="M54 5l4 1-2 4" />
    </>
  ),
  'pn-junction': (
    <>
      <rect x="6" y="18" width="52" height="28" rx="2" />
      <rect x="26" y="18" width="12" height="28" fill="currentColor" fillOpacity=".15" stroke="none" />
      <path d="M26 18v28M38 18v28" strokeDasharray="2 3" />
      <path d="M12 32h6M15 29v6" />
      <path d="M46 32h6" />
    </>
  ),
}

/** Division emblems, used as previews for labs that are not designed yet. */
const DIVISION_GLYPHS: Record<DivisionId, ReactNode> = {
  physics: (
    <>
      <circle cx="32" cy="32" r="4" fill="currentColor" />
      <ellipse cx="32" cy="32" rx="22" ry="9" />
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(60 32 32)" />
      <ellipse cx="32" cy="32" rx="22" ry="9" transform="rotate(-60 32 32)" />
    </>
  ),
  chemistry: (
    <>
      <circle cx="32" cy="30" r="6" fill="currentColor" fillOpacity=".25" />
      <circle cx="14" cy="20" r="4" />
      <circle cx="50" cy="20" r="4" />
      <circle cx="32" cy="52" r="4" />
      <path d="M27 27l-9-5M37 27l9-5M32 36v12" />
    </>
  ),
  botany: (
    <>
      <path d="M32 58V28" />
      <path d="M32 40c-14 0-20-10-20-20 12 0 20 8 20 20z" fill="currentColor" fillOpacity=".15" />
      <path d="M32 32c12 0 18-8 18-18-10 0-18 6-18 18z" />
    </>
  ),
  zoology: (
    <>
      <ellipse cx="32" cy="32" rx="24" ry="18" />
      <circle cx="30" cy="30" r="7" fill="currentColor" fillOpacity=".2" />
      <ellipse cx="46" cy="38" rx="5" ry="2.5" transform="rotate(-20 46 38)" />
      <circle cx="18" cy="40" r="2" />
    </>
  ),
}

export function LabGlyph({
  labId,
  division,
  className,
}: {
  labId: string
  division: DivisionId
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {GLYPHS[labId] ?? DIVISION_GLYPHS[division]}
    </svg>
  )
}

export function DivisionGlyph({ division, className }: { division: DivisionId; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {DIVISION_GLYPHS[division]}
    </svg>
  )
}
