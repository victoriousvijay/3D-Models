import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { EXPERIENCE_LABELS, type LabDivision, type LabEntry } from '@/catalogue'
import { LabGlyph } from './LabGlyph'

/**
 * One lab in a division's catalogue: concept preview, name, simulation type,
 * status and the way in. Available labs launch; planned labs open a
 * "coming soon" page describing what they will cover.
 */
export function LabRow({ lab, division }: { lab: LabEntry; division: LabDivision }) {
  const available = lab.status === 'available'
  const href = `/lab/${division.id}/${lab.id}`

  return (
    <article
      aria-labelledby={`lab-${lab.id}`}
      className="group relative flex items-start gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-white sm:items-center"
    >
      <div
        className="grid size-16 shrink-0 place-items-center rounded-xl ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
        style={{ backgroundColor: division.accentSoft, color: division.accent }}
      >
        <LabGlyph labId={lab.id} division={division.id} className="size-11" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 id={`lab-${lab.id}`} className="font-semibold text-lab-strong">
            {/* The whole row is clickable through this link's overlay. */}
            <Link
              to={href}
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
            >
              {lab.title}
            </Link>
          </h3>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
            style={
              available
                ? { backgroundColor: division.accent, color: '#ffffff' }
                : { backgroundColor: 'var(--color-lab-subtle)', color: 'var(--color-lab-muted)' }
            }
          >
            {available ? 'Ready' : 'In development'}
          </span>
        </div>
        {lab.description ? (
          <p className="mt-1 text-sm leading-snug text-lab-text">{lab.description}</p>
        ) : null}
        <p className="mt-1 text-xs text-lab-muted">{EXPERIENCE_LABELS[lab.experience]}</p>
      </div>

      <span
        aria-hidden
        className="hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:flex"
        style={
          available
            ? { backgroundColor: division.accent, color: '#ffffff' }
            : { color: 'var(--color-lab-muted)' }
        }
      >
        {available ? 'Launch lab' : 'Details'}
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </span>
    </article>
  )
}
