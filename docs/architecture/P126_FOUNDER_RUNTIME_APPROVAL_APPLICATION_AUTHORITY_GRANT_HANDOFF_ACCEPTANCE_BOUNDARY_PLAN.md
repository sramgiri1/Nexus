# P126 Founder Runtime Approval Application Authority Grant Handoff Acceptance Boundary Plan

P126 defines a governed local acceptance boundary for approval application
authority grant handoff. It does not accept handoff, capture acceptance, hand
off authority, grant authority, activate authority, apply approvals, write
DB/runtime state, unlock execution, call providers/models, dispatch agents,
mutate projects, deploy, release, export, package, use network calls, or spend.

## P126.1 Acceptance Boundary Contract / Policy

Phase: P126 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Boundary
Subphase: P126.1 Acceptance Boundary Contract / Policy

Goal: create the P126 implementation-grade acceptance boundary contract,
seven-subphase split, safety rules, reuse requirements, validation commands,
docs, and status handoff without accepting live authority handoff.

Why this is needed: P126 existed as a planned marker after P125.7. P126.1
turns it into a governed implementation contract before any metadata, model,
dry-run, or UX work can proceed.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json`
- `docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md`
- `scripts/check-p1257-founder-runtime-approval-application-authority-grant-handoff.js`
- `scripts/check-p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1257-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
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
acceptance records, project data, provider envelopes, dispatch packets, or DB
write shapes are created.

Command Center UX requirements: no new cards, routes, controls, or dashboard
source/test changes. Preserve the existing scoped P125 handoff UX on Business
Build and Agent Flow only, with no DemoApp, raw dumps, raw private IDs, or fake
runnable actions.

Validation commands:
- `npm run check:p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:p1257-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff appears only on scoped pages"`
- `git diff --check`

OS phase status update: P126 in progress, P126.1 complete, current phase
P126.1, previous phase P125.7, next phase P126.2. P126.2-P126.7 remain
planned-only.

Known risks: acceptance language can imply live approval capture. P126.1 keeps
the phase contract-only and repeats that acceptance, writes, execution,
providers, dispatch, mutation, network, and spend remain blocked.

Rollback plan: remove the P126 contract/checker/plan/package script/report,
revert P125.7 checker/report and status/docs changes, restore P126 to planned,
and return current phase to P125.7.

Status: complete.

## P126.2 Acceptance Eligibility Metadata

Phase: P126 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Boundary
Subphase: P126.2 Acceptance Eligibility Metadata

Goal: add browser-safe local acceptance eligibility metadata that reuses P125.2
handoff metadata and keeps acceptance blocked.

Why this is needed: P126.1 created the contract. P126.2 provides the local
metadata source that later acceptance intent, dry-run, and scoped UX work can
consume without creating live acceptance state.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata.js`
- `scripts/check-p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json`
- `docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
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
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_METADATA_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_STATES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SECTIONS`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata`

Data shape: browser-safe metadata object with metadata version, phase id,
source P125.2 handoff metadata, metadataOnly/localOnly/hidden flags, acceptance
policy, allowlisted states, prior handoff boundary summary, section rows,
blockers, next action, owner capability, and no-spend label.

Command Center UX requirements: no new UI. Do not show acceptance metadata on
Chat, Lite, OS Roadmap, Live Readiness, or unrelated pages.

Validation commands:
- `npm run check:p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff appears only on scoped pages"`
- `git diff --check`

OS phase status update: P126 in progress, P126.2 complete, current phase
P126.2, previous phase P126.1, next phase P126.3.

Known risks: metadata can look like authorization. P126.2 keeps all acceptance,
write, execution, provider, dispatch, mutation, network, and spend flags false.

Rollback plan: remove the P126.2 metadata helper/checker/report/package script,
revert docs/status updates, restore P126.2 to planned, and return current phase
to P126.1.

Status: complete.

## P126.3 Governed Acceptance Intent Model

Phase: P126 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Boundary
Subphase: P126.3 Governed Acceptance Intent Model

Goal: add a governed local acceptance intent model that consumes P126.2 metadata
and keeps every acceptance, write, execution, provider, dispatch, mutation,
network, and spend path blocked.

