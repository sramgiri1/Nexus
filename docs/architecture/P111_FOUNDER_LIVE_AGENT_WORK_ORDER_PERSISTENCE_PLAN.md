# P111 Founder Live Agent Work Order Persistence Plan

P111 moves founder live agent work orders toward governed local SQLite
persistence so approved agent work can be tracked durably before any dispatch,
execution, project mutation, hosted DB mutation, deploy, network, or spend
authority is considered.

## Phase Split

- P111.1 Work Order Persistence Contract / Policy / Schema Plan
- P111.2 Agent Work Order SQLite Schema
- P111.3 Governed Local Work Order CRUD Model
- P111.4 Command Center Work Order Persistence UX
- P111.5 Work Order Persistence Validation
- P111.6 Docs / Roadmap
- P111.7 Final Validation

The canonical implementation-grade scope, allowed files, forbidden files,
expected exports, data shapes, UX rules, theme rules, Playwright requirements,
checker updates, docs updates, OS status updates, validation commands, git
commands, and final response checklists are recorded in
[`p111-founder-live-agent-work-order-persistence-contracts.json`](../../contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json).

## P111.1 Work Order Persistence Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local SQLite persistence contract for
founder-approved agent work orders without changing DB schema, runtime models,
Command Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `d0c8d2aa`.

Allowed files: P111 contract, P111 plan, README, platform roadmap, package
script registry, P111.1 checker, P110.7 compatibility checker, OS phase
checker, OS phase status files, and generated P111.1/P110.7/status/coverage
reports.

Forbidden files: `projects/**`, `careloop/**`, generated project sources/tests,
`db/**`, `live-ready/**`, `dashboard/src/**`, `dashboard/tests/**`,
`local-state/runtime/**`, `providers/**`, `tools/**`, `worker-runtime/**`,
`deploy/**`, `release/**`, `exports/**`, `packages/**`, and `.env*`.

Exact files/modules changed: added the P111 contract and P111.1 checker,
registered the P111.1 package script, updated the P110.7 final checker for the
P111.1/P111.2 handoff, updated the OS phase checker to accept P111.1-P111.7,
updated README/platform roadmap/P111 docs, and advanced OS status.

Expected exports/data shapes: P111.1 exports no runtime API and adds no DB
schema. It documents future exports and future local schemas for later scoped
subphases only. Future work order records must remain display-safe and include
current state, next action, blockers, disabled reason, owner capability,
evidence/audit/activity references, cost impact, and unsafe runtime flags set
false.

Safety rules: P111.1 is contract/docs/status/checker only. It does not call
providers/models, dispatch agents, run workers/tools, mutate projects, use
hosted DBs, run raw SQL, deploy, release, export, package, call networks, or
spend.

Reuse check: P111.1 requires reuse of the shared report/checker helpers,
existing SQLite runtime/repository helpers, existing founder handoff work order
helpers, existing founder work admission helpers, and existing Command Center
route/card/status patterns. No helper duplication is allowed.

Command Center UX requirements: no Command Center source change in P111.1.
Later P111 UX must surface work order persistence only on relevant founder
routes and must keep Chat/Lite clean.

Dark/light/system theme requirements: no theme source change in P111.1. P111.4
must preserve and test System, Dark, and Light theme behavior when UX changes.

Playwright tests: no new Playwright test in P111.1 because no UI files change.
P111.4 must add focused route coverage for work order persistence UX.

Checker updates: P111.1 adds
`check:p1111-founder-live-agent-work-order-persistence-contract`, updates
P110.7 final validation compatibility, and updates OS phase status acceptance.

Docs/README/roadmap updates: P111.1 is recorded in this plan, README, platform
roadmap, P111 contract, OS roadmap/status, and generated reports. P111.2 is
next.

OS phase status update: P111 is in progress; P111.1 is complete; current phase
P111.1; previous P110.7; next P111.2.

