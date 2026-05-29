# P113 Founder Live Agent Work Assignment Readiness Plan

P113 moves governed queue admission candidates toward local agent work
assignment readiness. The phase does not dispatch agents, execute
workers/tools, mutate projects, call providers/models, use hosted DB writes,
expose raw SQL, deploy, release, export, package, network, or spend.

Subphases:
- P113.1 Assignment Readiness Contract / Policy / Schema Plan
- P113.2 Agent Work Assignment SQLite Schema
- P113.3 Governed Local Assignment CRUD Model
- P113.4 Assignment Readiness Preview / Safe Dry Run
- P113.5 Command Center Agent Assignment UX
- P113.6 Work Assignment Validation / Docs
- P113.7 Final Validation

Implementation follows
[`p113-founder-live-agent-work-assignment-readiness-contracts.json`](../../contracts/os-roadmap/p113-founder-live-agent-work-assignment-readiness-contracts.json).

## P113.1 Assignment Readiness Contract / Policy / Schema Plan

Status: complete

Narrow goal: define the governed local assignment readiness contract for
admitted founder agent queue candidates without changing DB schema, runtime
models, Command Center source, or runtime data.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `e4bfc7dbd878491f5482717a87394dfcba1955e6`.

Allowed files: P113 contract, P113 plan, README, platform roadmap, P113.1
checker, P112.7 compatibility checker, OS phase status checker, package script
registry, OS roadmap/status files, and generated P113.1/P112.7/status/coverage
reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `db/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added the P113 contract and plan, added the
P113.1 contract checker, registered the package script, updated P112.7 handoff
compatibility, updated the OS status checker for P113.1-P113.7 and P114,
updated README/platform roadmap/status, and regenerated reports.

Expected exports/data shapes: no runtime exports, schema, UI data, or
persistent runtime data in P113.1. Future subphases may add only the documented
assignment readiness exports and local SQLite entities after their own
subphase plans.

Safety rules: contract-only. Hosted DB mutation, raw SQL, provider/model calls,
agent dispatch, worker/tool execution, runtime admission, execution unlock,
project mutation, deploy, release, export, package creation, network calls, and
provider spend remain blocked.

Reuse check: P113.1 reuses `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `os-roadmap/updatePhaseStatus.js`, the P112
queue admission contract, and existing DB/runtime/Command Center helper names
as future reuse requirements. No report writer, checker formatter, DB helper,
status helper, UI component, or runtime helper is duplicated.

Command Center UX requirements: no Command Center source change in P113.1.
Later UX work must show assignment readiness state on founder Agent Flow and
Business Build pages and keep Chat with NEXUS and Lite clean.

Dark/light/system theme requirements: no theme source change in P113.1. Later
UX work must preserve System, Dark, and Light themes.

Playwright tests: no new Playwright test in P113.1 because no UI source changes
are made. Later UX work must add focused route coverage.

Checker updates: P113.1 adds a dedicated contract checker, updates the OS phase
status checker to accept P113.1-P113.7 and P114, and updates the P112.7 checker
to accept the P113.1/P113.2 handoff state.

Docs/README/roadmap updates: P113.1 is recorded in this plan, README, platform
roadmap, P113 contract, OS roadmap/status, and generated reports. P113.2 is
next.

OS phase status update: P113 is in progress; P113.1 is complete; current phase
P113.1; previous P112.7; next P113.2.

Validation commands:
- `npm run check:p1131-founder-live-agent-work-assignment-contract`
- `npm run check:p1127-founder-live-agent-work-queue-admission-final`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/db/provider/
deploy paths changed; no DemoApp exposure; no raw JSON/log/policy dumps; no raw
private IDs or raw assignment/queue table names in primary UX; no fake runnable
actions; no hosted DB mutation, raw SQL interface, provider/model calls, agent
dispatch, worker/tool execution, project mutation, deploy, release, export,
package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P113.1 files>`
- `git commit -m "feat(nexus): add p113 work assignment contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: assignment readiness wording can sound like agent dispatch is
available. The P113.1 checker blocks unsafe authority claims and fake runnable
actions.

Rollback plan: remove the P113.1 checker/script/docs/status/report updates,
restore current phase to P112.7 with P113 as a handoff placeholder, and keep
P112 completion unchanged.

