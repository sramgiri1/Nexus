# P120 Founder Runtime Approval Decision Persistence Boundary Plan

## P120 Subphase Split

- P120.1 Approval Decision Persistence Contract / Policy
- P120.2 Approval Decision Persistence Schema Metadata
- P120.3 Governed Local Approval Decision Persistence Intent Model
- P120.4 Approval Decision Persistence Safe Dry Run
- P120.5 Command Center Approval Decision Persistence Boundary UX
- P120.6 Approval Decision Persistence Validation / Docs
- P120.7 Final Validation

## P120.1 Approval Decision Persistence Contract / Policy

Status: complete

Phase: P120 Founder Runtime Approval Decision Persistence Boundary

Subphase: P120.1 Approval Decision Persistence Contract / Policy

Goal: define the approval-decision persistence boundary, implementation-grade
subphase split, safety policy, reuse rules, validation commands, and OS
handoff from P119 without implementing approval persistence, approve/reject
decision recording, DB/runtime writes, or runtime execution.

Why this is needed: P119 closed the approval decision recording boundary as
read-only. P120 must define exactly what approval decision persistence can mean
before any persistence metadata, UI state, or future write path is added.

User/operator impact: operators can see P120 started and split. No new
founder-facing approve/reject action or persistence behavior is enabled in
P120.1; existing approval decision boundary summaries remain read-only.

Command Center impact: no Command Center source changes in P120.1. Preserve
the P119 approval decision boundary UX on Business Build and Agent Flow. Keep
Chat with NEXUS and Lite chat clean.

Safety impact: P120.1 is contract-only. It does not enable approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, or spend.

Cost impact: docs/checkers/status only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `2c1d7430`.

Allowed files:
- `contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json`
- `docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md`
- `scripts/check-p1201-founder-runtime-approval-decision-persistence-boundary-contract.js`
- `scripts/check-p1197-founder-runtime-approval-decision-recording-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1197-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/p1201-founder-runtime-approval-decision-persistence-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files expected to change:
- P120 contract
- P120 plan
- P120.1 checker
- P119.7 checker handoff acceptance
- OS status checker P120.1-P120.7 recognition
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
- add `contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json`
- add `docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md`
- add `scripts/check-p1201-founder-runtime-approval-decision-persistence-boundary-contract.js`
- update `scripts/check-p1197-founder-runtime-approval-decision-recording-boundary.js`
- update `scripts/check-os-phase-status.js`
- update package/docs/status/reports

Expected exports, schemas, and data shapes: no runtime data shape, schema, DB
table, approval decision payload, or write path is introduced. P120.1 creates
only a contract JSON document and markdown validation report.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
existing P119 validation patterns, existing OS phase status validation, and
existing roadmap/status reporting. Do not duplicate report writers, checker
formatters, phase status updaters, redaction helpers, mode guards, route
matrices, UI card/tab/status components, or audit/activity appenders.

Command Center UX requirements: preserve P119.5 approval-decision boundary UX.
Do not add UI controls, route labels, submit buttons, approve/reject buttons,
save decision buttons, raw JSON/log/policy dumps, raw private IDs, raw DB table
names, internal phase labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P120.1 because there is
no UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P120.1 contract checker covering contract
shape, subphase completeness, P119 closure, P120.1 status, docs/report
alignment, safety wording, allowed file scope, and P119.7 handoff acceptance.
Update OS phase status validation to recognize P120.1-P120.7.

Docs/README/roadmap updates: P120.1 is recorded in this plan, README, platform
roadmap, P120 contract, OS roadmap/status, and generated reports. P120.2 is
next for approval decision persistence schema metadata.

OS phase status update: P120 is in progress; P120.1 is complete; current phase
P120.1; previous P119.7; next P120.2.

Reports to regenerate:
- `reports/p1197-founder-runtime-approval-decision-recording-boundary-report.md`
- `reports/p1201-founder-runtime-approval-decision-persistence-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1201-founder-runtime-approval-decision-persistence-boundary-contract`
- `npm run check:p1197-founder-runtime-approval-decision-recording-boundary`
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
- `git add <allowed P120.1 files>`
- `git commit -m "feat(nexus): implement p1201 approval decision persistence contract"`
- stamp P120/P120.1 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1201 approval decision persistence contract"`
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

