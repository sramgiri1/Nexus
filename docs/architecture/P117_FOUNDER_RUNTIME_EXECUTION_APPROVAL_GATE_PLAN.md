# P117 Founder Runtime Execution Approval Gate Plan

## P117 Subphase Split

- P117.1 Runtime Execution Approval Contract / Policy
- P117.2 Approval Evidence Schema Metadata
- P117.3 Governed Local Approval Decision Model
- P117.4 Approval Gate Preview / Safe Dry Run
- P117.5 Command Center Approval Gate UX
- P117.6 Approval Gate Validation / Docs
- P117.7 Final Validation

## P117.1 Runtime Execution Approval Contract / Policy

Status: complete

Scope classification: NEXUS_OS_CHANGE

Narrow goal: define the P117 approval-gate contract, subphase split, safety
policy, reuse rules, validation commands, and OS handoff records without
implementing approval behavior.

Allowed files:
- `contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json`
- `docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md`
- `scripts/check-p1171-founder-runtime-execution-approval-gate-contract.js`
- `scripts/check-p1167-founder-live-runtime-execution-readiness.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1167-founder-live-runtime-execution-readiness-report.md`
- `reports/p1171-founder-runtime-execution-approval-gate-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/*/Sources/**`
- `generated-projects/*/Tests/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `live-ready/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`
- `local-state/runtime/**`

Exact files/modules changed: added the P117 contract and P117.1 checker,
updated the P116.7 handoff checker, updated OS phase status checker IDs,
registered the package script, updated docs/roadmap/status, and regenerated
reports.

Expected exports and data shapes: no runtime approval data shape is introduced
in P117.1. Future subphases must add schemas/models only after scoped plans.

Command Center UX requirements: no Command Center source change. Preserve P116
runtime execution readiness UX. Do not add approval buttons, run buttons, raw
IDs, raw logs, raw policy dumps, or fake actions.

Dark/light/system theme requirements: preserve existing System, Dark, and Light
theme behavior. No UI source changes are made.

Playwright tests: no new Playwright test because P117.1 has no UI source
changes. Existing route-wide safety tests remain in place.

Checker updates: P117.1 adds a contract checker, updates P116.7 final handoff
validation to accept P117.1, and updates OS phase status validation to recognize
P117.1-P117.7.

Docs/README/roadmap updates: P117.1 is recorded in this plan, README, platform
roadmap, P117 contract, OS roadmap/status, and generated reports. P117.2 is
next for approval evidence schema metadata.

OS phase status update: P117 is in progress; P117.1 is complete; current phase
P117.1; previous P116.7; next P117.2.

Validation commands:
- `npm run check:p1171-founder-runtime-execution-approval-gate-contract`
- `npm run check:p1167-founder-live-runtime-execution-readiness`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no approval capture,
approval persistence, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL, deploy, release, export, package, network, or provider spend authority
is enabled; no DemoApp exposure, raw private IDs, raw DB table names, raw
JSON/log/policy dumps, or fake actions are introduced.

Git add/commit/push commands:
- `git add <allowed P117.1 files>`
- `git commit -m "feat(nexus): implement p1171 execution approval contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Dashboard build/unit/page results if applicable
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: approval-gate language can be mistaken for live approval capture.
P117.1 keeps approval capture, approval persistence, runtime execution, and
execution unlock blocked.

Rollback plan: remove the P117 contract/checker/plan/status/report/package
updates, restore P117 to the planned placeholder, and restore current phase to
P116.7 complete.

## P117.2 Approval Evidence Schema Metadata

Phase: P117 Founder Runtime Execution Approval Gate

Subphase: P117.2 Approval Evidence Schema Metadata

Status: complete

Goal: add local schema metadata and isolated SQLite validation for runtime
execution approval evidence items, approval events, and evidence references.

Why this is needed: P117.1 created the approval-gate contract only. P117.2
gives later decision, preview, and UX subphases a typed local evidence boundary
before any approval review behavior is modeled.

User/operator impact: operators can trace future approval evidence state in a
governed local schema, while approval capture, approval persistence, runtime
execution, and execution unlock remain blocked.

Command Center impact: no UI source changes in P117.2. Existing Command Center
UX is preserved, and future approval details must stay on scoped approval,
agent-flow, or business-build surfaces rather than overloading Chat with NEXUS.

Safety impact: P117.2 is local schema metadata and isolated checker validation
only. It does not add persistent runtime writes, hosted DB mutation, raw SQL,
approval capture, approval persistence, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
deploy/release/export/package actions, network calls, or provider spend.

Cost impact: isolated local SQLite validation only. No provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`. No project source or CareLoop files are
modified.

Allowed files:
- `db/schema.json`
- `db/schema.sql`
- `scripts/check-p1172-founder-runtime-execution-approval-gate.js`
- `scripts/check-p1171-founder-runtime-execution-approval-gate-contract.js`
- `contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json`
- `docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1172-founder-runtime-execution-approval-gate-report.md`
- `reports/p1171-founder-runtime-execution-approval-gate-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/*/Sources/**`
- `generated-projects/*/Tests/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `live-ready/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules changed: updated `db/schema.json` and `db/schema.sql`;
added `scripts/check-p1172-founder-runtime-execution-approval-gate.js`;
updated the P117.1 compatibility checker; registered the package script;
updated P117 contract/status/docs; and regenerated reports.

Expected exports, schemas, and data shapes: P117.2 adds local schema metadata
for approval evidence items, approval events, and approval evidence references.
The schema records display-safe labels, owner, next action, disabled reason,
evidence/activity references, and explicit false authority flags for approval
capture, approval persistence, runtime execution, execution unlock, providers,
agents, workers/tools, projects, package/deploy/release/export, network, and
spend.

Command Center UX requirements: preserve existing Command Center UX. Future UX
must not expose raw approval table names, raw IDs, raw logs, raw policy dumps,
or fake live approval/run controls.

Dark/light/system theme requirements: preserve existing System, Dark, and Light
theme behavior. No UI source changes are made.

Playwright tests: no new Playwright test is added because P117.2 has no UI
source changes. Existing route-wide safety tests remain in place.

Checker updates: P117.2 adds an isolated SQLite schema checker and updates the
P117.1 checker to accept the P117.2/P117.3 handoff.

Docs/README/roadmap updates: P117.2 is recorded in this plan, README, platform
roadmap, P117 contract, OS roadmap/status, and generated reports. P117.3 is
next for governed local approval decision modeling.

OS phase status update: P117 is in progress; P117.2 is complete; current phase
P117.2; previous P117.1; next P117.3.

Validation commands:
- `npm run check:p1172-founder-runtime-execution-approval-gate`
- `npm run check:p1171-founder-runtime-execution-approval-gate-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no persistent runtime
DB remains; no approval capture, approval persistence, runtime execution,
execution unlock, provider/model calls, agent dispatch, worker/tool execution,
project mutation, hosted DB mutation, raw SQL, deploy, release, export,
package, network, or provider spend authority is enabled; no DemoApp exposure,
raw private IDs, raw DB table names, raw JSON/log/policy dumps, or fake actions
are introduced.