## P113.2 Agent Work Assignment SQLite Schema

Status: complete

Narrow goal: add local SQLite schema metadata and isolated validation for
assignment items, assignment events, and assignment evidence references without
runtime dispatch.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `50dcc888b70587180b52952a79fe13028fe33b4d`.

Allowed files: local DB schema metadata and SQL, P113.2 schema checker, P113.1
compatibility checker, P113 contract, P113 plan, README, platform roadmap,
package script registry, OS phase status files, and generated P113.2/P113.1/
status/coverage reports.

Forbidden files: `projects/**`, `careloop/**`, `generated-projects/*/Sources/**`,
`generated-projects/*/Tests/**`, `live-ready/**`, `dashboard/src/**`,
`dashboard/tests/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Exact files/modules changed: added `founder_agent_work_assignments`,
`founder_agent_work_assignment_events`, and
`founder_agent_work_assignment_evidence_refs` to `db/schema.json` and
`db/schema.sql`; added the P113.2 checker; registered the package script;
updated P113 contract/status/docs; and regenerated reports.

Expected exports/data shapes: no runtime exports. The local schema now includes
display-safe assignment item, assignment event, and assignment evidence
reference records with explicit false-capable flags for local CRUD, DB writes,
hosted DB mutation, dispatch, execution, worker execution, runtime admission,
project mutation, and provider spend.

Safety rules: schema-only. Hosted DB mutation, raw SQL interface,
provider/model calls, agent dispatch, worker/tool execution, runtime admission,
execution unlock, project mutation, deploy, release, export, package creation,
network calls, and provider spend remain blocked.

Reuse check: P113.2 reuses `db/sqliteRuntime.js`,
`db/sqliteCrudRepository.js`, `shared/reportWriter.js`, and
`shared/checkResultFormatter.js`. No SQLite runtime, CRUD repository, report
writer, checker formatter, status helper, UI component, or runtime helper is
duplicated.

Command Center UX requirements: no Command Center source change in P113.2.
Assignment readiness UX remains planned for P113.5.

Dark/light/system theme requirements: no theme source change in P113.2.

Playwright tests: no new Playwright test in P113.2 because no UI source changes
are made.

Checker updates: P113.2 adds a dedicated schema checker. P113.1 already accepts
the P113.2/P113.3 handoff state.

Docs/README/roadmap updates: P113.2 is recorded in this plan, README, platform
roadmap, P113 contract, OS roadmap/status, and generated reports. P113.3 is
next.

OS phase status update: P113 is in progress; P113.2 is complete; current phase
P113.2; previous P113.1; next P113.3.

Validation commands:
- `npm run check:p1132-founder-live-agent-work-assignment-schema`
- `npm run check:p1131-founder-live-agent-work-assignment-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/live-ready/provider/deploy
paths changed; temporary local schema-check DB is removed; no DemoApp exposure;
no raw JSON/log/policy dumps; no raw private IDs or raw assignment/queue table
names in primary UX; no fake runnable actions; no hosted DB mutation, raw SQL
interface, provider/model calls, agent dispatch, worker/tool execution, project
mutation, deploy, release, export, package, network, or provider spend
authority is enabled.

