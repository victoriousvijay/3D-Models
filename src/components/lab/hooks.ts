import { useEffect, useState } from 'react'
import type { AnySimulationRuntime, ExperimentLog, ExperimentRecord, RuntimeSnapshot } from '@/engine'

type Snapshot = RuntimeSnapshot<AnySimulationRuntime['definition']>

const READOUT_HZ = 10

/**
 * A runtime snapshot for UI readouts, refreshed at a human-readable rate
 * (10 Hz) plus immediately on lifecycle events. The 3D view never uses this;
 * it reads the runtime per frame.
 */
export function useRuntimeSnapshot(runtime: AnySimulationRuntime): Snapshot {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => runtime.getSnapshot())

  useEffect(() => {
    const refresh = () => {
      setSnapshot((previous) => {
        const next = runtime.getSnapshot()
        const unchanged =
          next.status === previous.status &&
          next.variables === previous.variables &&
          next.measurements === previous.measurements
        return unchanged ? previous : next
      })
    }
    const unsubscribe = [
      runtime.events.on('status', refresh),
      runtime.events.on('reset', refresh),
      runtime.events.on('stepped', refresh),
    ]
    const timer = setInterval(refresh, 1000 / READOUT_HZ)
    return () => {
      for (const off of unsubscribe) off()
      clearInterval(timer)
    }
  }, [runtime])

  return snapshot
}

/** Experiment records for one simulation, kept in sync with the log's events. */
export function useExperimentRecords(log: ExperimentLog, simulationId: string): readonly ExperimentRecord[] {
  const [records, setRecords] = useState(() => log.list(simulationId))

  useEffect(() => {
    const refresh = () => {
      setRecords(log.list(simulationId))
    }
    const offRecorded = log.events.on('recorded', refresh)
    const offRemoved = log.events.on('removed', refresh)
    return () => {
      offRecorded()
      offRemoved()
    }
  }, [log, simulationId])

  return records
}