Git add/commit/push commands:
- `git add <allowed P117.2 files>`
- `git commit -m "feat(nexus): implement p1172 execution approval schema"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Dashboard build/unit/page results if applicable
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: P117.2 adds schema metadata only. Approval decision modeling,
preview rows, and Command Center UX are not complete until later P117 subphases.

Rollback plan: remove P117.2 schema/checker/docs/status/package/report updates,
restore P117.2 to planned, and keep P117.1 complete with P117.3 planned.

## P117.3 Governed Local Approval Decision Model

Phase: P117 Founder Runtime Execution Approval Gate

Subphase: P117.3 Governed Local Approval Decision Model

Status: complete

Goal: add a governed local approval evidence review model and allowlisted local
CRUD helper for P117.2 schema records, without recording approve/reject
decisions, capturing approvals, persisting approval decisions, or unlocking
runtime execution.

Why this is needed: P117.2 created schema metadata only. P117.3 gives later
preview and UX subphases a deterministic local model for what evidence is
review-ready and what remains blocked before any approval gate can be shown
usefully.

User/operator impact: operators can inspect a structured local review boundary
for approval evidence and validation gates. They still cannot approve, run,
dispatch, mutate projects, deploy, or spend.

Command Center impact: no UI source changes in P117.3. Future UX must show
review state, next action, blockers, owner capability, evidence/activity
location, and cost posture on approval, agent-flow, or business-build surfaces,
not on Chat with NEXUS.

Safety impact: P117.3 allows only local SQLite create/read/update/upsert/list
against allowlisted OS approval evidence records after explicit local review
evidence. Delete, approval capture, approval persistence, approve/reject
decisions, execution unlock, runtime execution, raw SQL, hosted DB mutation,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
deploy/release/export/package, network calls, and provider spend remain
blocked.

Cost impact: local SQLite CRUD only after review gates. No provider/model
calls, network calls, deploy/package actions, or provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`. No project source or CareLoop files are
modified.

