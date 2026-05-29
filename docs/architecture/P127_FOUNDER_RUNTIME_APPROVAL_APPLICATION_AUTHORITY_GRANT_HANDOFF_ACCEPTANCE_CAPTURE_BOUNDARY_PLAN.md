# P127 Founder Runtime Approval Application Authority Grant Handoff Acceptance Capture Boundary Plan

P127 governs approval application authority grant handoff acceptance capture.
It does not capture acceptance, accept handoff, hand off authority, grant
authority, activate authority, apply approvals, write DB/runtime state, unlock
execution, call providers/models, dispatch agents, mutate projects, deploy,
release, export, package, use network calls, or spend.

## P127.1 Acceptance Capture Boundary Contract / Policy

Phase: P127 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Capture Boundary
Subphase: P127.1 Acceptance Capture Boundary Contract / Policy

Goal: create the P127 implementation-grade contract, seven-subphase split,
safety rules, docs, status handoff, and checker while keeping acceptance
capture blocked.

Why this is needed: P126 closed with a planned-only P127 marker. P127.1 turns
that marker into a governed implementation contract before metadata, model,
dry-run, or UX work can proceed.

User/operator impact: OS Roadmap shows P127 in progress with P127.2 next and
clear blocked behavior for live acceptance capture.

Command Center impact: no dashboard source/test changes. Existing P126.5
scoped read-only acceptance boundary UX remains on Business Build and Agent
Flow only. Chat with NEXUS, Lite, OS Roadmap, Live Readiness, and unrelated
pages stay clean.

Safety impact: contract/policy-only. Acceptance capture, handoff acceptance,
authority handoff, authority grant, activation, approval application, approval
capture, approval persistence, approve/reject decision recording, DB/runtime
writes, runtime execution, execution unlock, provider/model calls, agent
dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL
interface, deploy, release, export, package, network call, and provider spend
remain blocked.

Cost impact: no provider calls, model calls, network calls, worker runtime,
deploy/package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json`
- `docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md`
- `scripts/check-p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
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

Expected exports: none.

Data shape: contract/status/report evidence only. No runtime exports, schemas,
acceptance capture records, DB write shapes, provider envelopes, dispatch
packets, or project data are created.

Command Center UX requirements: no new cards, routes, controls, dashboard
source, or dashboard test changes. Do not show raw reports, raw IDs, raw JSON,
raw logs, raw policy dumps, DemoApp, or fake runnable actions.

Validation commands:
- `npm run check:p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance appears only on scoped pages"`
- `git diff --check`

OS phase status update: P127 in progress, P127.1 complete, current phase
P127.1, previous phase P126.7, next phase P127.2. P127.2-P127.7 remain
planned-only.

Known risks: capture language can imply live approval recording. P127.1 keeps
the phase contract-only and repeats that capture, writes, execution, providers,
dispatch, mutation, network, and spend remain blocked.

Rollback plan: remove the P127 contract/plan/checker/report/package script,
revert P126.7 checker and OS checker updates, restore P127 to planned, and
return current phase to P126.7.

Status: complete.

## P127.2 Acceptance Capture Eligibility Metadata

Phase: P127 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Capture Boundary
Subphase: P127.2 Acceptance Capture Eligibility Metadata

Goal: add browser-safe local acceptance capture eligibility metadata without
creating capture records, writes, execution paths, provider calls, dispatch,
mutation, network calls, or spend.

Why this is needed: P127.1 created the capture boundary contract. P127.2 gives
later intent, dry-run, and UX subphases a typed local metadata source so they
can reuse flags, labels, blockers, owner, next action, and cost posture instead
of duplicating helpers.

User/operator impact: OS Roadmap shows capture eligibility metadata complete
with P127.3 next, while live acceptance capture remains unavailable.

Command Center impact: no dashboard source or route test changes. Existing
P126.5 scoped read-only acceptance boundary UX remains on Business Build and
Agent Flow only. Chat with NEXUS, Lite, OS Roadmap, Live Readiness, and
unrelated pages stay clean.

