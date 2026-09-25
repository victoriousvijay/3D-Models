import type { UnitDefinition } from '@/engine'

declare module '@/engine/types/units' {
  interface UnitCatalog {
    'm/s': true
    'm/s²': true
    'kg·m/s': true
    'N·m': true
    'rad/s': true
    'kg·m²': true
    deg: true
    nm: true
    mm: true
  }
}

/** Units the physics domain contributes on top of the core SI catalog. */
export const PHYSICS_UNITS: readonly UnitDefinition[] = [
  { id: 'm/s', name: 'metre per second', quantity: 'velocity' },
  { id: 'm/s²', name: 'metre per second squared', quantity: 'acceleration' },
  { id: 'kg·m/s', name: 'kilogram metre per second', quantity: 'momentum' },
  { id: 'N·m', name: 'newton metre', quantity: 'torque' },
  { id: 'rad/s', name: 'radian per second', quantity: 'angular velocity' },
  { id: 'kg·m²', name: 'kilogram square metre', quantity: 'moment of inertia' },
  // Degrees are a learner-facing input unit; models convert to radians before calculating.
  { id: 'deg', name: 'degree', quantity: 'plane angle', toSI: { factor: Math.PI / 180 } },
  // Conventional optics units; models convert to metres before calculating.
  { id: 'nm', name: 'nanometre', quantity: 'length', toSI: { factor: 1e-9 } },
  { id: 'mm', name: 'millimetre', quantity: 'length', toSI: { factor: 1e-3 } },
]