Git add/commit/push commands:
- `git add <allowed P113.2 files>`
- `git commit -m "feat(nexus): add p113 work assignment schema"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: schema additions can be mistaken for live dispatch. P113.2 keeps
all assignment execution, dispatch, project mutation, hosted DB mutation, and
provider spend fields false in isolated validation records.

Rollback plan: remove the P113.2 schema/checker/script/docs/status/report
updates, restore P113 to P113.1 complete with P113.2 planned, and keep P113.1
unchanged.

## P113.3 Governed Local Assignment CRUD Model

Phase: P113 Founder Live Agent Work Assignment Readiness

Subphase: P113.3 Governed Local Assignment CRUD Model

Goal: add approval-gated local SQLite CRUD helpers for allowlisted assignment
readiness records without delete, dispatch, project mutation, hosted DB
mutation, or execution.

Why this is needed: P112 admits queue items and P113.2 defines assignment
tables, but NEXUS still needs a governed local model for persisting assignment
readiness before any future dispatch subphase can consider execution.

User/operator impact: operators can inspect the exact local assignment records
that would be created for founder work lanes after explicit approval gates.
The helper returns disabled reasons, next action, blocker, evidence, activity,
and cost fields without exposing raw private IDs.

Command Center impact: no Command Center source change in P113.3. Assignment
readiness UX remains planned for P113.5; this subphase only prepares the
display-safe local model and checker evidence.

Safety impact: P113.3 allows only local SQLite create/read/update/upsert/list
for `founder_agent_work_assignments`,
`founder_agent_work_assignment_events`, and
`founder_agent_work_assignment_evidence_refs` after `execute=true`, operator
approval, rollback acceptance, audit acceptance, validation command acceptance,
`sqlite-live` mode, and local write flags. Delete, hosted DB mutation, raw SQL
interface, provider/model calls, agent dispatch, worker/tool execution, runtime
admission, execution unlock, project mutation, deploy, release, export,
package creation, network calls, and provider spend remain blocked.

Cost impact: local SQLite CRUD only. No provider/model calls, network calls, or
provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`.

Files expected to change: `live-ready/founderLiveAgentWorkAssignmentReadiness.js`,
P113.3 checker, P113.2 compatibility checker reports, P113 contract, this plan,
README, platform roadmap, package script registry, OS phase status files, and
generated P113.3/P113.2/status/coverage reports.

Files forbidden to change: `projects/**`, `careloop/**`,
`generated-projects/*/Sources/**`, `generated-projects/*/Tests/**`,
`dashboard/src/**`, `dashboard/tests/**`, `local-state/runtime/**`,
`providers/**`, `tools/**`, `worker-runtime/**`, `deploy/**`, `release/**`,
`exports/**`, `packages/**`, and `.env*`.

Exact files/modules changed: added
`live-ready/founderLiveAgentWorkAssignmentReadiness.js`; added
`scripts/check-p1133-founder-live-agent-work-assignment-crud-model.js`;
registered the package script; updated P113 contract/status/docs; and
regenerated reports.

Expected exports/data shapes:
- `P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PHASE`
- `P113_AGENT_WORK_ASSIGNMENT_DB_ENTITIES`
- `buildFounderLiveAgentWorkAssignmentReadinessContract(input)`
- `validateFounderLiveAgentWorkAssignmentReadinessContract(envelope)`
- `buildSafeAgentWorkAssignmentDbRecord(entityName, input)`
- `executeApprovedAgentWorkAssignmentDbCrudRequest(request, input)`

The contract envelope contains display-safe assignment item, assignment event,
assignment evidence reference, local CRUD request summaries, allowed local CRUD
operations, forbidden operations, mutation gate, runtime flags, next action,
blockers, disabled reason, owner capability, evidence/activity refs, and cost
impact fields.

Safety rules: do not accept delete, raw SQL, hosted DB mutation, runtime
admission, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, deploy, release, export, package, network calls,
or provider spend. Do not expose raw private project IDs, raw logs, raw policy
dumps, DemoApp, or fake runnable actions.

Reuse check: P113.3 reuses `db/sqliteRuntime.js`,
`db/sqliteCrudRepository.js`, `shared/resultEnvelope.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`, and
`live-ready/founderLiveAgentWorkQueueAdmission.js`. No SQLite runtime, CRUD
repository, report writer, checker formatter, status helper, result envelope,
redaction helper, mode guard, UI component, or queue helper is duplicated.

Command Center UX requirements: no UI source change in P113.3. The generated
contract includes display-safe fields needed by the future Assignment UX:
what changed, current state, next action, blockers, disabled reason, owner
capability, evidence/activity location, and cost impact.

Dark/light/system theme requirements: no theme source change in P113.3.

Playwright tests: no new Playwright test in P113.3 because no UI source changes
are made.

Checker updates: P113.3 adds a dedicated CRUD model checker that initializes an
isolated local SQLite DB, writes all three allowlisted assignment entities,
validates read/update/list paths, and proves default execution, unapproved
execution, delete, outside allowlist, unsafe authority, raw private IDs, and
fake runnable actions remain blocked.

