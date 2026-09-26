import { cn } from 'cn'
import { gsap } from 'gsap'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router'
import { LAB_CATALOGUE, labsInDivision, findDivision } from '@/catalogue'
import {
  ghostFontSize,
  roleOf,
  SLIDE_DURATION,
  SLIDE_EASING,
  stepIndex,
  type Direction,
  type SlideRole,
} from '@/components/landing/carousel'
import { LANDING_SLIDES } from '@/components/landing/slides'
import { useMediaQuery, usePrefersReducedMotion } from '@/lib/useMediaQuery'

const COUNT = LANDING_SLIDES.length

/** Film grain over the whole page (SVG fractal noise). */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")"

const DISPLAY_FONT = "'Anton', sans-serif"

function roleStyle(role: SlideRole, mobile: boolean): CSSProperties {
  switch (role) {
    case 'center':
      return {
        transform: `translateX(-50%) scale(${mobile ? 1.25 : 1.68})`,
        filter: 'blur(0px)',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: mobile ? '60%' : '92%',
        bottom: mobile ? '22%' : 0,
      }
    case 'left':
    case 'right':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: role === 'left' ? (mobile ? '20%' : '30%') : mobile ? '80%' : '70%',
        height: mobile ? '16%' : '28%',
        bottom: mobile ? '32%' : '12%',
      }
    case 'back':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 1,
        zIndex: 5,
        left: '50%',
        height: mobile ? '13%' : '22%',
        bottom: mobile ? '32%' : '12%',
      }
  }
}

/**
 * The Science Simulation Lab hub: a character carousel, one division per
 * slide. The division's name stands huge behind its character; the arrows
 * (or ← →, or the division switcher) rotate the slides, and "Explore" opens
 * the division. Everything crossfades over 650 ms.
 */
