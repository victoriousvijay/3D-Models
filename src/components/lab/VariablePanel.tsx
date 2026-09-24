import { useState, type ReactNode } from 'react'
import type {
  AnySimulationRuntime,
  NumberVariableDefinition,
  VariableDefinition,
  VariableResolution,
  VariableValue,
} from '@/engine'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ExplainButton } from './ExplainButton'
import { formatInputValue, formatVariable, parseInputValue, unitSymbol } from './format'
import { useRuntimeSnapshot } from './hooks'
import { Panel } from './Panel'
import { applyPreset } from './presets'

/** Applies a change and returns a learner-readable problem, or `null` when it was accepted. */
type Apply = (value: VariableValue) => string | null

const firstIssue = (result: VariableResolution<unknown> | null): string | null =>
  result === null || result.ok ? null : (result.issues[0]?.message ?? 'Invalid value.')

interface ControlProps<D extends VariableDefinition> {
  def: D
  value: VariableValue | undefined
  disabled: boolean
  explained: boolean
  apply: Apply
}

function ControlLabel({ def, explained }: { def: VariableDefinition; explained: boolean }) {
  return (
    <span id={`variable-${def.id}`} className="flex items-center gap-1.5 text-lab-strong">
      {def.label}
      {explained ? <ExplainButton anchor={{ kind: 'variable', id: def.id }} label={def.label} /> : null}
    </span>
  )
}

function Help({ children }: { children: ReactNode }) {
  return children ? <p className="text-[11px] leading-snug text-lab-muted">{children}</p> : null
}

/** Slider plus a typed-entry box. Typing commits on Enter or when the box loses focus; Esc cancels. */
function NumberControl({ def, value, disabled, explained, apply }: ControlProps<NumberVariableDefinition>) {
  const current = typeof value === 'number' ? value : def.defaultValue
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const errorId = `variable-${def.id}-error`
  const unit = unitSymbol(def.unit)

  const commit = () => {
    if (draft === null) return
    const parsed = parseInputValue(draft)
    const problem =
      parsed === null
        ? `Enter a number between ${def.min} and ${def.max}${unit ? ` ${unit}` : ''}.`
        : apply(parsed)
    setError(problem)
    if (problem === null) setDraft(null)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <ControlLabel def={def} explained={explained} />
        <span className="flex items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${def.label}${unit ? ` in ${unit}` : ''}`}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            disabled={disabled}
            value={draft ?? formatInputValue(current, def.step)}
            onFocus={(event) => {
              event.currentTarget.select()
            }}
            onChange={(event) => {
              setDraft(event.currentTarget.value)
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commit()
                event.currentTarget.blur()
              } else if (event.key === 'Escape') {
                setDraft(null)
                setError(null)
                event.currentTarget.blur()
              }
            }}
            // 16px on touch screens stops iOS zooming into the field.
            className="w-20 rounded-md border border-lab-line bg-lab-bg px-2 py-1 text-right font-mono text-base text-lab-strong tabular-nums outline-none focus:border-lab-accent aria-invalid:border-red-500 disabled:opacity-50 lg:w-[4.5rem] lg:py-0.5 lg:text-xs"
          />
          {unit ? <span className="min-w-8 font-mono text-xs text-lab-muted">{unit}</span> : null}
        </span>
      </div>
      <Help>{def.description}</Help>
      <Slider
        className="py-2"
        value={[current]}
        min={def.min}
        max={def.max}
        step={def.step}
        disabled={disabled}
        thumbLabel={def.label}
        formatValueText={(v) => formatVariable(def, v)}
        onValueChange={(next: number | readonly number[]) => {
          const number = typeof next === 'number' ? next : next[0]
          if (typeof number !== 'number') return
          setDraft(null)
          setError(apply(number))
        }}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function VariableControl(props: ControlProps<VariableDefinition>) {
  const { def, value, disabled, explained, apply } = props
  switch (def.kind) {
    case 'number':
      return <NumberControl {...props} def={def} />
    case 'boolean':
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <ControlLabel def={def} explained={explained} />
            <Switch
              checked={value === true}
              disabled={disabled}
              aria-labelledby={`variable-${def.id}`}
              onCheckedChange={(checked) => {
                apply(checked)
              }}
            />
          </div>
          <Help>{def.description}</Help>
        </div>
      )
    case 'choice':
      return (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <ControlLabel def={def} explained={explained} />
            <span className="text-xs text-lab-strong">{formatVariable(def, value)}</span>
          </div>
          <Help>{def.description}</Help>
          <div role="radiogroup" aria-labelledby={`variable-${def.id}`} className="flex flex-wrap gap-1">
            {def.options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={value === option.value}
                disabled={disabled}
                onClick={() => {
                  apply(option.value)
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

/**
 * Controls generated from a simulation's variable definitions: a slider and a
 * typed-entry box for numbers, a switch for booleans, buttons for choices.
 * Every change goes through the runtime's validated `setVariables`.
 */
export function VariablePanel({ runtime, bare = false }: { runtime: AnySimulationRuntime; bare?: boolean }) {
  const { variables, status } = useRuntimeSnapshot(runtime)
  const [presetIssue, setPresetIssue] = useState<string | null>(null)
  const { definition } = runtime
  const locked = status === 'running'
  const explained = new Set(
    definition.explanations.flatMap((e) => (e.anchor.kind === 'variable' ? [e.anchor.id] : [])),
  )

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
                  setPresetIssue(firstIssue(applyPreset(runtime, preset.id)))
                }}
                className="shrink-0 rounded-full border border-lab-line px-2.5 py-1 text-[11px] whitespace-nowrap text-lab-text transition-colors hover:border-lab-accent hover:text-lab-strong disabled:opacity-40"
              >
                {preset.title}
              </button>
            ))}
          </div>
          {presetIssue ? (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {presetIssue}
            </p>
          ) : null}
        </div>
      ) : null}
      {locked ? <p className="mb-3 text-xs text-lab-muted">Pause or reset to change conditions.</p> : null}
      <div className="space-y-4">
        {definition.variables.map((def) => (
          <VariableControl
            key={def.id}
            def={def}
            value={variables[def.id]}
            disabled={locked}
            explained={explained.has(def.id)}
            apply={(value) => firstIssue(runtime.setVariables({ [def.id]: value }))}
          />
        ))}
      </div>
    </Panel>
  )
}
