# Biology Domain Engine Specification

Status: **specified — not implemented** (Roadmap Phase 6). Implements the `DomainEngine` contract;
no biology concept may enter the core.

## Scope

Cells and organelles, anatomy and organ systems, physiological processes (circulation,
respiration), genetics and DNA, cell cycle, populations and ecosystems.

## Model Kinds Used

| Kind         | Examples                                                                   |
| ------------ | -------------------------------------------------------------------------- |
| `static`     | cell explorer, organ anatomy, DNA structure (object hierarchies, isolate)  |
| `discrete`   | cell-cycle phases, protein synthesis steps, Mendelian crosses              |
| `continuous` | cardiac cycle, gas exchange, population dynamics (logistic, predator–prey) |

Biology relies heavily on **object hierarchies** (`SimulationObjectDefinition.parentId`) and the
**isolate** interaction. Both are core, subject-neutral features.

## Units Contributed

`µm` (toSI 1e-6), `nm`, `mmHg` (toSI 133.322…), `L/min`, `mL`, `bpm` (toSI 1/60 → s⁻¹),
`cells/mL`, `bp` (base pairs). Core already provides `s⁻¹`, `mol`, `°C`, `Pa`.

## Domain Services (pure, `src/domains/biology/`)

- Anatomical structure datasets (hierarchies, names, functions) with sources
- Cell-cycle state machine (discrete) with checkpoints
- Physiological models: simplified cardiac pressure–volume loop, ventilation/perfusion
- Genetics: Punnett squares, allele frequency (Hardy–Weinberg), with exact tests
- Population dynamics: logistic and Lotka–Volterra ODEs (via `src/lib/numerics`)

## Visual Layer (`src/domains/biology/visual/`)

- Anatomy GLBs with named, hierarchical nodes matching object ids
  (e.g. `heart_left_ventricle`, per ASSET_PIPELINE.md)
- Isolate/explode helpers; cross-section clipping planes
- Instanced rendering for many cells

## Dependencies

None by default. Biophysics simulations may declare `dependsOn: ['physics']` or
`['chemistry']` explicitly.

## Scientific Integrity

- Anatomical models state their level of simplification. Optimising geometry must not remove
  structures that matter scientifically (ASSET_PIPELINE.md).
- Physiological values cite reference ranges and state the population they describe.
- Sensitive content (human anatomy, disease) is reviewed for age appropriateness.

## Open Questions

- Source and licensing of anatomical 3D assets
- Level of detail strategy for full organ systems on laptops
