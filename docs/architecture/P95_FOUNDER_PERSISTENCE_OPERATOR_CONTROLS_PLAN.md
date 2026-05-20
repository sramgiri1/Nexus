# P95 Founder Persistence Operator Controls Plan

P95 makes approved local founder workflow persistence operator-usable while
preserving the NEXUS safety boundary. It builds on P94 founder runtime DB CRUD
workflow wiring and does not enable provider/model calls, agent dispatch,
worker/tool execution, project creation, project mutation, hosted DB mutation,
network calls, deploy, release, export, package creation, or provider spend.

## Scope Classification

P95 is a `NEXUS_OS_CHANGE`.

Allowed scope is NEXUS OS founder workflow persistence control code,
Command Center display surfaces, checkers, docs, roadmap/status files, and
reports where each subphase explicitly allows them. Project source files are
out of scope.

## Reuse Check

P95 must reuse:

- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js` where display-safe text requires redaction
- `live-ready/founderRuntimeDbCrudWorkflow.js`
- `db/sqliteCrudRepository.js`
- existing Command Center route/card/badge patterns

P95 must not duplicate report writers, result envelopes, redaction helpers,
checker formatters, phase status updaters, CRUD repositories, route matrices,
or Command Center card/tab components.

## Safety Rules

- No project files or CareLoop files may be changed.
- No provider/model calls may be enabled.
- No agent dispatch, worker execution, or tool execution may be enabled.
- No project creation or project mutation may be enabled.
- No hosted DB mutation, network calls, deploy, release, export, package
  creation, or provider spend may be enabled.
- No delete or raw SQL actions are admitted in the founder persistence flow.
- Local SQLite writes remain approval-gated and limited to allowlisted NEXUS OS
  founder workflow records.
- Primary Command Center UX must not show raw private IDs, raw JSON, raw logs,
  raw policy dumps, or DemoApp in full Command Center.

## Subphases

### P95.1 Contract

P95.1 is complete when the implementation-grade execution contract exists, the
P95 plan is documented, package/checker wiring exists, and OS status tracks
P95.1 without touching runtime, DB, dashboard, or project files.

Validation:

- `npm run check:p951-founder-persistence-controls-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P95.2 Core Model

P95.2 is complete. It adds a display-safe founder persistence operator control model.
It surfaces approval state, approval evidence, local entity summaries,
pending control actions, rollback/audit references, next action, blockers,
disabled reason, owner capability, cost impact, and unsafe runtime flags set to
false without rendering Command Center UI or executing writes.

Validation:

- `npm run check:p952-founder-persistence-control-model`
- `npm run check:p951-founder-persistence-controls-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P95.3 Approved Local Persistence Adapter

P95.3 is complete. It adds approved local persistence action handling that
reuses the P94 CRUD admission helper. It exercises create/read/update/upsert/list
against local SQLite only after explicit local write gates are present. Delete,
raw SQL, hosted DB mutation, project mutation, dispatch, worker/tool execution,
deploy, package, and spend remain blocked.

Validation:

- `npm run check:p953-approved-local-persistence-adapter`
- `npm run check:p952-founder-persistence-control-model`
- `npm run check:p951-founder-persistence-controls-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P95.4 Command Center UX

P95.4 is next. It exposes the persistence control state in Command Center Lite, Business
Build, and DB Runtime. The UX must show saved founder workflow state, approval
state, read/write posture, rollback/audit evidence, next action, blockers,
disabled reason, owner capability, evidence/activity location, and cost impact.

It must preserve system, dark, and light themes, route-wide navigation, no
DemoApp leakage, no raw JSON/log/policy dumps, and no raw private IDs.

### P95.5 Validation

P95.5 aggregates contract, model, adapter, Command Center UX, temp SQLite, and
route-safety validation. It adds or updates checkers and reports only.

### P95.6 Docs And Roadmap

P95.6 updates README, PRD, Command Center guide if applicable, platform roadmap,
OS roadmap/status, and reports. It must describe what is live-local and what is
still blocked without implying unsafe execution.

### P95.7 Final Validation

P95.7 runs final validation, stamps real commits, closes P95, and hands off to
P96.

## Known Risks

- Operator controls can look actionable before the underlying local persistence
  adapter exists. P95.4 must not render fake working actions.
- Local SQLite write controls can be confused with hosted or project writes.
  Labels and checkers must keep the local-only boundary visible.
- Re-running validation reports changes timestamps and validation HEADs. Final
  status stamping must record real commits and avoid stale phase status.

## Rollback Plan

Revert the latest P95 subphase commit. P95.1 is contract-only, so rollback
removes contract/checker/doc/status/report changes without affecting runtime
behavior, DB schema, dashboard source, local-state runtime data, or project
files.
