import type { OverlayDescriptor } from '@/simulations'
import { useLabStore } from '@/state/labStore'
import { Panel } from './Panel'

/** Legend for the view's overlays, doubling as visibility toggles. */
export function OverlayLegend({
  overlays,
  bare = false,
}: {
  overlays: readonly OverlayDescriptor[]
  bare?: boolean
}) {
  const hidden = useLabStore((state) => state.hiddenOverlays)
  const toggleOverlay = useLabStore((state) => state.toggleOverlay)
  if (overlays.length === 0) return null

  return (
    <Panel title="Show on screen" bare={bare}>
      <ul className="space-y-1">
        {overlays.map((overlay) => {
          const visible = !hidden.includes(overlay.id)
          return (
            <li key={overlay.id}>
              <button
                type="button"
                aria-pressed={visible}
                onClick={() => {
                  toggleOverlay(overlay.id)
                }}
                className="flex w-full items-start gap-2 rounded px-1 py-0.5 text-left transition-opacity hover:bg-lab-subtle/60 aria-[pressed=false]:opacity-45"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-0.5 w-4 shrink-0 rounded"
                  style={{ backgroundColor: overlay.color }}
                />
                <span>
                  <span className="block text-lab-text">{overlay.label}</span>
                  {overlay.note ? (
                    <span className="block text-[11px] text-lab-muted">{overlay.note}</span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
