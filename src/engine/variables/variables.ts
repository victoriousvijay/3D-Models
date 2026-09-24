import type {
  ValuesOf,
  VariableDefinition,
  VariableIssue,
  VariableResolution,
  VariableValue,
  VariableValues,
} from '../types'

/** Checks that variable definitions are internally consistent. Used when a simulation is registered. */
export function validateVariableDefinitions(definitions: readonly VariableDefinition[]): VariableIssue[] {
  const issues: VariableIssue[] = []
  const seen = new Set<string>()

  for (const def of definitions) {
    const report = (message: string) => issues.push({ variableId: def.id, message })

    if (def.id.trim() === '') report('Variable id must not be empty.')
    if (seen.has(def.id)) report(`Duplicate variable id "${def.id}".`)
    seen.add(def.id)

    switch (def.kind) {
      case 'number': {
        const { min, max, step, defaultValue } = def
        if (![min, max, step, defaultValue].every(Number.isFinite)) {
          report('min, max, step and defaultValue must be finite numbers.')
          break
        }
        if (min > max) report(`min (${min}) must not exceed max (${max}).`)
        if (step <= 0) report(`step (${step}) must be positive.`)
        if (defaultValue < min || defaultValue > max) {
          report(`defaultValue (${defaultValue}) must lie within [${min}, ${max}].`)
        }
        break
      }
      case 'choice': {
        if (def.options.length === 0) report('A choice variable needs at least one option.')
        if (!def.options.some((option) => option.value === def.defaultValue)) {
          report(`defaultValue "${def.defaultValue}" is not one of the options.`)
        }
        break
      }
      case 'boolean':
        break
    }
  }

  return issues
}

/** Validates a single value against its definition in isolation. Returns a message, or `null` when valid. */
export function checkVariableValue(def: VariableDefinition, value: unknown): string | null {
  switch (def.kind) {
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) return `${def.label} must be a finite number.`
      if (value < def.min) return `${def.label} must be at least ${def.min} ${def.unit}.`
      if (value > def.max) return `${def.label} must be at most ${def.max} ${def.unit}.`
      return null
    case 'boolean':
      return typeof value === 'boolean' ? null : `${def.label} must be true or false.`
    case 'choice':
      return def.options.some((option) => option.value === value)
        ? null
        : `${def.label} must be one of: ${def.options.map((option) => option.value).join(', ')}.`
  }
}

function runCustomValidator(
  def: VariableDefinition,
  value: VariableValue,
  all: VariableValues,
): string | null {
  // Each branch narrows `value` to the type its validator expects.
  if (def.kind === 'number' && typeof value === 'number') return def.validate?.(value, all) ?? null
  if (def.kind === 'boolean' && typeof value === 'boolean') return def.validate?.(value, all) ?? null
  if (def.kind === 'choice' && typeof value === 'string') return def.validate?.(value, all) ?? null
  return null
}

/**
 * Merges `overrides` over the defaults and validates the result. Unknown keys
 * are rejected so typos in presets or AI tool calls cannot silently no-op.
 */
export function resolveVariables<const TDefs extends readonly VariableDefinition[]>(
  definitions: TDefs,
  overrides: Readonly<Record<string, unknown>> = {},
): VariableResolution<ValuesOf<TDefs>> {
  const issues: VariableIssue[] = []
  const known = new Set(definitions.map((def) => def.id))

  for (const key of Object.keys(overrides)) {
    if (!known.has(key)) issues.push({ variableId: key, message: `Unknown variable "${key}".` })
  }

  const values: Record<string, VariableValue> = {}
  for (const def of definitions) {
    const candidate = Object.hasOwn(overrides, def.id) ? overrides[def.id] : def.defaultValue
    const message = checkVariableValue(def, candidate)
    if (message) {
      issues.push({ variableId: def.id, message })
      values[def.id] = def.defaultValue
    } else {
      values[def.id] = candidate as VariableValue
    }
  }

  // Cross-variable rules only make sense once every value is individually valid.
  if (issues.length === 0) {
    for (const def of definitions) {
      const value = values[def.id]
      if (value === undefined) continue
      const message = runCustomValidator(def, value, values)
      if (message) issues.push({ variableId: def.id, message })
    }
  }

  if (issues.length > 0) return { ok: false, issues }
  // The loop above assigned a checked value for every definition id.
  return { ok: true, values: Object.freeze(values) as ValuesOf<TDefs> }
}
