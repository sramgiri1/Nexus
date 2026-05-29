# P119 Founder Runtime Approval Decision Recording Boundary Plan

## P119 Subphase Split

- P119.1 Approval Decision Recording Contract / Policy
- P119.2 Approval Decision Schema Metadata
- P119.3 Governed Local Approval Decision Intent Model
- P119.4 Approval Decision Safe Dry Run
- P119.5 Command Center Approval Decision Boundary UX
- P119.6 Approval Decision Validation / Docs
- P119.7 Final Validation

## P119.1 Approval Decision Recording Contract / Policy

Status: complete

Phase: P119 Founder Runtime Approval Decision Recording Boundary

Subphase: P119.1 Approval Decision Recording Contract / Policy

Goal: define the approval-decision recording boundary, implementation-grade
subphase split, safety policy, reuse rules, validation commands, and OS
handoff from P118 without implementing approval capture, approval persistence,
approve/reject decision recording, DB/runtime writes, or runtime execution.

Why this is needed: P118 closed the approval capture boundary as read-only.
P119 must define exactly what founder approval decision recording can mean
before any UI control, persistence path, or runtime admission flow is added.

User/operator impact: operators can see P119 started and split. No new
founder-facing approve/reject action is enabled in P119.1; existing approval
capture boundary summaries remain read-only.

Command Center impact: no Command Center source changes in P119.1. Preserve
the P118 approval capture boundary UX on Business Build and Agent Flow. Keep
Chat with NEXUS and Lite chat clean.

Safety impact: P119.1 is contract-only. It does not enable approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, or spend.

Cost impact: docs/checkers/status only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `8ad466c0`.

Allowed files:
- `contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json`
- `docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md`
- `scripts/check-p1191-founder-runtime-approval-decision-recording-boundary-contract.js`
- `scripts/check-p1187-founder-runtime-approval-capture-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1187-founder-runtime-approval-capture-boundary-report.md`
- `reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files expected to change:
- P119 contract
- P119.1 checker
- P118.7 checker handoff acceptance
- OS status checker P119.1-P119.7 recognition
- package script registration
- README and platform roadmap
- OS roadmap/status and generated reports

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
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

Exact files/modules to create or update:
- add `contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json`
- add `docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md`
- add `scripts/check-p1191-founder-runtime-approval-decision-recording-boundary-contract.js`
- update `scripts/check-p1187-founder-runtime-approval-capture-boundary.js`
- update `scripts/check-os-phase-status.js`
- update package/docs/status/reports

Expected exports, schemas, and data shapes: no runtime data shape, schema, DB
table, approval decision payload, or write path is introduced. P119.1 creates
only a contract JSON document and markdown validation report.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
existing P118 validation patterns, existing OS phase status validation, and
existing roadmap/status reporting. Do not duplicate report writers, checker
formatters, phase status updaters, redaction helpers, mode guards, route
matrices, UI card/tab/status components, or audit/activity appenders.

Command Center UX requirements: preserve P118.5 approval-capture boundary UX.
Do not add UI controls, route labels, submit buttons, approve/reject buttons,
save decision buttons, raw JSON/log/policy dumps, raw private IDs, raw DB table
names, internal phase labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P119.1 because there is
no UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P119.1 contract checker covering contract
shape, subphase completeness, P118 closure, P119.1 status, docs/report
alignment, safety wording, allowed file scope, and P118.7 handoff acceptance.
Update OS phase status validation to recognize P119.1-P119.7.

Docs/README/roadmap updates: P119.1 is recorded in this plan, README, platform
roadmap, P119 contract, OS roadmap/status, and generated reports. P119.2 is
next for approval decision schema metadata.

OS phase status update: P119 is in progress; P119.1 is complete; current phase
P119.1; previous P118.7; next P119.2.

Reports to regenerate:
- `reports/p1187-founder-runtime-approval-capture-boundary-report.md`
- `reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1191-founder-runtime-approval-decision-recording-boundary-contract`
- `npm run check:p1187-founder-runtime-approval-capture-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no dashboard source or
dashboard test files changed; no DB/runtime provider, tool, worker, deploy,
release, export, package, or env paths changed; no approval capture, approval
persistence, approval decision recording, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, network, deploy, release, export, package, or
spend authority is enabled; no DemoApp exposure, raw private IDs, raw DB table
names, raw JSON/log/policy dumps, internal primary UX phase labels, or fake
actions are introduced.

