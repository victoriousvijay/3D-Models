import { gsap } from 'gsap'
import { Box, FlaskConical, Gauge, Lightbulb } from 'lucide-react'
import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { LAB_CATALOGUE, LAB_DIVISIONS, labsInDivision } from '@/catalogue'
import { DivisionGlyph } from '@/components/catalogue/LabGlyph'
import { EnterLabButton } from '@/components/landing/EnterLabButton'
import { usePrefersReducedMotion } from '@/components/lab/useMediaQuery'

const HeroScene = lazy(() =>
  import('@/components/landing/HeroScene').then((module) => ({ default: module.HeroScene })),
)

const STEPS = [
  { icon: Box, title: 'Explore', text: 'Orbit, zoom and select the objects in a 3D scientific environment.' },
  { icon: FlaskConical, title: 'Experiment', text: 'Change the conditions and run the experiment yourself.' },
  { icon: Gauge, title: 'Measure', text: 'Read live results, record trials and compare them side by side.' },
  {
    icon: Lightbulb,
    title: 'Understand',
    text: 'Follow explanations and questions that connect what you see to the science.',
  },
] as const

export default function LandingPage() {
  const navigate = useNavigate()
  const reducedMotion = usePrefersReducedMotion()
  const root = useRef<HTMLElement>(null)
  const portal = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const [entering, setEntering] = useState(false)

  const total = LAB_CATALOGUE.length
  const available = LAB_CATALOGUE.filter((lab) => lab.status === 'available').length

  // Entrance: the hero copy rises in, one element after another.
  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const context = gsap.context(() => {
      gsap.from('[data-reveal]', {
        y: 18,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.1,
      })
    }, root)
    return () => {
      context.revert()
    }
  }, [reducedMotion])

  const enterLab = () => {
    if (entering) return
    if (reducedMotion || !portal.current || !button.current || !root.current) {
      void navigate('/lab')
      return
    }
    setEntering(true)
    // The portal opens from the button and fills the screen, then the hub takes over.
    const rect = button.current.getBoundingClientRect()
    const origin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`
    gsap
      .timeline({ onComplete: () => void navigate('/lab', { state: { fromLanding: true } }) })
      .to(root.current.querySelectorAll('[data-reveal]'), {
        y: -14,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
        stagger: 0.03,
      })
      .fromTo(
        portal.current,
        { clipPath: `circle(0% at ${origin})`, opacity: 1 },
        { clipPath: `circle(150% at ${origin})`, duration: 0.8, ease: 'power3.inOut' },
        '<0.1',
      )
  }

  return (
    <main ref={root} className="relative min-h-dvh overflow-x-hidden bg-lab-bg text-lab-strong">
      {/* ─── Hero ─── */}
      <section className="relative isolate flex min-h-dvh flex-col">
        <div className="absolute inset-0 -z-10">
          <Suspense fallback={null}>
            <HeroScene animate={!reducedMotion} />
          </Suspense>
        </div>
        {/* Keeps the copy legible over the constellation, and adds a faint lab grid. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_45%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.75)_35%,rgba(255,255,255,0)_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(#e6eef9_1px,transparent_1px),linear-gradient(90deg,#e6eef9_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />

        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" className="flex items-center gap-2" aria-label="Simulation Lab home">
            <DivisionGlyph division="physics" className="size-7 text-lab-accent" />
            <span className="text-xs font-semibold tracking-[0.24em] uppercase">Simulation Lab</span>
          </Link>
          <Link to="/lab" className="text-sm text-lab-text transition-colors hover:text-lab-accent">
            Browse labs
          </Link>
        </header>

        <div className="flex flex-1 items-center px-6 pb-16 sm:px-10">
          <div className="max-w-xl">
            <p data-reveal className="text-xs font-medium tracking-[0.22em] text-lab-accent uppercase">
              Interactive 3D science laboratory
            </p>
            <h1 data-reveal className="mt-4 text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Step inside
              <br />
              the science.
            </h1>
            <p data-reveal className="mt-5 max-w-md text-base leading-relaxed text-lab-text sm:text-lg">
              Explore Physics, Chemistry, Botany and Zoology in interactive 3D laboratories. Change the
              conditions, run the experiment and watch the science unfold.
            </p>
            <div data-reveal className="mt-9">
              <EnterLabButton ref={button} onEnter={enterLab} disabled={entering} />
            </div>

            <ul data-reveal className="mt-10 flex flex-wrap gap-2" aria-label="Divisions">
              {LAB_DIVISIONS.map((division) => (
                <li key={division.id}>
                  <Link
                    to={`/lab/${division.id}`}
                    className="flex items-center gap-2 rounded-full border border-lab-line bg-lab-bg/80 py-1.5 pr-3.5 pl-2 text-sm text-lab-text backdrop-blur transition-colors hover:border-current"
                    style={{ color: division.accent }}
                  >
                    <DivisionGlyph division={division.id} className="size-5" />
                    <span className="text-lab-strong">{division.title}</span>
                    <span className="text-xs text-lab-muted">
                      {labsInDivision(LAB_CATALOGUE, division.id).length}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p data-reveal className="mt-4 text-xs text-lab-muted">
              {total} labs in the catalogue · {available} ready to explore now, more arriving lab by lab
            </p>
          </div>
        </div>
      </section>

      {/* ─── How every lab works ─── */}
      <section className="border-t border-lab-subtle bg-lab-panel/50 px-6 py-16 sm:px-10">
        <h2 className="text-xs font-medium tracking-[0.22em] text-lab-muted uppercase">
          How every lab works
        </h2>
        <ol className="mt-8 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-lab-bg text-lab-accent shadow-sm ring-1 ring-lab-line">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="font-mono text-xs text-lab-muted">0{i + 1}</span>
              </div>
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-lab-text">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="px-6 py-6 text-xs text-lab-muted sm:px-10">
        Simulation Lab — interactive 3D science for NEET and NCERT learners.
      </footer>

      {/* The portal that carries the learner into the lab. */}
      <div
        ref={portal}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,#ffffff_0%,#eef4fd_55%,#dce8fa_100%)] opacity-0"
        style={{ clipPath: 'circle(0% at 50% 50%)' }}
      />
    </main>
  )
}
