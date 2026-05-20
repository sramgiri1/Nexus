# P90 Governed Founder PRD Live Authoring Lane Plan

P90 starts the first narrow live lane after P89: local founder PRD authoring.
This is not agent dispatch, project generation, provider execution, DB writes,
deploy, export, package creation, or spend. P90 must only make a deterministic
local PRD authoring path live after the exact subphase scopes and validates it.

## Safety Rules

- NEXUS OS changes only.
- Do not modify `projects/**`, `careloop/**`, generated app `Sources/Tests`,
  `providers/**`, `tools/**`, `worker-runtime/**`, DB/prisma/migrations,
  deploy/release/export/package roots, or `.env*`.
- Do not enable provider/model calls, agent dispatch, tool execution, worker
  execution, project mutation, DB writes, deploy, release, export, package
  creation, network calls, or provider spend unless that exact lane is scoped
  and validated in its own subphase.
- Do not expose DemoApp in full Command Center.
- Do not expose raw private project IDs.
- Do not invent fake working actions.

## P90.1 Schema / Policy / Contract

P90.1 is complete. It defines the implementation-grade P90 execution contract
for the governed local founder PRD authoring lane. The lane is intentionally
narrow: it may later turn collected founder context into a local PRD authoring
result envelope, while project mutation, provider/model calls, agent dispatch,
DB writes, deploy/release/export/package actions, network calls, and spend
remain blocked.

Validation:

- `npm run check:p901-founder-prd-live-lane-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P90.1 is schema, policy, and contract only. It does not run an
executor, dispatch agents, execute tools/workers, mutate projects, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## P90.2 Core Local PRD Model

P90.2 is complete. It adds a deterministic local founder PRD authoring model
that maps founder context into PRD sections, readiness evidence, local-only
operations, blockers, owner capability, evidence, activity, and cost posture.
All unsafe runtime flags remain false.

Validation:

- `npm run check:p902-founder-prd-local-model`
- `npm run check:p901-founder-prd-live-lane-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P90.2 is a local model only. It does not run an executor,
dispatch agents, execute tools/workers, mutate projects, call providers/models,
write DB state, use network calls, deploy, release, export, package, or spend.

## P90.3 Safe Local PRD Authoring

P90.3 is complete. It adds deterministic in-memory PRD authoring from the P90.2
local model. The authored PRD artifact includes markdown, sections, acceptance
criteria, readiness, review state, owner capability, evidence, activity, and
cost posture. It does not write project files, dispatch agents, call providers,
use network calls, write DB state, deploy, export, package, or spend.

Validation:

- `npm run check:p903-founder-prd-safe-authoring`
- `npm run check:p902-founder-prd-local-model`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P90.3 authors a deterministic PRD artifact in memory only. It
does not write project files, dispatch agents, execute tools/workers, call
providers/models, write DB state, use network calls, deploy, release, export,
package, or spend.

## P90.4 Command Center PRD Lane UX

P90.4 is complete. Business Build now has a Local PRD tab that shows the
deterministic in-memory PRD artifact as operator-facing state. The tab shows
review state, current state, next action, owner capability, evidence, activity,
cost posture, PRD sections, acceptance criteria, and blocked unsafe operations
without raw JSON, raw logs, internal phase labels, DemoApp, raw private IDs, or
fake runnable actions.

Validation:

- `npm run check:p904-command-center-prd-lane-ux`
- `npm run check:p903-founder-prd-safe-authoring`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Business Build"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P90.4 is Command Center UX only. It does not write project
files, dispatch agents, execute tools/workers, call providers/models, write DB
state, use network calls, deploy, release, export, package, or spend.

## P90.5 Tests / Checkers

P90.5 is complete. It adds aggregate validation for the P90 founder PRD lane
across the execution contract, P90.1-P90.4 reports, safe in-memory authoring,
Business Build Local PRD UX wiring, Playwright coverage, docs, roadmap, phase
status, and safety boundaries. The aggregate checker verifies the P90.6 handoff
exists before docs closure begins.

Validation:

- `npm run check:p905-founder-prd-lane-validation`
- `npm run check:p904-command-center-prd-lane-ux`
- `npm run check:p903-founder-prd-safe-authoring`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Business Build"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P90.5 is validation aggregation only. It does not write
project files, dispatch agents, execute tools/workers, call providers/models,
write DB state, use network calls, deploy, release, export, package, or spend.

## P90.6 Docs / Roadmap

P90.6 is complete. It closes P90 docs, roadmap, contract, and phase-status
evidence through the docs/roadmap subphase. The closure keeps P90.7 as the final
validation handoff, records the Local PRD lane as Command Center visible, and
preserves the blocked runtime boundary.

Validation:

- `npm run check:p906-founder-prd-docs-roadmap`
- `npm run check:p905-founder-prd-lane-validation`
- `npm run check:p904-command-center-prd-lane-ux`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Known limitation: P90.6 is docs and roadmap closure only. It does not write
project files, dispatch agents, execute tools/workers, call providers/models,
write DB state, use network calls, deploy, release, export, package, or spend.

## Next Subphases

- P90.7 Final Validation: close P90 and hand off to the next scoped phase.
