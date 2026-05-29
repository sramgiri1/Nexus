# P118 Founder Runtime Approval Capture Boundary Plan

## P118 Subphase Split

- P118.1 Approval Capture Contract / Policy
- P118.2 Approval Capture Schema Metadata
- P118.3 Governed Local Approval Intent Model
- P118.4 Approval Capture Safe Dry Run
- P118.5 Command Center Approval Capture Boundary UX
- P118.6 Approval Capture Validation / Docs
- P118.7 Final Validation

## P118.1 Approval Capture Contract / Policy

Status: complete

Phase: P118 Founder Runtime Approval Capture Boundary

Subphase: P118.1 Approval Capture Contract / Policy

Goal: define the approval-capture boundary, implementation-grade subphase split,
safety policy, reuse rules, validation commands, and OS handoff from P117
without implementing approval capture, approval persistence, DB writes, or
runtime execution.

Why this is needed: P117 closed the approval gate as readiness and preview.
P118 must define exactly what founder approval capture can mean before any UI
control, persistence path, or runtime admission flow is added.

User/operator impact: operators can see P118 started and split. No new
founder-facing approval action is enabled in P118.1; existing approval-gate
summaries remain read-only.

Command Center impact: no Command Center source changes in P118.1. Preserve the
P117 approval-gate UX on Business Build and Agent Flow. Keep Chat with NEXUS
and Lite chat clean.

Safety impact: P118.1 is contract-only. It does not enable approval capture,
approval persistence, approve/reject recording, DB writes, runtime execution,
execution unlock, provider/model calls, agent dispatch, worker/tool execution,
project mutation, hosted DB mutation, raw SQL, deploy, release, export,
package, network calls, or spend.

Cost impact: docs/checkers/status only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `5a78ec28`.

Allowed files:
- `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- `scripts/check-p1177-founder-runtime-execution-approval-gate.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- generated P117.7/P118.1/OS/coverage reports

Files expected to change:
- P118 contract
- P118.1 checker
- P117.7 checker handoff acceptance
- OS status checker P118.1-P118.7 recognition
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
- add `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- add `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- add `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- update `scripts/check-p1177-founder-runtime-execution-approval-gate.js`
- update `scripts/check-os-phase-status.js`
- update package/docs/status/reports

Expected exports, schemas, and data shapes: no runtime data shape, schema, DB
table, approval decision payload, or write path is introduced. P118.1 creates
only a contract JSON document and markdown validation report.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
existing P117 validation patterns, existing OS phase status validation, and
existing roadmap/status reporting. Do not duplicate report writers, checker
formatters, phase status updaters, redaction helpers, mode guards, route
matrices, UI card/tab/status components, or audit/activity appenders.

Command Center UX requirements: preserve P117.5 approval-gate UX. Do not add UI
controls, route labels, submit buttons, approval buttons, reject buttons, raw
JSON/log/policy dumps, raw private IDs, raw DB table names, internal phase
labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P118.1 because there is no
UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P118.1 contract checker covering contract
shape, subphase completeness, P117 closure, P118.1 status, docs/report
alignment, safety wording, allowed file scope, and P117.7 handoff acceptance.
Update OS phase status validation to recognize P118.1-P118.7.

Docs/README/roadmap updates: P118.1 is recorded in this plan, README, platform
roadmap, P118 contract, OS roadmap/status, and generated reports. P118.2 is
next for approval capture schema metadata.

OS phase status update: P118 is in progress; P118.1 is complete; current phase
P118.1; previous P117.7; next P118.2.

Reports to regenerate:
- `reports/p1177-founder-runtime-execution-approval-gate-report.md`
- `reports/p1181-founder-runtime-approval-capture-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1181-founder-runtime-approval-capture-boundary-contract`
- `npm run check:p1177-founder-runtime-execution-approval-gate`
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
- `git add <allowed P118.1 files>`
- `git commit -m "feat(nexus): implement p1181 approval capture contract"`
- stamp P118/P118.1 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1181 approval capture contract"`
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

Known risks: wording can imply live approval capture before the boundary is
implemented. The P118.1 checker rejects unsafe positive claims and fake runnable
actions.

Rollback plan: remove P118 contract/checker/docs/status/report updates, restore
P118 to a planned placeholder after P117.7, and keep P117 approval-gate UX
unchanged.