Known risks: persistence language can imply live approve/reject authority or
DB writes. P120.1 keeps the work contract-only and repeats the blocked
persistence, DB write, decision recording, execution, dispatch, project
mutation, deploy/package, network, and spend posture.

Rollback plan: remove the P120.1 contract/checker/docs/status/report changes,
restore P120 to planned, set current phase back to P119.7, and keep P119
complete.

## P120.2 Approval Decision Persistence Schema Metadata

Status: complete

Phase: P120 Founder Runtime Approval Decision Persistence Boundary

Subphase: P120.2 Approval Decision Persistence Schema Metadata

Goal: define browser-safe approval decision persistence schema metadata without
DB files, DB writes, persistence, approve/reject decision recording, or runtime
execution.

Why this is needed: P120.1 defines the persistence boundary. P120.2 gives later
P120 intent, preview, and UX phases a stable display-safe metadata shape while
all write authority remains blocked.

User/operator impact: no founder-facing behavior changes. Operators get
schema-level evidence for future persistence drafts, events, and evidence
references without storing decisions.

Command Center impact: no Command Center source changes in P120.2. Preserve
P119/P120.1 read-only posture and avoid any approve/reject or save decision
controls.

Safety impact: P120.2 is metadata-only. It does not enable approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
hosted DB mutation, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, raw SQL, deploy,
release, export, package, network calls, or spend.

Cost impact: local deterministic metadata only. No provider/model/network/spend
path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `e25c78d5`.

Allowed files:
- `shared/founderApprovalDecisionPersistenceSchemaMetadata.js`
- `contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json`
- `docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md`
- `scripts/check-p1202-founder-runtime-approval-decision-persistence-boundary.js`
- `scripts/check-p1201-founder-runtime-approval-decision-persistence-boundary-contract.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1201-founder-runtime-approval-decision-persistence-boundary-contract-report.md`
- `reports/p1202-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files expected to change:
- `shared/founderApprovalDecisionPersistenceSchemaMetadata.js`
- `scripts/check-p1202-founder-runtime-approval-decision-persistence-boundary.js`
- P120 contract, this plan, README, platform roadmap, OS roadmap/status, and
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
- add `shared/founderApprovalDecisionPersistenceSchemaMetadata.js`
- add `scripts/check-p1202-founder-runtime-approval-decision-persistence-boundary.js`
- add `check:p1202-founder-runtime-approval-decision-persistence-boundary`
  to `package.json`
- update P120 contract, this plan, README, platform roadmap, OS roadmap/status,
  and generated reports

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_METADATA_PHASE`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_VERSION`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_ENTITY_NAMES`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_AUTHORITY_FLAGS`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_SCHEMA_ENTITIES`
- `buildFounderApprovalDecisionPersistenceSchemaMetadata`
- browser-safe metadata object with schema version, phase id,
  `schemaOnly: true`, `commandCenterVisible: false`, metadata-only write
  policy, and three entities for future persistence drafts, persistence events,
  and persistence evidence references.

Reuse check: reuse the P119.2 schema metadata pattern, P120.1 checker handoff
style, `shared/reportWriter.js`, `shared/checkResultFormatter.js`, existing OS
status checks, and existing phase validation coverage. Do not duplicate report
writers, checker formatters, phase status updaters, redaction helpers, mode
guards, route matrices, UI card/tab/status components, or audit/activity
appenders.

Command Center UX requirements: no UI changes. Do not add approve/reject/save
decision controls, persistence controls, raw JSON/log/policy dumps, raw private
IDs, raw DB table names, internal phase labels in primary UX, DemoApp, or fake
working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P120.2 because there is
no UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P120.2 checker covering metadata shape,
authority flags, helper import safety, docs/report alignment, allowed file
scope, and P120.1 handoff acceptance.

