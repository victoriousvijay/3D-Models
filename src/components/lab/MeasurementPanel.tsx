import type { AnySimulationRuntime } from '@/engine'
import { ExplainButton } from './ExplainButton'
import { formatMeasurement } from './format'
import { useRuntimeSnapshot } from './hooks'
import { KeyResults } from './KeyResults'
import { Panel } from './Panel'

/**
 * Headline results first; every other measurement one tap away under
 * "More details", so learners are not faced with vectors straight away.
 */
export function MeasurementPanel({
  runtime,
  bare = false,
}: {
  runtime: AnySimulationRuntime
  bare?: boolean
}) {
  const { measurements } = useRuntimeSnapshot(runtime)
  const { definition } = runtime
  const explained = new Set(
    definition.explanations.flatMap((e) => (e.anchor.kind === 'measurement' ? [e.anchor.id] : [])),
  )
  const primary = definition.measurements.filter((m) => m.emphasis === 'primary')
  const details = definition.measurements.filter((m) => m.emphasis !== 'primary')

  return (
    <Panel title="Results" bare={bare}>
      {primary.length > 0 && !bare ? <KeyResults runtime={runtime} /> : null}
      {primary.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-lab-muted">
          {primary.map((def) => (
            <li key={def.id} className="flex items-start gap-1.5">
              <span>
                <span className="text-lab-text">{def.label}:</span> {def.description}
              </span>
              {explained.has(def.id) ? (
                <ExplainButton anchor={{ kind: 'measurement', id: def.id }} label={def.label} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {details.length > 0 ? (
        <details className="mt-3 border-t border-lab-subtle pt-2" open={primary.length === 0}>
          <summary className="cursor-pointer text-xs text-lab-muted">More details</summary>
          <dl className="mt-2 space-y-1.5">
            {details.map((def) => (
              <div key={def.id} className="flex items-baseline justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-lab-text">
                  {def.label}
                  {explained.has(def.id) ? (
                    <ExplainButton anchor={{ kind: 'measurement', id: def.id }} label={def.label} />
                  ) : null}
                </dt>
                <dd
                  data-measurement={def.id}
                  className="text-right font-mono text-xs whitespace-nowrap text-lab-strong tabular-nums"
                >
                  {formatMeasurement(def, measurements[def.id])}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </Panel>
  )
}
