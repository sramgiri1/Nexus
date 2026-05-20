# P94 Founder Runtime DB CRUD Workflow Wiring Plan

## Scope

P94 wires the founder-to-business workflow to governed local SQLite CRUD records.
It builds on P93 local CRUD admission and keeps the work limited to NEXUS OS
runtime state: founder session, Q&A turns, PRD artifact, workstream plan,
activation review, runtime task summaries, evidence, audit, and activity.

P94 does not enable provider/model calls, agent dispatch, tool execution, worker
execution, project creation, project source mutation, hosted DB mutation,
network calls, deploy, release, export, package creation, or provider spend.

## Subphase Plan

### P94.1 Schema / Policy / Contract

P94.1 is complete. It defines the implementation-grade P94 execution contract,
subphase split, future exports, data shape, Command Center UX requirements,
validation commands, and safety checks. P94.1 is contract-only and does not
modify `db/**`, dashboard source, live runtime models, or local runtime data.

### P94.2 Founder Runtime DB Schema

P94.2 is complete. It adds local SQLite schema definitions for durable founder
sessions, founder Q&A turns, PRD artifacts, and workstream plans. The schema
uses display-safe IDs, public labels, summaries, owner capabilities, evidence
and activity references, timestamps, retention classes, and redaction
requirements.

### P94.3 Founder Runtime CRUD Model

P94.3 is complete. It adds the governed local CRUD model and admission wrapper
for the P94.2 entities. It reuses existing result envelopes, SQLite runtime
configuration, SQLite CRUD repository helpers, and the P93 approval pattern.
Default admission remains blocked; local writes require explicit operator
approval, rollback acceptance, audit acceptance, validation command acceptance,
sqlite-live mode, and local write flags.

### P94.4 Founder DB View Model

P94.4 is complete. It adds display-safe Command Center data for the DB-backed
founder workflow. The model shows saved session state, next founder question,
PRD readiness, workstream lanes, blockers, disabled reason, owner capability,
evidence/activity locations, and cost posture. Business Build, Founder Intake,
and DB Runtime can consume the shared founder DB workflow model without page
rendering changes.

### P94.5 Command Center Founder DB UX

P94.5 is complete. It wires Lite, Business Build, and DB Runtime to the founder
DB workflow state. The UX shows saved session state, next founder question, PRD
readiness, workstream lanes, blockers, disabled reason, owner capability,
evidence/activity locations, and cost posture without exposing raw JSON, raw
logs, raw policy dumps, DemoApp, raw private IDs, raw DB URLs, or fake runnable
mutation/provider/agent/project actions.

### P94.6 Docs / Roadmap / Validation

P94.6 is next. It will aggregate validation across P94.1-P94.5 and update README, PRD,
architecture docs, roadmap, phase status, and reports.

### P94.7 Final Validation

P94.7 will run final validation, close P94, stamp status with real commits,
and hand off to the next scoped phase.

## Reuse Check

P94 must reuse:

- `shared/reportWriter.js`
- `shared/reportMetadata.js`
- `shared/resultEnvelope.js`
- `shared/modeGuard.js`
- `shared/redaction.js`
- `shared/checkResultFormatter.js`
- `os-roadmap/updatePhaseStatus.js`
- `db/sqliteCrudRepository.js`
- `db/sqliteRuntime.js`
- `live-ready/localCrudExecutionAdmission.js`
- existing Command Center tabs/cards/badges
- existing route matrix
- existing evidence/audit/activity helpers

P94 must not duplicate report writers, mode guards, redaction helpers, checker
formatters, phase status updaters, result envelopes, route matrices, UI
card/tab/status components, or activity/evidence/audit appenders.

## Safety Rules

- Implement one subphase at a time.
- Do not modify `projects/**`, `careloop/**`, generated app source/tests,
  providers, tools, worker runtime, deploy, release, export, package, or
  environment files.
- Do not enable provider/model calls, agent dispatch, tool execution, worker
  execution, project creation, project mutation, hosted DBs, network calls,
  deploy, release, export, package creation, or provider spend.
- Do not expose DemoApp in full Command Center.
- Do not show project/private raw IDs in primary UX.
- Do not invent fake working actions.

## Validation

P94.1 validation:

- `npm run check:p941-founder-runtime-db-crud-contract`
- `npm run check:p942-founder-runtime-db-schema`
- `npm run check:p922-sqlite-crud-repository`
- `npm run check:p943-founder-runtime-crud-model`
- `npm run check:p944-founder-db-view-model`
- `npm run check:p945-command-center-founder-db-ux`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Later subphases must add focused checkers and Playwright coverage when UI files
change.
