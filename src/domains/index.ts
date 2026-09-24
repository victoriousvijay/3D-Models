import type { DomainEngine } from '@/engine'
import { physicsDomain } from './physics'

/**
 * Installed domain engines, in dependency order (a domain must follow the
 * domains it depends on). Chemistry, Biology, Astronomy, Earth Science and
 * Mathematics are specified in their *_ENGINE.md documents and are added here
 * when implemented.
 */
export const domainEngines: readonly DomainEngine[] = [physicsDomain]
