import type { UnitId, Vec3 } from './units'

/**
 * Renderer-agnostic description of how a simulation's scene is framed.
 * Scene space is right-handed with +Y up.
 */
export interface SceneConfig {
  /**
   * What one scene unit represents: `m` for a lab bench, a domain unit such as
   * `Å` for a molecule or `AU` for a planetary system, `1` for an abstract
   * mathematical space. Grids, rulers and labels are scaled from this.
   */
  readonly worldUnit: UnitId
  readonly camera: {
    readonly position: Vec3
    readonly target: Vec3
    /** Orthographic suits graphs and diagrams; perspective suits spatial scenes. */
    readonly projection?: 'perspective' | 'orthographic'
    /** Vertical field of view in degrees (perspective only). */
    readonly fov?: number
  }
}

/** An entity inside a simulation: a projectile, an atom, an organelle, a planet, a curve. */
export interface SimulationObjectDefinition {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly selectable: boolean
  /** Id of a parent object, forming a hierarchy (heart → left ventricle, molecule → atom). */
  readonly parentId?: string
}

export type InteractionKind = 'click' | 'hover' | 'select' | 'drag' | 'rotate' | 'isolate' | 'manipulate'

/**
 * Declares how a learner may interact with an object in the 3D scene.
 * Sliders and toggles are not interactions: they are derived from variables.
 */
export interface InteractionDefinition {
  readonly id: string
  readonly kind: InteractionKind
  readonly targetObjectId: string
  /** The variable this interaction changes, if any (e.g. dragging a launcher changes its angle). */
  readonly variableId?: string
}