Allowed files:
- `live-ready/founderRuntimeExecutionApprovalGate.js`
- `scripts/check-p1173-founder-runtime-execution-approval-gate.js`
- `scripts/check-p1172-founder-runtime-execution-approval-gate.js`
- `contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json`
- `docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1173-founder-runtime-execution-approval-gate-report.md`
- `reports/p1172-founder-runtime-execution-approval-gate-report.md`
- `reports/p1171-founder-runtime-execution-approval-gate-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/*/Sources/**`
- `generated-projects/*/Tests/**`
- `db/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules changed: added
`live-ready/founderRuntimeExecutionApprovalGate.js`; added
`scripts/check-p1173-founder-runtime-execution-approval-gate.js`; registered
the package script; updated P117 contract/status/docs; and regenerated reports.

Expected exports, schemas, and data shapes:
- `P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PHASE`
- `P117_RUNTIME_EXECUTION_APPROVAL_DB_ENTITIES`
- `buildFounderRuntimeExecutionApprovalGateContract`
- `buildSafeRuntimeExecutionApprovalEvidenceRecord`
- `executeApprovedRuntimeExecutionApprovalGateCrudRequest`
- `validateFounderRuntimeExecutionApprovalGateContract`

The data shape is a governed local approval evidence review model with source
runtime execution summary, approval evidence item, approval event, evidence
references, local CRUD requests, review gates, blockers, disabled reason,
owner capability, evidence/activity references, cost impact, and all unsafe
approval/execution authority flags false.

Command Center UX requirements: preserve existing Command Center UX. No raw
approval table names, raw IDs, raw logs, raw policy dumps, DemoApp exposure,
mutation buttons, or fake approve/run controls are introduced.

Dark/light/system theme requirements: preserve existing theme behavior. No UI
source changes are made.

Playwright tests: no new Playwright test is added because P117.3 has no UI
source changes. Existing route-wide safety tests remain in place.

Checker updates: P117.3 adds a dedicated local model checker that validates
blocked default execution, unreviewed execution, blocked delete, blocked
approve/reject operations, blocked outside-allowlist access, approved
create/read/update/upsert/list in an isolated SQLite database, helper reuse,
docs/status, and safety wording.

Docs/README/roadmap updates: P117.3 is recorded in this plan, README, platform
roadmap, P117 contract, OS roadmap/status, and generated reports. P117.4 is
next for approval gate safe dry-run preview modeling.

OS phase status update: P117 is in progress; P117.3 is complete; current phase
P117.3; previous P117.2; next P117.4.

Validation commands:
- `npm run check:p1173-founder-runtime-execution-approval-gate`
- `npm run check:p1172-founder-runtime-execution-approval-gate`
- `npm run check:p1171-founder-runtime-execution-approval-gate-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no DB schema files
changed in P117.3; no approval capture, approval persistence, approve/reject
decision persistence, runtime execution, execution unlock, provider/model
calls, agent dispatch, worker/tool execution, project mutation, hosted DB
mutation, raw SQL, deploy, release, export, package, network, or provider
spend authority is enabled; no DemoApp exposure, raw private IDs, raw DB table
names, raw JSON/log/policy dumps, or fake actions are introduced.

Git add/commit/push commands:
- `git add <allowed P117.3 files>`
- `git commit -m "feat(nexus): implement p1173 execution approval model"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Dashboard build/unit/page results if applicable
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: P117.3 local CRUD could be misread as live approval capture.
The helper, checker, docs, and reports keep approval capture, approval
persistence, approval decision recording, runtime execution, and execution
unlock blocked.

Rollback plan: remove P117.3 helper/checker/docs/status/package/report updates,
restore P117.3 to planned, and keep P117.2 schema metadata intact.

## P117.4 Approval Gate Preview / Safe Dry Run

Phase: P117 Founder Runtime Execution Approval Gate

Subphase: P117.4 Approval Gate Preview / Safe Dry Run

Status: complete

Goal: build a display-safe local dry-run preview model for approval-gate
candidates without writing records, capturing approvals, recording
approve/reject decisions, or unlocking runtime execution.

Why this is needed: P117.3 can model local approval evidence review metadata.
P117.4 creates the UI-ready preview shape that P117.5 can render without
exposing raw DB details or fake approval/run actions.

User/operator impact: operators can inspect prepared approval-gate lanes,
current blocked state, next action, blockers, owner capability,
evidence/activity location, and local-only cost impact before any later UX.

Command Center impact: no UI source changes in P117.4. The preview model
remains hidden from Command Center until P117.5 renders it on scoped non-chat
founder pages. Chat with NEXUS remains clean and chat-focused.

Safety impact: P117.4 is local dry-run only. It does not write approval
evidence records, capture approvals, persist approval decisions, record
approve/reject decisions, unlock execution, run runtime work, call
providers/models, dispatch agents, execute workers/tools, mutate projects, use
hosted DBs, expose raw SQL, deploy, release, export, package, use network
calls, or spend.

Cost impact: deterministic local preview only; no provider/model calls,
network calls, deploy/package work, or provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`. No project source or CareLoop files are
modified.