Validation commands:
- `npm run check:p1111-founder-live-agent-work-order-persistence-contract`
- `npm run check:p1107-founder-live-operator-decision-ledger-persistence-final`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden paths changed; no DemoApp exposure; no raw
JSON/log/policy dumps; no raw private project IDs; no raw packet keys; no fake
runnable actions; no hosted DB mutation, raw SQL, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.1 files>`
- `git commit -m "feat(nexus): define p111 agent work order persistence contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: contract wording can accidentally imply agent dispatch or
execution is available, or future schema names can be added to DB schema too
early. The P111.1 checker blocks those risks.

Rollback plan: remove P111 contract/checker/docs/status/report updates, restore
top-level status to P110.7 with P111 planned, and leave P110 complete.

## P111.2 Agent Work Order SQLite Schema

Status: complete

Narrow goal: add local SQLite schema definitions for display-safe founder agent
work orders, work order events, and work order evidence references.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `431be5d0`.

Allowed files: `db/schema.json`, `db/schema.sql`, P111.2 checker, P111.1
compatibility checker, P111 contract, P111 plan, README, platform roadmap,
package script registry, OS phase status files, and generated P111.2,
P111.1, OS status, and phase coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `dashboard/src/**`,
`dashboard/tests/**`, `live-ready/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
`.env*`, and persistent runtime DB files. The checker may create
`local-state/runtime/check-p1112.sqlite` only during validation and must delete
it before exit.

Exact files/modules changed: added three schema entities, three SQL tables and
indexes, the P111.2 schema checker, package script registration, P111.1
checker compatibility, P111 contract/status/docs updates, and generated
reports.

Expected exports/data shapes: P111.2 exports no runtime API. It adds schema
metadata and SQL tables for `founder_agent_work_orders`,
`founder_agent_work_order_events`, and
`founder_agent_work_order_evidence_refs`. Rows include display-safe labels,
state, summary, owner capability, evidence/activity references, and blocked
authority booleans for dispatch, execution, worker execution, project mutation,
runtime admission, hosted DB mutation, and provider spend.

Safety rules: P111.2 is schema/checker/status/docs only. It does not add
runtime CRUD admission, persistent runtime data writes, Command Center source,
agent dispatch, execution, project mutation, hosted DB mutation, raw SQL
interface, deploy, release, export, package, network, or provider spend.

Reuse check: P111.2 reuses the existing SQLite runtime and CRUD repository for
isolated validation. No schema loader, report writer, checker formatter,
redaction helper, mode guard, or DB helper is duplicated.

Command Center UX requirements: no Command Center source change in P111.2.
P111.4 owns work order persistence UX.

Dark/light/system theme requirements: no theme source change in P111.2.

Playwright tests: no new Playwright test in P111.2 because no UI source changes
are made.

Checker updates: P111.2 adds a dedicated schema checker and updates P111.1 to
accept the P111.2/P111.3 handoff state.

Docs/README/roadmap updates: P111.2 is recorded in this plan, README, platform
roadmap, P111 contract, OS roadmap/status, and generated reports. P111.3 is
next.

OS phase status update: P111 is in progress; P111.2 is complete; current phase
P111.2; previous P111.1; next P111.3.

Validation commands:
- `npm run check:p1112-founder-live-agent-work-order-schema`
- `npm run check:p1111-founder-live-agent-work-order-persistence-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/runtime/provider/deploy paths
changed; temporary SQLite checker DB removed; no DemoApp exposure; no raw
JSON/log/policy dumps; no fake runnable actions; no hosted DB mutation, raw SQL
interface, provider/model calls, agent dispatch, worker/tool execution, project
mutation, deploy, release, export, package, network, or provider spend
authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.2 files>`
- `git commit -m "feat(nexus): add p111 agent work order schema"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: schema fields can accidentally default unsafe authority true, or
the checker can leave a temporary SQLite DB behind. The P111.2 checker validates
blocked booleans and removes the temporary DB.

Rollback plan: remove the three schema entries/tables/indexes, remove the
P111.2 checker/script/docs/status/report updates, restore P111 to P111.1 with
P111.2 planned, and keep P111.1 unchanged.

