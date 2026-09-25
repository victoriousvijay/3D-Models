import { ArrowLeft } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { findDivision, groupByChapter, LAB_CATALOGUE, labsInDivision } from '@/catalogue'
import { LabRow } from '@/components/catalogue/LabRow'
import { usePrefersReducedMotion } from '@/components/lab/useMediaQuery'
import NotFoundPage from './NotFoundPage'

const EmblemCanvas = lazy(() =>
  import('@/components/hub/EmblemCanvas').then((m) => ({ default: m.EmblemCanvas })),
)

/**
 * A division's laboratory (e.g. the Physics Lab): its identity, and every lab
 * it offers grouped by syllabus chapter, available labs first within each
 * chapter's catalogue order.
 */
export default function DivisionPage() {
  const params = useParams()
  const reducedMotion = usePrefersReducedMotion()
  const division = findDivision(params['division'] ?? '')
  if (!division) return <NotFoundPage />

  const labs = labsInDivision(LAB_CATALOGUE, division.id)
  const ready = labs.filter((lab) => lab.status === 'available').length
  const chapters = groupByChapter(labs)

  return (
    <main className="min-h-dvh bg-[#f7faff] text-lab-strong">
      <header
        className="relative overflow-hidden border-b border-lab-line"
        style={{ background: `linear-gradient(135deg, ${division.accentSoft} 0%, #ffffff 70%)` }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-5 pt-5 pb-8 sm:px-8">
          <div className="min-w-0 flex-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-lab-muted">
              <Link to="/lab" className="flex items-center gap-1 transition-colors hover:text-lab-strong">
                <ArrowLeft className="size-3.5" aria-hidden />
                Lab Hub
              </Link>
            </nav>
            <p
              className="mt-6 text-[11px] font-semibold tracking-[0.24em] uppercase"
              style={{ color: division.accent }}
            >
              Division
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{division.title} Lab</h1>
            <p className="mt-2 max-w-md text-lab-text">{division.tagline}</p>
            <p className="mt-4 text-xs text-lab-muted">
              {labs.length} labs · {chapters.length} chapters · {ready} ready now
            </p>
          </div>
          <div className="hidden size-40 shrink-0 sm:block">
            <Suspense fallback={null}>
              <EmblemCanvas division={division} animate={!reducedMotion} />
            </Suspense>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-2 py-6 sm:px-6">
        {chapters.map(({ chapter, labs: labsInChapter }) => (
          <section key={chapter} aria-label={chapter} className="mb-4">
            <h2 className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-[0.18em] text-lab-muted uppercase">
              {chapter}
            </h2>
            <div className="divide-y divide-lab-subtle">
              {labsInChapter.map((lab) => (
                <LabRow key={lab.id} lab={lab} division={division} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
