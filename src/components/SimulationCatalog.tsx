import { ArrowLeft } from 'lucide-react'
import { useLabStore } from '@/state/labStore'
import { platform } from '@/app/platform'

/** Navigation overlay listing installed domains and their simulations. */
export function SimulationCatalog() {
  const activeId = useLabStore((state) => state.activeSimulationId)
  const openSimulation = useLabStore((state) => state.openSimulation)
  const closeSimulation = useLabStore((state) => state.closeSimulation)
  const loadError = useLabStore((state) => state.loadError)
  const active = activeId ? platform.simulations.get(activeId) : undefined

  return (
    <nav
      aria-label="Simulations"
      className="pointer-events-auto absolute top-3 left-3 max-w-[calc(100vw-1.5rem)] text-sm lg:top-4 lg:left-4 lg:w-72"
    >
      <h1
        className={
          active
            ? 'sr-only lg:not-sr-only lg:mb-3 lg:block lg:text-xs lg:font-medium lg:tracking-[0.2em] lg:text-lab-muted lg:uppercase'
            : 'mb-4 text-xs font-medium tracking-[0.2em] text-lab-muted uppercase'
        }
      >
        Simulation Lab
      </h1>

      {active ? (
        <div className="flex items-center gap-2 lg:block">
          <button
            type="button"
            onClick={closeSimulation}
            aria-label="All simulations"
            className="flex items-center gap-1 rounded-md bg-lab-bg/70 p-1.5 text-lab-text transition-colors hover:text-lab-strong lg:mb-2 lg:bg-transparent lg:p-0 lg:text-xs lg:text-lab-muted"
          >
            <ArrowLeft className="size-4 lg:size-3" aria-hidden />
            <span className="hidden lg:inline">All simulations</span>
          </button>
          <p className="text-base font-medium text-lab-strong">{active.definition.title}</p>
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
      ) : (
        <ul className="space-y-4">
          {platform.domains.list().map((domain) => {
            const simulations = platform.simulations.listByDomain(domain.id)
            return (
              <li key={domain.id}>
                <h2 className="font-medium text-lab-strong">{domain.title}</h2>
                {simulations.length === 0 ? (
                  <p className="mt-1 text-xs text-lab-muted">No simulations installed yet.</p>
                ) : (
                  <ul className="mt-1 border-l border-lab-line">
                    {simulations.map(({ definition }) => (
                      <li key={definition.id}>
                        <button
                          type="button"
                          onClick={() => {
                            openSimulation(definition.id)
                          }}
                          className="-ml-px block border-l border-transparent py-1.5 pl-3 text-left transition-colors hover:border-lab-accent"
                        >
                          <span className="block text-lab-strong">{definition.title}</span>
                          <span className="block max-w-72 text-xs text-lab-muted">
                            {definition.description}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
