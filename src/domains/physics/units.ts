import type { UnitDefinition } from '@/engine'

declare module '@/engine/types/units' {
  interface UnitCatalog {
    'm/s': true
    'm/s²': true
    'kg·m/s': true
    'N·m': true
    deg: true
  }
}

/** Units the physics domain contributes on top of the core SI catalog. */
export const PHYSICS_UNITS: readonly UnitDefinition[] = [
  { id: 'm/s', name: 'metre per second', quantity: 'velocity' },
  { id: 'm/s²', name: 'metre per second squared', quantity: 'acceleration' },
  { id: 'kg·m/s', name: 'kilogram metre per second', quantity: 'momentum' },
  { id: 'N·m', name: 'newton metre', quantity: 'torque' },
  // Degrees are a learner-facing input unit; models convert to radians before calculating.
  { id: 'deg', name: 'degree', quantity: 'plane angle', toSI: { factor: Math.PI / 180 } },
]
