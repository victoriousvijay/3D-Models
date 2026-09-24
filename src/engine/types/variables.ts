import type { UnitId } from './units'

export type VariableValue = number | boolean | string

/** Loosely-typed variable values, used where the concrete simulation is unknown. */
export type VariableValues = Readonly<Record<string, VariableValue>>

/**
 * Cross-variable validation hook. Return a learner-readable message when the
 * value is invalid in the context of the other variables, otherwise `null`.
 */
export type VariableValidator<T extends VariableValue> = (value: T, all: VariableValues) => string | null

interface VariableDefinitionBase {
  readonly id: string
  readonly label: string
  readonly description?: string
}

export interface NumberVariableDefinition extends VariableDefinitionBase {
  readonly kind: 'number'
  readonly unit: UnitId
  readonly defaultValue: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly validate?: VariableValidator<number>
}

export interface BooleanVariableDefinition extends VariableDefinitionBase {
  readonly kind: 'boolean'
  readonly defaultValue: boolean
  readonly validate?: VariableValidator<boolean>
}

export interface ChoiceOption<V extends string = string> {
  readonly value: V
  readonly label: string
}

export interface ChoiceVariableDefinition extends VariableDefinitionBase {
  readonly kind: 'choice'
  readonly options: readonly ChoiceOption[]
  readonly defaultValue: string
  readonly validate?: VariableValidator<string>
}

export type VariableDefinition =
  NumberVariableDefinition | BooleanVariableDefinition | ChoiceVariableDefinition

type ValueOfDefinition<D> = D extends { readonly kind: 'number' }
  ? number
  : D extends { readonly kind: 'boolean' }
    ? boolean
    : D extends { readonly kind: 'choice'; readonly options: readonly ChoiceOption<infer V>[] }
      ? V
      : never

/**
 * Derives a strongly-typed values object from a tuple of variable definitions,
 * e.g. `{ concentration: number; catalyst: boolean }`.
 */
export type ValuesOf<TDefs extends readonly VariableDefinition[]> = {
  readonly [K in TDefs[number]['id']]: ValueOfDefinition<Extract<TDefs[number], { readonly id: K }>>
}

export interface VariableIssue {
  readonly variableId: string
  readonly message: string
}

export type VariableResolution<TValues> =
  | { readonly ok: true; readonly values: TValues }
  | { readonly ok: false; readonly issues: readonly VariableIssue[] }