## P118.2 Approval Capture Schema Metadata

Status: complete

Phase: P118 Founder Runtime Approval Capture Boundary

Subphase: P118.2 Approval Capture Schema Metadata

Goal: add browser-safe approval capture schema metadata for future capture
requests, events, and evidence references without DB files, DB writes, approval
capture, approval persistence, or approval decision recording.

Why this is needed: P118.1 defines the boundary only. P118.2 gives later model
and UX subphases a typed metadata source for what would be captured while the
system remains read-only and blocked.

User/operator impact: no new action. Operators get clearer documentation and
validation of the approval capture data shape that future subphases may
preview.

Command Center impact: no Command Center source changes in P118.2. Preserve the
P117 approval-gate UX on Business Build and Agent Flow. Keep Chat with NEXUS
and Lite chat clean.

Safety impact: P118.2 is schema metadata only. It does not add DB schema files,
DB writes, approval capture, approval persistence, approve/reject recording,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, or spend.

Cost impact: local checker/docs only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `e6695c2b`.

Allowed files:
- `shared/founderApprovalCaptureSchemaMetadata.js`
- `scripts/check-p1182-founder-runtime-approval-capture-boundary.js`
- `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- generated P118.1/P118.2/OS/coverage reports

Files expected to change:
- approval capture schema metadata helper
- P118.2 checker
- P118.1 checker handoff acceptance
- P118 contract and plan
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
- add `shared/founderApprovalCaptureSchemaMetadata.js`
- add `scripts/check-p1182-founder-runtime-approval-capture-boundary.js`
- update `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- update P118 contract/docs/status/reports

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_CAPTURE_SCHEMA_METADATA_PHASE`
- `FOUNDER_APPROVAL_CAPTURE_SCHEMA_VERSION`
- `FOUNDER_APPROVAL_CAPTURE_ENTITY_NAMES`
- `FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS`
- `FOUNDER_APPROVAL_CAPTURE_SCHEMA_ENTITIES`
- `buildFounderApprovalCaptureSchemaMetadata`

The data shape is metadata-only: capture request, capture event, and capture
evidence reference descriptions with display-safe labels, disabled reason,
owner/capability, evidence/activity labels, cost posture, redaction requirement,
and explicit false authority flags for every approval, write, execution,
provider, dispatch, project, deploy/release/export/package, network, and spend
capability.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
P118.1 checker/report patterns, existing OS phase status validation, and
existing phase coverage reporting. No existing shared approval-capture schema
metadata helper exists; the new helper is scoped for reuse by P118.3-P118.5.
Do not duplicate report writers, checker formatters, phase status updaters,
redaction helpers, mode guards, route matrices, UI components, or
audit/activity appenders.

Command Center UX requirements: no UI source change. Do not add submit buttons,
approval buttons, reject buttons, run controls, route labels, raw JSON/log/policy
dumps, raw private IDs, raw DB table names, internal phase labels in primary UX,
DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P118.2 because there is no
UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P118.2 checker for metadata shape, exports,
blocked authority flags, docs/status alignment, allowed file scope, and safety
wording. Update the P118.1 checker to accept P118.2/P118.3 handoff.

Docs/README/roadmap updates: P118.2 is recorded in this plan, README, platform
roadmap, P118 contract, OS roadmap/status, and generated reports. P118.3 is
next for governed local approval intent modeling.

OS phase status update: P118 is in progress; P118.2 is complete; current phase
P118.2; previous P118.1; next P118.3.

Reports to regenerate:
- `reports/p1181-founder-runtime-approval-capture-boundary-contract-report.md`
- `reports/p1182-founder-runtime-approval-capture-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1182-founder-runtime-approval-capture-boundary`
- `npm run check:p1181-founder-runtime-approval-capture-boundary-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
- `find local-state/runtime -maxdepth 1 -name 'check-p118*.sqlite' -print`

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
- `git add <allowed P118.2 files>`
- `git commit -m "feat(nexus): implement p1182 approval capture schema"`
- stamp P118/P118.2 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1182 approval capture schema"`
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

