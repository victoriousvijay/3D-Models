import type { DomainEngine } from '../types'

/** Identity helper for declaring a domain engine with full type checking. */
export function defineDomain(domain: DomainEngine): DomainEngine {
  return domain
}
