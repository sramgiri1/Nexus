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

## Planned Subphase Contracts

P126.4 Acceptance Safe Dry Run: local dry-run envelope only. No handoff
acceptance, writes, execution, providers, dispatch, mutation, network, or spend.

P126.5 Command Center Acceptance Boundary UX: scoped read-only Business Build
and Agent Flow UX only. No Chat/Lite/OS Roadmap leakage and no runnable
acceptance controls.

P126.6 Acceptance Validation / Docs: validation/docs closure only.

P126.7 Final Validation: final validation only, closes P126, stamps real
commits, creates the next planned handoff, and keeps live acceptance blocked.
