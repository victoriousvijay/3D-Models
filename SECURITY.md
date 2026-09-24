# Security Specification

The platform will serve students, many of them minors. Security and privacy are design
constraints, not a later phase.

## Repository Location (resolved 2026-09-24)

The project now has its **own git repository** in the project folder, with remote
`hoduacademycontenttwo-sudo/3D-models`.

A separate, older repository still exists at `C:\Users\ADMIN`: the whole home directory, with no
commits, which can see `.ssh/` and `.git-credentials`. **Never run `git add` or commit from the
home directory.** Consider deleting `C:\Users\ADMIN\.git` if nothing depends on it.

## Credentials

- Never paste access tokens into chats, issues, code or commit messages. A pasted token must be
  treated as exposed and revoked.
- Authenticate git with the Git Credential Manager browser sign-in or `gh auth login`.
- `.gitignore` excludes `.env*`, build output and test artefacts.

## Threat Model Summary

| Area         | Risk                                                             | Control                                                                                                    |
| ------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| AI tutor     | Prompt injection; model executing or emitting code; data leakage | Allow-listed tools only; no code execution; all changes via validated engine APIs                          |
| Content      | Malicious or broken simulation/education content                 | Definitions are code-reviewed; future authored content is **data only**, schema-validated, never evaluated |
| Secrets      | API keys exposed to the browser                                  | Only public keys in the client; secrets server-side only                                                   |
| Data         | Students reading each other's work                               | Supabase Row Level Security on every table                                                                 |
| Assets       | Oversized or malicious uploads                                   | Trusted sources, size limits, allowed MIME types, no user-supplied scripts                                 |
| Dependencies | Supply-chain compromise                                          | Lockfile committed, `npm audit` in CI, minimal dependencies                                                |
| Browser      | XSS via content or AI output                                     | No `dangerouslySetInnerHTML` with untrusted data; sanitised markup subset; CSP                             |

## AI Tutor Boundary

- The tutor may call only: `getSimulationState`, `getMeasurement`, `explainObject`,
  `explainConcept`, `suggestExperiment`, `compareExperiments`. Any future state-changing tool
  (e.g. applying a suggested preset) goes through `runtime.setVariables`, which validates every
  value, and requires learner confirmation.
- The AI never produces JavaScript, shaders or definitions that are executed.
- Tutor calls go through a server-side function (e.g. a Supabase Edge Function). The model API key
  is never shipped to the browser. Requests are authenticated and rate-limited per user.
- Context sent to the model is limited to structured simulation data (`RuntimeSnapshot`,
  experiment records, objectives). No personal data beyond what the conversation needs.
- AI output is rendered as text or sanitised markup, never as HTML.

## Supabase

- Row Level Security enabled on every table; default deny.
- Students read/write only their own experiments and progress. Teacher access is explicit via
  class membership (Phase 8).
- The browser uses the anon/publishable key only. The **service-role key is never used client-side**
  and is never prefixed `VITE_`. Any `VITE_*` variable is public by definition.
- Storage buckets: public read only for published simulation assets; private buckets for
  learner uploads, if ever introduced.

## Content & Extensibility

- Domain engines and simulations are first-party code, reviewed like any code change.
- A future authoring system accepts **data only** (JSON validated against the SDK schemas:
  variables, measurements, presets, explanations). It never accepts functions, expressions
  evaluated with `eval`/`new Function`, or scripts.
- Where learners or teachers enter formulas (e.g. Mathematics), parse them with a sandboxed
  expression parser (mathjs with a restricted function scope). Never `eval`.
- Third-party scientific toolkits (Mol*, Ketcher) load through the domain's `initialize()`. If a
  toolkit needs broad DOM access, it will be isolated in an iframe.

## Web Platform

- Vercel response headers: Content-Security-Policy (self + required CDNs, no `unsafe-eval`
  unless a vetted dependency requires it, documented if so), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal.
- HTTPS only; HSTS via Vercel.

## Privacy

- Collect the minimum personal data needed. No analytics identifiers without consent. Consider
  COPPA, GDPR/GDPR-K and local regulations before accounts launch (Phase 3).
- Persist meaningful learning events, never per-frame telemetry.
- Error reporting must strip personal data.

## Verification

- `npm audit` and lint/type/test gates in CI before deploy.
- RLS policies covered by tests against a local Supabase instance.
- Security review before enabling accounts, the AI tutor, or any authoring feature.
