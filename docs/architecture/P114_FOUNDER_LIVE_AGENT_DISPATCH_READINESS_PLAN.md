# P114 Founder Live Agent Dispatch Readiness Plan

P114 moves approved local assignment readiness toward governed local dispatch
readiness. The phase does not dispatch agents, execute workers/tools, mutate
projects, call providers/models, use hosted DB writes, expose raw SQL, deploy,
release, export, package, network, or spend.

Subphases:
- P114.1 Dispatch Readiness Contract / Policy / Schema Plan
- P114.2 Agent Dispatch SQLite Schema
- P114.3 Governed Local Dispatch CRUD Model
- P114.4 Dispatch Readiness Preview / Safe Dry Run
- P114.5 Command Center Agent Dispatch UX
- P114.6 Dispatch Validation / Docs
- P114.7 Final Validation

Implementation follows
[`p114-founder-live-agent-dispatch-readiness-contracts.json`](../../contracts/os-roadmap/p114-founder-live-agent-dispatch-readiness-contracts.json).

## P114.1 Dispatch Readiness Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local dispatch readiness contract for
approved founder agent assignment candidates without changing DB schema,
runtime models, Command Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `96e7a4c5e720`.

Allowed files: P114 contract, P114 plan, README, platform roadmap, P114.1
checker, P113.7 compatibility checker, OS phase status checker, package script
registry, OS roadmap/status files, and generated P114.1/P113.7/status/coverage
reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P114 contract and plan, added the
P114.1 contract checker, registered the package script, updated P113.7 handoff
compatibility, updated the OS status checker for P114.1-P114.7 and P115,
updated README/platform roadmap/status, and regenerated reports.

Expected exports/data shapes: no runtime exports, schema, UI data, or
persistent runtime data in P114.1. Future subphases may add only the documented
dispatch readiness exports and local SQLite entities after their own subphase
plans.

Safety rules: contract-only. Hosted DB mutation, raw SQL, provider/model calls,
agent dispatch, worker/tool execution, runtime admission, execution unlock,
project mutation, deploy, release, export, package creation, network calls, and
provider spend remain blocked.

Reuse check: P114.1 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `os-roadmap/updatePhaseStatus.js`, the P113
assignment readiness contract, and existing DB/runtime/Command Center helper
names as future reuse requirements. No report writer, checker formatter, DB
helper, status helper, UI component, or runtime helper is duplicated.

Command Center UX requirements: no Command Center source change in P114.1.
Later UX work must show dispatch readiness state on founder Agent Flow and
Business Build pages and keep Chat with NEXUS and Lite clean.

Dark/light/system theme requirements: no theme source change in P114.1. Later
UX work must preserve System, Dark, and Light themes.

Playwright tests: no new Playwright test in P114.1 because no UI source changes
are made. Later UX work must add focused route coverage.

Checker updates: P114.1 adds a dedicated contract checker, updates the OS phase
status checker to accept P114.1-P114.7 and P115, and updates the P113.7 checker
to accept the P114.1/P114.2 handoff state.

Docs/README/roadmap updates: P114.1 is recorded in this plan, README, platform
roadmap, P114 contract, OS roadmap/status, and generated reports. P114.2 is
next.

OS phase status update: P114 is in progress; P114.1 is complete; current phase
P114.1; previous P113.7; next P114.2.

Validation commands:
- `npm run check:p1141-founder-live-agent-dispatch-contract`
- `npm run check:p1137-founder-live-agent-work-assignment-final`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw dispatch/assignment/queue table names in primary UX; no fake
runnable actions; no hosted DB mutation, raw SQL interface, provider/model
calls, agent dispatch, worker/tool execution, project mutation, deploy,
release, export, package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P114.1 files>`
- `git commit -m "feat(nexus): implement p1141 dispatch readiness contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: dispatch readiness wording can sound like live agent dispatch is
available. The P114.1 checker blocks unsafe authority claims and fake runnable
actions.

Rollback plan: remove the P114.1 checker/script/docs/status/report updates,
restore current phase to P113.7 with P114 as a handoff placeholder, and keep
P113 completion unchanged.

