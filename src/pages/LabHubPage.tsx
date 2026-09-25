import { gsap } from 'gsap'
import { ArrowLeft } from 'lucide-react'
import { lazy, Suspense, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { LAB_CATALOGUE, LAB_DIVISIONS, labsInDivision, type DivisionId } from '@/catalogue'
import { DivisionGlyph } from '@/components/catalogue/LabGlyph'
import { usePrefersReducedMotion } from '@/components/lab/useMediaQuery'

const HubScene = lazy(() => import('@/components/hub/HubScene').then((m) => ({ default: m.HubScene })))

/**
 * The Science Simulation Lab hub: a 3D facility with one station per
 * division. Selecting a division flies the camera to its station, then opens
 * that division's lab. The labelled list is the accessible (keyboard, screen
 * reader, touch) way to do the same.
 */
export default function LabHubPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const [hovered, setHovered] = useState<DivisionId | null>(null)
  const [flyTo, setFlyTo] = useState<DivisionId | null>(null)
  const veil = useRef<HTMLDivElement>(null)
  const arrivedFromLanding = (location.state as { fromLanding?: boolean } | null)?.fromLanding === true

  // Continue the landing page's portal: the hub fades in from the same light.
  useLayoutEffect(() => {
    if (!veil.current) return
    if (!arrivedFromLanding || reducedMotion) {
      veil.current.style.opacity = '0'
      return
    }
    const tween = gsap.fromTo(
      veil.current,
      { opacity: 1 },
      { opacity: 0, duration: 0.9, ease: 'power2.out', delay: 0.15 },
    )
    return () => {
      tween.kill()
    }
  }, [arrivedFromLanding, reducedMotion])

  const select = (id: DivisionId) => {
    if (flyTo) return
    if (reducedMotion) {
      void navigate(`/lab/${id}`)
      return
    }
    setFlyTo(id)
  }

  const arrive = useCallback(() => {
    if (flyTo) void navigate(`/lab/${flyTo}`)
  }, [flyTo, navigate])

  return (
    <main className="relative flex min-h-dvh flex-col bg-[#f4f8fd] text-lab-strong lg:block lg:h-dvh lg:overflow-hidden">
      <div className="relative h-[52dvh] shrink-0 lg:absolute lg:inset-0 lg:h-auto">
        <Suspense fallback={null}>
          <HubScene
            divisions={LAB_DIVISIONS}
            hovered={hovered}
            onHover={setHovered}
            onSelect={select}
            flyTo={flyTo}
            onArrive={arrive}
            animate={!reducedMotion}
          />
        </Suspense>
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-5 pt-5 sm:px-8">
        <div className="pointer-events-auto">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-lab-muted transition-colors hover:text-lab-strong"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Home
          </Link>
          <p className="mt-4 text-[11px] font-medium tracking-[0.24em] text-lab-accent uppercase">
            Choose a division
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Science Simulation Lab</h1>
        </div>
      </header>

      <nav
        aria-label="Divisions"
        className="relative z-10 px-4 pt-4 pb-6 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-8 lg:pb-8"
      >
        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LAB_DIVISIONS.map((division) => {
            const labs = labsInDivision(LAB_CATALOGUE, division.id)
            const ready = labs.filter((lab) => lab.status === 'available').length
            const active = hovered === division.id || flyTo === division.id
            return (
              <li key={division.id} className="lg:pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    select(division.id)
                  }}
                  onMouseEnter={() => {
                    setHovered(division.id)
                  }}
                  onMouseLeave={() => {
                    setHovered(null)
                  }}
                  onFocus={() => {
                    setHovered(division.id)
                  }}
                  onBlur={() => {
                    setHovered(null)
                  }}
                  className="group flex w-full items-start gap-3 rounded-xl border bg-white/85 p-4 text-left shadow-sm backdrop-blur transition-[border-color,box-shadow,transform] duration-200 motion-reduce:transition-none"
                  style={{
                    borderColor: active ? division.accent : 'var(--color-lab-line)',
                    boxShadow: active ? `0 10px 30px -12px ${division.accent}` : undefined,
                  }}
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: division.accentSoft, color: division.accent }}
                  >
                    <DivisionGlyph division={division.id} className="size-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="font-semibold">{division.title}</span>
                      <span className="text-xs text-lab-muted">
                        {labs.length} labs{ready > 0 ? ` · ${ready} ready` : ''}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-lab-text">
                      {division.tagline}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div
        ref={veil}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,#ffffff_0%,#eef4fd_55%,#dce8fa_100%)]"
      />
    </main>
  )
}
