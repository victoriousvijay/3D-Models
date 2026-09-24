# Claude Code Development Workflow

## Rule

Never jump directly from idea to large implementation.

## Step 1 — Inspect

Read:

- CLAUDE.md
- PROJECT_BRIEF.md
- ARCHITECTURE.md
- relevant engine documentation

Inspect the existing repository before modifying it.

## Step 2 — Plan

Create a small implementation plan.

Identify:

- files to create
- files to modify
- dependencies
- risks
- tests

## Step 3 — Implement

Implement one coherent feature at a time.

Avoid unrelated refactoring.

## Step 4 — Validate

Run:

```bash
npm run typecheck
npm run lint
npm run test
```

Run Playwright for user-facing workflows where applicable.

## Step 5 — Inspect

Check:

- browser console
- visual behavior
- simulation correctness
- performance

## Step 6 — Document

Update the relevant markdown documentation.

## Step 7 — Commit

Use focused commits.

Example:

```text
feat: add simulation lifecycle manager
feat: add projectile motion engine
feat: add experiment recording
fix: correct projectile flight-time calculation
```

## Claude Code Rule

Before implementing a large feature, explain the proposed architecture and affected files.

Do not silently rewrite the system.