Known risks: metadata can drift into implementation behavior if it exposes
write handles or DB names. P118.2 keeps the helper metadata-only and the checker
rejects DB/runtime imports, raw table names in public docs, and unsafe positive
claims.

Rollback plan: remove the P118.2 helper/checker/docs/status/report changes,
restore P118.2 to planned, set current phase back to P118.1, and keep P118.1
complete.

## P118.3 Governed Local Approval Intent Model

Status: complete

Phase: P118 Founder Runtime Approval Capture Boundary

Subphase: P118.3 Governed Local Approval Intent Model

Goal: add a pure in-memory approval intent model that consumes the P118.2 schema
metadata and describes founder review intent states without recording
approve/reject decisions, writing DB/runtime state, or enabling execution.

Why this is needed: P118.2 defines the metadata shape. P118.3 gives later
dry-run and Command Center UX subphases a deterministic model for current state,
next action, blocker, disabled reason, owner, evidence/activity labels, and
cost posture.

User/operator impact: no new action. Operators get a validated local model that
explains what remains blocked before any approval capture UI can exist.

Command Center impact: no Command Center source changes. Chat with NEXUS and
Lite remain clean; Business Build and Agent Flow keep the P117 read-only
approval-gate UX.

Safety impact: pure local model only. It does not add DB files, DB writes,
local runtime artifacts, approval capture, approval persistence, approve/reject
recording, runtime execution, execution unlock, provider/model calls, agent
dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL,
deploy, release, export, package, network calls, or spend.

Cost impact: local checker/docs only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `6e2cd1bc`.

Allowed files:
- `shared/founderApprovalCaptureIntentModel.js`
- `shared/founderApprovalCaptureSchemaMetadata.js`
- `scripts/check-p1183-founder-runtime-approval-capture-boundary.js`
- `scripts/check-p1182-founder-runtime-approval-capture-boundary.js`
- `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- generated P118.2/P118.3/OS/coverage reports

Files expected to change:
- approval capture intent model helper
- P118.3 checker
- P118.2 checker handoff acceptance
- P118 contract and plan
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
- add `shared/founderApprovalCaptureIntentModel.js`
- add `scripts/check-p1183-founder-runtime-approval-capture-boundary.js`
- update `scripts/check-p1182-founder-runtime-approval-capture-boundary.js`
- update P118 contract/docs/status/reports

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_CAPTURE_INTENT_STATES`
- `buildFounderApprovalCaptureIntentModel`
- `validateFounderApprovalCaptureIntentModel`

The data shape is a display-safe, in-memory model with schema version, phase,
source schema phase, model-only flag, hidden-from-Command-Center flag, intent
state, current state, founder question, requested decision label, next action,
disabled reason, owner capability, evidence/activity labels, cost posture, and
explicit false authority flags for approval capture, persistence, decision
recording, writes, execution, providers, dispatch, project mutation, deploy,
release, export, package, network, and spend.

Reuse check: reuse `shared/founderApprovalCaptureSchemaMetadata.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`, P118.2 checker
patterns, existing OS phase status validation, and existing phase coverage
reporting. Do not duplicate schema metadata, report writers, checker
formatters, phase status updaters, redaction helpers, mode guards, route
matrices, UI components, or audit/activity appenders.

Command Center UX requirements: no UI source change. Do not add submit buttons,
approval buttons, reject buttons, run controls, route labels, raw JSON/log/policy
dumps, raw private IDs, raw DB table names, internal phase labels in primary UX,
DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P118.3 because there is no
UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P118.3 checker for model shape, state
allowlist, blocked authority flags, docs/status alignment, allowed file scope,
and safety wording. Update the P118.2 checker to accept P118.3/P118.4 handoff.

Docs/README/roadmap updates: P118.3 is recorded in this plan, README, platform
roadmap, P118 contract, OS roadmap/status, and generated reports. P118.4 is
next for approval capture safe dry run.

OS phase status update: P118 is in progress; P118.3 is complete; current phase
P118.3; previous P118.2; next P118.4.

Reports to regenerate:
- `reports/p1182-founder-runtime-approval-capture-boundary-report.md`
- `reports/p1183-founder-runtime-approval-capture-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1183-founder-runtime-approval-capture-boundary`
- `npm run check:p1182-founder-runtime-approval-capture-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
- `find local-state/runtime -maxdepth 1 -name 'check-p118*.sqlite' -print`

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
- `git add <allowed P118.3 files>`
- `git commit -m "feat(nexus): implement p1183 approval intent model"`
- stamp P118/P118.3 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1183 approval intent model"`
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

