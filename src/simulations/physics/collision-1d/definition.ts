import { defineSimulation } from '@/engine'
import { kineticEnergy, momentum } from '@/domains/physics'
import { clean, createInitialState, GLIDER_LENGTH, START_A, START_B, step } from './model'

export const COLLISION_TIME_STEP = 1 / 240

/** Shared by both velocity variables; the exported variables let dragging an arrow use the slider's limits. */
const velocityLimits = { unit: 'm/s', min: -1.5, max: 1.5, step: 0.05 } as const

export const velocityAVariable = {
  kind: 'number',
  id: 'velocityA',
  label: 'Initial velocity of A',
  description: 'How fast glider A starts moving. Positive is to the right, negative to the left.',
  defaultValue: 1,
  ...velocityLimits,
} as const

export const velocityBVariable = {
  kind: 'number',
  id: 'velocityB',
  label: 'Initial velocity of B',
  description: 'How fast glider B starts moving. 0 means it waits at rest to be hit.',
  defaultValue: 0,
  ...velocityLimits,
} as const

const massLimits = { unit: 'kg', min: 0.1, max: 2, step: 0.05, defaultValue: 0.5 } as const

export const collision1d = defineSimulation({
  id: 'collision-1d',
  domain: 'physics',
  title: '1D Collision',
  description:
    'Collide two gliders on an air track and compare momentum and kinetic energy before and after the collision.',
  learningObjectives: [
    'Verify that the total momentum of two colliding bodies is the same before, during and after the collision.',
    'Distinguish elastic, inelastic and perfectly inelastic collisions by what happens to the total kinetic energy.',
    'Predict the outcome of special cases: equal masses, a heavy target, a light target and bodies that stick together.',
    'Use the coefficient of restitution e = (v_B − v_A)/(u_A − u_B) to describe how bouncy a collision is.',
  ],
  assumptions: [
    'The air track is level and frictionless: no friction, air drag or other external horizontal force acts, so momentum is exactly conserved.',
    'Motion is only along the track (one dimension). Positive velocity is to the right.',
    'The gliders are rigid; only their bumpers deform. A bumper is a linear spring (k = 5000 N/m) with a damper tuned to the chosen bounciness, and the contact is solved exactly — no numerical integration.',
    'Elastic: steel spring bumpers, e = 1. Inelastic: soft bumpers that return part of the relative speed (you choose e). Perfectly inelastic: a putty pad that dents permanently and locks the gliders together once they move at the same velocity.',
    `Gliders start at ${START_A.toFixed(2)} m and ${START_B.toFixed(2)} m, and are ${GLIDER_LENGTH.toFixed(2)} m long including bumpers. Starting positions never change the outcome, only when the collision happens.`,
    'The run ends when a glider reaches an end stop; bounces off the end stops are not modelled.',
    'Everything is drawn to scale, including the bumper compression (a few millimetres to centimetres).',
  ],
  // Side-on, slightly raised: the natural view of motion along one line. The whole
  // 3 m track fits between the desktop side panels; narrower screens pull back automatically.
  scene: { worldUnit: 'm', camera: { position: [1.5, 1.55, 5.05], target: [1.5, 0.3, 0], fov: 40 } },
  variables: [
    {
      kind: 'number',
      id: 'massA',
      label: 'Mass of A',
      description: 'Mass of the left glider (blue).',
      ...massLimits,
    },
    {
      kind: 'number',
      id: 'massB',
      label: 'Mass of B',
      description: 'Mass of the right glider (orange).',
      ...massLimits,
    },
    velocityAVariable,
    velocityBVariable,
    {
      kind: 'choice',
      id: 'collisionType',
      label: 'Collision type',
      description: 'Which bumpers the gliders wear. This decides what happens to the kinetic energy.',
      defaultValue: 'elastic',
      options: [
        { value: 'elastic', label: 'Elastic (spring bumpers)' },
        { value: 'inelastic', label: 'Inelastic (soft bumpers)' },
        { value: 'perfectly-inelastic', label: 'Perfectly inelastic (sticky)' },
      ],
    },
    {
      kind: 'number',
      id: 'restitution',
      label: 'Bounciness e',
      description:
        'For inelastic collisions only: the fraction of the approach speed the gliders separate with. 1 would be elastic, 0 sticky.',
      unit: '1',
      defaultValue: 0.5,
      min: 0.05,
      max: 0.95,
      step: 0.05,
    },
  ],
  measurements: [
    {
      kind: 'scalar',
      id: 'velocityA',
      label: 'Velocity of A',
      description: 'Glider A’s velocity now. After the collision this is its final velocity v_A.',
      unit: 'm/s',
      emphasis: 'primary',
    },
    {
      kind: 'scalar',
      id: 'velocityB',
      label: 'Velocity of B',
      description: 'Glider B’s velocity now. After the collision this is its final velocity v_B.',
      unit: 'm/s',
      emphasis: 'primary',
    },
    {
      kind: 'scalar',
      id: 'totalMomentum',
      label: 'Total momentum',
      description: 'p_A + p_B. Watch it stay the same before, during and after the collision.',
      unit: 'kg·m/s',
      emphasis: 'primary',
    },
    { kind: 'scalar', id: 'totalKineticEnergy', label: 'Total kinetic energy', unit: 'J' },
    {
      kind: 'scalar',
      id: 'kineticEnergyRatio',
      label: 'KE now ÷ KE before',
      description: '1 means no kinetic energy has been lost.',
      unit: '1',
    },
    {
      kind: 'scalar',
      id: 'kineticEnergyChange',
      label: 'Change in kinetic energy',
      description: 'Negative when kinetic energy has turned into heat, sound or deformation.',
      unit: 'J',
    },
    { kind: 'scalar', id: 'momentumA', label: 'Momentum of A', unit: 'kg·m/s' },
    { kind: 'scalar', id: 'momentumB', label: 'Momentum of B', unit: 'kg·m/s' },
    { kind: 'scalar', id: 'kineticEnergyA', label: 'Kinetic energy of A', unit: 'J' },
    { kind: 'scalar', id: 'kineticEnergyB', label: 'Kinetic energy of B', unit: 'J' },
    { kind: 'scalar', id: 'initialMomentum', label: 'Total momentum before', unit: 'kg·m/s' },
    { kind: 'scalar', id: 'initialKineticEnergy', label: 'Total kinetic energy before', unit: 'J' },
    {
      kind: 'scalar',
      id: 'contactTime',
      label: 'Contact time',
      description: 'How long the bumpers were pressed together.',
      unit: 's',
    },
    { kind: 'scalar', id: 'compression', label: 'Bumper compression', unit: 'm' },
    { kind: 'scalar', id: 'time', label: 'Time', unit: 's' },
    {
      kind: 'category',
      id: 'stage',
      label: 'Stage',
      options: [
        { value: 'ready', label: 'Ready' },
        { value: 'before', label: 'Moving, not touching' },
        { value: 'contact', label: 'In contact' },
        { value: 'after', label: 'After the collision' },
        { value: 'missed', label: 'No collision' },
      ],
    },
  ],
  objects: [
    { id: 'gliderA', label: 'Glider A', selectable: true },
    { id: 'gliderB', label: 'Glider B', selectable: true },
    { id: 'track', label: 'Air track', selectable: true },
  ],
  interactions: [
    { id: 'aim-a', kind: 'drag', targetObjectId: 'gliderA', variableId: 'velocityA' },
    { id: 'aim-b', kind: 'drag', targetObjectId: 'gliderB', variableId: 'velocityB' },
    { id: 'select-a', kind: 'select', targetObjectId: 'gliderA' },
    { id: 'select-b', kind: 'select', targetObjectId: 'gliderB' },
    { id: 'select-track', kind: 'select', targetObjectId: 'track' },
  ],
  presets: [
    {
      id: 'equal',
      title: 'Equal masses',
      variables: { massA: 0.5, massB: 0.5, velocityA: 1, velocityB: 0, collisionType: 'elastic' },
    },
    {
      id: 'heavy-target',
      title: 'Heavy target',
      variables: { massA: 0.5, massB: 2, velocityA: 1, velocityB: 0, collisionType: 'elastic' },
    },
    {
      id: 'light-target',
      title: 'Light target',
      variables: { massA: 2, massB: 0.5, velocityA: 1, velocityB: 0, collisionType: 'elastic' },
    },
    {
      id: 'head-on',
      title: 'Head-on',
      variables: { massA: 0.5, massB: 0.5, velocityA: 1, velocityB: -1, collisionType: 'elastic' },
    },
    {
      id: 'sticky',
      title: 'Sticky',
      variables: { massA: 0.5, massB: 0.5, velocityA: 1, velocityB: 0, collisionType: 'perfectly-inelastic' },
    },
    {
      id: 'soft',
      title: 'Soft bumpers (e = 0.5)',
      variables: {
        massA: 0.5,
        massB: 0.5,
        velocityA: 1,
        velocityB: 0,
        collisionType: 'inelastic',
        restitution: 0.5,
      },
    },
    {
      id: 'chase',
      title: 'Chase',
      variables: { massA: 0.5, massB: 1, velocityA: 1.2, velocityB: 0.3, collisionType: 'elastic' },
    },
  ],
  investigations: [
    {
      id: 'swap',
      question: 'A glider hits an identical glider at rest. What happens?',
      hint: 'Run this elastic collision and watch both velocities. Then record the trial.',
      presetId: 'equal',
      review: 'draft',
    },
    {
      id: 'mass',
      question: 'Does A bounce back? Change the mass of B.',
      hint: 'Record this heavy target, then try the light target. Compare the velocity of A in the two trials.',
      presetId: 'heavy-target',
      review: 'draft',
    },
    {
      id: 'speed',
      question: 'If A goes twice as fast, what happens to the final velocities?',
      hint: 'Record a run with A at 0.50 m/s, then one at 1.00 m/s, keeping everything else the same. Compare.',
      review: 'draft',
    },
    {
      id: 'types',
      question: 'Elastic, inelastic or sticky: what stays the same?',
      hint: 'Keep the masses and velocities. Record one trial for each collision type, then compare total momentum and kinetic energy.',
      review: 'draft',
    },
    {
      id: 'momentum-zero',
      question: 'Can the total momentum be zero while both gliders move?',
      hint: 'Run this head-on collision. Look at the total momentum before, during and after. Then try it with sticky bumpers.',
      presetId: 'head-on',
      review: 'draft',
    },
    {
      id: 'energy-dip',
      question: 'Where does the kinetic energy go during a collision?',
      hint: 'Run an elastic collision at 0.25× speed and watch the total kinetic energy on the board while the bumpers are pressed together.',
      presetId: 'equal',
      review: 'draft',
    },
  ],
  explanations: [
    {
      id: 'overview',
      anchor: { kind: 'simulation' },
      title: 'Momentum is always conserved',
      body: 'During the collision, A pushes on B and B pushes back on A with an equal and opposite force (Newton’s third law), for exactly the same time. So whatever momentum B gains, A loses.\n\nNo outside force pushes along the track, so the total momentum p_A + p_B never changes — before, during or after the collision.\n\nKinetic energy is different: it is only conserved if the bumpers give back all the energy they absorb (an elastic collision).',
      review: 'draft',
    },
    {
      id: 'key-formula',
      anchor: { kind: 'simulation' },
      title: 'Key formula',
      body: 'Momentum: m_A u_A + m_B u_B = m_A v_A + m_B v_B\n\nKinetic energy: K = ½mv². Elastic: K before = K after.\n\nRestitution: e = (v_B − v_A)/(u_A − u_B). Elastic e = 1, perfectly inelastic e = 0.\n\nFinal velocities: v_A = (m_A u_A + m_B u_B − m_B e (u_A − u_B))/(m_A + m_B), v_B = (m_A u_A + m_B u_B + m_A e (u_A − u_B))/(m_A + m_B).\n\nKinetic energy lost: ΔK = ½ · m_A m_B/(m_A + m_B) · (1 − e²)(u_A − u_B)².',
      review: 'draft',
    },
    {
      id: 'glider-a',
      anchor: { kind: 'object', id: 'gliderA' },
      title: 'Glider A',
      body: 'Glider A starts on the left. Drag the tip of its green velocity arrow to set its initial velocity — to the right is positive.\n\nThe brass discs on top show its mass: more discs, more mass.',
      review: 'draft',
    },
    {
      id: 'glider-b',
      anchor: { kind: 'object', id: 'gliderB' },
      title: 'Glider B',
      body: 'Glider B starts on the right. It can wait at rest to be hit, move towards A (head-on) or move away from A (then A has to catch up).\n\nDrag the tip of its velocity arrow to change its initial velocity.',
      review: 'draft',
    },
    {
      id: 'track',
      anchor: { kind: 'object', id: 'track' },
      title: 'The air track',
      body: 'Air blown through the tiny holes lifts the gliders on a thin cushion of air, so there is almost no friction. That is why a glider keeps moving at a steady velocity until something pushes on it — and why momentum is conserved so well.',
      review: 'draft',
    },
    {
      id: 'collision-type',
      anchor: { kind: 'variable', id: 'collisionType' },
      title: 'Types of collision',
      body: 'Elastic: springy bumpers store energy while squashed and give all of it back. Total kinetic energy after equals before.\n\nInelastic: soft bumpers turn part of the energy into heat and sound. The gliders separate more slowly than they approached.\n\nPerfectly inelastic: the gliders stick together and move as one. The largest possible kinetic energy is lost — but never all of it unless the total momentum is zero.',
      review: 'draft',
    },
    {
      id: 'restitution',
      anchor: { kind: 'variable', id: 'restitution' },
      title: 'Coefficient of restitution',
      body: 'e compares how fast the gliders separate with how fast they approached: e = (v_B − v_A)/(u_A − u_B). A superball is close to 1; a lump of clay is close to 0.',
      review: 'draft',
    },
    {
      id: 'mass',
      anchor: { kind: 'variable', id: 'massB' },
      title: 'Mass and bouncing back',
      body: 'In an elastic collision with B at rest, A stops if the masses are equal, keeps going forward if A is heavier, and bounces back if A is lighter.',
      review: 'draft',
    },
    {
      id: 'total-momentum',
      anchor: { kind: 'measurement', id: 'totalMomentum' },
      title: 'Total momentum',
      body: 'Momentum has a direction: a glider moving left has negative momentum. The total is the sum with signs, so two gliders moving towards each other can have a total of zero.\n\nThis number does not change at any moment of the run.',
      review: 'draft',
    },
    {
      id: 'kinetic-energy',
      anchor: { kind: 'measurement', id: 'totalKineticEnergy' },
      title: 'Kinetic energy during the collision',
      body: 'Kinetic energy has no direction and is never negative. While the bumpers are squashed, some of it is stored in them, so the total dips — even in an elastic collision. Springy bumpers give it all back; soft ones turn part of it into heat.',
      review: 'draft',
    },
    {
      id: 'contact-time',
      anchor: { kind: 'measurement', id: 'contactTime' },
      title: 'Contact time',
      body: 'The bumpers touch for only a few hundredths of a second. With springy bumpers the time does not depend on speed, but heavier gliders take longer to turn around.\n\nThe push during that time — force × time, the impulse — equals the change in each glider’s momentum.',
      review: 'draft',
    },
  ],
  model: {
    kind: 'continuous',
    fixedTimeStep: COLLISION_TIME_STEP,
    // Slowest collision: 0.9 m at 0.05 m/s = 18 s, then at most ≈ 54 s to an end stop.
    maxDuration: 120,
    createInitialState,
    step,
    measure: (state, vars) => {
      const pA = momentum(vars.massA, state.vA)
      const pB = momentum(vars.massB, state.vB)
      const kA = kineticEnergy(vars.massA, state.vA)
      const kB = kineticEnergy(vars.massB, state.vB)
      const p0 = momentum(vars.massA, vars.velocityA) + momentum(vars.massB, vars.velocityB)
      const k0 = kineticEnergy(vars.massA, vars.velocityA) + kineticEnergy(vars.massB, vars.velocityB)
      const k = kA + kB
      return {
        velocityA: state.vA,
        velocityB: state.vB,
        totalMomentum: clean(pA + pB),
        totalKineticEnergy: k,
        kineticEnergyRatio: k0 === 0 ? 1 : k / k0,
        kineticEnergyChange: clean(k - k0),
        momentumA: pA,
        momentumB: pB,
        kineticEnergyA: kA,
        kineticEnergyB: kB,
        initialMomentum: clean(p0),
        initialKineticEnergy: k0,
        contactTime: state.contactTime,
        compression: state.compression,
        time: state.t,
        stage: state.stage,
      }
    },
    isComplete: (state) => state.finished,
  },
})
