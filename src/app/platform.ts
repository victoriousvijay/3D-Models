import { DomainRegistry, ExperimentLog, SimulationRegistry } from '@/engine'
import { LAB_CATALOGUE, validateCatalogue } from '@/catalogue'
import { domainEngines } from '@/domains'
import { simulationPackages, type SimulationPackage } from '@/simulations'

/**
 * Composition root: the single place where domains, simulations and the lab
 * catalogue are wired together. Everything is validated up front, so an
 * invalid definition or a broken catalogue entry fails at startup rather than
 * in front of a learner.
 */
function createPlatform() {
  const domains = new DomainRegistry()
  for (const domain of domainEngines) domains.register(domain)

  const simulations = new SimulationRegistry<SimulationPackage>(domains)
  for (const pkg of simulationPackages) simulations.register(pkg)

  const catalogueIssues = validateCatalogue(
    LAB_CATALOGUE,
    simulations.list().map(({ definition }) => ({ id: definition.id, domain: definition.domain })),
  )
  if (catalogueIssues.length > 0) {
    throw new Error(`Invalid lab catalogue:\n- ${catalogueIssues.join('\n- ')}`)
  }

  /** Session experiment log for all simulations (persistence subscribes to its events in Phase 3). */
  const experiments = new ExperimentLog()

  return { domains, simulations, catalogue: LAB_CATALOGUE, experiments } as const
}

export const platform = createPlatform()
