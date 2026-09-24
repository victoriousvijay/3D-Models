/**
 * TEST FIXTURES — not product content.
 *
 * Deliberately domain-neutral models, one per model kind, that use only core
 * SI units. They prove the engine hosts any kind of science without depending
 * on a particular domain.
 */
import { defineDomain } from '../domains/defineDomain'
import { defineSimulation } from '../simulation/defineSimulation'
import { vec2 } from '../units/vectors'

export const fixtureDomain = defineDomain({
  id: 'fixture',
  title: 'Fixture domain',
  description: 'Engine test domain.',
  units: [],
})

export const DECAY_TIME_STEP = 1 / 240

const commonScene = { worldUnit: '1', camera: { position: [0, 0, 10], target: [0, 0, 0] } } as const

/**
 * Continuous: first-order exponential decay, N(t) = N₀·e^(−λt). The closed-form
 * update lets tests compare against exact values. First-order decay appears in
 * radioactivity, drug clearance and reaction kinetics alike.
 */
export const decayFixture = defineSimulation({
  id: 'decay-fixture',
  domain: 'fixture',
  title: 'Exponential decay (fixture)',
  description: 'Engine test fixture.',
  learningObjectives: [],
  assumptions: ['First-order process'],
  scene: commonScene,
  variables: [
    {
      kind: 'number',
      id: 'initialAmount',
      label: 'Initial amount',
      unit: '1',
      defaultValue: 1000,
      min: 1,
      max: 1e6,
      step: 1,
    },
    {
      kind: 'number',
      id: 'rate',
      label: 'Rate constant',
      unit: 's⁻¹',
      defaultValue: 0.5,
      min: 0.01,
      max: 10,
      step: 0.01,
    },
  ],
  measurements: [
    { kind: 'scalar', id: 'amount', label: 'Amount', unit: '1' },
    { kind: 'scalar', id: 'halfLife', label: 'Half-life', unit: 's' },
    {
      kind: 'category',
      id: 'phase',
      label: 'Phase',
      options: [
        { value: 'decaying', label: 'Decaying' },
        { value: 'depleted', label: 'Depleted' },
      ],
    },
  ],
  objects: [{ id: 'sample', label: 'Sample', selectable: true }],
  interactions: [{ id: 'select-sample', kind: 'select', targetObjectId: 'sample' }],
  presets: [{ id: 'fast', title: 'Fast decay', variables: { rate: 5 } }],
  explanations: [
    { id: 'about', anchor: { kind: 'simulation' }, title: 'About', body: 'Fixture text.', review: 'draft' },
    {
      id: 'rate',
      anchor: { kind: 'variable', id: 'rate' },
      title: 'Rate',
      body: 'Fixture text.',
      review: 'draft',
    },
    {
      id: 'sample',
      anchor: { kind: 'object', id: 'sample' },
      title: 'Sample',
      body: 'Fixture text.',
      review: 'draft',
    },
  ],
  investigations: [
    {
      id: 'speed-up',
      question: 'Fixture question?',
      hint: 'Fixture hint.',
      presetId: 'fast',
      review: 'draft',
    },
  ],
  model: {
    kind: 'continuous',
    fixedTimeStep: DECAY_TIME_STEP,
    createInitialState: (vars) => ({ t: 0, amount: vars.initialAmount }),
    step: (state, dt, vars) => {
      const t = state.t + dt
      return { t, amount: vars.initialAmount * Math.exp(-vars.rate * t) }
    },
    measure: (state, vars) => ({
      amount: state.amount,
      halfLife: Math.LN2 / vars.rate,
      phase: state.amount < 1 ? 'depleted' : 'decaying',
    }),
    isComplete: (state) => state.amount < 1,
  },
})

/** Discrete: a process that moves through a fixed number of stages. */
export const stagesFixture = defineSimulation({
  id: 'stages-fixture',
  domain: 'fixture',
  title: 'Staged process (fixture)',
  description: 'Engine test fixture.',
  learningObjectives: [],
  assumptions: [],
  scene: commonScene,
  variables: [
    {
      kind: 'number',
      id: 'stageCount',
      label: 'Stages',
      unit: '1',
      defaultValue: 4,
      min: 2,
      max: 10,
      step: 1,
    },
  ],
  measurements: [{ kind: 'scalar', id: 'stage', label: 'Stage', unit: '1' }],
  objects: [],
  interactions: [],
  presets: [],
  explanations: [],
  investigations: [],
  model: {
    kind: 'discrete',
    autoAdvanceInterval: 0.5,
    createInitialState: () => ({ stage: 0 }),
    advance: (state) => ({ stage: state.stage + 1 }),
    measure: (state) => ({ stage: state.stage }),
    isComplete: (state, vars) => state.stage >= vars.stageCount - 1,
  },
})

/** Static: state is a pure function of the variables (a point in a plane). */
export const pointFixture = defineSimulation({
  id: 'point-fixture',
  domain: 'fixture',
  title: 'Point (fixture)',
  description: 'Engine test fixture.',
  learningObjectives: [],
  assumptions: [],
  scene: { worldUnit: '1', camera: { position: [0, 0, 10], target: [0, 0, 0], projection: 'orthographic' } },
  variables: [
    { kind: 'number', id: 'x', label: 'x', unit: '1', defaultValue: 3, min: -10, max: 10, step: 0.1 },
    { kind: 'number', id: 'y', label: 'y', unit: '1', defaultValue: 4, min: -10, max: 10, step: 0.1 },
  ],
  measurements: [
    { kind: 'vector', id: 'point', label: 'Point', unit: '1', dimensions: 2 },
    { kind: 'scalar', id: 'distance', label: 'Distance from origin', unit: '1' },
  ],
  objects: [],
  interactions: [],
  presets: [],
  explanations: [],
  investigations: [],
  model: {
    kind: 'static',
    createInitialState: (vars) => ({ x: vars.x, y: vars.y }),
    measure: (state) => ({ point: vec2(state.x, state.y), distance: Math.hypot(state.x, state.y) }),
  },
})