Docs/README/roadmap updates: P120.2 is recorded in this plan, README, platform
roadmap, P120 contract, OS roadmap/status, and generated reports. P120.3 is
next for the governed local approval decision persistence intent model.

OS phase status update: P120 is in progress; P120.2 is complete; current phase
P120.2; previous P120.1; next P120.3.

Reports to regenerate:
- `reports/p1201-founder-runtime-approval-decision-persistence-boundary-contract-report.md`
- `reports/p1202-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1202-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:p1201-founder-runtime-approval-decision-persistence-boundary-contract`
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
- `git add <allowed P120.2 files>`
- `git commit -m "feat(nexus): implement p1202 approval decision persistence schema"`
- stamp P120/P120.2 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1202 approval decision persistence schema"`
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

Known risks: schema metadata could be mistaken for persisted storage. P120.2
keeps `schemaOnly: true`, `commandCenterVisible: false`, and all write,
execution, dispatch, project mutation, network, and spend flags false.

Rollback plan: remove the P120.2 helper/checker/docs/status/report changes,
restore P120.2 to planned, set current phase back to P120.1, and keep P120.1
complete.

## P120.3 Governed Local Approval Decision Persistence Intent Model

Phase: P120 Founder Runtime Approval Decision Persistence Boundary

Subphase: P120.3 Governed Local Approval Decision Persistence Intent Model

Status: complete

Classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit: `403b08d7`

Goal: add a local intent model that translates P120.2 persistence schema
metadata into founder-safe readiness rows, blockers, next action, disabled
reason, owner capability, evidence/activity labels, and cost impact without
writing records or enabling approvals.

Why this is needed: P120.2 defines display-safe persistence schema metadata.
P120.3 gives later P120 preview and UX work a deterministic local model for
approval decision persistence planning while preserving the boundary that no
decision is captured, persisted, or used to unlock execution.

User/operator impact: operators can inspect a useful local persistence intent
shape with clear blockers and next action. The subphase does not create a live
approval workflow, DB record, runtime record, project mutation, provider call,
or execution path.

Command Center impact: no Command Center source changes in P120.3. The model
is display-safe for later P120.4/P120.5 surfaces. Primary UX must not show raw
JSON, raw logs, raw policy dumps, raw DB table names, private project IDs,
DemoApp outside demo mode, approve/reject controls, save controls, execution
controls, or fake runnable actions.

Safety impact: P120.3 remains model-only and local-only. Approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
hosted DB mutation, raw SQL, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
deploy, release, export, package, network calls, and provider spend remain
blocked.

Cost impact: no provider calls, network calls, hosted services, or provider
spend.

Project/OS scope: OS-only. No project source, CareLoop source, generated app
source, dashboard source, DB implementation, provider implementation,
tool/worker runtime, deploy/release/export/package files, or env files are
allowed.

Files expected to change:
- `shared/founderApprovalDecisionPersistenceIntentModel.js`
- `scripts/check-p1203-founder-runtime-approval-decision-persistence-boundary.js`
- `contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json`
- `docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1202-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/p1203-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

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

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES`
- `buildFounderApprovalDecisionPersistenceIntentModel`
- `validateFounderApprovalDecisionPersistenceIntentModel`
- The model shape includes phase/schema/model versions, source schema phase,
  `modelOnly`, `localOnly`, `commandCenterVisible: false`, display-safe
  founder summary, readiness rows, blockers, next action, disabled reason,
  owner capability, evidence/activity labels, cost label, zero
  persistence/write/execution/spend counts, and all authority flags false.

Command Center UX requirements:
- Preserve existing full Command Center and Lite UX.
- Do not expose P120.3 as a live control.
- Do not expose DemoApp in full Command Center.
- Do not expose raw JSON, raw logs, raw policy dumps, raw DB table names,
  private IDs, approve/reject controls, save controls, execution controls, or
  fake runnable actions.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- No CSS or route change is included in P120.3.

