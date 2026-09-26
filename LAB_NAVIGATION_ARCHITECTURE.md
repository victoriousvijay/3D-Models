# Lab Navigation Architecture

## Journey

```text
Landing (/)
   │  "ENTER 3D SIMULATION LAB" — portal transition
   ▼
Science Lab Hub (/lab)                 character carousel, one division per slide
   │  rotate to a division — "Explore Physics →"
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

| Piece     | File                                                                       | Notes                                                                           |
| --------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Router    | `src/app/router.tsx`                                                       | `react-router` data router. Every page is a lazy chunk.                         |
| Entry     | `src/main.tsx`                                                             | `RouterProvider`                                                                |
| Landing   | `src/pages/LandingPage.tsx`                                                | Hero 3D scene, GSAP entrance, portal transition                                 |
| Hub       | `src/pages/LabHubPage.tsx` + `src/components/landing/{slides,carousel}.ts` | Division carousel with arrows, keyboard and a division switcher                 |
| Division  | `src/pages/DivisionPage.tsx`                                               | Identity header and chapter-grouped `LabRow`s                                   |
| Lab       | `src/pages/SimulationPage.tsx`                                             | Resolves the lab from the catalogue: runs its package, or shows `LabComingSoon` |
| Not found | `src/pages/NotFoundPage.tsx`                                               |                                                                                 |

URLs are the source of truth for where the learner is. The Zustand store no longer decides which simulation is open. `SimulationPage` calls `openSimulation(id)` on mount and `closeSimulation()` on unmount, so the per-simulation UI state (selection, overlays, explanation focus) still resets between labs.

Deep links work in production because `vercel.json` rewrites every path to `index.html`, and static assets are served first.

## Transitions

| From → to      | Motion                                                                                                                 | Reduced motion                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Landing → Hub  | Hero copy lifts away, and a light portal expands from the button (GSAP, ~1.1 s). The hub fades in from the same light. | Immediate navigation, no veil |
| Within the hub | Slides crossfade: background, giant word, character positions, scale, blur (650 ms).                                   | Instant slide change          |
| Hub → Division | Standard navigation from "Explore …".                                                                                  | —                             |
| Division → Lab | Standard navigation. The lab's canvas mounts its own environment.                                                      | —                             |

Transitions never block input for long, and they are cancelled if the page unmounts (tweens are killed on cleanup).

## Accessibility

- Every choice has a DOM equivalent: the hub's "Divisions" switcher, arrow buttons and "Explore" link, and each lab row's link. Keyboard, screen-reader and touch users never need to click a 3D object.
- The hub announces the front slide ("Physics, 1 of 4") in a polite live region; hidden slides are `aria-hidden`.
- Headings follow the hierarchy: the page `h1` names where you are (Landing, Science Simulation Lab, Physics Lab, the lab's title).
