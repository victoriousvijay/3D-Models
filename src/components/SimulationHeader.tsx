import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from 'cn'
import type { LabDivision } from '@/catalogue'
import type { SceneTone } from '@/simulations'
import { useLabStore } from '@/state/labStore'

/**
 * Header over an open simulation: the way back to its division lab and the
 * lab's title. Compact (back arrow + title) on narrow screens.
 */
export function SimulationHeader({
  title,
  division,
  tone = 'light',
}: {
  title: string
  division: LabDivision
  /** Tone of the scene behind the header; dark scenes get light text. */
  tone?: SceneTone
}) {
  const dark = tone === 'dark'
  const loadError = useLabStore((state) => state.loadError)

  return (
    <nav
      aria-label="Simulation"
      className="pointer-events-auto absolute top-3 left-3 max-w-[calc(100vw-1.5rem)] text-sm lg:top-4 lg:left-4 lg:w-72"
    >
      <p
        className={cn(
          'sr-only lg:not-sr-only lg:mb-3 lg:block lg:text-xs lg:font-medium lg:tracking-[0.2em] lg:uppercase',
          dark ? 'lg:text-white/60' : 'lg:text-lab-muted',
        )}
      >
        Simulation Lab
      </p>
      <div className="flex items-center gap-2 lg:block">
        <Link
          to={`/lab/${division.id}`}
          aria-label={`Back to ${division.title} Lab`}
          className={cn(
            'flex items-center gap-1 rounded-md bg-lab-bg/70 p-1.5 text-lab-text transition-colors hover:text-lab-strong lg:mb-2 lg:bg-transparent lg:p-0 lg:text-xs',
            dark ? 'lg:text-white/70 lg:hover:text-white' : 'lg:text-lab-muted',
          )}
        >
          <ArrowLeft className="size-4 lg:size-3" aria-hidden />
          <span className="hidden lg:inline">{division.title} Lab</span>
        </Link>
        <h1 className={cn('text-base font-medium', dark ? 'text-white' : 'text-lab-strong')}>{title}</h1>
        {loadError ? (
          <p role="alert" className="mt-2 text-xs text-red-600">
            This simulation could not be loaded.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => {
                window.location.reload()
              }}
            >
              Reload
            </button>
          </p>
        ) : null}
      </div>
    </nav>
  )
}
