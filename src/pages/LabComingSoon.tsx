import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import {
  EXPERIENCE_LABELS,
  LAB_CATALOGUE,
  labsInDivision,
  type LabDivision,
  type LabEntry,
} from '@/catalogue'
import { LabGlyph } from '@/components/catalogue/LabGlyph'

/** Shown for a catalogued lab that is not built yet: what it will cover, and what can be explored now. */
export function LabComingSoon({ lab, division }: { lab: LabEntry; division: LabDivision }) {
  const readyNow = labsInDivision(LAB_CATALOGUE, division.id).filter((l) => l.status === 'available')

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f7faff] px-6 py-10 text-lab-strong">
      <div className="w-full max-w-lg">
        <Link
          to={`/lab/${division.id}`}
          className="flex items-center gap-1 text-xs text-lab-muted transition-colors hover:text-lab-strong"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {division.title} Lab
        </Link>

        <div
          className="mt-6 grid size-24 place-items-center rounded-2xl"
          style={{ backgroundColor: division.accentSoft, color: division.accent }}
        >
          <LabGlyph labId={lab.id} division={division.id} className="size-16" />
        </div>
        <p
          className="mt-6 text-[11px] font-semibold tracking-[0.22em] uppercase"
          style={{ color: division.accent }}
        >
          {lab.chapter}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{lab.title}</h1>
        {lab.description ? <p className="mt-3 text-lab-text">{lab.description}</p> : null}
        <p className="mt-3 text-sm text-lab-muted">
          Planned as a {EXPERIENCE_LABELS[lab.experience].toLowerCase()}.
        </p>

        <div className="mt-6 rounded-xl border border-lab-line bg-white p-4">
          <p className="font-medium">This lab is being built.</p>
          <p className="mt-1 text-sm text-lab-text">
            Each lab gets its own 3D environment, experiments and measurements, so they arrive one at a time.
          </p>
          {readyNow.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs text-lab-muted">Ready in the {division.title} Lab now:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {readyNow.map((ready) => (
                  <li key={ready.id}>
                    <Link
                      to={`/lab/${division.id}/${ready.id}`}
                      className="inline-block rounded-full px-3.5 py-1.5 text-sm font-medium text-white"
                      style={{ backgroundColor: division.accent }}
                    >
                      {ready.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}