Why this is needed: P126.2 provides metadata. P126.3 creates the local model
that P126.4 can preview through a safe dry-run.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryIntentModel.js`
- `scripts/check-p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-p1263-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json`
- `docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/p1263-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
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
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_INTENT_STATES`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryIntentModel`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryIntentModel`

Data shape: local model with schema version, phase id, source P126.2 metadata,
modelOnly/localOnly/hidden flags, allowlisted intent state, zero candidate
counts, readiness rows, blockers, next action, disabled reason, owner,
evidence/activity labels, cost label, all-false action booleans, authority
flags, and metadata section labels.

Command Center UX requirements: no new UI. Do not expose model data in Chat,
Lite, OS Roadmap, Live Readiness, or unrelated pages.

Validation commands:
- `npm run check:p1263-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:p1262-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff appears only on scoped pages"`
- `git diff --check`

OS phase status update: P126 in progress, P126.3 complete, current phase
P126.3, previous phase P126.2, next phase P126.4.

Known risks: readiness labels could imply runnable acceptance. P126.3 keeps
candidate counts at zero and all acceptance, write, execution, provider,
dispatch, mutation, network, and spend booleans false.

Rollback plan: remove the P126.3 intent model/checker/report/package script,
revert docs/status updates, restore P126.3 to planned, and return current phase
to P126.2.

Status: complete.

## P126.4 Acceptance Safe Dry Run

Goal: create a local-only result-envelope dry-run preview for approval
application authority grant handoff acceptance readiness without accepting
handoff or writing state.

Why this is needed: P126.3 modeled acceptance intent. P126.4 turns that intent
into display-safe preview rows and sections that P126.5 can surface in scoped
Command Center UX while keeping all live acceptance paths unavailable.

User/operator impact: operators can see what acceptance would require, the
current blocked state, next action, owner capability, evidence/activity
locations, and cost posture before any live authority exists.

Command Center impact: no dashboard source changes. The dry run remains hidden
from primary UX until P126.5 adds scoped read-only display.

Safety impact: local-only dry run. Handoff acceptance, acceptance capture,
authority handoff, authority grant, activation, approval application,
approval capture, approval persistence, approve/reject decision recording,
DB/runtime writes, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL interface, deploy, release, export, package, network call, and provider
spend remain blocked.

Cost impact: no provider calls, model calls, network calls, worker runtime,
deploy/package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun.js`
- `scripts/check-p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-p1263-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json`
- `docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1263-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
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
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_STATES`
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun`
- `validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun`

Data shape: result envelope with schema version, P126.4 phase, localOnly,
dryRunOnly, hidden Command Center state, P126.3/P126.2/P125.2 lineage,
acceptance summary, blocked preview sections, blocked preview rows, owner,
next action, disabled reason, evidence/activity references, no-spend cost
posture, all-false action booleans, and zero unsafe candidate counts.

Command Center UX requirements: no new UI. Do not expose safe-dry-run data in
Chat, Lite, OS Roadmap, Live Readiness, or unrelated pages.

Validation commands:
- `npm run check:p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:p1263-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff appears only on scoped pages"`
- `git diff --check`

OS phase status update: P126 in progress, P126.4 complete, current phase
P126.4, previous phase P126.3, next phase P126.5.

Known risks: dry-run rows could imply acceptance is runnable. P126.4 keeps
candidate counts at zero and all acceptance, write, execution, provider,
dispatch, mutation, network, and spend booleans false.

Rollback plan: remove the P126.4 safe-dry-run helper/checker/report/package
script, revert P126.3 checker updates, restore P126.4 to planned, and return
current phase to P126.3.

Status: complete.

## P126.5 Command Center Acceptance Boundary UX

Goal: surface local approval application authority grant handoff acceptance
readiness in scoped Command Center work pages without runnable acceptance
controls.

Why this is needed: P126.4 created a hidden local dry-run envelope. P126.5
makes that state useful to founder/operators on Business Build and Agent Flow
while preserving Chat with NEXUS, Lite, OS Roadmap, Live Readiness, and
unrelated pages.

User/operator impact: operators can inspect handoff acceptance readiness,
blocked rows, zero unsafe candidate counts, blockers, owner capability, next
action, disabled reason, evidence/activity labels, and no-spend posture on the
pages where governed founder work is coordinated.

Command Center impact: Business Build and Agent Flow render read-only
acceptance boundary cards through the existing boundary card component. No new
full Command Center card component is created.

Safety impact: display-only UX. Handoff acceptance, acceptance capture,
authority handoff, authority grant, activation, approval application,
approval capture, approval persistence, approve/reject decision recording,
DB/runtime writes, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL interface, deploy, release, export, package, network call, and provider
spend remain blocked.