Docs/README/roadmap updates: P113.3 is recorded in this plan, README, platform
roadmap, P113 contract, OS roadmap/status, and generated reports. P113.4 is
next.

OS phase status update: P113 is in progress; P113.3 is complete; current phase
P113.3; previous P113.2; next P113.4.

Validation commands:
- `npm run check:p1133-founder-live-agent-work-assignment-crud-model`
- `npm run check:p1132-founder-live-agent-work-assignment-schema`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/provider/deploy paths
changed; temporary local CRUD-check DB is removed; no DemoApp exposure; no raw
JSON/log/policy dumps; no raw private IDs in primary UX contracts; no fake
runnable actions; no hosted DB mutation, raw SQL interface, provider/model
calls, agent dispatch, worker/tool execution, project mutation, deploy,
release, export, package, network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P113.3 files>`
- `git commit -m "feat(nexus): add p113 work assignment crud"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: CRUD admission can be mistaken for execution readiness. P113.3
keeps every dispatch, execution, project mutation, hosted DB, network, and spend
flag false and requires explicit local approval gates before any local write.

Rollback plan: remove the P113.3 helper/checker/script/docs/status/report
updates, restore P113 to P113.2 complete with P113.3 planned, and keep the
P113.2 schema unchanged.

## P113.4 Assignment Readiness Preview / Safe Dry Run

Phase: P113 Founder Live Agent Work Assignment Readiness

Subphase: P113.4 Assignment Readiness Preview / Safe Dry Run

Goal: build a display-safe assignment readiness view model from local queue and
assignment context without writing assignment records or dispatching agents.

Why this is needed: P113.3 can model approved local CRUD, but Command Center
needs a read-only preview layer before any assignment UX can show useful agent
lanes to a founder/operator.

User/operator impact: operators get a clear assignment candidate list with
source queue context, owner capability, next action, blockers, disabled reason,
evidence/activity location, and cost impact without raw DB identifiers.

Command Center impact: no Command Center source change in P113.4. The preview
view model is intentionally hidden from Command Center until P113.5 renders it
on the appropriate non-chat founder page.

Safety impact: preview-only. Assignment writes, local CRUD admission, hosted DB
mutation, raw SQL interface, provider/model calls, agent dispatch,
worker/tool execution, runtime admission, execution unlock, project mutation,
deploy, release, export, package creation, network calls, and provider spend
remain blocked.