## P111.3 Governed Local Work Order CRUD Model

Status: complete

Narrow goal: add approval-gated local CRUD helpers for the allowlisted founder
agent work order entities without dispatching agents, executing workers/tools,
or mutating projects.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `6010680e`.

Allowed files: `live-ready/founderLiveAgentWorkOrderPersistence.js`, P111.3
checker, P111.2 compatibility checker, P111 contract, P111 plan, README,
platform roadmap, package script registry, OS phase status files, and generated
P111.3/P111.2/status/coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `dashboard/src/**`,
`dashboard/tests/**`, `providers/**`, `tools/**`, `worker-runtime/**`,
`deploy/**`, `release/**`, `exports/**`, `packages/**`, `.env*`, and
persistent runtime DB files. The checker may create
`local-state/runtime/check-p1113.sqlite` only during validation and must delete
it before exit.

Exact files/modules changed: added the P111.3 live-ready CRUD model and
checker, registered the package script, updated P111.2 compatibility, updated
P111 contract/status/docs, and regenerated reports.

Expected exports/data shapes: P111.3 exports the phase id, allowlisted work
order DB entity list, safe record builder, approval-gated CRUD executor,
persistence contract builder, and contract validator. The model returns
display-safe work order records, events, evidence refs, CRUD requests,
forbidden operations, mutation gate, runtime flags, blockers, disabled reason,
owner capability, evidence/activity refs, and cost impact.

Safety rules: default execution is blocked; unapproved execution is blocked;
delete is blocked; outside-allowlist entities are blocked; local CRUD requires
`execute=true`, operator approval, rollback acceptance, audit acceptance,
validation command acceptance, sqlite-live mode, and local write flags. Hosted
DB mutation, raw SQL interface, runtime admission, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
deploy, release, export, package, network, and provider spend remain blocked.

Reuse check: P111.3 reuses `shared/resultEnvelope.js`, `db/sqliteRuntime.js`,
`db/sqliteCrudRepository.js`, `live-ready/founderLiveHandoffWorkOrders.js`,
and `live-ready/founderLiveWorkAdmission.js`. No SQLite repository or handoff
helper is duplicated.

Command Center UX requirements: no Command Center source change in P111.3.
P111.4 owns work order persistence UX.

Dark/light/system theme requirements: no theme source change in P111.3.

Playwright tests: no new Playwright test in P111.3 because no UI source changes
are made.

Checker updates: P111.3 adds a dedicated CRUD checker and updates P111.2 to
accept the P111.3/P111.4 handoff state.

Docs/README/roadmap updates: P111.3 is recorded in this plan, README, platform
roadmap, P111 contract, OS roadmap/status, and generated reports. P111.4 is
next.

OS phase status update: P111 is in progress; P111.3 is complete; current phase
P111.3; previous P111.2; next P111.4.

Validation commands:
- `npm run check:p1113-founder-live-agent-work-order-crud-model`
- `npm run check:p1112-founder-live-agent-work-order-schema`
- `npm run check:p1111-founder-live-agent-work-order-persistence-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/provider/deploy paths
changed; temporary SQLite checker DB removed; no DemoApp exposure; no raw
JSON/log/policy dumps; no fake runnable actions; no hosted DB mutation, raw SQL
interface, provider/model calls, agent dispatch, worker/tool execution, project
mutation, deploy, release, export, package, network, or provider spend
authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.3 files>`
- `git commit -m "feat(nexus): add p111 work order crud model"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: CRUD helpers can accidentally admit deletes, outside entities, or
unsafe execution wording. The P111.3 checker blocks those cases and validates
isolated create/read/update/upsert/list behavior.

Rollback plan: remove the P111.3 live-ready module/checker/script/docs/status
and report updates, restore P111 to P111.2 with P111.3 planned, and keep
P111.1-P111.2 unchanged.

## P111.4 Command Center Work Order Persistence UX

Status: complete

Narrow goal: surface display-safe founder agent work order persistence state on
Business Build and Durable State while keeping Chat/Lite focused on founder
conversation only.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `06d43086`.

Allowed files: dashboard Business Build data, DB runtime readiness data,
Command Center V2 page, route Playwright test, P111.4 checker, P111.3
compatibility checker, P111 contract, P111 plan, README, platform roadmap,
package script registry, OS phase status files, and generated P111.4/P111.3/
status/coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`,
`local-state/runtime/**`, `providers/**`, `tools/**`, `worker-runtime/**`,
`deploy/**`, `release/**`, `exports/**`, `packages/**`, and `.env*`.