Playwright tests: no new Playwright test is added because P120.3 does not
modify dashboard source. Existing route-wide safety tests remain in scope for
future UX subphases.

Checker updates: add a dedicated P120.3 checker that verifies model exports,
P120.2 schema reuse, local-only hidden status, zero candidate counts, blocked
readiness rows, all authority flags false, no DB/runtime/provider imports,
docs/status updates, allowed diff scope, forbidden path safety, and no fake
runnable claims.

Docs/README/roadmap updates: P120.3 is recorded in this plan, README, platform
roadmap, P120 contract, OS roadmap/status, and generated reports. P120.4 is
next for safe dry-run planning.

OS phase status update: P120 is in progress; P120.3 is complete; current phase
P120.3; previous P120.2; next P120.4.

Validation commands:
- `npm run check:p1203-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:p1202-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P120.3 files>`
- `git commit -m "feat(nexus): implement p1203 approval decision persistence intent"`
- stamp P120/P120.3 status with the implementation commit
- `git add <allowed P120.3 status/report files>`
- `git commit -m "chore(nexus): stamp p1203 approval decision persistence intent"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- Confirm no approval capture, approval persistence, or approve/reject decision
  recording authority is enabled.
- Confirm no DB/runtime write, hosted DB mutation, raw SQL, provider/model
  call, agent dispatch, worker/tool execution, project mutation, deploy,
  release, export, package, network call, or provider spend authority exists.
- Confirm no project-owned, CareLoop, generated app, dashboard, DB, provider,
  tool, worker, deploy, release, export, package, or env path changed.

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

Known risks: P120.3 could be misread as live persistence. The model and checker
keep `modelOnly: true`, `localOnly: true`, `commandCenterVisible: false`, zero
candidate counts, blocked readiness rows, and all authority flags false.

Rollback plan: remove the P120.3 helper/checker/docs/status/report changes,
restore P120.3 to planned, set current phase back to P120.2, and keep P120.2
complete.

## P120.4 Approval Decision Persistence Safe Dry Run

Phase: P120 Founder Runtime Approval Decision Persistence Boundary

Subphase: P120.4 Approval Decision Persistence Safe Dry Run

Status: complete

Classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit: `9b76d00f`

Goal: add a local safe-dry-run preview that assembles approval decision
persistence readiness from P120.3 intent and P120.2 metadata without saving
decisions, writing DB/runtime records, or unlocking execution.

Why this is needed: P120.3 gives the local intent model. P120.4 turns it into
a deterministic preview envelope that later Command Center UX can render as
useful status without granting live persistence authority.

User/operator impact: operators get a structured preview of persistence
readiness, blocked rows, disabled reasons, owner capability, evidence/activity
locations, and cost impact. There is still no live approve/reject, save,
DB write, runtime write, or agent execution path.

Command Center impact: no Command Center source changes in P120.4. The preview
is `commandCenterVisible: false` until the scoped UX subphase. Primary UX must
not show raw JSON, raw logs, raw policy dumps, raw DB table names, private
project IDs, DemoApp outside demo mode, fake runnable actions, save controls,
approve/reject controls, or execution controls.

Safety impact: P120.4 remains dry-run-only and local-only. Approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
hosted DB mutation, raw SQL, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
deploy, release, export, package, network calls, and provider spend remain
blocked.

Cost impact: no provider calls, network calls, hosted services, or provider
spend.

Project/OS scope: OS-only. No project source, CareLoop source, generated app
source, dashboard source, DB implementation, provider implementation,
tool/worker runtime, deploy/release/export/package files, or env files are
allowed.

Files expected to change:
- `shared/founderApprovalDecisionPersistencePreview.js`
- `scripts/check-p1204-founder-runtime-approval-decision-persistence-boundary.js`
- `contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json`
- `docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1203-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

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

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_PHASE`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_VERSION`
- `FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES`
- `buildFounderApprovalDecisionPersistencePreview`
- `validateFounderApprovalDecisionPersistencePreview`
- The preview shape is a PASS result envelope with phase P120.4,
  `previewMode: local-only-persistence-dry-run`, `dryRunOnly: true`,
  `commandCenterVisible: false`, source phases P120.3/P120.2, display-safe
  preview rows and sections, evidence/activity/cost labels, zero
  persistence/write/execution/spend counts, and all authority flags false.

