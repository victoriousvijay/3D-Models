import { cn } from 'cn'
import type { AnySimulationRuntime, SimulationStatus } from '@/engine'
import { formatMeasurement } from './format'
import { useRuntimeSnapshot } from './hooks'

function prompt(status: SimulationStatus, dynamic: boolean): string {
  switch (status) {
    case 'ready':
      return dynamic ? 'Set the conditions, then press Start.' : 'Change the conditions to explore.'
    case 'running':
      return 'Running…'
    case 'paused':
      return 'Paused.'
    case 'completed':
      return 'Finished! Record this trial to compare it with others.'
    case 'faulted':
      return 'Something went wrong. Press Reset.'
    case 'destroyed':
      return ''
  }
}

/**
 * The headline results of an experiment (measurements declared with
 * `emphasis: 'primary'`), large and always visible, with a one-line prompt
 * telling the learner what to do next.
 */
export function KeyResults({
  runtime,
  compact = false,
}: {
  runtime: AnySimulationRuntime
  compact?: boolean
}) {
  const { measurements, status } = useRuntimeSnapshot(runtime)
  const primary = runtime.definition.measurements.filter((m) => m.emphasis === 'primary')
  if (primary.length === 0) return null

  return (
    <div aria-label="Key results" role="group">
      <p
        className={cn('text-xs', status === 'completed' ? 'text-lab-accent' : 'text-lab-muted')}
        aria-live="polite"
      >
        {prompt(status, runtime.isDynamic)}
      </p>
      <dl className={cn('mt-2 grid gap-2', primary.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {primary.map((def) => (
          <div key={def.id} className="min-w-0 rounded-md bg-lab-panel/80 px-2 py-1.5">
            <dt className="text-[11px] leading-tight text-lab-muted">{def.label}</dt>
            <dd
              data-measurement={def.id}
              className={cn(
                'font-mono font-medium text-lab-strong tabular-nums',
                compact ? 'text-sm' : 'text-base',
              )}
            >
              {formatMeasurement(def, measurements[def.id])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