Cost impact: no provider calls, model calls, network calls, worker runtime,
deploy/package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `scripts/check-p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-p1265-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json`
- `docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/p1265-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- dashboard files other than `dashboard/src/data/businessBuild.js`,
  `dashboard/src/pages/CommandCenterV2.jsx`, and
  `dashboard/tests/routes.spec.js`
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
- `buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryDisplayModel`

Data shape: browser-safe display model with current state, founder idea,
preview mode, readiness row counts, zero unsafe candidate counts,
readiness rows/sections, safety rows, blockers, owner capability, next action,
disabled reason, evidence/activity labels, and no-spend cost posture.

Command Center UX requirements: render scoped read-only cards on Business Build
and Agent Flow only. Do not expose in Chat with NEXUS, Lite, OS Roadmap, Live
Readiness, or unrelated pages. Do not show raw IDs, raw reports, raw JSON, raw
logs, raw policy dumps, DemoApp, or fake runnable action text.

Validation commands:
- `npm run check:p1265-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance appears only on scoped pages"`
- `git diff --check`

OS phase status update: P126 in progress, P126.5 complete, current phase
P126.5, previous phase P126.4, next phase P126.6.

Known risks: adding a scoped card could clutter unrelated pages or imply live
acceptance. P126.5 limits rendering to Business Build and Agent Flow, labels it
read-only, keeps all candidates at zero, and rejects fake runnable actions in
tests/checkers.

Rollback plan: remove the P126.5 display model/checker/report/package script,
remove the two scoped card render calls and Playwright test, revert P126.4
checker updates, restore P126.5 to planned, and return current phase to P126.4.

Status: complete.

## P126.6 Acceptance Validation / Docs

Phase: P126 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Boundary
Subphase: P126.6 Acceptance Validation / Docs

Goal: add validation/docs closure for P126.1-P126.5 acceptance boundary
evidence without changing dashboard source/tests or enabling live authority.

Why this is needed: P126.1-P126.5 completed the contract, metadata, local
acceptance intent model, safe dry run, and scoped Command Center acceptance UX.
P126.6 verifies those artifacts, reports, docs, status records, and safety
wording before final validation closes the parent phase.

User/operator impact: operators get one aggregate validation report showing
that scoped acceptance boundary evidence exists, stays useful, and remains
blocked before any live handoff acceptance work is considered.

Command Center impact: no dashboard source changes. P126.5 scoped read-only
Business Build and Agent Flow acceptance cards are preserved. Chat with NEXUS,
Lite, OS Roadmap, Live Readiness, and unrelated pages stay clean.

Safety impact: validation/docs-only. Handoff acceptance, acceptance capture,
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
- `scripts/check-p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-p1265-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json`
- `docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1265-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
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

Data shape: validation/docs/report evidence only. No runtime exports, schemas,
acceptance records, DB write shapes, provider envelopes, dispatch packets, or
project data are created.

Command Center UX requirements: preserve P126.5 scoped read-only acceptance
cards on Business Build and Agent Flow only. Do not add chat clutter, raw
reports, raw IDs, raw JSON, raw logs, raw policy dumps, DemoApp exposure, or
fake runnable action text.

Validation commands:
- `npm run check:p1266-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:p1265-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance appears only on scoped pages"`
- `git diff --check`

OS phase status update: P126 in progress, P126.6 complete, current phase
P126.6, previous phase P126.5, next phase P126.7.

Known risks: validation can go stale if it only checks docs. P126.6 also
checks prior checker/report existence, scoped UX source/test evidence,
forbidden scope, unsafe wording, and validation-only imports.

Rollback plan: remove the P126.6 checker/report/package script, revert P126.5
checker handoff updates, restore docs/status/report updates, restore P126.6 to
planned, and return current phase to P126.5.

Status: complete.

## Planned Subphase Contracts

P126.4 Acceptance Safe Dry Run: complete. Local dry-run envelope only. No
handoff acceptance, writes, execution, providers, dispatch, mutation, network,
or spend.

P126.5 Command Center Acceptance Boundary UX: complete. Scoped read-only
Business Build and Agent Flow UX only. No Chat/Lite/OS Roadmap leakage and no
runnable acceptance controls.

P126.6 Acceptance Validation / Docs: complete. Aggregate validation/docs
closure only. No handoff acceptance, writes, execution, providers, dispatch,
mutation, network, or spend.

P126.7 Final Validation: final validation only, closes P126, stamps real
commits, creates the next planned handoff, and keeps live acceptance blocked.
