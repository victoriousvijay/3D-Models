import { FlaskConical, X } from 'lucide-react'
import {
  explanationsFor,
  type AnySimulationDefinition,
  type AnySimulationRuntime,
  type ExplanationAnchor,
} from '@/engine'
import { useLabStore } from '@/state/labStore'
import { useRuntimeSnapshot } from './hooks'
import { Panel } from './Panel'
import { applyPreset } from './presets'

function anchorLabel(definition: AnySimulationDefinition, anchor: ExplanationAnchor): string | null {
  switch (anchor.kind) {
    case 'simulation':
      return null
    case 'object':
      return definition.objects.find((o) => o.id === anchor.id)?.label ?? null
    case 'variable':
      return definition.variables.find((v) => v.id === anchor.id)?.label ?? null
    case 'measurement':
      return definition.measurements.find((m) => m.id === anchor.id)?.label ?? null
  }
}

/** "Try this": open questions that send the learner into an experiment. */
function Investigations({ runtime }: { runtime: AnySimulationRuntime }) {
  const { status } = useRuntimeSnapshot(runtime)
  const { investigations } = runtime.definition
  if (investigations.length === 0) return null

  return (
    <section aria-label="Try this" className="space-y-2">
      <h3 className="flex items-center gap-1.5 font-medium text-lab-strong">
        <FlaskConical className="size-4 text-lab-accent" aria-hidden />
        Try this
      </h3>
      <ol className="space-y-2">
        {investigations.map((investigation) => (
          <li key={investigation.id} className="rounded-md bg-lab-panel/80 p-2.5">
            <p className="font-medium text-lab-strong">{investigation.question}</p>
            <p className="mt-1 text-xs leading-relaxed text-lab-muted">{investigation.hint}</p>
            {investigation.presetId ? (
              <button
                type="button"
                disabled={status === 'running'}
                onClick={() => {
                  if (investigation.presetId) applyPreset(runtime, investigation.presetId)
                }}
                className="mt-2 rounded-full border border-lab-accent/60 px-2.5 py-1 text-[11px] text-lab-accent transition-colors hover:bg-lab-accent/10 disabled:opacity-40"
              >
                Set it up
              </button>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * Contextual teaching content: "Try this" questions, then explanations that
 * follow what the learner selects or asks about, then objectives and the
 * model's assumptions.
 */
export function ExplanationPanel({
  runtime,
  bare = false,
}: {
  runtime: AnySimulationRuntime
  bare?: boolean
}) {
  const { definition } = runtime
  const focus = useLabStore((state) => state.explanationFocus)
  const focusExplanation = useLabStore((state) => state.focusExplanation)
  const selectObject = useLabStore((state) => state.selectObject)

  const anchor: ExplanationAnchor = focus ?? { kind: 'simulation' }
  const focused = explanationsFor(definition, anchor)
  const explanations = focused.length > 0 ? focused : explanationsFor(definition, { kind: 'simulation' })
  const label = focused.length > 0 ? anchorLabel(definition, anchor) : null
  const hasDraft =
    definition.explanations.some((e) => e.review === 'draft') ||
    definition.investigations.some((i) => i.review === 'draft')

  return (
    <Panel
      title={label ?? 'About this experiment'}
      bare={bare}
      className={bare ? undefined : 'max-h-[calc(100dvh-10rem)] overflow-y-auto'}
      actions={
        focus ? (
          <button
            type="button"
            aria-label="Back to overview"
            className="text-lab-muted hover:text-lab-strong"
            onClick={() => {
              focusExplanation(null)
              selectObject(null)
            }}
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null
      }
    >
      <div aria-live="polite" className="space-y-3">
        {explanations.map((explanation) => (
          <article key={explanation.id} className="space-y-1.5">
            <h3 className="font-medium text-lab-strong">{explanation.title}</h3>
            {explanation.body.split(/\n\s*\n/).map((paragraph, i) => (
              <p key={i} className="leading-relaxed text-lab-text">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>

      {!focus ? (
        <div className="mt-4">
          <Investigations runtime={runtime} />
        </div>
      ) : null}

      {!focus && definition.learningObjectives.length > 0 ? (
        <details className="mt-3 border-t border-lab-subtle pt-2">
          <summary className="cursor-pointer text-xs text-lab-muted">What you will learn</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-lab-text">
            {definition.learningObjectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </details>
      ) : null}

      <details className="mt-3 border-t border-lab-subtle pt-2">
        <summary className="cursor-pointer text-xs text-lab-muted">How this model simplifies reality</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-lab-text">
          {definition.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>

      {hasDraft ? (
        <p className="mt-3 text-[11px] text-lab-muted italic">
          Draft learning content — awaiting review by a subject expert.
        </p>
      ) : null}
    </Panel>
  )
}
