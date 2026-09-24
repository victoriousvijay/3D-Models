# Scientific Simulation Platform

An immersive, web-based scientific learning environment: 3D environments, interactive models,
real-time simulations, experiments and measurements, across subjects. Physics is the first domain.

Start with [ARCHITECTURE.md](ARCHITECTURE.md). Engineering rules: [CLAUDE.md](CLAUDE.md).

## Requirements

Node.js ≥ 20.19 (developed on 24.12) and npm.

## Commands

| Command             | Purpose                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| `npm install`       | Install dependencies                                                        |
| `npm run dev`       | Start the dev server at http://localhost:5173                               |
| `npm run build`     | Typecheck and build for production (`dist/`)                                |
| `npm run preview`   | Serve the production build                                                  |
| `npm run typecheck` | TypeScript project check                                                    |
| `npm run lint`      | ESLint, including architectural import boundaries                           |
| `npm run format`    | Format with Prettier                                                        |
| `npm run test`      | Unit tests (Vitest)                                                         |
| `npm run e2e`       | End-to-end tests (Playwright; first run: `npx playwright install chromium`) |
| `npm run check`     | typecheck + lint + test                                                     |

## Documentation

| Area       | Documents                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product    | PROJECT_BRIEF.md · ROADMAP.md                                                                                                                             |
| Platform   | ARCHITECTURE.md · SIMULATION_ENGINE.md · RENDERING_ENGINE.md · INTERACTION_ENGINE.md · EXPERIMENT_ENGINE.md · MEASUREMENT_ENGINE.md · EDUCATION_ENGINE.md |
| Domains    | PHYSICS_ENGINE.md · CHEMISTRY_ENGINE.md · BIOLOGY_ENGINE.md · ASTRONOMY_ENGINE.md · EARTH_SCIENCE_ENGINE.md · MATHEMATICS_ENGINE.md                       |
| Operations | ASSET_PIPELINE.md · DATABASE.md · AI_TUTOR.md · SECURITY.md · TESTING.md · PERFORMANCE.md · WORKFLOW.md                                                   |
