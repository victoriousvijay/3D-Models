import { cn } from 'cn'
import { Focus, Hand, PanelsTopLeft, PenLine, Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { useState } from 'react'
import type { AnySimulationRuntime, RunProgress } from '@/engine'
import { Button } from '@/components/ui/button'
import { useAnnotationStore } from '@/state/annotationStore'
import { useLabStore } from '@/state/labStore'
import { formatNumber } from './format'
import { useRuntimeSnapshot } from './hooks'

const TIME_SCALES = [0.25, 0.5, 1, 2] as const

const toggledClass = 'aria-pressed:bg-lab-accent/15 aria-pressed:text-lab-accent'

/**
 * View tools shared by every lab: grab mode (drag moves the view, wheel zooms
 * to the cursor), reset view and — on wide screens — hide all panels.
 */
function ViewTools({ compact }: { compact: boolean }) {
  const grabMode = useLabStore((state) => state.grabMode)
  const panelsHidden = useLabStore((state) => state.panelsHidden)
  const toggleGrabMode = useLabStore((state) => state.toggleGrabMode)
  const togglePanels = useLabStore((state) => state.togglePanels)
  const resetView = useLabStore((state) => state.resetView)
  const annotating = useAnnotationStore((state) => state.active)
  const toggleAnnotating = useAnnotationStore((state) => state.toggle)
  const size = compact ? 'icon-lg' : 'icon'
  return (
    <div role="group" aria-label="View" className="flex items-center gap-1">
      <Button
        variant="ghost"
        size={size}
        aria-label="Annotate"
        aria-pressed={annotating}
        title={annotating ? 'Close annotation tools' : 'Annotate: draw on the lab'}
        className={toggledClass}
        onClick={toggleAnnotating}
      >
        <PenLine aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size={size}
        aria-label="Grab mode"
        aria-pressed={grabMode}
        title={
          grabMode
            ? 'Grab mode on: drag to move the view, scroll to zoom'
            : 'Grab mode: drag to move the view'
        }
        className={toggledClass}
        onClick={toggleGrabMode}
      >
        <Hand aria-hidden />
      </Button>
      <Button variant="ghost" size={size} aria-label="Reset view" title="Reset view" onClick={resetView}>
        <Focus aria-hidden />
      </Button>
      {compact ? null : (
        <Button
          variant="ghost"
          size={size}
          aria-label={panelsHidden ? 'Show panels' : 'Hide panels'}
          aria-pressed={panelsHidden}
          title={panelsHidden ? 'Show panels' : 'Hide panels'}
          className={toggledClass}
          onClick={togglePanels}
        >
          <PanelsTopLeft aria-hidden />
        </Button>
      )}
    </div>
  )
}

function progressText(progress: RunProgress): string {
  switch (progress.kind) {
    case 'time':
      return `t = ${formatNumber(progress.seconds)} s`
    case 'stages':
      return `stage ${progress.count}`
    case 'none':
      return ''
  }
}

/**
 * Lifecycle controls for any dynamic simulation: run, pause, step, reset,
 * playback speed. `compact` is the touch layout: a large primary button and a
 * single tap-to-cycle speed control.
 */
export function TransportBar({
  runtime,
  compact = false,
}: {
  runtime: AnySimulationRuntime
  compact?: boolean
}) {
  const { status, progress } = useRuntimeSnapshot(runtime)
  const [timeScale, setTimeScale] = useState(runtime.timeScale)
  const chrome =
    'pointer-events-auto flex items-center gap-2 rounded-lg border border-lab-line/70 bg-lab-bg/80 p-1.5 shadow-lg backdrop-blur-sm group-data-[tone=dark]/tone:bg-lab-bg/95'
  // Static labs (nothing to run) still get the view tools.
  if (!runtime.isDynamic) {
    return (
      <div
        role="toolbar"
        aria-label="Simulation controls"
        className={cn(chrome, compact && 'border-0 bg-transparent p-0 shadow-none')}
      >
        <ViewTools compact={compact} />
      </div>
    )
  }

  const primary =
    status === 'running'
      ? { label: 'Pause', icon: Pause, action: () => runtime.pause() }
      : status === 'paused'
        ? { label: 'Resume', icon: Play, action: () => runtime.resume() }
        : status === 'ready'
          ? { label: 'Start', icon: Play, action: () => runtime.start() }
          : {
              label: 'Run again',
              icon: Play,
              action: () => {
                runtime.reset()
                return runtime.start()
              },
            }

  const changeSpeed = (scale: number) => {
    if (runtime.setTimeScale(scale)) setTimeScale(scale)
  }
  const nextScale =
    TIME_SCALES[(TIME_SCALES.indexOf(timeScale as (typeof TIME_SCALES)[number]) + 1) % TIME_SCALES.length] ??
    1

  return (
    <div
      role="toolbar"
      aria-label="Simulation controls"
      className={cn(
        'pointer-events-auto flex items-center gap-2',
        !compact &&
          'rounded-lg border border-lab-line/70 bg-lab-bg/80 p-1.5 shadow-lg backdrop-blur-sm group-data-[tone=dark]/tone:bg-lab-bg/95',
      )}
    >
      <Button onClick={primary.action} className={compact ? 'h-10 flex-1 text-base' : 'min-w-28'}>
        <primary.icon aria-hidden />
        {primary.label}
      </Button>
      <Button
        variant="ghost"
        size={compact ? 'icon-lg' : 'icon'}
        aria-label="Step once"
        title="Step once"
        disabled={status !== 'ready' && status !== 'paused'}
        onClick={() => runtime.stepOnce()}
      >
        <StepForward aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size={compact ? 'icon-lg' : 'icon'}
        aria-label="Reset"
        title="Reset"
        onClick={() => runtime.reset()}
      >
        <RotateCcw aria-hidden />
      </Button>

      {compact ? (
        <button
          type="button"
          aria-label={`Playback speed ${timeScale}×, tap to change`}
          onClick={() => {
            changeSpeed(nextScale)
          }}
          className="h-10 min-w-12 rounded-md border border-lab-line px-2 font-mono text-xs text-lab-strong"
        >
          {timeScale}×
        </button>
      ) : (
        <div role="group" aria-label="Playback speed" className="ml-1 flex rounded-md border border-lab-line">
          {TIME_SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              aria-pressed={timeScale === scale}
              onClick={() => {
                changeSpeed(scale)
              }}
              className="px-2 py-1 font-mono text-[11px] text-lab-muted aria-pressed:bg-lab-subtle aria-pressed:text-lab-strong"
            >
              {scale}×
            </button>
          ))}
        </div>
      )}

      {compact ? null : (
        <span className="min-w-24 px-2 text-right font-mono text-xs text-lab-text tabular-nums">
          {progressText(progress)}
        </span>
      )}
      <span aria-hidden className={cn('h-6 w-px bg-lab-line', compact && 'hidden')} />
      <ViewTools compact={compact} />
      {status === 'faulted' ? (
        <span role="alert" className="px-2 text-xs text-red-600">
          The model produced an invalid result. Reset to continue.
        </span>
      ) : null}
    </div>
  )
}
