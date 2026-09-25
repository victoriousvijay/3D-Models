import type { ModelKind } from '@/engine'

/**
 * Laboratory divisions the learner navigates. A division is a navigation and
 * identity concept; the science behind it comes from a domain engine
 * (`domain`). Botany and Zoology both build on the biology domain engine.
 */
export type DivisionId = 'physics' | 'chemistry' | 'botany' | 'zoology'

export interface LabDivision {
  readonly id: DivisionId
  readonly title: string
  /** One line describing what the division studies. */
  readonly tagline: string
  /** Id of the domain engine whose science this division's labs use. */
  readonly domain: string
  /** Identity colours (light theme). */
  readonly accent: string
  readonly accentSoft: string
}

/**
 * `available`: implemented and registered; can be launched.
 * `planned`: catalogued so the learner can see what is coming; not launchable.
 */
export type LabStatus = 'available' | 'planned'

export interface LabEntry {
  /** Stable kebab-case id, unique across the catalogue; also the URL segment. */
  readonly id: string
  readonly division: DivisionId
  readonly title: string
  /** Syllabus chapter (NCERT Class 11/12). */
  readonly chapter: string
  /** One-line, learner-facing description of what the lab lets you explore. */
  readonly description?: string
  /** How the model behaves: live simulation, step-by-step process or 3D explorer. */
  readonly experience: ModelKind
  readonly status: LabStatus
  /** For `available` labs: the id of the registered simulation package. */
  readonly simulationId?: string
}