Git add/commit/push commands:
- `git add <allowed P119.1 files>`
- `git commit -m "feat(nexus): implement p1191 approval decision contract"`
- stamp P119/P119.1 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1191 approval decision contract"`
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

Known risks: decision-recording language can imply live approve/reject
authority. P119.1 keeps the work contract-only and repeats the blocked decision
recording, DB write, execution, dispatch, project mutation, deploy/package,
network, and spend posture.

Rollback plan: remove the P119.1 contract/checker/docs/status/report changes,
restore P119 to planned, set current phase back to P118.7, and keep P118
complete.

## P119.2 Approval Decision Schema Metadata

Status: complete

Phase: P119 Founder Runtime Approval Decision Recording Boundary

Subphase: P119.2 Approval Decision Schema Metadata

Goal: define browser-safe approval decision recording schema metadata without
DB files, DB writes, persistence, approve/reject decision recording, or runtime
execution.

Why this is needed: P119.1 defines the decision recording boundary. P119.2
gives later P119 model, preview, and UX phases a stable browser-safe metadata
shape while all decision and execution authority remains blocked.

User/operator impact: no founder-facing behavior changes. Operators get
schema-level evidence for future approval decision requests, events, and
evidence references without storing decisions.

Command Center impact: no Command Center source changes in P119.2. Preserve
P118 approval capture boundary UX and avoid any approve/reject or save
decision controls.

Safety impact: P119.2 is metadata-only. It does not enable approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
hosted DB mutation, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, raw SQL, deploy,
release, export, package, network calls, or spend.

Cost impact: local deterministic metadata only. No provider/model/network/spend
path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `8a29a532`.

Allowed files:
- `shared/founderApprovalDecisionSchemaMetadata.js`
- `contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json`
- `docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md`
- `scripts/check-p1192-founder-runtime-approval-decision-recording-boundary.js`
- `scripts/check-p1191-founder-runtime-approval-decision-recording-boundary-contract.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md`
- `reports/p1192-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files expected to change:
- `shared/founderApprovalDecisionSchemaMetadata.js`
- `scripts/check-p1192-founder-runtime-approval-decision-recording-boundary.js`
- P119 contract, this plan, README, platform roadmap, OS roadmap/status, and
  generated reports

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
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

Exact files/modules to create or update:
- add `shared/founderApprovalDecisionSchemaMetadata.js`
- add `scripts/check-p1192-founder-runtime-approval-decision-recording-boundary.js`
- add `check:p1192-founder-runtime-approval-decision-recording-boundary`
  to `package.json`
- update P119 contract, this plan, README, platform roadmap, OS roadmap/status,
  and generated reports

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_DECISION_SCHEMA_METADATA_PHASE`
- `FOUNDER_APPROVAL_DECISION_SCHEMA_VERSION`
- `FOUNDER_APPROVAL_DECISION_ENTITY_NAMES`
- `FOUNDER_APPROVAL_DECISION_AUTHORITY_FLAGS`
- `FOUNDER_APPROVAL_DECISION_SCHEMA_ENTITIES`
- `buildFounderApprovalDecisionSchemaMetadata`
- browser-safe metadata object with schema version, phase id,
  `schemaOnly: true`, `commandCenterVisible: false`, metadata-only write
  policy, and three entities for future decision requests, decision events, and
  decision evidence references.

Reuse check: reuse the P118.2 schema metadata pattern, P119.1 checker handoff
style, `shared/reportWriter.js`, `shared/checkResultFormatter.js`, existing OS
status checks, and existing phase validation coverage. Do not duplicate report
writers, checker formatters, phase status updaters, redaction helpers, mode
guards, route matrices, UI card/tab/status components, or audit/activity
appenders.

