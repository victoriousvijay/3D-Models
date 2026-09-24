import type { UnitDefinition } from './units'

/**
 * Contract every scientific domain (physics, chemistry, biology, astronomy,
 * earth science, mathematics, …) implements to plug into the platform.
 *
 * The contract is deliberately thin: it only covers what the platform must
 * know to host a domain's simulations. Each domain's scientific logic —
 * integrators, reaction models, anatomy data, graph evaluators — lives
 * entirely inside the domain module and is not constrained by any other domain.
 */
export interface DomainEngine {
  /** Stable kebab-case id, e.g. `physics`, `earth-science`. */
  readonly id: string
  readonly title: string
  readonly description: string
  /**
   * Domains whose units and services this one builds on (e.g. astronomy on
   * physics). Dependencies are explicit so no domain silently constrains another.
   */
  readonly dependsOn?: readonly string[]
  /** Units this domain contributes. Each id must also be declared in `UnitCatalog`. */
  readonly units: readonly UnitDefinition[]
  /**
   * One-off asynchronous setup before the domain's first simulation runs,
   * such as loading a WASM physics solver or a molecular toolkit.
   */
  initialize?(): Promise<void>
  dispose?(): void
}
