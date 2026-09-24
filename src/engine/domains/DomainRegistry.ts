import type { DomainEngine, UnitDefinition, UnitId } from '../types'
import { CORE_UNITS, unitsAreEquivalent } from '../units/coreUnits'

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export class DomainRegistrationError extends Error {
  readonly domainId: string
  readonly issues: readonly string[]

  constructor(domainId: string, issues: readonly string[]) {
    super(`Invalid domain "${domainId}":\n- ${issues.join('\n- ')}`)
    this.name = 'DomainRegistrationError'
    this.domainId = domainId
    this.issues = issues
  }
}

/**
 * Holds the registered domain engines and the units each contributes.
 *
 * Unit visibility is scoped: a simulation may use core SI units, its own
 * domain's units and those of the domains it explicitly depends on. Two
 * domains may declare the same unit only if their definitions are identical,
 * so no domain can redefine a unit another relies on.
 */
export class DomainRegistry {
  readonly #domains = new Map<string, DomainEngine>()
  readonly #units = new Map<UnitId, UnitDefinition>()
  readonly #initialization = new Map<string, Promise<void>>()

  constructor() {
    for (const unit of CORE_UNITS) this.#units.set(unit.id, unit)
  }

  /**
   * Validates and adds a domain. Dependencies must be registered first, which
   * also makes dependency cycles impossible.
   */
  register(domain: DomainEngine): void {
    const issues: string[] = []
    if (!KEBAB_CASE.test(domain.id)) issues.push(`id "${domain.id}" must be kebab-case.`)
    if (this.#domains.has(domain.id)) issues.push(`A domain with id "${domain.id}" is already registered.`)

    for (const dependency of domain.dependsOn ?? []) {
      if (!this.#domains.has(dependency)) issues.push(`depends on unregistered domain "${dependency}".`)
    }

    const seen = new Set<UnitId>()
    for (const unit of domain.units) {
      if (seen.has(unit.id)) issues.push(`declares unit "${unit.id}" twice.`)
      seen.add(unit.id)
      const existing = this.#units.get(unit.id)
      if (existing && !unitsAreEquivalent(existing, unit)) {
        issues.push(`unit "${unit.id}" conflicts with an existing definition.`)
      }
      if (unit.toSI && !(Number.isFinite(unit.toSI.factor) && unit.toSI.factor !== 0)) {
        issues.push(`unit "${unit.id}" has an invalid SI conversion factor.`)
      }
    }

    if (issues.length > 0) throw new DomainRegistrationError(domain.id, issues)

    this.#domains.set(domain.id, domain)
    for (const unit of domain.units) {
      if (!this.#units.has(unit.id)) this.#units.set(unit.id, unit)
    }
  }

  has(id: string): boolean {
    return this.#domains.has(id)
  }

  get(id: string): DomainEngine | undefined {
    return this.#domains.get(id)
  }

  list(): DomainEngine[] {
    return [...this.#domains.values()]
  }

  unit(id: UnitId): UnitDefinition | undefined {
    return this.#units.get(id)
  }

  /** Core SI units plus those of the domain and its transitive dependencies. */
  unitsAvailableTo(domainId: string): ReadonlySet<UnitId> {
    const available = new Set<UnitId>(CORE_UNITS.map((unit) => unit.id))
    for (const domain of this.#withDependencies(domainId)) {
      for (const unit of domain.units) available.add(unit.id)
    }
    return available
  }

  /** Runs `initialize()` for the domain and its dependencies, once each, dependencies first. */
  initialize(domainId: string): Promise<void> {
    const cached = this.#initialization.get(domainId)
    if (cached) return cached

    const domain = this.#domains.get(domainId)
    if (!domain) return Promise.reject(new Error(`Unknown domain "${domainId}".`))

    const promise = (async () => {
      await Promise.all((domain.dependsOn ?? []).map((dependency) => this.initialize(dependency)))
      await domain.initialize?.()
    })()
    this.#initialization.set(domainId, promise)
    // Allow a retry after a failed initialisation (e.g. a WASM download error).
    promise.catch(() => this.#initialization.delete(domainId))
    return promise
  }

  #withDependencies(domainId: string, visited = new Set<string>()): DomainEngine[] {
    const domain = this.#domains.get(domainId)
    if (!domain || visited.has(domainId)) return []
    visited.add(domainId)
    return [
      domain,
      ...(domain.dependsOn ?? []).flatMap((dependency) => this.#withDependencies(dependency, visited)),
    ]
  }
}
