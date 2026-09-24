import type { DomainRegistry } from '../domains/DomainRegistry'
import type { AnySimulationDefinition } from '../types'
import { SimulationDefinitionError, validateSimulationDefinition } from './validateDefinition'

/**
 * Catalog of available simulations. Generic over the entry type so outer
 * layers can attach their own data (e.g. a lazily-loaded 3D view) without the
 * engine depending on them.
 */
export class SimulationRegistry<TEntry extends { readonly definition: AnySimulationDefinition }> {
  readonly #domains: DomainRegistry
  readonly #entries = new Map<string, TEntry>()

  constructor(domains: DomainRegistry) {
    this.#domains = domains
  }

  /**
   * Validates and adds an entry. Throws `SimulationDefinitionError` when the
   * definition is invalid, duplicated, belongs to an unregistered domain, or
   * uses units its domain does not provide.
   */
  register(entry: TEntry): void {
    const { definition } = entry
    const issues: string[] = []

    if (this.#domains.has(definition.domain)) {
      issues.push(
        ...validateSimulationDefinition(definition, this.#domains.unitsAvailableTo(definition.domain)),
      )
    } else {
      issues.push(...validateSimulationDefinition(definition))
      issues.push(`domain "${definition.domain}" is not registered.`)
    }
    if (this.#entries.has(definition.id)) {
      issues.push(`A simulation with id "${definition.id}" is already registered.`)
    }

    if (issues.length > 0) throw new SimulationDefinitionError(definition.id, issues)
    this.#entries.set(definition.id, entry)
  }

  get(id: string): TEntry | undefined {
    return this.#entries.get(id)
  }

  list(): TEntry[] {
    return [...this.#entries.values()]
  }

  listByDomain(domainId: string): TEntry[] {
    return this.list().filter((entry) => entry.definition.domain === domainId)
  }
}
