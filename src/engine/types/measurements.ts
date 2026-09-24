import type { ChoiceOption } from './variables'
import type { UnitId, Vec2, Vec3 } from './units'

interface MeasurementDefinitionBase {
  readonly id: string
  readonly label: string
  /** Plain-language description shown to learners as helper text. */
  readonly description?: string
  /**
   * `primary` measurements are the headline results of an experiment and are
   * shown prominently; `detail` (the default) are available on demand.
   */
  readonly emphasis?: 'primary' | 'detail'
}

/** A single number with a unit: range, pH, heart rate, orbital period, slope. */
export interface ScalarMeasurementDefinition extends MeasurementDefinitionBase {
  readonly kind: 'scalar'
  readonly unit: UnitId
}

/** A 2D or 3D vector with a unit: velocity, dipole moment, a point on a graph. */
export interface VectorMeasurementDefinition extends MeasurementDefinitionBase {
  readonly kind: 'vector'
  readonly unit: UnitId
  readonly dimensions: 2 | 3
}

/** A categorical observation: bond type, cell-cycle phase, rock type, function parity. */
export interface CategoryMeasurementDefinition extends MeasurementDefinitionBase {
  readonly kind: 'category'
  readonly options: readonly ChoiceOption[]
}

export type MeasurementDefinition =
  ScalarMeasurementDefinition | VectorMeasurementDefinition | CategoryMeasurementDefinition

export type MeasurementValue = number | Vec2 | Vec3 | string

export type MeasurementValues = Readonly<Record<string, MeasurementValue>>

/** Distributes over `2 | 3`, so an erased definition yields `Vec2 | Vec3`. */
type VectorOf<N> = N extends 2 ? Vec2 : N extends 3 ? Vec3 : never

type ValueOfMeasurement<D> = D extends { readonly kind: 'scalar' }
  ? number
  : D extends { readonly kind: 'vector'; readonly dimensions: infer N }
    ? VectorOf<N>
    : D extends { readonly kind: 'category'; readonly options: readonly ChoiceOption<infer V>[] }
      ? V
      : never

/** Strongly-typed measurement values keyed by the ids of the given definitions. */
export type MeasurementsOf<TDefs extends readonly MeasurementDefinition[]> = {
  // A plain (non-remapped) mapped type keeps contextual typing intact, so
  // `measure()` can return literals such as 'depleted' or [x, y] without `as const`.
  readonly [K in TDefs[number]['id']]: ValueOfMeasurement<Extract<TDefs[number], { readonly id: K }>>
}
