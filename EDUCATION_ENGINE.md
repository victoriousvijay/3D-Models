# Education Engine Specification

Status: **first slice built** (Phase 1).

- `learningObjectives`, `assumptions` and `explanations` are required fields on every simulation
  definition.
- `Explanation` (`src/engine/types/education.ts`) is anchored to the simulation, an object, a
  variable or a measurement. It carries a `review` status (`draft` | `reviewed`), and the UI labels
  draft content. Anchors, ids and non-empty text are validated at registration
  (`validateExplanations`).
- The `ExplanationPanel` follows the learner's focus: a selected object, or an info button next to
  a variable or measurement. It falls back to the overview and always offers objectives and
  assumptions.
- Projectile Motion ships 8 explanations, all `draft` and awaiting subject-expert review.
- **Investigations ("Try this")**: `Investigation` pairs an open question with a plain-language
  hint and an optional preset (`presetId`, validated). Investigations pose questions and never
  state the answer, so learners discover it by experimenting. Projectile Motion ships 5, all
  `draft`.
- **Plain-language helper text**: variable and measurement `description`s appear under each
  control and result. Learner-facing labels use everyday words ("Time in the air", "Highest
  point"); vectors sit under "More details".

Not yet built: `concept` anchors (they need a concept registry), guided steps, hints and
assessments.

## Responsibility

Connect what the learner sees and does to the underlying science, for every domain, without
putting teaching content inside rendering or engine code.

## Principles

- **Experiment first.** Guidance points learners toward changing variables and observing outcomes.
  It does not replace doing the experiment.
- **Explicit simplifications.** Every model states its `assumptions`. Learners and the AI tutor see
  them. A simplified model is never presented as exact.
- **Content is data.** Explanations, steps and questions are declarative data validated like
  simulation definitions. They are never executable code (SECURITY.md).
- **No fabricated content.** Educational text is written or reviewed by a subject expert. It is
  not generated to fill space.

## Content Model

| Element            | Anchored to                            | Purpose                                              |
| ------------------ | -------------------------------------- | ---------------------------------------------------- |
| Learning objective | simulation                             | What the learner should be able to do afterwards     |
| Assumption         | simulation                             | Simplification in the model (built)                  |
| Explanation        | object, variable, measurement, concept | Contextual "what is this / why does it change"       |
| Equation reference | variable / measurement                 | Links a quantity to the relationship that governs it |
| Guided experiment  | simulation                             | Ordered steps: set → run → observe → reflect         |
| Hint               | step / misconception                   | Progressive nudges before answers                    |
| Assessment item    | objective                              | Checks understanding; results go to progress         |

Anchors use the ids already declared in the definition (object, variable and measurement ids), so
content is validated against the simulation at registration: a broken reference fails at startup.

## Planned Contracts

```ts
interface Explanation {
  id: string
  anchor:
    | { kind: 'object'; id: string }
    | { kind: 'variable'; id: string }
    | { kind: 'measurement'; id: string }
    | { kind: 'concept'; id: string }
  title: string
  body: string // plain text or a restricted, sanitised markup subset
}

interface GuidedStep {
  id: string
  instruction: string
  expects?:
    | { kind: 'variable'; id: string; range?: [number, number] }
    | { kind: 'status'; status: 'completed' }
    | { kind: 'measurement-observed'; id: string }
}
```

Step completion is evaluated against runtime snapshots and events, never by polling React state.

## Relationship to Other Engines

- **Rendering** shows explanations as contextual labels and panels, not permanent text walls.
- **Experiments**: guided steps may record experiments automatically.
- **AI Tutor**: `explainObject` and `explainConcept` first return authored explanations, then
  elaborate. Objectives, assumptions and step state are part of the tutor's context.
- **Persistence**: objective and assessment progress (DATABASE.md).

## Domain Neutrality

The model knows only ids, anchors and text. Physics equations, chemical mechanisms, anatomical
descriptions and mathematical proofs are all content, never code paths.
