# P96 Founder Business Build Local Execution Readiness Plan

P96 moves founder Business Build from display-only DB readiness toward governed
local CRUD-backed readiness. It builds on P94 founder runtime DB CRUD and P95
operator persistence controls. It does not enable provider/model calls, agent
dispatch, worker/tool execution, project creation, project mutation, hosted DB
mutation, network calls, deploy, release, export, package creation, or provider
spend.

## Scope Classification

P96 is a `NEXUS_OS_CHANGE`.

Allowed scope is NEXUS OS founder workflow readiness contracts, local-only
readiness models, local API read posture, Command Center display surfaces,
checkers, docs, roadmap/status files, and reports where each subphase explicitly
allows them. Project source files are out of scope.

## Reuse Check

P96 must reuse:

- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js` where display-safe text requires redaction
- `live-ready/founderRuntimeDbCrudWorkflow.js`
- `live-ready/founderPersistenceOperatorControls.js`
- `db/sqliteCrudRepository.js`
- existing local API safe-response helpers
- existing Command Center route/card/badge patterns

P96 must not duplicate report writers, result envelopes, redaction helpers,
checker formatters, phase status updaters, CRUD repositories, route matrices,
or Command Center card/tab components.

## Safety Rules

- No project files or CareLoop files may be changed.
- No provider/model calls may be enabled.
- No agent dispatch, worker execution, or tool execution may be enabled.
- No project creation or project mutation may be enabled.
- No hosted DB mutation, network calls, deploy, release, export, package
  creation, or provider spend may be enabled.
- No delete or raw SQL actions are admitted in the founder readiness flow.
- Local SQLite writes remain approval-gated and limited to allowlisted NEXUS OS
  founder workflow records.
- Primary Command Center UX must not show raw private IDs, raw JSON, raw logs,
  raw policy dumps, raw table dumps, or DemoApp in full Command Center.

## Subphases

### P96.1 Contract

P96.1 is complete when the implementation-grade execution contract exists, the
P96 plan is documented, package/checker wiring exists, and OS status tracks
P96.1 without touching runtime, DB, local API, dashboard, or project files.

Validation:

- `npm run check:p961-founder-business-build-readiness-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P96.2 Local Execution Readiness Model

P96.2 is complete. It adds a display-safe local Business Build execution
readiness model. It reuses the P94 founder runtime DB CRUD workflow and P95
persistence controls, summarizes founder session, Q&A, PRD artifact, and
workstream plan readiness, and keeps all unsafe runtime flags false.

Validation:

- `npm run check:p962-founder-business-build-readiness-model`
- `npm run check:p961-founder-business-build-readiness-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P96.3 Safe Dry-Run Admission

P96.3 is complete. It adds a display-safe dry-run admission matrix for local
Business Build lane inspection. It does not dispatch agents, execute workers or
tools, add mutation endpoints, mutate projects, mutate hosted DBs, deploy,
package, or spend.

Validation:

- `npm run check:p963-founder-business-build-dry-run-admission`
- `npm run check:p962-founder-business-build-readiness-model`
- `npm run check:p961-founder-business-build-readiness-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P96.4 Command Center DB-Backed Readiness UX

P96.4 is complete. It renders P96.2 local readiness and P96.3 dry-run admission
inside Business Build. The UX shows DB source state, future review lane count,
admission lanes, next action, blockers, disabled reason, owner capability,
evidence/activity location, cost impact, and blocked safety rows.

It must preserve system, dark, and light themes, route-wide navigation, no
DemoApp leakage, no raw JSON/log/policy dumps, no raw table dumps in primary UX,
and no raw private IDs.

Validation:

- `npm run check:p964-command-center-business-build-readiness-ux`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Business Build local execution readiness"`
- `cd dashboard && npm run build`
- `npm run check:p963-founder-business-build-dry-run-admission`
- `npm run check:p962-founder-business-build-readiness-model`
- `npm run check:p961-founder-business-build-readiness-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P96.5 Validation

P96.5 is complete. It aggregates contract, model, dry-run admission, Command
Center UX, route safety, phase status, report coverage, and forbidden path
checks.

Validation:

- `npm run check:p965-founder-business-build-readiness-validation`
- `npm run check:p964-command-center-business-build-readiness-ux`
- `npm run check:p963-founder-business-build-dry-run-admission`
- `npm run check:p962-founder-business-build-readiness-model`
- `npm run check:p961-founder-business-build-readiness-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P96.6 Docs And Roadmap

P96.6 is complete. It updates README, PRD, Command Center guide, platform
roadmap, OS roadmap/status, and reports. It describes what is CRUD-backed
locally and what is still blocked without implying unsafe execution.

Validation:

- `npm run check:p966-founder-business-build-readiness-docs-roadmap`
- `npm run check:p965-founder-business-build-readiness-validation`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P96.7 Final Validation

P96.7 is complete. It runs final validation, stamps real commits, closes P96,
and hands off to P97.

Validation:

- `npm run check:p967-founder-business-build-readiness-final-validation`
- `npm run check:p966-founder-business-build-readiness-docs-roadmap`
- `npm run check:p965-founder-business-build-readiness-validation`
- `npm run check:p964-command-center-business-build-readiness-ux`
- `npm run check:p963-founder-business-build-dry-run-admission`
- `npm run check:p962-founder-business-build-readiness-model`
- `npm run check:p961-founder-business-build-readiness-contract`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Business Build local execution readiness"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

## Known Risks

- DB-backed wording can be confused with hosted or production DB readiness.
  Labels and checkers must keep the local-only boundary visible.
- Readiness UI can look like execution. P96.4 must not render fake working
  actions or execution buttons.
- Local CRUD helper reuse must not become a duplicate repository or raw SQL path.

## Rollback Plan

Revert the latest P96 subphase commit. P96.1 is contract-only, so rollback
removes contract/checker/doc/status/report changes without affecting runtime
behavior, DB schema, dashboard source, local API routes, local-state runtime
data, or project files.