Safety impact: metadata-only. Acceptance capture, handoff acceptance, authority
handoff, authority grant, activation, approval application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL interface,
deploy, release, export, package, network call, and provider spend remain
blocked.

Cost impact: no provider calls, model calls, network calls, worker runtime,
deploy/package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata.js`
- `scripts/check-p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `scripts/check-p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json`
- `docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
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

Expected exports:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_METADATA_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_STATES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_FLAGS`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SECTIONS`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata`

Data shape: browser-safe metadata with `metadataVersion`, `phaseId`,
`sourceAcceptancePhase`, `sourceAcceptanceVersion`, `metadataOnly`,
`localOnly`, `commandCenterVisible`, `capturePolicy`, `captureStates`,
`priorAcceptanceBoundary`, `sections`, `blockers`, `nextAction`,
`ownerCapability`, and `costImpactLabel`. No DB schema, runtime schema,
capture record shape, provider envelope, dispatch packet, or project data are
created.

Command Center UX requirements: no new cards, routes, controls, dashboard
source, or dashboard test changes. Do not show raw reports, raw IDs, raw JSON,
raw logs, raw policy dumps, DemoApp, or fake runnable actions.

Validation commands:
- `npm run check:p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance appears only on scoped pages"`
- `git diff --check`

OS phase status update: P127 in progress, P127.2 complete, current phase
P127.2, previous phase P127.1, next phase P127.3. P127.3-P127.7 remain
planned-only.

Known risks: capture language can imply live recording. P127.2 keeps the work
metadata-only and repeats that capture, writes, execution, providers, dispatch,
mutation, network, and spend remain blocked.

Rollback plan: remove the P127.2 metadata helper, checker, package script, and
report; revert P127.1 checker and P127 contract/docs/status updates; return
current phase to P127.1 with P127.2 planned.

Status: complete.

## P127.3 Governed Acceptance Capture Intent Model

Phase: P127 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Capture Boundary
Subphase: P127.3 Governed Acceptance Capture Intent Model

Goal: add a pure local governed acceptance capture intent model that reuses
P127.2 metadata while keeping capture, writes, execution, providers, dispatch,
mutation, network calls, and spend blocked.

Why this is needed: P127.2 defines capture eligibility metadata. P127.3 turns
that metadata into a validated local model with readiness rows, blockers,
disabled reasons, owner, evidence/activity labels, and zero candidate/action
counts for P127.4 dry-run planning.

User/operator impact: OS Roadmap shows capture intent modeling complete with
P127.4 next, while live acceptance capture remains unavailable.

Command Center impact: no dashboard source or route test changes. Existing
P126.5 scoped read-only acceptance boundary UX remains on Business Build and
Agent Flow only. Chat with NEXUS, Lite, OS Roadmap, Live Readiness, and
unrelated pages stay clean.

Safety impact: model-only. Acceptance capture, handoff acceptance, authority
handoff, authority grant, activation, approval application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL interface,
deploy, release, export, package, network call, and provider spend remain
blocked.

Cost impact: no provider calls, model calls, network calls, worker runtime,
deploy/package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel.js`
- `scripts/check-p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `scripts/check-p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json`
- `docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
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

Expected exports:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_STATES`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel`

Data shape: local model with `schemaVersion`, `phaseId`,
`sourceMetadataPhase`, `sourceMetadataVersion`, `modelOnly`, `localOnly`,
`commandCenterVisible`, `intentState`, `currentState`, zero candidate counts,
`readinessRows`, `blockers`, `nextAction`, `disabledReason`,
`ownerCapability`, `evidenceLabels`, `activityLabels`, `costImpactLabel`,
all-false action booleans, `authorityFlags`, and `metadataSectionLabels`. No
DB schema, runtime schema, capture record shape, provider envelope, dispatch
packet, or project data are created.

Command Center UX requirements: no new cards, routes, controls, dashboard
source, or dashboard test changes. Do not show raw reports, raw IDs, raw JSON,
raw logs, raw policy dumps, DemoApp, or fake runnable actions.

Validation commands:
- `npm run check:p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance appears only on scoped pages"`
- `git diff --check`

