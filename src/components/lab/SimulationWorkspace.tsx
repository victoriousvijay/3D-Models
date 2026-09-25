import { cn } from 'cn'
import { useState } from 'react'
import type { AnySimulationRuntime, ExperimentLog } from '@/engine'
import type { SimulationPackage } from '@/simulations'
import { useLabStore } from '@/state/labStore'
import { ExperimentPanel } from './ExperimentPanel'
import { ExplanationPanel } from './ExplanationPanel'
import { useExperimentRecords } from './hooks'
import { KeyResults } from './KeyResults'
import { MeasurementPanel } from './MeasurementPanel'
import { OverlayLegend } from './OverlayLegend'
import { TransportBar } from './TransportBar'
import { useMediaQuery, WIDE_LAYOUT_QUERY } from './useMediaQuery'
import { VariablePanel } from './VariablePanel'

interface WorkspaceProps {
  pkg: SimulationPackage
  runtime: AnySimulationRuntime
  experiments: ExperimentLog
}

/** Wide screens: instrument panels float over the full-screen 3D lab. */
function FloatingWorkspace({ pkg, runtime, experiments }: WorkspaceProps) {
  const panelsHidden = useLabStore((state) => state.panelsHidden)
  if (panelsHidden) {
    return (
      <div className="group/tone pointer-events-none absolute inset-0" data-tone={pkg.sceneTone}>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <TransportBar runtime={runtime} />
        </div>
      </div>
    )
  }
  return (
    // data-tone: panels turn near-opaque over dark scenes so they stay legible.
    <div className="group/tone pointer-events-none absolute inset-0" data-tone={pkg.sceneTone}>
      <div className="absolute top-24 bottom-40 left-4 flex w-80 flex-col">
        <ExplanationPanel runtime={runtime} />
      </div>

      <div className="absolute top-4 right-4 bottom-24 flex w-80 flex-col gap-3 overflow-y-auto">
        {/* Results first: they are what the learner is looking for after every run. */}
        <MeasurementPanel runtime={runtime} />
        <VariablePanel runtime={runtime} />
        <OverlayLegend overlays={pkg.overlays} />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <TransportBar runtime={runtime} />
      </div>

      <div className="absolute bottom-4 left-4">
        <ExperimentPanel runtime={runtime} log={experiments} />
      </div>
    </div>
  )
}

const TABS = [
  { id: 'controls', label: 'Controls' },
  { id: 'results', label: 'Results' },
  { id: 'learn', label: 'Learn' },
  { id: 'trials', label: 'Trials' },
] as const
type TabId = (typeof TABS)[number]['id']

/**
 * Phones and tablets: the 3D lab stays on top, and a bottom sheet holds the
 * key results (always visible), the run controls and tabbed panels. Tapping
 * the open tab collapses the sheet to give the scene more room.
 */
function SheetWorkspace({ pkg, runtime, experiments }: WorkspaceProps) {
  const [tab, setTab] = useState<TabId>('controls')
  const [expanded, setExpanded] = useState(true)
  const trialCount = useExperimentRecords(experiments, runtime.definition.id).length

  return (
    <section
      aria-label="Lab controls"
      className="relative z-10 shrink-0 border-t border-lab-subtle bg-lab-bg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="space-y-3 px-3 pt-3">
        <KeyResults runtime={runtime} compact />
        <TransportBar runtime={runtime} compact />
      </div>

      <div role="tablist" aria-label="Panels" className="mt-3 flex border-b border-lab-subtle px-1">
        {TABS.map(({ id, label }) => {
          const selected = tab === id
          return (
            <button
              key={id}
              id={`tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="sheet-panel"
              aria-expanded={selected ? expanded : undefined}
              onClick={() => {
                if (selected) setExpanded(!expanded)
                else {
                  setTab(id)
                  setExpanded(true)
                }
              }}
              className={cn(
                '-mb-px flex-1 border-b-2 px-1 py-2.5 text-sm transition-colors',
                selected && expanded
                  ? 'border-lab-accent text-lab-strong'
                  : 'border-transparent text-lab-muted hover:text-lab-text',
              )}
            >
              {label}
              {id === 'trials' && trialCount > 0 ? (
                <span className="ml-1 rounded-full bg-lab-subtle px-1.5 text-[10px] text-lab-strong">
                  {trialCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {expanded ? (
        <div
          id="sheet-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="max-h-[38dvh] overflow-y-auto overscroll-contain px-3 py-3"
        >
          {tab === 'controls' ? <VariablePanel runtime={runtime} bare /> : null}
          {tab === 'results' ? (
            <div className="space-y-4">
              <MeasurementPanel runtime={runtime} bare />
              <OverlayLegend overlays={pkg.overlays} bare />
            </div>
          ) : null}
          {tab === 'learn' ? <ExplanationPanel runtime={runtime} bare /> : null}
          {tab === 'trials' ? <ExperimentPanel runtime={runtime} log={experiments} bare /> : null}
        </div>
      ) : null}
    </section>
  )
}

/**
 * The instrument layer over the 3D lab for any open simulation. Everything
 * here is generated from the definition and runtime; no simulation-specific UI.
 */
export function SimulationWorkspace(props: WorkspaceProps) {
  const wide = useMediaQuery(WIDE_LAYOUT_QUERY)
  return wide ? <FloatingWorkspace {...props} /> : <SheetWorkspace {...props} />
}
