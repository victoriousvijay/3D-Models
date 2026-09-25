import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  compareExperiments,
  type AnySimulationRuntime,
  type ExperimentLog,
  type ExperimentRecord,
} from '@/engine'
import { Button } from '@/components/ui/button'
import { formatMeasurement, formatNumber, formatVariable, unitSymbol } from './format'
import { useExperimentRecords, useRuntimeSnapshot } from './hooks'
import { Panel } from './Panel'

function Comparison({
  runtime,
  a,
  b,
}: {
  runtime: AnySimulationRuntime
  a: ExperimentRecord
  b: ExperimentRecord
}) {
  const { definition } = runtime
  const result = compareExperiments(a, b)
  const changedVariables = result.variables.filter((v) => v.changed)

  return (
    <div className="mt-3 border-t border-lab-subtle pt-2 text-xs" aria-label="Comparison">
      <p className="mb-1 text-lab-muted">
        {a.label} → {b.label}
      </p>
      {changedVariables.length === 0 ? (
        <p className="text-lab-muted">Same conditions in both trials.</p>
      ) : (
        <ul className="mb-2 space-y-0.5">
          {changedVariables.map((change) => {
            const def = definition.variables.find((v) => v.id === change.id)
            return def ? (
              <li key={change.id} className="text-lab-text">
                {def.label}: {formatVariable(def, change.a)} → {formatVariable(def, change.b)}
              </li>
            ) : null
          })}
        </ul>
      )}
      <table className="w-full">
        <tbody>
          {result.measurements.map((m) => {
            const def = definition.measurements.find((d) => d.id === m.id)
            if (def?.kind !== 'scalar' || typeof m.difference !== 'number') return null
            const sign = m.difference > 0 ? '+' : ''
            return (
              <tr key={m.id}>
                <td className="py-0.5 text-lab-text">{def.label}</td>
                <td className="py-0.5 text-right font-mono text-lab-strong tabular-nums">
                  {sign}
                  {formatNumber(m.difference)} {unitSymbol(def.unit)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Record trials and compare any two. Records hold the full conditions and
 * measurements, so a trial is reproducible from its record alone.
 */
export function ExperimentPanel({
  runtime,
  log,
  bare = false,
}: {
  runtime: AnySimulationRuntime
  log: ExperimentLog
  bare?: boolean
}) {
  const { definition } = runtime
  const { status } = useRuntimeSnapshot(runtime)
  const records = useExperimentRecords(log, definition.id)
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState<readonly string[]>([])

  const headline = definition.measurements.filter((m) => m.kind === 'scalar').slice(0, 3)
  const pair = selected.map((id) => records.find((r) => r.id === id)).filter((r) => r !== undefined)

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id].slice(-2),
    )
  }

  return (
    <Panel
      title={`My trials (${records.length})`}
      bare={bare}
      collapsible={false}
      className={bare ? undefined : 'w-80'}
      actions={
        bare ? null : (
          <button
            type="button"
            aria-label={open ? 'Collapse experiments' : 'Expand experiments'}
            aria-expanded={open}
            onClick={() => {
              setOpen(!open)
            }}
            className="text-lab-muted hover:text-lab-strong"
          >
            {open ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronUp className="size-4" aria-hidden />
            )}
          </button>
        )
      }
    >
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={status === 'running'}
        onClick={() => {
          log.record(runtime.getSnapshot(), `Trial ${records.length + 1}`)
        }}
      >
        Record trial
      </Button>

      {open || bare ? (
        <>
          {records.length === 0 ? (
            <p className="mt-2 text-xs text-lab-muted">
              Run the simulation, then press “Record trial” to save the result. Save a few and tick two to
              compare them.
            </p>
          ) : (
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto" aria-label="Recorded trials">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="flex items-start gap-2 rounded px-1 py-1 hover:bg-lab-subtle/50"
                >
                  <input
                    type="checkbox"
                    aria-label={`Compare ${record.label ?? 'trial'}`}
                    checked={selected.includes(record.id)}
                    onChange={() => {
                      toggle(record.id)
                    }}
                    className="mt-0.5 accent-lab-accent"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="text-lab-strong">{record.label}</p>
                    <p className="truncate text-lab-muted">
                      {definition.variables
                        .filter((v) => v.kind === 'number')
                        .map((v) => formatVariable(v, record.variables[v.id]))
                        .join(' · ')}
                    </p>
                    <p className="font-mono text-lab-text tabular-nums">
                      {headline.map((m) => formatMeasurement(m, record.measurements[m.id])).join(' · ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${record.label ?? 'trial'}`}
                    onClick={() => {
                      log.remove(record.id)
                      setSelected((current) => current.filter((id) => id !== record.id))
                    }}
                    className="text-lab-muted hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {pair.length === 2 && pair[0] && pair[1] ? (
            <Comparison runtime={runtime} a={pair[0]} b={pair[1]} />
          ) : records.length >= 2 ? (
            <p className="mt-2 text-[11px] text-lab-muted">Tick two trials to compare them.</p>
          ) : null}
        </>
      ) : null}
    </Panel>
  )
}