OS phase status update: P127 in progress, P127.3 complete, current phase
P127.3, previous phase P127.2, next phase P127.4. P127.4-P127.7 remain
planned-only.

Known risks: `ready_for_safe_acceptance_capture_dry_run` can be mistaken for
live capture readiness. P127.3 keeps the model local-only, records zero
candidate counts, and keeps all action flags false.

Rollback plan: remove the P127.3 intent model, checker, package script, and
report; revert P127.2 checker and P127 contract/docs/status updates; return
current phase to P127.2 with P127.3 planned.

Status: complete.

## P127.4 Acceptance Capture Safe Dry Run

Phase: P127 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Capture Boundary
Subphase: P127.4 Acceptance Capture Safe Dry Run

Goal: create a local-only safe dry-run envelope for acceptance capture
readiness without capture records, writes, execution paths, provider calls,
dispatch, mutation, network calls, or spend.

Why this is needed: P127.3 proves capture intent can be modeled safely. P127.4
packages that model into a result-envelope preview for later scoped UX work
without enabling any runtime action.

User/operator impact: OS Roadmap shows capture safe dry-run preview complete
with P127.5 next, while live acceptance capture remains unavailable.

Command Center impact: no dashboard source or route test changes. Existing
P126.5 scoped read-only acceptance boundary UX remains on Business Build and
Agent Flow only. Chat with NEXUS, Lite, OS Roadmap, Live Readiness, and
unrelated pages stay clean.

Safety impact: preview-only. Acceptance capture, handoff acceptance, authority
handoff, authority grant, activation, approval application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL interface,
deploy, release, export, package, network call, and provider spend remain
blocked.

Cost impact: no provider calls, model calls, network calls, worker runtime,
deploy/package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun.js`
- `scripts/check-p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `scripts/check-p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json`
- `docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
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

Expected exports:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_SAFE_DRY_RUN_STATES`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun`

Data shape: result envelope with `dryRunOnly`, `localOnly`, hidden Command
Center state, blocked preview rows/sections, zero unsafe candidate counts,
owner/evidence/activity/cost labels, all action booleans false, and no DB
schema, runtime schema, capture record shape, provider envelope, dispatch
packet, or project data.

Command Center UX requirements: no new cards, routes, controls, dashboard
source, or dashboard test changes. Do not show raw reports, raw IDs, raw JSON,
raw logs, raw policy dumps, DemoApp, or fake runnable actions.

Validation commands:
- `npm run check:p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance appears only on scoped pages"`
- `git diff --check`

OS phase status update at completion: P127 in progress, P127.4 complete,
current phase P127.4, previous phase P127.3, next phase P127.5. P127.5-P127.7
remained planned-only at the P127.4 handoff.

Known risks: dry-run preview language can imply execution. P127.4 keeps the
preview local-only, hidden from primary UX, and all action booleans false.

Rollback plan: remove the P127.4 safe dry-run helper, checker, package script,
and report; revert P127.3 checker and P127 contract/docs/status updates; return
current phase to P127.3 with P127.4 planned.

Status: complete.

## P127.5 Command Center Acceptance Capture UX

Phase: P127 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Capture Boundary
Subphase: P127.5 Command Center Acceptance Capture UX

Goal: surface display-safe acceptance capture readiness only on scoped Command
Center founder work pages.

Why this is needed: P127.4 created a local safe-dry-run envelope, but the
founder/operator could not inspect the acceptance capture boundary from the
Business Build and Agent Flow pages.

User/operator impact: Business Build and Agent Flow now show current capture
state, next action, blockers, disabled reason, owner capability, evidence,
activity, and cost impact for acceptance capture without adding capture or
execution controls.