Known risks: an intent model can look like an approval decision if the language
is sloppy. P118.3 explicitly separates requested review labels from decision
recording and keeps approval intent/decision recorded flags false.

Rollback plan: remove the P118.3 helper/checker/docs/status/report changes,
restore P118.3 to planned, set current phase back to P118.2, and keep P118.2
complete.

## P118.4 Approval Capture Safe Dry Run

Status: complete

Phase: P118 Founder Runtime Approval Capture Boundary

Subphase: P118.4 Approval Capture Safe Dry Run

Goal: add a display-safe local dry-run preview for approval capture readiness
and blockers without accepting approvals, writing records, recording
approve/reject decisions, or unlocking runtime execution.

Why this is needed: P118.3 can model local approval intent. P118.4 creates the
UI-ready preview shape that P118.5 can render on scoped non-chat pages while
the approval capture boundary remains blocked.

User/operator impact: operators can inspect preview rows for current state,
next action, blocker, disabled reason, owner capability, evidence/activity
location, and cost posture before any approval capture UI exists.

Command Center impact: no UI source changes in P118.4. Chat with NEXUS and
Lite remain clean; P118.5 owns scoped Command Center rendering.

Safety impact: P118.4 is local dry-run only. It does not add DB files, DB
writes, local runtime artifacts, approval capture, approval persistence,
approve/reject recording, runtime execution, execution unlock, provider/model
calls, agent dispatch, worker/tool execution, project mutation, hosted DB
mutation, raw SQL, deploy, release, export, package, network calls, or spend.

Cost impact: local checker/docs only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `3dc38112`.

Allowed files:
- `shared/founderApprovalCapturePreview.js`
- `shared/founderApprovalCaptureIntentModel.js`
- `shared/founderApprovalCaptureSchemaMetadata.js`
- `scripts/check-p1184-founder-runtime-approval-capture-boundary.js`
- `scripts/check-p1183-founder-runtime-approval-capture-boundary.js`
- `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- generated P118.3/P118.4/OS/coverage reports

Files expected to change:
- approval capture preview helper
- P118.4 checker
- P118.3 checker handoff acceptance
- P118 contract and plan
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
- add `shared/founderApprovalCapturePreview.js`
- add `scripts/check-p1184-founder-runtime-approval-capture-boundary.js`
- update `shared/founderApprovalCaptureIntentModel.js`
- update `scripts/check-p1183-founder-runtime-approval-capture-boundary.js`
- update P118 contract/docs/status/reports

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_CAPTURE_PREVIEW_PHASE`
- `FOUNDER_APPROVAL_CAPTURE_PREVIEW_VERSION`
- `FOUNDER_APPROVAL_CAPTURE_PREVIEW_STATES`
- `buildFounderApprovalCapturePreview`
- `validateFounderApprovalCapturePreview`

The data shape is a `resultEnvelope` with schema version, preview mode, dry-run
flag, hidden-from-Command-Center flag, source P118.3/P118.2 phases, founder
question, requested decision label, summary counts, preview sections, preview
rows, blockers, next action, disabled reason, owner capability,
evidence/activity/cost labels, and explicit false authority flags for approval
capture, persistence, decision recording, writes, execution, providers,
dispatch, project mutation, deploy, release, export, package, network, and
spend.

Reuse check: reuse `shared/founderApprovalCaptureIntentModel.js`,
`shared/founderApprovalCaptureSchemaMetadata.js`, `shared/resultEnvelope.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`, P118.3 checker
patterns, existing OS phase status validation, and existing phase coverage
reporting. Do not duplicate schema metadata, intent model helpers, report
writers, checker formatters, phase status updaters, redaction helpers, mode
guards, route matrices, UI components, or audit/activity appenders.

Command Center UX requirements: no UI source change. Do not add submit buttons,
approval buttons, reject buttons, run controls, route labels, raw
JSON/log/policy dumps, raw private IDs, raw DB table names, internal phase
labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P118.4 because there is no
UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P118.4 checker for preview envelope shape,
state allowlist, P118.3/P118.2 helper reuse, zero unsafe counts, blocked
authority flags, docs/status alignment, allowed file scope, and safety wording.
Update the P118.3 checker to accept P118.4/P118.5 handoff.