Exact files/modules changed: added a display-only founder agent work order
persistence view model, surfaced it on Business Build and Durable State DB
Runtime, added focused Playwright route/theme coverage, added the P111.4
checker, updated P111.3 handoff compatibility, registered the package script,
updated P111 contract/status/docs, and regenerated reports.

Expected exports/data shapes:
`buildFounderLiveAgentWorkOrderPersistenceDisplayModel(founderIdeaSummary)`
returns `currentState`, `runtimeMode`, `dbMode`, saved work order/event/evidence
states, allowed local CRUD labels, allowed record labels, ready/total counts,
next action, blockers, disabled reason, owner capability, evidence/activity
locations, cost impact, command center visibility, lane rows, and safety rows.
The model uses founder-readable labels and does not expose raw DB table names or
private IDs.

Safety rules: the UI is display-only and exposes no mutation controls. Hosted DB
mutation, raw SQL, provider/model calls, agent dispatch, worker/tool execution,
runtime admission, execution unlock, project mutation, deploy, release, export,
package creation, network calls, and provider spend remain blocked.

Reuse check: P111.4 reuses the existing Business Build display model pattern,
DB runtime readiness model, Command Center card/status primitives, route matrix,
theme controls, and Playwright route safety tests. It does not duplicate SQLite
repository helpers or import the Node-side P111.3 CRUD executor into the browser
bundle.

Command Center UX requirements: Business Build and Durable State now show Work
Order Persistence with current state, next action, blockers, disabled reason,
owner capability, evidence, activity, cost, allowed local CRUD, record rows, and
safety rows. Chat/Lite remains chat-only.

Dark/light/system theme requirements: no theme API changes. The new card uses
existing `ccv2-*` classes and is covered by dark/light route tests; system theme
behavior remains inherited from the existing shell.

Playwright tests: added the focused Work order persistence route test covering
Business Build, Durable State DB Runtime, Chat/Lite absence, and dark/light
theme switching.

Checker updates: P111.4 adds a dedicated UX checker and updates P111.3 to accept
the P111.4/P111.5 handoff state.

Docs/README/roadmap updates: P111.4 is recorded in this plan, README, platform
roadmap, P111 contract, OS roadmap/status, and generated reports. P111.5 is
next.

OS phase status update: P111 is in progress; P111.4 is complete; current phase
P111.4; previous P111.3; next P111.5.

Validation commands:
- `npm run check:p1114-command-center-work-order-persistence-ux`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Work order persistence"`
- `cd dashboard && npm run build`
- `npm run check:p1113-founder-live-agent-work-order-crud-model`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/live-ready/db/provider/deploy paths
changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw private IDs
or raw work order table names in primary UX; no fake runnable actions; no
hosted DB mutation, raw SQL interface, provider/model calls, agent dispatch,
worker/tool execution, project mutation, deploy, release, export, package,
network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.4 files>`
- `git commit -m "feat(nexus): add p111 work order persistence ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: the UI could accidentally import Node-only DB helpers or leak raw
SQLite entity names. The P111.4 checker blocks both cases.

Rollback plan: remove the P111.4 dashboard/checker/test/docs/status/report
updates, restore P111 to P111.3 with P111.4 planned, and keep P111.1-P111.3
unchanged.

## P111.5 Work Order Persistence Validation

Status: complete

Narrow goal: aggregate P111.1-P111.4 validation across contract, schema,
governed local CRUD model, Command Center UX, route safety, docs, status, and
reports without changing runtime behavior.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `553a7a7e`.