Command Center UX requirements: no UI changes. Do not add approve/reject/save
controls, raw JSON/log/policy dumps, raw private IDs, raw DB table names,
internal phase labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P119.2 because there is
no UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P119.2 schema metadata checker covering
exports, schema-only posture, blocked authority flags, display-safe entity
fields, no DB/runtime imports, docs/report alignment, and P119.1 handoff
acceptance.

Docs/README/roadmap updates: P119.2 is recorded in this plan, README, platform
roadmap, P119 contract, OS roadmap/status, and generated reports. P119.3 is
next for governed local approval decision intent modeling.

OS phase status update: P119 is in progress; P119.2 is complete; current phase
P119.2; previous P119.1; next P119.3.

Reports to regenerate:
- `reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md`
- `reports/p1192-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1192-founder-runtime-approval-decision-recording-boundary`
- `npm run check:p1191-founder-runtime-approval-decision-recording-boundary-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
- `find local-state/runtime -maxdepth 1 -name 'check-p119*.sqlite' -print`

Final safety checks: no project/CareLoop paths changed; no dashboard source or
dashboard test files changed; no DB/runtime provider, tool, worker, deploy,
release, export, package, or env paths changed; no approval capture, approval
persistence, approval decision recording, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, network, deploy, release, export, package, or
spend authority is enabled; no DemoApp exposure, raw private IDs, raw DB table
names, raw JSON/log/policy dumps, internal primary UX phase labels, or fake
actions are introduced.

Git add/commit/push commands:
- `git add <allowed P119.2 files>`
- `git commit -m "feat(nexus): implement p1192 approval decision schema"`
- stamp P119/P119.2 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1192 approval decision schema"`
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

Known risks: schema metadata can drift into implied persistence if names and
flags are loose. P119.2 keeps all decision, write, execution, dispatch,
project mutation, deploy/package, network, and spend authority flags false and
does not create DB files.

Rollback plan: remove the P119.2 helper/checker/docs/status/report changes,
restore P119.2 to planned, set current phase back to P119.1, and keep P119.1
complete.

## P119.3 Governed Local Approval Decision Intent Model

Status: complete

Phase: P119 Founder Runtime Approval Decision Recording Boundary

Subphase: P119.3 Governed Local Approval Decision Intent Model

Goal: add a pure local approval decision intent model that consumes P119.2
schema metadata and keeps approve/reject decisions, persistence, DB/runtime
writes, and execution blocked.

Why this is needed: P119.2 gives schema metadata only. P119.3 gives P119.4
safe dry-run and P119.5 Command Center UX a deterministic model for current
state, blockers, next action, owner, evidence/activity labels, and cost
posture.

User/operator impact: no new live approval action. Operators get validated
local decision-intent state without save, approve, reject, execution, dispatch,
or spend capability.

Command Center impact: no dashboard source change. Chat with NEXUS stays clean;
Business Build and Agent Flow keep existing read-only boundary cards.

Safety impact: P119.3 is model-only and hidden from primary UX. It does not
enable approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, hosted DB mutation, runtime execution, execution
unlock, provider/model calls, agent dispatch, worker/tool execution, project
mutation, raw SQL, deploy, release, export, package, network calls, or spend.

Cost impact: local helper/checkers/docs only. No provider/model/network/spend
path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `eb330254`.

Allowed files:
- `shared/founderApprovalDecisionIntentModel.js`
- `contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json`
- `docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md`
- `scripts/check-p1193-founder-runtime-approval-decision-recording-boundary.js`
- `scripts/check-p1192-founder-runtime-approval-decision-recording-boundary.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1192-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/p1193-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files expected to change:
- P119.3 intent model helper
- P119.3 checker
- P119.2 checker handoff acceptance
- P119 contract and plan
- package script registration
- README and platform roadmap
- OS roadmap/status and generated reports

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
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

Exact files/modules to create or update:
- add `shared/founderApprovalDecisionIntentModel.js`
- add `scripts/check-p1193-founder-runtime-approval-decision-recording-boundary.js`
- update `scripts/check-p1192-founder-runtime-approval-decision-recording-boundary.js`
- update P119 contract/docs/status/reports

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_DECISION_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_DECISION_INTENT_STATES`
- `buildFounderApprovalDecisionIntentModel`
- `validateFounderApprovalDecisionIntentModel`

