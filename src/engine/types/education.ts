/**
 * Education engine contracts. Teaching content is declarative data anchored
 * to ids the simulation already declares, so it is validated at registration
 * and never contains executable code.
 */

export type ExplanationAnchor =
  | { readonly kind: 'simulation' }
  | { readonly kind: 'object'; readonly id: string }
  | { readonly kind: 'variable'; readonly id: string }
  | { readonly kind: 'measurement'; readonly id: string }

/**
 * `draft` content has been written but not yet checked by a subject expert;
 * the UI labels it as such. Only `reviewed` content should ship to learners
 * without that label.
 */
export type ContentReviewStatus = 'draft' | 'reviewed'

export interface Explanation {
  readonly id: string
  readonly anchor: ExplanationAnchor
  readonly title: string
  /** Plain text. Paragraphs are separated by blank lines. */
  readonly body: string
  readonly review: ContentReviewStatus
}

/**
 * An open question that invites the learner to experiment ("Which angle
 * sends the ball farthest?"). It poses the question and suggests how to
 * investigate; it deliberately does not state the answer.
 */
export interface Investigation {
  readonly id: string
  readonly question: string
  /** How to go about it, in plain language. */
  readonly hint: string
  /** Optional preset that sets up the starting conditions. */
  readonly presetId?: string
  readonly review: ContentReviewStatus
}