Command Center UX requirements:
- Preserve existing full Command Center and Lite UX.
- Do not expose the preview as a live control.
- Do not expose DemoApp in full Command Center.
- Do not expose raw JSON, raw logs, raw policy dumps, raw DB table names,
  private IDs, approve/reject controls, save controls, execution controls, or
  fake runnable actions.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- No CSS or route change is included in P120.4.

Playwright tests: no new Playwright test is added because P120.4 does not
modify dashboard source. Existing route-wide safety tests remain in scope for
future UX subphases.

Checker updates: add a dedicated P120.4 checker that verifies preview exports,
P120.3/P120.2 reuse, result envelope shape, dry-run-only status, hidden UX,
blocked rows, zero unsafe counts, all authority flags false, no unsafe imports,
docs/status updates, allowed diff scope, forbidden path safety, and no fake
runnable claims.

Docs/README/roadmap updates: P120.4 is recorded in this plan, README, platform
roadmap, P120 contract, OS roadmap/status, and generated reports. P120.5 is
next for the scoped Command Center persistence boundary UX.

OS phase status update: P120 is in progress; P120.4 is complete; current phase
P120.4; previous P120.3; next P120.5.

Validation commands:
- `npm run check:p1204-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:p1203-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P120.4 files>`
- `git commit -m "feat(nexus): implement p1204 approval decision persistence preview"`
- stamp P120/P120.4 status with the implementation commit
- `git add <allowed P120.4 status/report files>`
- `git commit -m "chore(nexus): stamp p1204 approval decision persistence preview"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- Confirm no approval capture, approval persistence, or approve/reject decision
  recording authority is enabled.
- Confirm no DB/runtime write, hosted DB mutation, raw SQL, provider/model
  call, agent dispatch, worker/tool execution, project mutation, deploy,
  release, export, package, network call, or provider spend authority exists.
- Confirm no project-owned, CareLoop, generated app, dashboard, DB, provider,
  tool, worker, deploy, release, export, package, or env path changed.

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

Known risks: P120.4 could be mistaken for live persistence. The preview and
checker keep `dryRunOnly: true`, `commandCenterVisible: false`, zero unsafe
counts, blocked preview rows, and all authority flags false.

Rollback plan: remove the P120.4 helper/checker/docs/status/report changes,
restore P120.4 to planned, set current phase back to P120.3, and keep P120.3
complete.

## P120.5 Command Center Approval Decision Persistence Boundary UX

Phase: P120 Founder Runtime Approval Decision Persistence Boundary

Subphase: P120.5 Command Center Approval Decision Persistence Boundary UX

Status: complete

Classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit: `9822b22e`

Goal: show P120.4 persistence dry-run readiness on scoped Command Center founder
work pages without adding live save, approve/reject, DB write, runtime write,
dispatch, provider, or execution controls.

Why this is needed: P120.4 created a safe preview envelope. P120.5 makes it
useful in the Command Center by showing current state, blockers, next action,
owner, evidence/activity labels, and cost impact on the pages where founder
work planning already happens.

User/operator impact: Business Build and Agent Flow now show a display-safe
approval decision persistence boundary card. Chat/Lite stays clean and
chat-focused; OS Roadmap remains phase-only; Live Readiness stays focused on
readiness.

Command Center impact: scoped UX only on Business Build and Agent Flow. Primary
UX must not show raw JSON, raw logs, raw policy dumps, raw DB table names,
private project IDs, internal P120 labels, report paths, DemoApp, fake runnable
actions, save controls, approve/reject controls, or execution controls.

Safety impact: P120.5 is display-only. Approval capture, approval persistence,
approve/reject decision recording, save actions, DB/runtime writes, hosted DB
mutation, raw SQL, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, deploy, release,
export, package, network calls, and provider spend remain blocked.

Cost impact: no provider calls, model calls, network calls, hosted services, or
provider spend.

Project/OS scope: OS UI/data/tests only. No project source, CareLoop source,
generated app source, DB implementation, provider implementation, tool/worker
runtime, deploy/release/export/package files, or env files are allowed.

Files expected to change:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `scripts/check-p1205-founder-runtime-approval-decision-persistence-boundary.js`
- `contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json`
- `docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/p1205-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
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

