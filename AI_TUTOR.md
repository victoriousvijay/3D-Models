# AI Tutor Architecture

## Goal

The AI tutor should understand what the student is currently doing.

It should not be a generic chatbot detached from the simulation.

## Context

The tutor can receive:

```ts
interface SimulationContext {
  simulationId: string
  variables: Record<string, number>
  selectedObject?: string
  measurements: Record<string, number>
  experimentHistory: ExperimentSummary[]
  learningObjectives: string[]
}
```

## Safe Tools

The AI may call structured tools such as:

```text
getSimulationState()
getMeasurement(name)
explainObject(id)
explainConcept(concept)
suggestExperiment()
compareExperiments(id1, id2)
```

## Safety Boundary

The AI must never execute arbitrary code.

The AI must never directly manipulate the simulation through generated JavaScript.

Any state change must go through validated application APIs.

## Teaching Behavior

The tutor should:

- explain
- ask guiding questions
- identify misconceptions
- suggest experiments
- compare results
- connect variables to equations

Avoid immediately giving the answer when guided discovery is more appropriate.