Cost impact: local deterministic view model only. No provider/model calls,
network calls, or provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`.

Files expected to change: `live-ready/founderLiveAgentWorkAssignmentReadiness.js`,
P113.4 checker, P113.3 compatibility checker/report, P113 contract, this plan,
README, platform roadmap, package script registry, OS phase status files, and
generated P113.4/P113.3/status/coverage reports.

Files forbidden to change: `projects/**`, `careloop/**`,
`generated-projects/*/Sources/**`, `generated-projects/*/Tests/**`,
`dashboard/src/**`, `dashboard/tests/**`, `local-state/runtime/**`,
`providers/**`, `tools/**`, `worker-runtime/**`, `deploy/**`, `release/**`,
`exports/**`, `packages/**`, and `.env*`.

Exact files/modules changed: extended
`live-ready/founderLiveAgentWorkAssignmentReadiness.js` with preview constants,
`buildAgentWorkAssignmentReadinessViewModel`, and
`validateAgentWorkAssignmentReadinessViewModel`; added
`scripts/check-p1134-founder-live-agent-work-assignment-preview.js`;
registered the package script; updated P113 contract/status/docs; and
regenerated reports.

Expected exports/data shapes:
- `P113_FOUNDER_LIVE_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_PHASE`
- `P113_AGENT_WORK_ASSIGNMENT_READINESS_PREVIEW_STATES`
- `buildAgentWorkAssignmentReadinessViewModel(input)`
- `validateAgentWorkAssignmentReadinessViewModel(envelope)`

The preview envelope contains display-safe source queue summary, assignment
readiness counts, assignment sections, assignment rows, forbidden operations,
next action, blockers, disabled reason, owner capability, evidence/activity
refs, cost impact, and explicit false flags for writes, dispatch, execution,
project mutation, hosted DB mutation, deploy/release/export/package, network,
and spend.

Safety rules: do not write local assignment records, call provider/model APIs,
dispatch agents, execute tools/workers, mutate projects, use hosted DBs, expose
raw SQL, admit runtime execution, deploy, release, export, package, use network
calls, or spend. Do not expose raw private IDs, raw assignment/queue record
keys, raw DB table names, raw logs, raw policy dumps, DemoApp, or fake runnable
actions.

Reuse check: P113.4 reuses `shared/resultEnvelope.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`, and the P113.3
assignment readiness contract/model helpers. It does not duplicate SQLite
runtime, CRUD repository, report writer, checker formatter, status helper,
result envelope, mode guard, redaction helper, queue helper, or UI components.

Command Center UX requirements: no UI source change in P113.4. The view model
contains the fields P113.5 needs: what changed, current state, next action,
blockers, disabled reason, owner agent/capability, evidence/activity location,
and cost impact.

Dark/light/system theme requirements: no theme source change in P113.4.

Playwright tests: no new Playwright test in P113.4 because no UI source changes
are made.

Checker updates: P113.4 adds a dedicated preview checker that validates the
view model, confirms useful founder assignment rows and sections, verifies
P113.3 reuse, blocks raw IDs/table names/raw dumps/fake actions, and confirms
all unsafe authority flags remain false.

Docs/README/roadmap updates: P113.4 is recorded in this plan, README, platform
roadmap, P113 contract, OS roadmap/status, and generated reports. P113.5 is
next.

OS phase status update: P113 is in progress; P113.4 is complete; current phase
P113.4; previous P113.3; next P113.5.

Validation commands:
- `npm run check:p1134-founder-live-agent-work-assignment-preview`
- `npm run check:p1133-founder-live-agent-work-assignment-crud-model`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no forbidden project/dashboard/provider/deploy paths
changed; no runtime DB artifacts are created; no DemoApp exposure; no raw
JSON/log/policy dumps; no raw private IDs, raw assignment keys, raw queue keys,
or raw DB table names in the preview; no fake runnable actions; no local write,
hosted DB mutation, raw SQL interface, provider/model call, agent dispatch,
worker/tool execution, project mutation, deploy, release, export, package,
network, or provider spend authority is enabled.

Git add/commit/push commands:
- `git add <allowed P113.4 files>`
- `git commit -m "feat(nexus): add p113 assignment preview"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: preview rows could be confused with runnable work. P113.4 keeps
Command Center visibility false until P113.5 and stores explicit disabled
reasons and false safety flags on every preview row.

Rollback plan: remove the P113.4 preview/checker/script/docs/status/report
updates, restore P113 to P113.3 complete with P113.4 planned, and keep the
P113.3 CRUD model unchanged.

## P113.5 Command Center Agent Assignment UX

Phase: P113 Founder Live Agent Work Assignment Readiness

Subphase: P113.5 Command Center Agent Assignment UX

Goal: show display-safe assignment readiness on Business Build and Agent Flow
while keeping Chat with NEXUS, Lite, and Live Readiness clean.

Why this is needed: P113.4 created safe assignment preview data, but founders
and operators need to see how the idea maps to agent assignment lanes on the
work pages where planning happens.

User/operator impact: Business Build and Agent Flow now show assignment
candidates, owner capabilities, blockers, next actions, evidence/activity
locations, cost impact, and blocked authority counts without exposing raw DB
identifiers.

Command Center impact: adds one scoped card labeled `Founder agent work
assignment readiness` to Business Build and Agent Flow only. Chat with NEXUS,
Lite, Command Center home, and Live Readiness do not show the card.

Safety impact: UI-only and read-only. Assignment writes, local CRUD admission,
runtime admission, provider/model calls, agent dispatch, worker/tool execution,
project mutation, hosted DB mutation, raw SQL interface, deploy, release,
export, package creation, network calls, and provider spend remain blocked.

Cost impact: local display data only. No provider/model calls, network calls,
or provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`.

Files expected to change: `dashboard/src/data/businessBuild.js`,
`dashboard/src/data/dbRuntimeReadiness.js`,
`dashboard/src/pages/CommandCenterV2.jsx`, `dashboard/tests/routes.spec.js`,
P113.5 checker, P113.4 compatibility checker/report, P113 contract, this plan,
README, platform roadmap, package script registry, OS phase status files, and
generated P113.5/P113.4/status/coverage reports.

Files forbidden to change: `projects/**`, `careloop/**`,
`generated-projects/*/Sources/**`, `generated-projects/*/Tests/**`,
`local-state/runtime/**`, `providers/**`, `tools/**`, `worker-runtime/**`,
`deploy/**`, `release/**`, `exports/**`, `packages/**`, and `.env*`.

Exact files/modules changed: added browser-safe
`buildFounderLiveAgentWorkAssignmentDisplayModel`; added DB runtime summary
rows for assignment readiness; added `FounderLiveAgentWorkAssignmentCard` and
rendered it only on Business Build and Agent Flow; added focused Playwright
coverage; added the P113.5 checker; registered the package script; updated
P113 contract/status/docs; and regenerated reports.

Expected exports/data shapes:
- `buildFounderLiveAgentWorkAssignmentDisplayModel(founderIdeaSummary)`

The browser-safe display model contains founder idea, preview mode, assignment
candidate counts, assignment sections, assignment rows, safety rows, blockers,
disabled reason, owner capability, evidence/activity locations, and cost
impact. It contains no raw assignment IDs, queue IDs, work order IDs, table
names, raw dumps, or runnable action labels.

Safety rules: do not import node-only SQLite/runtime helpers into dashboard
source. Do not expose write controls, dispatch controls, execution controls,
raw JSON/logs/policy dumps, DemoApp, raw private IDs, raw assignment/queue
keys, raw DB table names, or fake runnable actions.

Reuse check: P113.5 reuses existing dashboard data/display patterns,
`BusinessBuild` display model conventions, existing card/grid/pill components,
`shared/reportWriter.js`, and `shared/checkResultFormatter.js`. It does not
duplicate SQLite runtime, CRUD repository, report writer, checker formatter,
phase status updater, result envelope, redaction helper, mode guard, route
matrix, or UI status components.

Command Center UX requirements: Business Build and Agent Flow show what changed
through the assignment card; current state, next action, blockers, disabled
reason, owner capability, evidence/activity location, and cost impact are all
visible. Chat with NEXUS stays chat-related; Lite stays chat-only; Live
Readiness stays clear of assignment preview details.

Dark/light/system theme requirements: Playwright coverage checks the assignment
card under Dark, Light, and System theme selection.

Playwright tests: `dashboard/tests/routes.spec.js` adds focused coverage for
`Agent work assignment readiness appears only on Business Build and Agent
Flow`.

Checker updates: P113.5 adds a dedicated checker validating the browser-safe
display model, DB runtime summary, card render sites, page/test safety, docs,
status, and raw ID/action exclusions.

Docs/README/roadmap updates: P113.5 is recorded in this plan, README, platform
roadmap, P113 contract, OS roadmap/status, and generated reports. P113.6 is
next.

OS phase status update: P113 is in progress; P113.5 is complete; current phase
P113.5; previous P113.4; next P113.6.

Validation commands:
- `npm run check:p1135-command-center-work-assignment-ux`
- `npm run check:p1134-founder-live-agent-work-assignment-preview`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Agent work assignment"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no runtime DB artifacts
are created; no DemoApp exposure; no raw JSON/log/policy dumps; no raw private
IDs, raw assignment keys, raw queue keys, or raw DB table names in primary UX;
no fake runnable actions; no local write, hosted DB mutation, raw SQL
interface, provider/model call, agent dispatch, worker/tool execution, project
mutation, deploy, release, export, package, network, or provider spend
authority is enabled.

Git add/commit/push commands:
- `git add <allowed P113.5 files>`
- `git commit -m "feat(nexus): add p113 assignment ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Known risks: Command Center can become noisy if every readiness phase appears
everywhere. P113.5 keeps the assignment card scoped to Business Build and Agent
Flow and keeps Chat/Lite clean.

Rollback plan: remove the P113.5 display model/card/test/checker/script/docs/
status/report updates, restore P113 to P113.4 complete with P113.5 planned, and
keep the P113.4 preview model unchanged.