## P114.2 Agent Dispatch SQLite Schema

Status: complete

Narrow goal: add local SQLite schema metadata and isolated validation for
dispatch readiness items, dispatch events, and dispatch evidence references
without runtime dispatch.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `abda78fb2182`.

Allowed files: local DB schema metadata and SQL, P114.2 schema checker, P114.1
compatibility checker, P114 contract, P114 plan, README, platform roadmap,
package script registry, OS phase status files, and generated P114.2/P114.1/
status/coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added local dispatch readiness item, event, and
evidence reference entities to `db/schema.json` and `db/schema.sql`; added the
P114.2 checker; registered the package script; updated P114 contract/status/
docs; and regenerated reports.

Expected exports/data shapes: no runtime exports. The local schema now includes
display-safe dispatch readiness item, dispatch event, and dispatch evidence
reference records with explicit false-capable flags for local CRUD, DB writes,
hosted DB mutation, dispatch, execution, worker execution, runtime admission,
project mutation, and provider spend.

Safety rules: schema-only. Hosted DB mutation, raw SQL interface,
provider/model calls, agent dispatch, worker/tool execution, runtime admission,
execution unlock, project mutation, deploy, release, export, package creation,
network calls, and provider spend remain blocked.

Reuse check: P114.2 reuses `db/sqliteRuntime.js`,
`db/sqliteCrudRepository.js`, `shared/reportWriter.js`, and
`shared/checkResultFormatter.js`. No SQLite runtime, CRUD repository, report
writer, checker formatter, status helper, UI component, or runtime helper is
duplicated.

Command Center UX requirements: no Command Center source change in P114.2.
Dispatch readiness UX remains planned for P114.5.

Dark/light/system theme requirements: no theme source change in P114.2.

Playwright tests: no new Playwright test in P114.2 because no UI source changes
are made.

Checker updates: P114.2 adds a dedicated schema checker. P114.1 already accepts
the P114.2/P114.3 handoff state.

Docs/README/roadmap updates: P114.2 is recorded in this plan, README, platform
roadmap, P114 contract, OS roadmap/status, and generated reports. P114.3 is
next.

OS phase status update: P114 is in progress; P114.2 is complete; current phase
P114.2; previous P114.1; next P114.3.

Validation commands:
- `npm run check:p1142-founder-live-agent-dispatch-readiness`
- `npm run check:p1141-founder-live-agent-dispatch-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/provider/deploy
paths changed; temporary local schema-check DB is removed; no DemoApp exposure;
no raw JSON/log/policy dumps; no raw private IDs or raw dispatch/assignment/
queue table names in primary UX; no fake runnable actions; no hosted DB
mutation, raw SQL interface, provider/model calls, agent dispatch, worker/tool
execution, project mutation, deploy, release, export, package, network, or
provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P114.2 files>`
- `git commit -m "feat(nexus): implement p1142 dispatch readiness schema"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: schema additions can be mistaken for live dispatch. P114.2 keeps
all dispatch, execution, project mutation, hosted DB mutation, and provider
spend fields false in isolated validation records.

Rollback plan: remove the P114.2 schema/checker/script/docs/status/report
updates, restore P114 to P114.1 complete with P114.2 planned, and keep P114.1
unchanged.

## P114.3 Governed Local Dispatch CRUD Model

Phase: P114 Founder Live Agent Dispatch Readiness

Subphase: P114.3 Governed Local Dispatch CRUD Model

Goal: add approval-gated local SQLite CRUD helpers for allowlisted dispatch
readiness records without delete, agent dispatch, project mutation, hosted DB
mutation, or execution.

Why this is needed: P114.2 defines dispatch readiness tables, but NEXUS still
needs a governed local model for persisting dispatch readiness before any
future preview or UX subphase can inspect dispatch candidates.

User/operator impact: operators can inspect the exact local dispatch readiness
records that would be created for founder work lanes after explicit approval
gates. The helper returns disabled reasons, next action, blocker, evidence,
activity, and cost fields without exposing raw private IDs.

Command Center impact: no Command Center source change in P114.3. Dispatch
readiness UX remains planned for P114.5.

Safety impact: P114.3 allows only local SQLite create/read/update/upsert/list
for allowlisted dispatch readiness entities after explicit local approval
gates. Delete, raw SQL, hosted DB mutation, runtime admission, execution
unlock, provider/model calls, agent dispatch, worker/tool execution, project
mutation, deploy/release/export/package, network calls, and provider spend
remain blocked.

Cost impact: no provider/model calls, network calls, or provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`.