Docs/README/roadmap updates: P118.4 is recorded in this plan, README, platform
roadmap, P118 contract, OS roadmap/status, and generated reports. P118.5 is
next for Command Center approval capture boundary UX.

OS phase status update: P118 is in progress; P118.4 is complete; current phase
P118.4; previous P118.3; next P118.5.

Reports to regenerate:
- `reports/p1183-founder-runtime-approval-capture-boundary-report.md`
- `reports/p1184-founder-runtime-approval-capture-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1184-founder-runtime-approval-capture-boundary`
- `npm run check:p1183-founder-runtime-approval-capture-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
- `find local-state/runtime -maxdepth 1 -name 'check-p118*.sqlite' -print`

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
- `git add <allowed P118.4 files>`
- `git commit -m "feat(nexus): implement p1184 approval capture dry run"`
- stamp P118/P118.4 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1184 approval capture dry run"`
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

Known risks: dry-run approval readiness can look like live approval capture if
the UI later adds action wording too early. P118.4 keeps every write,
approval, decision, execution, dispatch, project, hosted DB, deploy, package,
network, and spend flag false and remains hidden from Command Center until
P118.5.

Rollback plan: remove the P118.4 helper/checker/docs/status/report changes,
restore P118.4 to planned, set current phase back to P118.3, and keep P118.3
complete.

## P118.5 Command Center Approval Capture Boundary UX

Status: complete

Phase: P118 Founder Runtime Approval Capture Boundary

Subphase: P118.5 Command Center Approval Capture Boundary UX

Goal: render a scoped, display-safe approval capture boundary card on founder
work pages without submit, approve, reject, run, DB write, provider, dispatch,
project mutation, deploy/package, network, or spend authority.

Why this is needed: P118.4 produces a safe dry-run approval capture preview but
keeps it hidden from Command Center. P118.5 gives founders and operators a
useful visual surface for capture readiness, blockers, owner, next action, and
cost posture before later validation.

User/operator impact: Business Build and Agent Flow now show which approval
capture readiness rows exist, why every row is blocked, what to review next,
who owns the boundary, where evidence/activity lives, and that cost impact is
local and zero-spend. Chat with NEXUS remains chat-only.

Command Center impact: add a browser-safe dashboard display model and a reused
Command Center card pattern. Render the card only on Business Build and Agent
Flow. Do not render it on Chat, Lite chat, Live Readiness, OS Roadmap, or Demo
surfaces.

Safety impact: P118.5 is read-only UX. It does not import node-only DB/runtime
helpers, does not touch SQLite/runtime files, and does not add any runnable
controls. Primary UX uses friendly evidence labels instead of raw phase/report
paths or schema names.

Cost impact: local deterministic display only. No provider/model calls,
network calls, deploy/package actions, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `1c420094`.

Allowed files:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `scripts/check-p1185-founder-runtime-approval-capture-boundary.js`
- `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- generated P118.5/OS/coverage reports

Files expected to change:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `scripts/check-p1185-founder-runtime-approval-capture-boundary.js`
- `package.json`
- P118 contract, this plan, README, platform roadmap, OS roadmap/status, and
  generated reports

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

Exact files/modules to create or update:
- add `buildFounderApprovalCaptureBoundaryDisplayModel` to
  `dashboard/src/data/businessBuild.js`
- add `FounderApprovalCaptureBoundaryCard` and render it from Business Build
  and Agent Flow in `dashboard/src/pages/CommandCenterV2.jsx`
- add focused route coverage to `dashboard/tests/routes.spec.js`
- add `scripts/check-p1185-founder-runtime-approval-capture-boundary.js`
- add `check:p1185-founder-runtime-approval-capture-boundary` to
  `package.json`

Expected exports, schemas, and data shapes:
- `buildFounderApprovalCaptureBoundaryDisplayModel`
- browser-safe model with current state, founder idea, preview mode, readiness
  counts, sections, rows, blockers, disabled reason, owner capability,
  evidence/activity/cost labels, safety rows, and all capture/write/execution/
  dispatch/project/hosted DB/deploy/package/spend posture blocked.

Reuse check: reuse the P118.4 preview helper, existing Business Build data
model file, existing Command Center V2 card/grid/pill/safety-row patterns,
existing route test helpers, `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, and existing OS phase status/reporting
checks. Do not duplicate report writers, formatters, route matrices, mode
guards, redaction helpers, or phase status updaters.

