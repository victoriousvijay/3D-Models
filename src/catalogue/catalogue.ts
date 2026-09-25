import type { ModelKind } from '@/engine'
import { LAB_DIVISIONS } from './divisions'
import type { DivisionId, LabEntry } from './types'

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const EXPERIENCE_LABELS: Record<ModelKind, string> = {
  continuous: 'Live simulation',
  discrete: 'Step-by-step process',
  static: '3D explorer',
}

export function labsInDivision(catalogue: readonly LabEntry[], division: DivisionId): LabEntry[] {
  return catalogue.filter((lab) => lab.division === division)
}

export function findLab(catalogue: readonly LabEntry[], division: string, id: string): LabEntry | undefined {
  return catalogue.find((lab) => lab.division === division && lab.id === id)
}

/** Groups labs by chapter, keeping the catalogue's order for both chapters and labs. */
export function groupByChapter(labs: readonly LabEntry[]): { chapter: string; labs: LabEntry[] }[] {
  const groups = new Map<string, LabEntry[]>()
  for (const lab of labs) {
    const group = groups.get(lab.chapter)
    if (group) group.push(lab)
    else groups.set(lab.chapter, [lab])
  }
  return [...groups].map(([chapter, labsInChapter]) => ({ chapter, labs: labsInChapter }))
}

/** What the catalogue needs to know about a registered simulation. */
export interface RegisteredSimulation {
  readonly id: string
  readonly domain: string
}

/**
 * Checks the catalogue is internally consistent and agrees with the
 * registered simulations: unique ids, known divisions, every available lab
 * points to a registered simulation of the right domain, and every
 * registered simulation is reachable from the catalogue.
 */
export function validateCatalogue(
  catalogue: readonly LabEntry[],
  simulations: readonly RegisteredSimulation[],
): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const byId = new Map(simulations.map((s) => [s.id, s]))
  const reachable = new Set<string>()

  for (const lab of catalogue) {
    if (!KEBAB_CASE.test(lab.id)) issues.push(`lab "${lab.id}": id must be kebab-case.`)
    if (ids.has(lab.id)) issues.push(`Duplicate lab id "${lab.id}".`)
    ids.add(lab.id)

    const division = LAB_DIVISIONS.find((d) => d.id === lab.division)
    if (!division) {
      issues.push(`lab "${lab.id}": unknown division "${lab.division}".`)
      continue
    }
    if (lab.title.trim() === '' || lab.chapter.trim() === '')
      issues.push(`lab "${lab.id}": needs a title and chapter.`)

    if (lab.status === 'available') {
      const simulation = lab.simulationId === undefined ? undefined : byId.get(lab.simulationId)
      if (!simulation) {
        issues.push(
          `lab "${lab.id}" is available but simulation "${lab.simulationId ?? '(none)'}" is not registered.`,
        )
      } else {
        reachable.add(simulation.id)
        if (simulation.domain !== division.domain) {
          issues.push(
            `lab "${lab.id}": simulation domain "${simulation.domain}" ≠ division domain "${division.domain}".`,
          )
        }
      }
    } else if (lab.simulationId !== undefined) {
      issues.push(`lab "${lab.id}" is planned but names a simulation; mark it available.`)
    }
  }

  for (const simulation of simulations) {
    if (!reachable.has(simulation.id))
      issues.push(`Simulation "${simulation.id}" is registered but not in the catalogue.`)
  }
  return issues
}