Command Center impact: Business Build and Agent Flow render the existing
read-only boundary card with acceptance capture data. Chat with NEXUS and Lite
remain chat-focused, OS Roadmap remains OS-phase only, and Live Readiness stays
readiness-only.

Safety impact: display-only. Acceptance capture, record acceptance, handoff
acceptance, authority handoff, authority grant, activation, DB/runtime writes,
execution unlock, provider/model calls, agent dispatch, worker/tool execution,
project mutation, hosted DB mutation, deploy, release, export, package,
network calls, and spend remain blocked.

Cost impact: local deterministic display only. No provider/model/network calls
or spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `scripts/check-p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json`
- `docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change: `projects/**`, `careloop/**`,
`generated-projects/**`, `db/**`, `live-ready/**`, `local-state/runtime/**`,
`providers/**`, `tools/**`, `worker-runtime/**`, `deploy/**`, `release/**`,
`exports/**`, `packages/**`, `.env*`.

Tests to add/update/remove: add scoped Playwright coverage for the acceptance
capture card in dark, light, and system themes; verify Business Build and
Agent Flow show it; verify Lite, Chat root, OS Roadmap, and Live Readiness do
not show it; add a P127.5 checker. No obsolete tests were removed.

Docs to update: P127 plan, README, platform roadmap, OS phase status, generated
reports, and P127 contract.

Reports to regenerate: P127.4 report, P127.5 report, OS phase status report,
and phase validation coverage report.

OS phase status update: P127 in progress, P127.5 complete, current phase
P127.5, previous phase P127.4, next phase P127.6. P127.6-P127.7 remain
planned-only.

Known risks: Command Center source is large, so P127.5 only adds scoped card
placements and reuses the existing reusable card.

Rollback plan: revert the P127.5 implementation and stamp commits, then return
P127.5 to planned with P127.4 as the current completed handoff.

Status: complete.

## P127.6 Acceptance Capture Validation / Docs

Phase: P127 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Capture Boundary
Subphase: P127.6 Acceptance Capture Validation / Docs

Goal: validate P127.1-P127.5 evidence, docs, reports, and scoped UX before
final validation.

Why this is needed: P127 now has contract, metadata, intent model, safe
dry-run, and scoped Command Center UX. The phase needs aggregate evidence that
those layers remain aligned before final closure.

User/operator impact: no new UI surface. Operators keep using the P127.5
Business Build and Agent Flow acceptance capture cards.

Command Center impact: no dashboard source or test changes. P127.6 preserves
the P127.5 scoped UX and confirms Chat/Lite, OS Roadmap, and Live Readiness
remain clean.

Safety impact: validation/docs only. Acceptance capture, record acceptance,
handoff acceptance, authority handoff, authority grant, activation, DB/runtime
writes, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, hosted DB mutation, deploy, release, export,
package, network calls, and spend remain blocked.

Cost impact: local validation only. No provider/model/network calls or spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `scripts/check-p1276-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json`
- `docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/p1276-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change: `projects/**`, `careloop/**`,
`generated-projects/**`, `dashboard/src/**`, `dashboard/tests/**`, `db/**`,
`live-ready/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
`.env*`.

Tests to add/update/remove: add the P127.6 aggregate checker. Do not edit
dashboard route tests; rerun the existing P127.5 scoped Playwright coverage.

Docs to update: P127 plan, README, platform roadmap, OS phase status, generated
reports, and P127 contract.

Reports to regenerate: P127.4 report, P127.5 report, P127.6 report, OS phase
status report, and phase validation coverage report.

OS phase status update: P127 in progress, P127.6 complete, current phase
P127.6, previous phase P127.5, next phase P127.7. P127.7 remains planned.

Known risks: aggregate validation can drift into broad roadmap language. P127.6
keeps validation limited to existing P127 artifacts and scoped UX preservation.

Rollback plan: revert the P127.6 implementation and stamp commits, then return
P127.6 to planned with P127.5 as the current completed handoff.

Status: complete.

## Planned Subphase Contracts

P127.7 Final Validation: planned final validation only.
