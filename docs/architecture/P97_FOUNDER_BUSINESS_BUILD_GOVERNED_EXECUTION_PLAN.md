# P97 Founder Business Build Governed Execution Plan

P97 moves Business Build from local readiness toward governed local SQLite CRUD
for founder-to-business build records. It does not enable provider/model calls,
agent dispatch, worker/tool execution, project creation or mutation, hosted DB
mutation, network calls, deploy, release, export, package creation, or provider
spend.

## Subphase Scope

### P97.1 Execution Contract

P97.1 is complete. It defines the implementation-grade contract for DB-backed
Business Build CRUD and the later Command Center UX work.

Validation:

- `npm run check:p971-founder-business-build-governed-execution-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P97.2 Business Build DB Schema

P97.2 is complete. It adds local SQLite schema definitions for Business Build
sessions, execution requests, agent lane state, and PRD-to-workstream snapshots.

Validation:

- `npm run check:p972-business-build-db-schema`
- `npm run check:p922-sqlite-crud-repository`
- `npm run check:p971-founder-business-build-governed-execution-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P97.3 Business Build CRUD Model

P97.3 is complete. It adds a governed local CRUD model and admission helper for allowlisted
Business Build DB records. Delete, raw SQL, hosted DB writes, provider calls,
agent dispatch, worker/tool execution, project mutation, deploy, package, and
spend remain forbidden.

Validation:

- `npm run check:p973-business-build-crud-model`
- `npm run check:p972-business-build-db-schema`
- `npm run check:p971-founder-business-build-governed-execution-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P97.4 Command Center DB UX

P97.4 is complete. It shows DB-backed Chat with NEXUS, Business Build, Agent Flow, and DB
Runtime state. The primary UX shows saved local state, next action,
blockers, disabled reason, owner capability, evidence/activity location, and
cost posture without raw JSON, raw logs, raw policy dumps, DemoApp, raw private
IDs, or fake execution controls.

Validation:

- `npm run check:p974-command-center-business-build-db-ux`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Business Build DB CRUD"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P97.5 Tests / Checkers

P97.5 is complete. It aggregates contract, schema, CRUD model, Command Center
DB UX, focused Playwright, dashboard build, reports, docs, and status
validation. P97.6 is next for docs and roadmap closure.

Validation:

- `npm run check:p975-business-build-crud-validation`
- `npm run check:p974-command-center-business-build-db-ux`
- `npm run check:p973-business-build-crud-model`
- `npm run check:p972-business-build-db-schema`
- `npm run check:p971-founder-business-build-governed-execution-contract`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Business Build DB CRUD"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P97.6 Docs / Roadmap

P97.6 is complete. It updates README, PRD, Command Center guide, platform roadmap, OS
roadmap, phase status, and evidence reports for the DB-backed Business Build
workflow. P97.7 is next for final validation and parent phase closure.

Validation:

- `npm run check:p976-business-build-docs-roadmap`
- `npm run check:p975-business-build-crud-validation`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

### P97.7 Final Validation

P97.7 is next. It will run final validation, stamp real commits, close P97, and hand off to
P98.

Validation:

- `npm run check:p977-business-build-final-validation`
- `npm run check:p976-business-build-docs-roadmap`
- `npm run check:p975-business-build-crud-validation`
- `npm run check:p974-command-center-business-build-db-ux`
- `npm run check:p973-business-build-crud-model`
- `npm run check:p972-business-build-db-schema`
- `npm run check:p971-founder-business-build-governed-execution-contract`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

## Safety Boundary

P97 admits only scoped local SQLite CRUD for NEXUS OS Business Build records.
Project source files, existing generated app sources/tests, provider calls,
agent dispatch, worker/tool execution, hosted DB mutation, network calls,
deploy, release, export, package creation, and provider spend remain blocked
unless a later explicit phase changes that boundary.
