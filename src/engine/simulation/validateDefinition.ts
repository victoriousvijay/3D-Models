import { validateExplanations, validateInvestigations } from '../education/explanations'
import type { AnySimulationDefinition, UnitId } from '../types'
import { resolveVariables, validateVariableDefinitions } from '../variables/variables'

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Integration steps larger than this make most integrators visibly inaccurate. */
const MAX_FIXED_TIME_STEP = 0.1

export class SimulationDefinitionError extends Error {
  readonly simulationId: string
  readonly issues: readonly string[]

  constructor(simulationId: string, issues: readonly string[]) {
    super(`Invalid simulation "${simulationId}":\n- ${issues.join('\n- ')}`)
    this.name = 'SimulationDefinitionError'
    this.simulationId = simulationId
    this.issues = issues
  }
}

function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  }
  return [...duplicates]
}

function validateModel(model: AnySimulationDefinition['model']): string[] {
  switch (model.kind) {
    case 'continuous': {
      const issues: string[] = []
      if (!(model.fixedTimeStep > 0 && model.fixedTimeStep <= MAX_FIXED_TIME_STEP)) {
        issues.push(`model.fixedTimeStep must be in (0, ${MAX_FIXED_TIME_STEP}] seconds.`)
      }
      if (model.maxDuration !== undefined && !(model.maxDuration > 0)) {
        issues.push('model.maxDuration must be positive.')
      }
      return issues
    }
    case 'discrete':
      return model.autoAdvanceInterval !== undefined && !(model.autoAdvanceInterval > 0)
        ? ['model.autoAdvanceInterval must be positive.']
        : []
    case 'static':
      return []
  }
}

/**
 * Catches authoring mistakes before a simulation reaches a learner.
 *
 * @param availableUnits Units the simulation's domain may use. When omitted,
 *   unit scoping is not checked (useful for testing a definition in isolation).
 * @returns Human-readable issues; empty means valid.
 */
export function validateSimulationDefinition(
  def: AnySimulationDefinition,
  availableUnits?: ReadonlySet<UnitId>,
): string[] {
  const issues: string[] = []

  if (!KEBAB_CASE.test(def.id)) issues.push(`id "${def.id}" must be kebab-case.`)
  if (def.title.trim() === '') issues.push('title must not be empty.')

  for (const issue of validateVariableDefinitions(def.variables)) {
    issues.push(`variable "${issue.variableId}": ${issue.message}`)
  }

  for (const id of findDuplicates(def.measurements.map((m) => m.id))) {
    issues.push(`Duplicate measurement id "${id}".`)
  }
  for (const measurement of def.measurements) {
    if (measurement.kind === 'category' && measurement.options.length === 0) {
      issues.push(`measurement "${measurement.id}" needs at least one option.`)
    }
  }

  const objectIds = new Set(def.objects.map((o) => o.id))
  for (const id of findDuplicates(def.objects.map((o) => o.id))) {
    issues.push(`Duplicate object id "${id}".`)
  }
  for (const object of def.objects) {
    if (object.parentId !== undefined && !objectIds.has(object.parentId)) {
      issues.push(`object "${object.id}" has unknown parent "${object.parentId}".`)
    }
  }

  const variableIds = new Set(def.variables.map((v) => v.id))
  for (const interaction of def.interactions) {
    if (!objectIds.has(interaction.targetObjectId)) {
      issues.push(`interaction "${interaction.id}" targets unknown object "${interaction.targetObjectId}".`)
    }
    if (interaction.variableId !== undefined && !variableIds.has(interaction.variableId)) {
      issues.push(`interaction "${interaction.id}" references unknown variable "${interaction.variableId}".`)
    }
  }

  for (const preset of def.presets) {
    const resolution = resolveVariables(def.variables, preset.variables)
    if (!resolution.ok) {
      for (const issue of resolution.issues) issues.push(`preset "${preset.id}": ${issue.message}`)
    }
  }

  issues.push(...validateModel(def.model))
  issues.push(...validateExplanations(def))
  issues.push(...validateInvestigations(def))

  if (availableUnits) {
    const used: [string, UnitId][] = [['scene.worldUnit', def.scene.worldUnit]]
    for (const v of def.variables) if (v.kind === 'number') used.push([`variable "${v.id}"`, v.unit])
    for (const m of def.measurements) if (m.kind !== 'category') used.push([`measurement "${m.id}"`, m.unit])
    for (const [where, unit] of used) {
      if (!availableUnits.has(unit)) {
        issues.push(`${where} uses unit "${unit}", which is not available to domain "${def.domain}".`)
      }
    }
  }

  return issues
}
