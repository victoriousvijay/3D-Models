import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { AnySimulationDefinition } from '@/engine'

/** A visual overlay a view can draw (vector, trail, marker), listed in the legend where learners toggle it. */
export interface OverlayDescriptor {
  readonly id: string
  readonly label: string
  readonly color: string
  /** How the overlay maps to physical quantities, e.g. "1 m of arrow = 5 m/s". */
  readonly note?: string
}

/**
 * A simulation as shipped by the platform: its framework-free definition plus
 * a lazily-loaded 3D view. The view is only downloaded when a learner opens
 * the simulation, keeping the initial bundle small.
 *
 * Views take no props; they obtain their typed runtime with
 * `useSimulationRuntime(definition)` from `@/rendering`.
 */
export interface SimulationPackage {
  readonly definition: AnySimulationDefinition
  readonly View: LazyExoticComponent<ComponentType>
  readonly overlays: readonly OverlayDescriptor[]
}

export function defineSimulationPackage(options: {
  definition: AnySimulationDefinition
  loadView: () => Promise<{ default: ComponentType }>
  overlays?: readonly OverlayDescriptor[]
}): SimulationPackage {
  return { definition: options.definition, View: lazy(options.loadView), overlays: options.overlays ?? [] }
}