Allowed files: P111.5 checker, P111.4 compatibility checker, P111 contract,
P111 plan, README, platform roadmap, package script registry, OS phase status
files, and generated P111.5/P111.4/status/coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P111.5 aggregate checker, registered the
package script, updated P111.4 handoff compatibility, updated P111
contract/status/docs, and regenerated reports.

Expected exports/data shapes: no new runtime exports and no schema changes.
The checker validates the existing P111.1 contract, P111.2 local SQLite schema,
P111.3 CRUD contract, and P111.4 display-safe Command Center work order
persistence model.

Safety rules: aggregate validation only. Hosted DB mutation, raw SQL,
provider/model calls, agent dispatch, worker/tool execution, runtime admission,
execution unlock, project mutation, deploy, release, export, package creation,
network calls, and provider spend remain blocked.

Reuse check: P111.5 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, existing P111.1-P111.4 reports, the P111.3
contract validator, and the P111.4 display model. No checker formatter, report
writer, SQLite repository, UI component, or status helper is duplicated.

Command Center UX requirements: no Command Center source change in P111.5.
P111.4 Business Build and Durable State UX is preserved; Chat/Lite remains
clean.

Dark/light/system theme requirements: no theme source change in P111.5.
P111.5 validates that P111.4 Playwright route/theme coverage exists.

Playwright tests: no new Playwright test in P111.5 because no UI source changes
are made.

Checker updates: P111.5 adds a dedicated aggregate checker and updates P111.4
to accept the P111.5/P111.6 handoff state.

Docs/README/roadmap updates: P111.5 is recorded in this plan, README, platform
roadmap, P111 contract, OS roadmap/status, and generated reports. P111.6 is
next.

OS phase status update: P111 is in progress; P111.5 is complete; current phase
P111.5; previous P111.4; next P111.6.

Validation commands:
- `npm run check:p1115-founder-live-agent-work-order-persistence`
- `npm run check:p1114-command-center-work-order-persistence-ux`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw work order table names in primary UX; no fake runnable
actions; no hosted DB mutation, raw SQL interface, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.5 files>`
- `git commit -m "feat(nexus): add p111 work order persistence validation"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: aggregate validation can become stale if the prior UX checker only
accepts one handoff state. P111.5 updates the P111.4 checker to accept P111.5
and P111.6.

Rollback plan: remove the P111.5 checker/script/docs/status/report updates,
restore P111 to P111.4 with P111.5 planned, and keep P111.1-P111.4 unchanged.

## P111.6 Docs / Roadmap

Status: complete

Narrow goal: close P111 docs, README, platform roadmap, contract, reports, and
OS status evidence before final validation.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `cf5104f5`.

Allowed files: P111.6 docs checker, P111.5 compatibility checker, P111
contract, P111 plan, README, platform roadmap, package script registry, OS
phase status files, and generated P111.6/P111.5/status/coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P111.6 docs checker, registered the
package script, updated P111.5 handoff compatibility, updated P111
contract/status/docs, and regenerated reports.

Expected exports/data shapes: no new runtime exports, schema, or UI data. The
checker validates docs/status/report completeness for P111.1-P111.6 and the
handoff to P111.7 final validation.

Safety rules: docs and roadmap closure only. Hosted DB mutation, raw SQL,
provider/model calls, agent dispatch, worker/tool execution, runtime admission,
execution unlock, project mutation, deploy, release, export, package creation,
network calls, and provider spend remain blocked.

Reuse check: P111.6 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, existing P111.1-P111.5 reports, and existing
OS status files. No report writer, checker formatter, UI component, DB helper,
or runtime helper is duplicated.

Command Center UX requirements: no Command Center source change in P111.6.
P111.4 Business Build and Durable State UX is preserved; Chat/Lite remains
clean.

Dark/light/system theme requirements: no theme source change in P111.6.

Playwright tests: no new Playwright test in P111.6 because no UI source changes
are made.

