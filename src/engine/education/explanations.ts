import type { AnySimulationDefinition, Explanation, ExplanationAnchor } from '../types'

const sameAnchor = (a: ExplanationAnchor, b: ExplanationAnchor): boolean =>
  a.kind === b.kind && (a.kind === 'simulation' || (b.kind !== 'simulation' && a.id === b.id))

/** Explanations attached to the given anchor, in declaration order. */
export function explanationsFor(
  definition: AnySimulationDefinition,
  anchor: ExplanationAnchor,
): Explanation[] {
  return definition.explanations.filter((explanation) => sameAnchor(explanation.anchor, anchor))
}

/** Checks investigation ids are unique, text is present and presets exist. */
export function validateInvestigations(definition: AnySimulationDefinition): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const presets = new Set(definition.presets.map((p) => p.id))
  for (const investigation of definition.investigations) {
    if (ids.has(investigation.id)) issues.push(`Duplicate investigation id "${investigation.id}".`)
    ids.add(investigation.id)
    if (investigation.question.trim() === '' || investigation.hint.trim() === '') {
      issues.push(`investigation "${investigation.id}" needs a question and a hint.`)
    }
    if (investigation.presetId !== undefined && !presets.has(investigation.presetId)) {
      issues.push(
        `investigation "${investigation.id}" references unknown preset "${investigation.presetId}".`,
      )
    }
  }
  return issues
}

/** Checks ids are unique, text is present and every anchor refers to something the simulation declares. */
export function validateExplanations(definition: AnySimulationDefinition): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const declared = {
    object: new Set(definition.objects.map((o) => o.id)),
    variable: new Set(definition.variables.map((v) => v.id)),
    measurement: new Set(definition.measurements.map((m) => m.id)),
  }

  for (const explanation of definition.explanations) {
    if (ids.has(explanation.id)) issues.push(`Duplicate explanation id "${explanation.id}".`)
    ids.add(explanation.id)
    if (explanation.title.trim() === '' || explanation.body.trim() === '') {
      issues.push(`explanation "${explanation.id}" needs a title and body.`)
    }
    const { anchor } = explanation
    if (anchor.kind !== 'simulation' && !declared[anchor.kind].has(anchor.id)) {
      issues.push(`explanation "${explanation.id}" is anchored to unknown ${anchor.kind} "${anchor.id}".`)
    }
  }
  return issues
}
