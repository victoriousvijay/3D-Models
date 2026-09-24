import { Info } from 'lucide-react'
import type { ExplanationAnchor } from '@/engine'
import { useLabStore } from '@/state/labStore'

/** Small inline button that focuses the explanation panel on an anchor. */
export function ExplainButton({ anchor, label }: { anchor: ExplanationAnchor; label: string }) {
  const focusExplanation = useLabStore((state) => state.focusExplanation)
  return (
    <button
      type="button"
      onClick={() => {
        focusExplanation(anchor)
      }}
      className="rounded text-lab-muted transition-colors hover:text-lab-accent"
      aria-label={`Explain ${label}`}
    >
      <Info className="size-3.5" aria-hidden />
    </button>
  )
}
