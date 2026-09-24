/**
 * Unit catalog (compile-time).
 *
 * The core declares only the SI system itself — base units, the named
 * derived units and dimensionless quantities. This is metrology, not any one
 * science. Every other unit (m/s, mol/L, mmHg, Å, AU, …) is contributed by the
 * domain engine that needs it, by augmenting this interface:
 *
 * ```ts
 * declare module '@/engine/types/units' {
 *   interface UnitCatalog { 'mol/L': true }
 * }
 * ```
 *
 * and listing a matching `UnitDefinition` in the domain's `units` so the
 * runtime can validate it. Keeping this a closed set catches unit typos at
 * compile time without coupling the core to any subject.
 */
export interface UnitCatalog {
  /** Dimensionless quantity (ratios, counts, indices). */
  '1': true
  // SI base units
  s: true
  m: true
  kg: true
  A: true
  K: true
  mol: true
  cd: true
  // SI named derived units
  rad: true
  sr: true
  Hz: true
  N: true
  Pa: true
  J: true
  W: true
  C: true
  V: true
  F: true
  Ω: true
  S: true
  Wb: true
  T: true
  H: true
  '°C': true
  lm: true
  lx: true
  Bq: true
  Gy: true
  Sv: true
  kat: true
  /** Coherent unit of any rate (reaction rate constants, decay constants, heart rate). */
  's⁻¹': true
}

export type UnitId = Extract<keyof UnitCatalog, string>

/** Runtime description of a unit, used for validation, display and conversion. */
export interface UnitDefinition {
  readonly id: UnitId
  readonly name: string
  /** The kind of quantity measured, e.g. `length`, `amount concentration`, `pressure`. */
  readonly quantity: string
  /**
   * Linear conversion to the coherent SI unit of the same quantity:
   * `si = value * factor + offset`. Omit for coherent SI units.
   */
  readonly toSI?: { readonly factor: number; readonly offset?: number }
}

/**
 * A point or direction in scene space: right-handed, +Y up.
 * What one unit represents is declared per simulation by `SceneConfig.worldUnit`.
 */
export type Vec3 = readonly [x: number, y: number, z: number]
export type Vec2 = readonly [x: number, y: number]