The data shape is a display-safe local model with schema version, phase, source
schema phase, model-only flag, hidden-from-Command-Center flag, decision intent
state, current state, founder question, requested and proposed decision labels,
blockers, next action, disabled reason, owner capability, evidence/activity
labels, cost posture, explicit false approval decision recording/persistence
flags, false execution unlock flag, false authority flags, and schema entity
names.

Reuse check: reuse `shared/founderApprovalDecisionSchemaMetadata.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`, P119.2 checker
patterns, existing OS phase status validation, and existing phase coverage
reporting. Do not duplicate schema metadata, report writers, checker
formatters, phase status updaters, redaction helpers, mode guards, route
matrices, UI components, or audit/activity appenders.

Command Center UX requirements: no UI source change. Do not add submit buttons,
approval buttons, reject buttons, save decision buttons, run controls, route
labels, raw JSON/log/policy dumps, raw private IDs, raw DB table names, internal
phase labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P119.3 because there is no
UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P119.3 checker for model shape, state
allowlist, blocked authority flags, docs/status alignment, allowed file scope,
and safety wording. Update the P119.2 checker to keep P119.3/P119.4 handoff
acceptance explicit.

Docs/README/roadmap updates: P119.3 is recorded in this plan, README, platform
roadmap, P119 contract, OS roadmap/status, and generated reports. P119.4 is
next for approval decision safe dry run.

OS phase status update: P119 is in progress; P119.3 is complete; current phase
P119.3; previous P119.2; next P119.4.

Reports to regenerate:
- `reports/p1192-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/p1193-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1193-founder-runtime-approval-decision-recording-boundary`
- `npm run check:p1192-founder-runtime-approval-decision-recording-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
- `find local-state/runtime -maxdepth 1 -name 'check-p119*.sqlite' -print`

Final safety checks: no project/CareLoop paths changed; no dashboard source or
dashboard test files changed; no DB/runtime provider, tool, worker, deploy,
release, export, package, or env paths changed; no approval capture, approval
persistence, approval decision recording, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, network, deploy, release, export, package, or
spend authority is enabled; no DemoApp exposure, raw private IDs, raw DB table
names, raw JSON/log/policy dumps, internal primary UX phase labels, or fake
actions are introduced.

Git add/commit/push commands:
- `git add <allowed P119.3 files>`
- `git commit -m "feat(nexus): implement p1193 approval decision intent model"`
- stamp P119/P119.3 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1193 approval decision intent model"`
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

Known risks: decision-intent wording can look like a live approve/reject action.
P119.3 explicitly separates decision review labels from decision recording and
keeps decision recorded, persisted, accepted, rejected, and execution-unlocked
flags false.

Rollback plan: remove the P119.3 helper/checker/docs/status/report changes,
restore P119.3 to planned, set current phase back to P119.2, and keep P119.2
complete.

## Planned Subphase Controls

P119.3 Governed Local Approval Decision Intent Model is complete. A pure local
model now describes future approval decision review intent while recording no
decision.

P119.4 Approval Decision Safe Dry Run: produce a local preview that summarizes
decision readiness while keeping approve/reject decisions, persistence, writes,
and runtime execution blocked.

P119.5 Command Center Approval Decision Boundary UX: show scoped readiness on
Business Build and Agent Flow only, with no approve/reject or save controls.

P119.6 Approval Decision Validation / Docs: validate P119.1-P119.5 together,
regenerate reports, and preserve UX without adding new UI or controls. No
approval decision recording or runtime authority may be added.

P119.7 Final Validation: close P119, record a planned next phase, rerun
aggregate checks, ensure no stale phase status remains, and keep approval
capture/persistence/decision recording/execution blocked unless a future phase
explicitly grants narrow authority.