Checker updates: P111.6 adds a dedicated docs checker and updates P111.5 to
accept the P111.6/P111.7 handoff state.

Docs/README/roadmap updates: P111.6 is recorded in this plan, README, platform
roadmap, P111 contract, OS roadmap/status, and generated reports. P111.7 is
next.

OS phase status update: P111 is in progress; P111.6 is complete; current phase
P111.6; previous P111.5; next P111.7.

Validation commands:
- `npm run check:p1116-founder-live-agent-work-order-persistence`
- `npm run check:p1115-founder-live-agent-work-order-persistence`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw work order table names in primary UX; no fake runnable
actions; no hosted DB mutation, raw SQL interface, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.6 files>`
- `git commit -m "feat(nexus): add p111 work order persistence docs"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: stale docs can overstate live authority. The P111.6 checker blocks
unsafe authority claims and validates plan, README, platform roadmap, contract,
phase status, and prior reports together.

Rollback plan: remove the P111.6 checker/script/docs/status/report updates,
restore P111 to P111.5 with P111.6 planned, and keep P111.1-P111.5 unchanged.

## P111.7 Final Validation

Status: complete

Narrow goal: close P111 with final checker evidence and hand off to P112
without changing Command Center source, runtime behavior, DB schema, project
files, or execution authority.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `023ee117`.

Allowed files: P111.7 final checker, P111.6 compatibility checker, OS phase
status checker, P111 contract, P111 plan, README, platform roadmap, package
script registry, OS phase status files, and generated P111.7/P111.6/status/
coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P111.7 final checker, registered the
package script, updated P111.6 handoff compatibility, updated the OS status
checker for the P112 handoff placeholder, closed P111 contract/status/docs, and
regenerated reports.

Expected exports/data shapes: package script
`check:p1117-founder-live-agent-work-order-persistence`. No runtime export,
schema, UI data, or persistent runtime data change. The final checker validates
the existing display-safe work order state and verifies unsafe runtime flags
remain blocked.

Safety rules: final validation only. Hosted DB mutation, raw SQL,
provider/model calls, agent dispatch, worker/tool execution, runtime admission,
execution unlock, project mutation, deploy, release, export, package creation,
network calls, and provider spend remain blocked.

Reuse check: P111.7 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, existing P111.1-P111.6 reports, existing
P111 runtime contract validation, the existing Command Center display model,
and the OS phase status checker. No report writer, checker formatter, UI
component, DB helper, status helper, or runtime helper is duplicated.

Command Center UX requirements: no Command Center source change in P111.7.
Business Build and Durable State continue to show work order persistence
state; Chat/Lite remains chat-only.

Dark/light/system theme requirements: no theme source change in P111.7. Existing
P111.4 route/theme coverage is preserved.

Playwright tests: no new Playwright test in P111.7 because no UI source changes
are made. The final checker validates that existing P111.4 route coverage is
still present.

Checker updates: P111.7 adds a dedicated final checker, updates P111.6 to
accept the P111.7/P112 handoff state, and updates the OS phase status checker
to allow P112 as the next handoff placeholder.

Docs/README/roadmap updates: P111.7 and parent P111 are recorded complete in
this plan, README, platform roadmap, P111 contract, OS roadmap/status, and
generated reports. P112 is next and requires its own implementation-grade
contract before work begins.

OS phase status update: P111 is complete; P111.7 is complete; current phase
P111.7; previous P111.6; next P112.

Validation commands:
- `npm run check:p1117-founder-live-agent-work-order-persistence`
- `npm run check:p1116-founder-live-agent-work-order-persistence`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw work order table names in primary UX; no fake runnable
actions; no hosted DB mutation, raw SQL interface, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P111.7 files>`
- `git commit -m "feat(nexus): finalize p111 work order persistence"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: P112 is only a handoff placeholder until its own contract is
written. The P111.7 checker validates the placeholder but does not implement
P112 work.

Rollback plan: remove the P111.7 checker/script/docs/status/report updates,
restore P111 to P111.6 with P111.7 planned, and keep P111.1-P111.6 unchanged.
