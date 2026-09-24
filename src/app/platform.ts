import { DomainRegistry, ExperimentLog, SimulationRegistry } from '@/engine'
import { domainEngines } from '@/domains'
import { simulationPackages, type SimulationPackage } from '@/simulations'

/**
 * Composition root: the single place where domains and simulations are
 * wired into the engine. Registration validates everything up front, so an
 * invalid definition fails at startup rather than in front of a learner.
 */
function createPlatform() {
  const domains = new DomainRegistry()
  for (const domain of domainEngines) domains.register(domain)

  const simulations = new SimulationRegistry<SimulationPackage>(domains)
  for (const pkg of simulationPackages) simulations.register(pkg)

  /** Session experiment log for all simulations (persistence subscribes to its events in Phase 3). */
  const experiments = new ExperimentLog()

  return { domains, simulations, experiments } as const
}

export const platform = createPlatform()
