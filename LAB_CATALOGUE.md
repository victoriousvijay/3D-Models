# Lab Catalogue

The catalogue is the platform's navigable content: the **divisions** a learner walks through, and the **labs** inside them. It lives in `src/catalogue/` as framework-free data plus pure helpers, and ESLint keeps it free of React and Three.js and of UI imports.

## Divisions

| Division  | Domain engine | Accent           | Labs |
| --------- | ------------- | ---------------- | ---- |
| Physics   | `physics`     | blue `#1d6fe0`   | 16   |
| Chemistry | `chemistry`   | violet `#7048e8` | 30   |
| Botany    | `biology`     | green `#2f9e44`  | 12   |
| Zoology   | `biology`     | orange `#e8590c` | 15   |

A division is a navigation and identity concept. The science behind it comes from a domain engine (ARCHITECTURE.md). Botany and Zoology are separate divisions for learners but share the biology domain engine.

## Lab entries

```ts
interface LabEntry {
  id: string // kebab-case, unique, also the URL segment
  division: DivisionId
  title: string
  chapter: string // NCERT chapter
  description?: string // one learner-facing line
  experience: ModelKind // continuous | discrete | static → "Live simulation" | "Step-by-step process" | "3D explorer"
  status: 'available' | 'planned'
  simulationId?: string // required when available
}
```

Source: the NEET lab directory (72 labs), plus Projectile Motion (Physics, _Motion in a Plane_), for 73 in total. Physics entries have descriptions. The other divisions gain them as each lab is designed.

Available: **Projectile Motion**, **Double Slit (YDSE)** and **1D Collision** (Physics).

For planned labs, `experience` is the intended model kind and may change during design.

## Validation

`validateCatalogue()` runs in `createPlatform()` at startup and in unit tests. It fails if:

- an id is duplicated or not kebab-case, or a division is unknown
- an `available` lab does not point to a registered simulation, or points to one of another domain
- a `planned` lab names a simulation (it should be marked available instead)
- a registered simulation is not reachable from any lab

So a lab can't be launchable without its simulation, and a simulation can't ship without a place in the lab.

## Making a lab available

1. Build the simulation package (LAB_IMPLEMENTATION_FRAMEWORK.md) and add it to `src/simulations/index.ts`.
2. In `src/catalogue/labs.ts`, change the entry's `status` to `'available'` and set `simulationId`.
3. Add a concept preview to `LabGlyph` if the lab doesn't have one.
4. Run `npm run check`. The catalogue test and startup validation confirm the wiring.
