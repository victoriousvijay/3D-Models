import { useState } from 'react'
import type { AnySimulationRuntime, VariableDefinition, VariableValue } from '@/engine'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ExplainButton } from './ExplainButton'
import { formatVariable } from './format'
import { useRuntimeSnapshot } from './hooks'
import { Panel } from './Panel'
import { applyPreset } from './presets'

interface ControlProps {
  def: VariableDefinition
  value: VariableValue | undefined
  disabled: boolean
  explained: boolean
  onChange: (value: VariableValue) => void
}

function VariableControl({ def, value, disabled, explained, onChange }: ControlProps) {
  const labelId = `variable-${def.id}`
  const label = (
    <span id={labelId} className="flex items-center gap-1.5 text-lab-strong">
      {def.label}
      {explained ? <ExplainButton anchor={{ kind: 'variable', id: def.id }} label={def.label} /> : null}
    </span>
  )
  const help = def.description ? (
    <p className="text-[11px] leading-snug text-lab-muted">{def.description}</p>
  ) : null

  switch (def.kind) {
    case 'number':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {label}
            <span className="font-mono text-xs text-lab-strong tabular-nums">
              {formatVariable(def, value)}
            </span>
          </div>
          {help}
          <Slider
            className="py-2"
            value={[typeof value === 'number' ? value : def.defaultValue]}
            min={def.min}
            max={def.max}
            step={def.step}
            disabled={disabled}
            thumbLabel={def.label}
            formatValueText={(v) => formatVariable(def, v)}
            onValueChange={(next: number | readonly number[]) => {
              const number = typeof next === 'number' ? next : next[0]
              if (typeof number === 'number') onChange(number)
            }}
          />
        </div>
      )
    case 'boolean':
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            {label}
            <Switch
              checked={value === true}
              disabled={disabled}
              aria-labelledby={labelId}
              onCheckedChange={(checked) => {
                onChange(checked)
              }}
            />
          </div>
          {help}
        </div>
      )
    case 'choice':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {label}
            <span className="text-xs text-lab-strong">{formatVariable(def, value)}</span>
          </div>
          {help}
          <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-1">
            {def.options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={value === option.value}
                disabled={disabled}
                onClick={() => {
                  onChange(option.value)
                }}
                className="rounded border border-lab-line px-2 py-1 text-xs aria-checked:border-lab-accent aria-checked:text-lab-accent"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )
  }
}

/** Controls generated from a simulation's variable definitions. Changes go through validated runtime APIs. */
export function VariablePanel({ runtime, bare = false }: { runtime: AnySimulationRuntime; bare?: boolean }) {
  const { variables, status } = useRuntimeSnapshot(runtime)
  const [issue, setIssue] = useState<string | null>(null)
  const { definition } = runtime
  const locked = status === 'running'
  const explained = new Set(
    definition.explanations.flatMap((e) => (e.anchor.kind === 'variable' ? [e.anchor.id] : [])),
  )

  const report = (result: { ok: boolean; issues?: readonly { message: string }[] } | null) => {
    setIssue(result === null || result.ok ? null : (result.issues?.[0]?.message ?? 'Invalid value.'))
  }

  return (
    <Panel title="Conditions" bare={bare}>
      {definition.presets.length > 0 ? (
        <div className="mb-3">
          <p className="mb-1 text-[11px] text-lab-muted">Quick start</p>
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-wrap" aria-label="Presets">
            {definition.presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={locked}
                title={preset.description}
                onClick={() => {
                  report(applyPreset(runtime, preset.id))
                }}
                className="shrink-0 rounded-full border border-lab-line px-2.5 py-1 text-[11px] whitespace-nowrap text-lab-text transition-colors hover:border-lab-accent hover:text-lab-strong disabled:opacity-40"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="space-y-4">
        {definition.variables.map((def) => (
          <VariableControl
            key={def.id}
            def={def}
            value={variables[def.id]}
            disabled={locked}
            explained={explained.has(def.id)}
            onChange={(value) => {
              report(runtime.setVariables({ [def.id]: value }))
            }}
          />
        ))}
      </div>
      {locked ? <p className="mt-3 text-xs text-lab-muted">Pause or reset to change conditions.</p> : null}
      {issue ? (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {issue}
        </p>
      ) : null}
    </Panel>
  )
}
