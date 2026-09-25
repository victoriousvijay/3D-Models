# Lab Navigation Architecture

## Journey

```text
Landing (/)
   │  "ENTER 3D SIMULATION LAB" — portal transition
   ▼
Science Lab Hub (/lab)                 3D facility, one station per division
   │  choose a division — camera flies to its station
   ▼
Division Lab (/lab/:division)          e.g. /lab/physics — labs grouped by chapter
   │  choose a lab
   ▼
Lab (/lab/:division/:labId)            e.g. /lab/physics/projectile-motion
   ├─ available  → the lab's own 3D scientific environment
   └─ planned    → "coming soon" page (what it will cover; what is ready now)
```

Anything else shows the "This lab does not exist" page, as do unknown divisions and unknown lab ids.

## Implementation

| Piece     | File                                                           | Notes                                                                           |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Router    | `src/app/router.tsx`                                           | `react-router` data router. Every page is a lazy chunk.                         |
| Entry     | `src/main.tsx`                                                 | `RouterProvider`                                                                |
| Landing   | `src/pages/LandingPage.tsx`                                    | Hero 3D scene, GSAP entrance, portal transition                                 |
| Hub       | `src/pages/LabHubPage.tsx` + `src/components/hub/HubScene.tsx` | 3D stations plus an accessible division list                                    |
| Division  | `src/pages/DivisionPage.tsx`                                   | Identity header and chapter-grouped `LabRow`s                                   |
| Lab       | `src/pages/SimulationPage.tsx`                                 | Resolves the lab from the catalogue: runs its package, or shows `LabComingSoon` |
| Not found | `src/pages/NotFoundPage.tsx`                                   |                                                                                 |

URLs are the source of truth for where the learner is. The Zustand store no longer decides which simulation is open. `SimulationPage` calls `openSimulation(id)` on mount and `closeSimulation()` on unmount, so the per-simulation UI state (selection, overlays, explanation focus) still resets between labs.

Deep links work in production because `vercel.json` rewrites every path to `index.html`, and static assets are served first.

## Transitions

| From → to      | Motion                                                                                                                 | Reduced motion                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Landing → Hub  | Hero copy lifts away, and a light portal expands from the button (GSAP, ~1.1 s). The hub fades in from the same light. | Immediate navigation, no veil |
| Hub → Division | The camera flies to the chosen station (GSAP, ~1 s), then navigates.                                                   | Immediate navigation          |
| Division → Lab | Standard navigation. The lab's canvas mounts its own environment.                                                      | —                             |

Transitions never block input for long, and they are cancelled if the page unmounts (tweens are killed on cleanup).

## Accessibility

- Every 3D choice has a DOM equivalent: the hub's "Divisions" list, and each lab row's link. Keyboard, screen-reader and touch users never need to click a 3D object.
- Hovering or focusing a list item highlights the matching 3D station, and vice versa.
- Headings follow the hierarchy: the page `h1` names where you are (Landing, Science Simulation Lab, Physics Lab, the lab's title).