export default function LabHubPage() {
  const location = useLocation()
  const reducedMotion = usePrefersReducedMotion()
  const mobile = !useMediaQuery('(min-width: 640px)')
  const [active, setActive] = useState(0)
  const animating = useRef(false)
  const veil = useRef<HTMLDivElement>(null)
  const arrivedFromLanding = (location.state as { fromLanding?: boolean } | null)?.fromLanding === true

  const duration = reducedMotion ? 0 : SLIDE_DURATION
  const transition = (properties: readonly string[]) =>
    properties.map((property) => `${property} ${String(duration)}ms ${SLIDE_EASING}`).join(', ')

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

  // Preload every character so the first rotation never waits for the network.
  useEffect(() => {
    for (const slide of LANDING_SLIDES) new Image().src = slide.src
  }, [])

  const goTo = useCallback(
    (next: number) => {
      if (animating.current || next === active) return
      animating.current = true
      setActive(next)
      window.setTimeout(() => {
        animating.current = false
      }, duration)
    },
    [active, duration],
  )
  const navigate = useCallback(
    (direction: Direction) => {
      goTo(stepIndex(active, direction, COUNT))
    },
    [active, goTo],
  )

  // ← and → rotate the carousel.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'ArrowRight') navigate('next')
      if (event.key === 'ArrowLeft') navigate('prev')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [navigate])

  const slide = LANDING_SLIDES[active] ?? LANDING_SLIDES[0]
  const division = slide ? findDivision(slide.division) : undefined
  if (!slide || !division) return null
  const labs = labsInDivision(LAB_CATALOGUE, division.id)
  const ready = labs.filter((lab) => lab.status === 'available').length

  return (
    <main
      className="relative w-full overflow-hidden text-white"
      style={{
        backgroundColor: slide.bg,
        transition: transition(['background-color']),
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="relative h-dvh w-full overflow-hidden">
        {/* Grain */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 50, opacity: 0.4, backgroundImage: GRAIN, backgroundSize: '200px 200px' }}
        />

        {/* The division's name, huge, behind the characters. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 grid place-items-center select-none"
          style={{ zIndex: 2, top: '18%' }}
        >
          {LANDING_SLIDES.map((s, i) => {
            const word = findDivision(s.division)?.title.toUpperCase() ?? ''
            return (
              <span
                key={s.division}
                className="col-start-1 row-start-1 whitespace-nowrap"
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontSize: ghostFontSize(word),
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? 'translateY(0)' : 'translateY(4%)',
                  transition: transition(['opacity', 'transform']),
                }}
              >
                {word}
              </span>
            )
          })}
        </div>

        {/* Header: home link, title, division switcher */}
        <header
          className="absolute inset-x-0 top-0 flex items-start justify-between gap-4 px-4 pt-5 sm:px-8"
          style={{ zIndex: 60 }}
        >
          <div>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Home
            </Link>
            <h1 className="mt-3 text-xs font-semibold tracking-[0.18em] uppercase opacity-90">
              Science Simulation Lab
            </h1>
          </div>
          <nav aria-label="Divisions" className="hidden sm:block">
            <ul className="flex gap-1.5">
              {LANDING_SLIDES.map((s, i) => {
                const d = findDivision(s.division)
                return (
                  <li key={s.division}>
                    <button
                      type="button"
                      aria-current={i === active ? 'true' : undefined}
                      onClick={() => {
                        goTo(i)
                      }}
                      className={cn(
                        'rounded-full border border-white/70 px-3 py-1 text-xs font-medium transition-colors',
                        i === active ? 'bg-white' : 'text-white hover:bg-white/15',
                      )}
                      style={i === active ? { color: slide.bg } : undefined}
                    >
                      {d?.title}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </header>

        {/* Characters */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Divisions"
          className="absolute inset-0"
          style={{ zIndex: 3 }}
        >
          {LANDING_SLIDES.map((s, i) => {
            const role = roleOf(i, active, COUNT)
            return (
              <div
                key={s.division}
                aria-hidden={role !== 'center'}
                className="absolute"
                style={{
                  aspectRatio: '0.6 / 1',
                  ...roleStyle(role, mobile),
                  transition: transition(['transform', 'filter', 'opacity', 'left', 'height', 'bottom']),
                  willChange: 'transform, filter, opacity',
                }}
              >
                <img
                  src={s.src}
                  alt={role === 'center' ? `${division.title} character` : ''}
                  draggable={false}
                  className="h-full w-full select-none"
                  style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
                />
              </div>
            )
          })}
          <p className="sr-only" aria-live="polite">
            {division.title}, {active + 1} of {COUNT}
          </p>
        </div>

        {/* Bottom left: the division, what is inside, and the arrows */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
          style={{ zIndex: 60, maxWidth: 320 }}
        >
          <p
            className="mb-2 text-base font-bold tracking-widest uppercase sm:mb-3 sm:text-[22px]"
            style={{ opacity: 0.95, letterSpacing: '0.02em' }}
          >
            {division.title} Lab
          </p>
          <p
            className="mb-4 hidden text-xs sm:mb-5 sm:block sm:text-sm"
            style={{ opacity: 0.85, lineHeight: 1.6 }}
          >
            {division.tagline} {labs.length} labs
            {ready > 0 ? `, ${String(ready)} ready to explore now` : ', coming soon'}.
          </p>
          <div className="flex gap-3">
            {(
              [
                ['prev', 'Previous division', ArrowLeft],
                ['next', 'Next division', ArrowRight],
              ] as const
            ).map(([direction, label, Icon]) => (
              <button
                key={direction}
                type="button"
                aria-label={label}
                onClick={() => {
                  navigate(direction)
                }}
                className="grid size-12 place-items-center rounded-full border-2 border-white text-white hover:scale-[1.08] hover:bg-white/12 sm:size-16"
                style={{ transition: 'transform 150ms, background-color 150ms' }}
              >
                <Icon size={26} strokeWidth={2.25} aria-hidden />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom right: into the division */}
        <Link
          to={`/lab/${division.id}`}
          className="absolute right-4 bottom-6 flex items-center gap-2 uppercase no-underline opacity-95 hover:opacity-100 sm:right-10 sm:bottom-20"
          style={{
            zIndex: 60,
            fontFamily: DISPLAY_FONT,
            fontSize: 'clamp(20px, 4vw, 56px)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            transition: 'opacity 200ms',
          }}
        >
          Explore {division.title}
          <ArrowRight className="size-5 sm:size-8" strokeWidth={2.25} aria-hidden />
        </Link>
      </div>

      <div
        ref={veil}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70] bg-[radial-gradient(circle_at_center,#ffffff_0%,#eef4fd_55%,#dce8fa_100%)]"
      />
    </main>
  )
}