Expected exports, schemas, and data shapes:
- `buildFounderApprovalDecisionPersistenceBoundaryDisplayModel`
- The display model shape includes current state, founder idea, preview mode,
  summary rows, readiness row counts, zero persistence/write/execution/spend
  counts, next action, blockers, disabled reason, owner capability,
  evidence/activity labels, cost impact, display-safe readiness sections/rows,
  and safety rows all blocked.

Command Center UX requirements:
- Reuse the existing approval boundary card structure.
- Render the persistence boundary card on `/command-center/business-build` and
  `/command-center/agent-flow`.
- Do not render the card on `/command-center/lite`, `/command-center`,
  `/command-center/os-roadmap`, or `/command-center/live-readiness`.
- Do not expose DemoApp in full Command Center.
- Do not expose raw JSON, raw logs, raw policy dumps, raw DB table names,
  private IDs, internal phase labels, report paths, approve/reject controls,
  save controls, execution controls, or fake runnable actions.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Playwright verifies the scoped card in all three themes on Business Build.

Playwright tests:
- Add coverage for the approval decision persistence boundary card on scoped
  pages.
- Verify Business Build and Agent Flow show display-safe persistence readiness.
- Verify Lite, Chat, OS Roadmap, and Live Readiness do not show the card.
- Verify no DemoApp, raw dumps, private IDs, or fake runnable actions appear.

Checker updates: add a dedicated P120.5 checker covering the display model,
scoped rendering, Playwright coverage, safe strings, allowed paths, docs/status
updates, forbidden path safety, and P120.4 handoff.

Docs/README/roadmap updates: P120.5 is recorded in this plan, README, platform
roadmap, P120 contract, OS roadmap/status, and generated reports. P120.6 is
next for validation hardening.

OS phase status update: P120 is in progress; P120.5 is complete; current phase
P120.5; previous P120.4; next P120.6.

Validation commands:
- `npm run check:p1205-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:p1204-founder-runtime-approval-decision-persistence-boundary`
- `npm --prefix dashboard run test:pages -- -g "Approval decision persistence boundary" dashboard/tests/routes.spec.js`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P120.5 files>`
- `git commit -m "feat(nexus): implement p1205 approval decision persistence ux"`
- stamp P120/P120.5 status with the implementation commit
- `git add <allowed P120.5 status/report files>`
- `git commit -m "chore(nexus): stamp p1205 approval decision persistence ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- Confirm no approval capture, approval persistence, approve/reject decision
  recording, save action, DB/runtime write, hosted DB mutation, raw SQL,
  provider/model call, agent dispatch, worker/tool execution, project mutation,
  deploy, release, export, package, network call, or provider spend authority
  exists.
- Confirm Chat/Lite remains clean.
- Confirm no project-owned, CareLoop, generated app, DB, provider, tool,
  worker, deploy, release, export, package, or env path changed.

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

Known risks: adding another Command Center card could re-clutter founder pages.
The scope is limited to Business Build and Agent Flow, and Chat/Lite is
explicitly tested clean.

Rollback plan: remove the P120.5 UI/data/test/checker/docs/status/report
changes, restore P120.5 to planned, set current phase back to P120.4, and keep
P120.4 complete.

Status: complete.

## P120.6 Approval Decision Persistence Validation / Docs

Phase: P120 Founder Runtime Approval Decision Persistence Boundary

Subphase: P120.6 Approval Decision Persistence Validation / Docs

