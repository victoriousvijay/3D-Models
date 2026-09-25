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
 * A simulation as shipped by the platform: its framework-free definition, a
 * lazily-loaded 3D view, and the environment (scientific world) it lives in.
 * The view is only downloaded when a learner opens the simulation.
 *
 * Views take no props; they obtain their typed runtime with
 * `useSimulationRuntime(definition)` from `@/rendering`.
 *
 * `Environment` is deliberately required: every lab chooses its own world
 * (a projectile range, an optics darkroom, a cell interior…) rather than
 * falling back to a generic viewer. See MODEL_ECOSYSTEM_GUIDELINES.md.
 */
export interface SimulationPackage {
  readonly definition: AnySimulationDefinition
  readonly View: LazyExoticComponent<ComponentType>
  readonly Environment: ComponentType
  readonly overlays: readonly OverlayDescriptor[]
}

export function defineSimulationPackage(options: {
  definition: AnySimulationDefinition
  loadView: () => Promise<{ default: ComponentType }>
  /** Scene surroundings: lighting, ground, backdrop, reference aids. Rendered inside the canvas. */
  Environment: ComponentType
  overlays?: readonly OverlayDescriptor[]
}): SimulationPackage {
  return {
    definition: options.definition,
    View: lazy(options.loadView),
    Environment: options.Environment,
    overlays: options.overlays ?? [],
  }
}