Command Center UX requirements: show what changed, current state, next action,
blockers, disabled reason, owner capability, evidence/activity location, and
cost impact. Render only on Business Build and Agent Flow. Do not show raw
JSON, raw logs, raw policy dumps, raw private IDs, raw DB table names, internal
phase labels, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve existing System, Dark, and
Light theme behavior and add Playwright coverage for the new approval capture
boundary card.

Playwright tests: add a focused route test verifying the card appears on
Business Build and Agent Flow, survives dark/light/system themes, and is absent
from Chat, Lite chat, OS Roadmap, and Live Readiness.

Checker updates: add a dedicated P118.5 checker that validates the browser-safe
model, scoped rendering, Playwright coverage, docs/status updates, allowed file
scope, and absence of raw IDs, raw schema names, raw dumps, internal primary UX
phase labels, unsafe imports, or fake runnable actions.

Docs/README/roadmap updates: P118.5 is recorded in this plan, README, platform
roadmap, P118 contract, OS roadmap/status, and generated reports. P118.6 is
next for approval capture validation/docs.

OS phase status update: P118 is in progress; P118.5 is complete; current phase
P118.5; previous P118.4; next P118.6.

Reports to regenerate:
- `reports/p1185-founder-runtime-approval-capture-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1185-founder-runtime-approval-capture-boundary`
- `cd dashboard && npx playwright test tests/routes.spec.js --grep "Approval capture boundary appears only on scoped pages"`
- `cd dashboard && npm run build`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
- `find local-state/runtime -maxdepth 1 -name 'check-p118*.sqlite' -print`

Final safety checks: no project/CareLoop paths changed; no DB/runtime provider,
tool, worker, deploy, release, export, package, or env paths changed; no
approval capture, approval persistence, approval decision recording, runtime
execution, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, hosted DB mutation, raw SQL, network, deploy,
release, export, package, or spend authority is enabled; no DemoApp exposure,
raw private IDs, raw DB table names, raw JSON/log/policy dumps, internal
primary UX phase labels, or fake actions are introduced.

Git add/commit/push commands:
- `git add <allowed P118.5 files>`
- `git commit -m "feat(nexus): implement p1185 approval capture ux"`
- stamp P118/P118.5 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1185 approval capture ux"`
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

Known risks: a display card can look like a live approval control if labels are
loose. P118.5 uses read-only language, disabled pills, zero unsafe counts, no
buttons, and scoped route coverage.

Rollback plan: remove the P118.5 dashboard/checker/docs/status/report changes,
restore P118.5 to planned, set current phase back to P118.4, and keep P118.4
complete.

## Planned Subphase Controls

P118.2 Approval Capture Schema Metadata is complete. The metadata helper is
available for reuse by later P118 model, preview, and UX subphases, while DB
writes and approval decision recording remain unavailable.

P118.3 Governed Local Approval Intent Model is complete. The pure local model is
available for P118.4 preview work, while approve/reject decision recording
remains unavailable.

P118.4 Approval Capture Safe Dry Run is complete. The preview helper is
available for P118.5 scoped UX work, while approval capture, persistence,
approve/reject decision recording, writes, execution, provider dispatch, and
project mutation remain unavailable.

P118.5 Command Center Approval Capture Boundary UX is complete. Business Build
and Agent Flow show scoped approval capture readiness while Chat with NEXUS,
Lite, OS Roadmap, and Live Readiness remain clean.

P118.6 Approval Capture Validation / Docs: validate P118.1-P118.5 together,
regenerate reports, and preserve UX without adding new UI or controls. No
approval capture or runtime authority may be added.

P118.7 Final Validation: close P118, record a planned next phase, rerun
aggregate checks, ensure no stale phase status remains, and keep approval
capture/persistence/execution blocked unless a future phase explicitly grants
narrow authority.