Files expected to change: P114 dispatch readiness helper, P114.3 checker,
P114.2 compatibility checker/report, P114 contract, this plan, README,
platform roadmap, package script registry, OS phase status files, and generated
P114.3/P114.2/status/coverage reports.

Files forbidden to change: `projects/**`, `careloop/**`, `db/**`,
`dashboard/src/**`, `dashboard/tests/**`, `local-state/runtime/**`,
`providers/**`, `tools/**`, `worker-runtime/**`, `deploy/**`, `release/**`,
`exports/**`, `packages/**`, and `.env*`.

Exact files/modules changed: added
`live-ready/founderLiveAgentDispatchReadiness.js`; added
`scripts/check-p1143-founder-live-agent-dispatch-readiness.js`; registered the
package script; updated P114 contract/status/docs; and regenerated reports.

Expected exports/data shapes:
- `P114_FOUNDER_LIVE_AGENT_DISPATCH_READINESS_PHASE`
- `P114_AGENT_DISPATCH_DB_ENTITIES`
- `buildFounderLiveAgentDispatchReadinessContract`
- `validateFounderLiveAgentDispatchReadinessContract`
- `buildSafeAgentDispatchDbRecord`
- `executeApprovedAgentDispatchDbCrudRequest`

Safety rules: do not add delete, raw SQL, hosted DB mutation, runtime
admission, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, deploy/release/export/package, network calls, or
provider spend. Do not expose raw private IDs, raw logs, raw policy dumps, or
fake runnable actions.

Reuse check: P114.3 reuses `db/sqliteRuntime.js`,
`db/sqliteCrudRepository.js`, `shared/resultEnvelope.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`, and the P113
assignment helper. It does not duplicate SQLite runtime, CRUD repository,
result envelopes, report writers, checker formatters, status helpers, or UI
components.

Command Center UX requirements: no UI source change in P114.3. The generated
contract records what changed, current state, next action, blockers, disabled
reason, owner capability, evidence/activity location, and cost impact for
future P114.5 UX.

Dark/light/system theme requirements: no theme source change in P114.3.

Playwright tests: no new Playwright test in P114.3 because no UI source changes
are made.

Checker updates: P114.3 adds a dedicated CRUD model checker that initializes an
isolated local SQLite DB, exercises approved create/read/update/upsert/list
paths, blocks default/unapproved/delete/outside-allowlist attempts, removes its
temporary DB, validates docs/status, and confirms unsafe authority remains
false.

Docs/README/roadmap updates: P114.3 is recorded in this plan, README, platform
roadmap, P114 contract, OS roadmap/status, and generated reports. P114.4 is
next.

OS phase status update: P114 is in progress; P114.3 is complete; current phase
P114.3; previous P114.2; next P114.4.

Validation commands:
- `npm run check:p1143-founder-live-agent-dispatch-readiness`
- `npm run check:p1142-founder-live-agent-dispatch-readiness`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; temporary local
schema-check DB is removed; no DemoApp exposure; no raw JSON/log/policy dumps;
no raw private IDs or raw dispatch/assignment/queue table names in primary UX;
no fake runnable actions; no hosted DB mutation, raw SQL interface,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
deploy, release, export, package, network, or provider spend authority is
enabled.

Git add/commit/push commands:
- `git add <allowed P114.3 files>`
- `git commit -m "feat(nexus): implement p1143 dispatch readiness crud"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: CRUD admission can be mistaken for live dispatch. P114.3 keeps all
dispatch, execution, project mutation, hosted DB mutation, and provider spend
fields false in isolated validation records.

Rollback plan: remove the P114.3 helper/checker/script/docs/status/report
updates, restore P114 to P114.2 complete with P114.3 planned, and keep the
P114.2 schema unchanged.