Goal: validate P120.1-P120.5 together and align docs, reports, package scripts,
contracts, and OS phase status before final validation.

Why this is needed: P120 now has the contract, browser-safe schema metadata,
local intent model, safe dry-run preview, and scoped Command Center display. The
chain needs an aggregate validation pass before P120 can be closed.

User/operator impact: operators can see that the approval-decision persistence
boundary is consistent across reports and roadmap state. This does not add any
new action, persistence, runtime, provider, or project authority.

Command Center impact: preserve the existing scoped Business Build and Agent
Flow approval decision persistence boundary card. Chat/Lite remains
chat-focused, OS Roadmap remains OS phases only, and Live Readiness remains
readiness-only. No new controls are added.

Safety impact: approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, deploy, release, export, package actions, network
calls, and provider spend remain blocked.

Cost impact: no provider/model calls, network calls, hosted DB calls, or spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `scripts/check-p1206-founder-runtime-approval-decision-persistence-boundary.js`
- `contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json`
- `docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/p1205-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/p1206-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

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
- create `scripts/check-p1206-founder-runtime-approval-decision-persistence-boundary.js`
- update the P120 contract, P120 plan, platform roadmap, README, package script,
  OS status files, and generated reports listed above

Expected exports, schemas, and data shapes: no new exports or schemas. P120.6
validates the existing P120.3 intent model, P120.4 preview envelope, and P120.5
display model. It does not create a persisted approval record, DB table, runtime
event, project mutation, provider request, tool call, or worker dispatch.

Command Center UX requirements: keep the scoped persistence boundary visible
only where P120.5 placed it. Primary UX must not show raw JSON, raw logs, raw
policy dumps, raw DB table names, private project IDs, internal P120 labels
outside OS Roadmap, DemoApp, approve/reject controls, save controls, execution
controls, or fake runnable actions.

Dark/light/system theme requirements: preserve existing dark, light, and system
theme behavior. No CSS or component theme changes are allowed in this subphase.

Playwright tests: no new Playwright source change because dashboard source and
tests are forbidden in P120.6. The aggregate checker verifies the existing P120.5
scoped Playwright coverage remains present.

Checker updates: add a dedicated P120.6 checker that reuses
`shared/reportWriter.js`, `shared/checkResultFormatter.js`, the P120.3 intent
model, the P120.4 preview model, and the P120.5 display model. Do not duplicate
report writers, result envelopes, redaction helpers, mode guards, or phase
status updaters.

Docs/README/roadmap updates: P120.6 is recorded in this plan, README, platform
roadmap, P120 contract, OS roadmap/status, and generated reports. P120.7 is
next for final validation.

OS phase status update: P120 is in progress; P120.6 is complete; current phase
P120.6; previous P120.5; next P120.7.

Validation commands:
- `npm run check:p1206-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:p1205-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:p1204-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P120.6 files>`
- `git commit -m "chore(nexus): validate p1206 approval decision persistence"`
- stamp P120/P120.6 status with the implementation commit
- `git add <allowed P120.6 status/report files>`
- `git commit -m "chore(nexus): stamp p1206 approval decision persistence"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no approval capture, approval persistence, approve/reject decision
  recording, DB/runtime writes, runtime execution, execution unlock,
  provider/model calls, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL, deploy, release, export, package actions,
  network calls, or provider spend are enabled
- confirm no project-owned, CareLoop, generated-project, dashboard source/test,
  DB, live-ready, runtime, provider, tool, worker, deploy, release, export,
  package, or env files changed

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: existing validation reports can contain older command text; P120.6
normalizes status/contract command text without changing dashboard test source.

Rollback plan: remove the P120.6 checker/docs/status/report changes, restore
P120.6 to planned, set current phase back to P120.5, and keep P120.5 complete.

Status: complete.

## Planned Subphase Controls

P120.6 Approval Decision Persistence Validation / Docs is complete.
P120.7 is next for final validation, with approval persistence, DB/runtime
writes, approve/reject decision recording, and execution still blocked unless a
future subphase explicitly grants narrow authority.
