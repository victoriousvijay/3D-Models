import type {
  MeasurementDefinition,
  MeasurementValue,
  UnitId,
  VariableDefinition,
  VariableValue,
} from '@/engine'

/** Display symbol for a unit; dimensionless quantities show no unit. */
export function unitSymbol(unit: UnitId): string {
  if (unit === '1') return ''
  if (unit === 'deg') return '°'
  return unit
}

/**
 * Formats a number for a readout: 2 decimals below 100, 1 decimal below 1e6,
 * scientific notation for very small or very large magnitudes. Never shows "-0".
 */
export function formatNumber(value: number): string {
  const abs = Math.abs(value)
  const text =
    abs !== 0 && (abs < 0.01 || abs >= 1e6) ? value.toExponential(2) : value.toFixed(abs >= 100 ? 1 : 2)
  return /^-0(\.0+)?$/.test(text) ? text.slice(1) : text
}

/** Decimal places implied by a variable's step (0.5 → 1, 0.01 → 2, 1 → 0). */
export function decimalsForStep(step: number): number {
  const [, fraction = ''] = String(step).split('.')
  return fraction.length
}

const withUnit = (text: string, unit: UnitId): string => {
  const symbol = unitSymbol(unit)
  if (!symbol) return text
  return symbol === '°' ? `${text}°` : `${text} ${symbol}`
}

export function formatVariable(def: VariableDefinition, value: VariableValue | undefined): string {
  switch (def.kind) {
    case 'number':
      return typeof value === 'number' ? withUnit(value.toFixed(decimalsForStep(def.step)), def.unit) : '—'
    case 'boolean':
      return value === true ? 'On' : 'Off'
    case 'choice':
      return def.options.find((option) => option.value === value)?.label ?? '—'
  }
}

export function formatMeasurement(def: MeasurementDefinition, value: MeasurementValue | undefined): string {
  switch (def.kind) {
    case 'scalar':
      return typeof value === 'number' ? withUnit(formatNumber(value), def.unit) : '—'
    case 'vector':
      return Array.isArray(value) ? withUnit(`(${value.map(formatNumber).join(', ')})`, def.unit) : '—'
    case 'category':
      return def.options.find((option) => option.value === value)?.label ?? '—'
  }
}
