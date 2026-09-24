# Chemistry Domain Engine Specification

Status: **specified — not implemented** (Roadmap Phase 5). Implements the `DomainEngine` contract
(`src/engine/types/domain.ts`); no chemistry concept may enter the core.

## Scope

Atoms, molecules, bonds, molecular geometry, intermolecular forces, stoichiometry, reactions,
kinetics, equilibrium, acids and bases, thermochemistry.

## Model Kinds Used

| Kind         | Examples                                                        |
| ------------ | --------------------------------------------------------------- |
| `static`     | molecular geometry (VSEPR), orbitals, crystal lattices, isomers |
| `continuous` | reaction kinetics (rate laws), titration curves, gas behaviour  |
| `discrete`   | reaction mechanism steps, balancing an equation step by step    |

## Units Contributed (`UnitCatalog` augmentation)

`mol/L` (molarity), `mol/(L·s)` (rate), `g/mol` (molar mass), `kJ/mol`, `Å` (toSI 1e-10), `pm`,
`atm`, `L`, `mL`, `u` (Da). Core already provides `mol`, `K`, `Pa`, `J`, `s⁻¹`, `kat`, `°C`.
Units shared with other domains (e.g. `L` with Biology) must be declared with identical
definitions, which the `DomainRegistry` enforces.

## Domain Services (pure, `src/domains/chemistry/`)

- Element data (periodic table) as a typed, sourced dataset (e.g. IUPAC/NIST), with licence noted
- Molecule model: atoms, bonds (order, type), charges; parse/serialise SMILES/MOL via Ketcher-compatible formats
- Geometry: bond lengths and angles, VSEPR predictions (tested against reference molecules)
- Kinetics: integrated rate laws (0th/1st/2nd order), with analytic tests
- Equilibrium: ICE-table solver, K from concentrations
- Stoichiometry and equation balancing (matrix method; can use `src/lib/numerics`)

## Visual Layer (`src/domains/chemistry/visual/`)

- **Mol\***: high-fidelity molecular and biomolecular rendering. Loaded lazily in `initialize()`.
  Isolated in its own canvas/iframe if it cannot share the R3F context.
- **Ketcher**: 2D structure editor for learner-drawn molecules. Its output is validated as data
  before becoming variables.
- Lightweight ball-and-stick with R3F `Instances` for simple molecules (fewer draw calls than Mol\*).

## Dependencies

None. Chemistry must not depend on Physics. Shared numerics come from `src/lib/numerics`.

## Scientific Integrity

- State model level explicitly: VSEPR vs. quantum-chemical, ideal vs. real solutions, rate-law
  empirical vs. mechanistic.
- Reference data (masses, electronegativities, bond lengths) must cite source and version.
- Reaction simulations must conserve atoms and charge (tested invariants).

## Open Questions

- Mol\* integration mode (embedded plugin vs. iframe) and its bundle cost
- Whether Ketcher is needed in the first chemistry experience or deferred
