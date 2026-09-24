import type { UnitDefinition } from '../types'

/** Runtime definitions for every unit declared in the core `UnitCatalog`. */
export const CORE_UNITS: readonly UnitDefinition[] = [
  { id: '1', name: 'dimensionless', quantity: 'dimensionless' },
  { id: 's', name: 'second', quantity: 'time' },
  { id: 'm', name: 'metre', quantity: 'length' },
  { id: 'kg', name: 'kilogram', quantity: 'mass' },
  { id: 'A', name: 'ampere', quantity: 'electric current' },
  { id: 'K', name: 'kelvin', quantity: 'thermodynamic temperature' },
  { id: 'mol', name: 'mole', quantity: 'amount of substance' },
  { id: 'cd', name: 'candela', quantity: 'luminous intensity' },
  { id: 'rad', name: 'radian', quantity: 'plane angle' },
  { id: 'sr', name: 'steradian', quantity: 'solid angle' },
  { id: 'Hz', name: 'hertz', quantity: 'frequency' },
  { id: 'N', name: 'newton', quantity: 'force' },
  { id: 'Pa', name: 'pascal', quantity: 'pressure' },
  { id: 'J', name: 'joule', quantity: 'energy' },
  { id: 'W', name: 'watt', quantity: 'power' },
  { id: 'C', name: 'coulomb', quantity: 'electric charge' },
  { id: 'V', name: 'volt', quantity: 'electric potential' },
  { id: 'F', name: 'farad', quantity: 'capacitance' },
  { id: 'Ω', name: 'ohm', quantity: 'electric resistance' },
  { id: 'S', name: 'siemens', quantity: 'electric conductance' },
  { id: 'Wb', name: 'weber', quantity: 'magnetic flux' },
  { id: 'T', name: 'tesla', quantity: 'magnetic flux density' },
  { id: 'H', name: 'henry', quantity: 'inductance' },
  {
    id: '°C',
    name: 'degree Celsius',
    quantity: 'thermodynamic temperature',
    toSI: { factor: 1, offset: 273.15 },
  },
  { id: 'lm', name: 'lumen', quantity: 'luminous flux' },
  { id: 'lx', name: 'lux', quantity: 'illuminance' },
  { id: 'Bq', name: 'becquerel', quantity: 'activity' },
  { id: 'Gy', name: 'gray', quantity: 'absorbed dose' },
  { id: 'Sv', name: 'sievert', quantity: 'dose equivalent' },
  { id: 'kat', name: 'katal', quantity: 'catalytic activity' },
  { id: 's⁻¹', name: 'per second', quantity: 'rate' },
]

/** Converts a value in `unit` to its coherent SI unit. Coherent units pass through unchanged. */
export function toSI(value: number, unit: UnitDefinition): number {
  if (!unit.toSI) return value
  return value * unit.toSI.factor + (unit.toSI.offset ?? 0)
}

/** Two definitions of the same unit id are compatible when they describe the same quantity and conversion. */
export function unitsAreEquivalent(a: UnitDefinition, b: UnitDefinition): boolean {
  return (
    a.id === b.id &&
    a.quantity === b.quantity &&
    (a.toSI?.factor ?? 1) === (b.toSI?.factor ?? 1) &&
    (a.toSI?.offset ?? 0) === (b.toSI?.offset ?? 0)
  )
}
