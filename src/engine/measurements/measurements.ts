import type { MeasurementDefinition, MeasurementValues } from '../types'

/**
 * Validates one measured value against its definition. Returns a message, or
 * `null` when valid. A non-finite number means the model produced an
 * impossible result (division by zero, numerical blow-up) and must never be
 * presented to a learner as data.
 */
export function checkMeasurementValue(def: MeasurementDefinition, value: unknown): string | null {
  switch (def.kind) {
    case 'scalar':
      return typeof value === 'number' && Number.isFinite(value) ? null : `${def.id} must be a finite number.`
    case 'vector':
      return Array.isArray(value) &&
        value.length === def.dimensions &&
        value.every((component) => typeof component === 'number' && Number.isFinite(component))
        ? null
        : `${def.id} must be a finite ${def.dimensions}D vector.`
    case 'category':
      return def.options.some((option) => option.value === value)
        ? null
        : `${def.id} must be one of: ${def.options.map((option) => option.value).join(', ')}.`
  }
}

/** Returns a message for every declared measurement that is missing or invalid. */
export function findInvalidMeasurements(
  definitions: readonly MeasurementDefinition[],
  values: MeasurementValues,
): string[] {
  const messages: string[] = []
  for (const def of definitions) {
    const message = checkMeasurementValue(def, values[def.id])
    if (message) messages.push(message)
  }
  return messages
}
