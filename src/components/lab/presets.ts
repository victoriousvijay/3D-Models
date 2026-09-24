import { resolveVariables, type AnySimulationRuntime, type VariableResolution } from '@/engine'

/**
 * Applies a preset on top of the simulation's defaults (not the current
 * values), so a preset always produces the same starting conditions.
 */
export function applyPreset(
  runtime: AnySimulationRuntime,
  presetId: string,
): VariableResolution<Readonly<Record<string, unknown>>> | null {
  const { definition } = runtime
  const preset = definition.presets.find((p) => p.id === presetId)
  const defaults = resolveVariables(definition.variables)
  if (!preset || !defaults.ok) return null
  return runtime.setVariables({ ...defaults.values, ...preset.variables })
}