Allowed files:
- `live-ready/founderRuntimeExecutionApprovalGate.js`
- `scripts/check-p1174-founder-runtime-execution-approval-gate.js`
- `contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json`
- `docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1174-founder-runtime-execution-approval-gate-report.md`
- `reports/p1173-founder-runtime-execution-approval-gate-report.md`
- `reports/p1172-founder-runtime-execution-approval-gate-report.md`
- `reports/p1171-founder-runtime-execution-approval-gate-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/*/Sources/**`
- `generated-projects/*/Tests/**`
- `db/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules changed: updated
`live-ready/founderRuntimeExecutionApprovalGate.js`; added
`scripts/check-p1174-founder-runtime-execution-approval-gate.js`; registered
the package script; updated P117 contract/status/docs; and regenerated reports.

Expected exports and data shapes:
- `P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PREVIEW_PHASE`
- `P117_APPROVAL_GATE_PREVIEW_STATES`
- `buildRuntimeExecutionApprovalGatePreviewModel`
- `validateRuntimeExecutionApprovalGatePreviewModel`

The preview shape includes schema version, current state, source contract
phase/state, preview mode, display-safe source review summary, approval summary
counts, approval sections, approval rows, forbidden operations, next action,
blockers, disabled reason, owner capability, evidence/audit/activity/cost
references, `commandCenterVisible: false`, and all write, approval, runtime,
dispatch, project, deploy, package, and spend flags false.

Command Center UX requirements: no UI source change in P117.4. P117.5 must
render the display-safe approval gate preview on relevant non-chat founder
pages and continue to hide raw DB details and fake runnable controls.

Dark/light/system theme requirements: preserve existing theme behavior. No UI
source changes are made.

Playwright tests: no new Playwright test is added because P117.4 has no UI
source changes. Existing route-wide safety tests remain in place.

Checker updates: P117.4 adds a dedicated preview checker that validates the
dry-run shape, useful candidate rows/sections, safe review context
carry-forward, false unsafe flags, docs/status updates, allowed file scope, and
absence of raw private IDs, raw record keys/table names, raw dumps, or fake
runnable actions.

Docs/README/roadmap updates: P117.4 is recorded in this plan, README, platform
roadmap, P117 contract, OS roadmap/status, and generated reports. P117.5 is
next for Command Center approval gate UX.

OS phase status update: P117 is in progress; P117.4 is complete; current phase
P117.4; previous P117.3; next P117.5.

Validation commands:
- `npm run check:p1174-founder-runtime-execution-approval-gate`
- `npm run check:p1173-founder-runtime-execution-approval-gate`
- `npm run check:p1172-founder-runtime-execution-approval-gate`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no DB schema/runtime
files or dashboard source files changed; no persistent runtime DB remains; no
approval capture, approval persistence, approve/reject recording, runtime
execution, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, hosted DB mutation, raw SQL, deploy, release,
export, package, network, or provider spend authority is enabled; no DemoApp
exposure, raw private IDs, raw DB table names, raw JSON/log/policy dumps, or
fake actions are introduced.

Git add/commit/push commands:
- `git add <allowed P117.4 files>`
- `git commit -m "feat(nexus): implement p1174 execution approval preview"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Dashboard build/unit/page results if applicable
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: dry-run approval readiness can be mistaken for live approval
capture. P117.4 keeps all write, approval capture, approval persistence,
approve/reject recording, execution, project mutation, hosted DB mutation, and
provider spend fields false and marks the model Command Center hidden until
P117.5.

Rollback plan: remove P117.4 preview exports/checker/docs/status/report
updates, restore P117 to P117.3 complete with P117.4 planned, and keep P117.3
modeling unchanged.
