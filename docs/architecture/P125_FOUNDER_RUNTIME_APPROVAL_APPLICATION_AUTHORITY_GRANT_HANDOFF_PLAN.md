# P125 Founder Runtime Approval Application Authority Grant Handoff Plan

## Parent Phase

Phase: P125 Founder Runtime Approval Application Authority Grant Handoff
Scope classification: NEXUS_OS_CHANGE
Starting branch: `codex/nexus-e2e-phase-validation`
Expected base commit for P125.1: `b82a9181`

Goal: define the governed approval application authority grant handoff path after
P124, without enabling live authority handoff, authority grant, execution,
provider/model calls, project mutation, DB writes, deploy, package, network, or
spend.

User/operator impact: operators get explicit handoff policy, planned subphases,
blocked states, validation commands, and next actions before any live grant
handoff can be considered.

Command Center impact: P125.1 does not change Command Center source, routes,
tests, controls, cards, or actions. Existing scoped P124 Business Build and Agent
Flow grant UX must remain display-only and safe.

Safety impact: authority grant handoff, authority grant, activation, approval
application, approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, deploy, release, export, package, network calls,
and provider spend remain blocked.

Cost impact: no provider calls and no spend.

Subphase split:
- P125.1 Handoff Contract / Policy
- P125.2 Handoff Eligibility Metadata
- P125.3 Governed Handoff Intent Model
- P125.4 Handoff Safe Dry Run
- P125.5 Command Center Handoff UX
- P125.6 Handoff Validation / Docs
- P125.7 Final Validation

## P125.1 Handoff Contract / Policy

Phase: P125 Founder Runtime Approval Application Authority Grant Handoff
Subphase: P125.1 Handoff Contract / Policy

Goal: create the P125 implementation-grade phase contract, seven-subphase split,
safety rules, reuse requirements, validation commands, docs, checker, report,
and OS status handoff without handing off live authority.

Why this is needed: P124 created only a planned P125 placeholder. P125 needs an
explicit contract before any handoff metadata, model, dry-run, UX, validation,
or final closure work is allowed.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json`
- `docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md`
- `scripts/check-p1247-founder-runtime-approval-application-authority-grant-boundary.js`
- `scripts/check-p1251-founder-runtime-approval-application-authority-grant-handoff.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1247-founder-runtime-approval-application-authority-grant-boundary-report.md`
- `reports/p1251-founder-runtime-approval-application-authority-grant-handoff-report.md`
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

Expected exports, schemas, and data shapes: no runtime exports. P125.1 creates a
contract JSON, checker, status records, docs, and reports only.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `os-roadmap/updatePhaseStatus.js` conventions,
existing OS status shape, existing route matrix, and P124 grant boundary
evidence. Do not duplicate report writers, check result formatters, redaction
helpers, result envelopes, mode guards, route matrices, UI cards, or audit
appenders.

Command Center UX requirements: no new cards, tabs, controls, routes, actions,
raw reports, raw logs, raw JSON, raw IDs, raw policy dumps, mutation controls,
or fake runnable actions. Preserve scoped P124 grant UX only on Business Build
and Agent Flow.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior. Because P125.1 does not change UX, run the focused existing scoped
grant route test as regression coverage.

Tests to add/update/remove: add the P125.1 checker, update the P124.7 handoff
checker, update OS phase status recognition for P125.1-P125.7, and run dashboard
build, unit, and focused Playwright route checks.

Docs to update: P125 plan, README, platform roadmap, P125 contract, OS roadmap,
phase status, and generated reports.

Reports to regenerate: P124.7 report, P125.1 report, OS phase status report, and
phase validation coverage report.

OS phase status update: P125 in progress, P125.1 complete, P125.2-P125.7
planned, current phase P125.1, previous phase P124.7, next phase P125.2.

Validation commands:
- `npm run check:p1251-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:p1247-founder-runtime-approval-application-authority-grant-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant appears only on scoped pages"`
- `git diff --check`

Known risks: the handoff name can sound like live behavior. P125.1 keeps all
claims contract-only and makes later live behavior impossible without a separate
implementation-grade phase.

Rollback plan: revert the P125.1 implementation and stamp commits, remove the
P125 contract/checker/report/docs/package entry, restore P125 to planned-only,
and return current phase to P124.7.

Status: complete.

## P125.2 Handoff Eligibility Metadata

Phase: P125 Founder Runtime Approval Application Authority Grant Handoff
Subphase: P125.2 Handoff Eligibility Metadata

Goal: add browser-safe, local-only approval application authority grant handoff
eligibility metadata that reuses P124.2 grant metadata and keeps every
handoff/write/execution/provider/mutation/spend flag blocked.

Why this is needed: P125.1 created the contract. P125.2 gives later local
handoff intent modeling a safe metadata source without creating handoff records,
runtime events, DB writes, or primary UX controls.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata.js`
- `scripts/check-p1252-founder-runtime-approval-application-authority-grant-handoff.js`
- `contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json`
- `docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1252-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change: `projects/**`, `careloop/**`,
`generated-projects/**`, `dashboard/src/**`, `dashboard/tests/**`, `db/**`,
`live-ready/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Expected exports:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_METADATA_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ELIGIBILITY_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_STATES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_FLAGS`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SECTIONS`
- `buildFounderApprovalApplicationAuthorityGrantHandoffEligibilityMetadata`

Data shape: local metadata with `metadataVersion`, `phaseId`,
`sourceGrantPhase`, `sourceGrantVersion`, `metadataOnly`, `localOnly`,
`commandCenterVisible`, `handoffPolicy`, `handoffStates`,
`priorGrantBoundary`, `sections`, `blockers`, `nextAction`,
`ownerCapability`, and `costImpactLabel`.

Command Center UX requirements: no source/test changes and no primary UX
surface. Metadata remains hidden until a later scoped UX subphase.

Validation commands:
- `npm run check:p1252-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:p1251-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant appears only on scoped pages"`
- `git diff --check`

OS phase status update: P125 in progress, P125.2 complete, current phase
P125.2, previous phase P125.1, next phase P125.3.

Known risks: metadata names can imply live handoff. P125.2 keeps all flags
false and all docs/checkers explicit that handoff remains blocked.

Rollback plan: remove the P125.2 helper/checker/report/package script, revert
contract/docs/status/report updates, restore P125.2 to planned, and return
current phase to P125.1.

Status: complete.

## P125.3 Governed Handoff Intent Model

Phase: P125 Founder Runtime Approval Application Authority Grant Handoff
Subphase: P125.3 Governed Handoff Intent Model

Goal: add a governed local handoff intent model that reuses P125.2 metadata,
exposes founder/operator-ready status rows, and keeps every handoff, write,
execution, provider, mutation, network, and spend action blocked.

Why this is needed: P125.2 created safe metadata. P125.3 provides the local
intent model input for a later dry-run preview without creating any live handoff
path.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffIntentModel.js`
- `scripts/check-p1253-founder-runtime-approval-application-authority-grant-handoff.js`
- `contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json`
- `docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1253-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change: `projects/**`, `careloop/**`,
`generated-projects/**`, `dashboard/src/**`, `dashboard/tests/**`, `db/**`,
`live-ready/**`, `local-state/runtime/**`, `providers/**`, `tools/**`,
`worker-runtime/**`, `deploy/**`, `release/**`, `exports/**`, `packages/**`,
and `.env*`.

Expected exports:
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_INTENT_STATES`
- `buildFounderApprovalApplicationAuthorityGrantHandoffIntentModel`
- `validateFounderApprovalApplicationAuthorityGrantHandoffIntentModel`

Data shape: local model with source metadata identifiers, `modelOnly`,
`localOnly`, `commandCenterVisible`, allowlisted `intentState`, `currentState`,
zero candidate counts, readiness rows, blockers, next action, disabled reason,
owner capability, evidence/activity labels, no-spend label, all-false action
booleans, authority flags, and metadata section labels.

Command Center UX requirements: no source/test changes and no primary UX
surface. The model remains hidden until a later scoped UX subphase.

Validation commands:
- `npm run check:p1253-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:p1252-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant appears only on scoped pages"`
- `git diff --check`

OS phase status update: P125 in progress, P125.3 complete, current phase
P125.3, previous phase P125.2, next phase P125.4.

Known risks: model states can imply live handoff. P125.3 keeps all candidate
counts zero, all action booleans false, and all authority flags blocked.

Rollback plan: remove the P125.3 model/checker/report/package script, revert
contract/docs/status/report updates, restore P125.3 to planned, and return
current phase to P125.2.

Status: complete.

## P125.4 Handoff Safe Dry Run

Phase: P125 Founder Runtime Approval Application Authority Grant Handoff
Subphase: P125.4 Handoff Safe Dry Run

Goal: add a local-only result-envelope dry-run preview for approval application
authority grant handoff without enabling live handoff, writes, execution,
provider/model calls, dispatch, mutation, network, deploy, package, or spend.

Why this is needed: P125 needs a validated handoff preview artifact before any
Command Center handoff display is allowed.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffSafeDryRun.js`
- `scripts/check-p1253-founder-runtime-approval-application-authority-grant-handoff.js`
- `scripts/check-p1254-founder-runtime-approval-application-authority-grant-handoff.js`
- `contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json`
- `docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1254-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/p1253-founder-runtime-approval-application-authority-grant-handoff-report.md`
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
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES`
- `buildFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun`
- `validateFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun`

Data shape: result envelope with schema version, local-only preview mode,
`dryRunOnly`, `commandCenterVisible: false`, P125.3/P125.2/P124.2 source
phases, founder summary, handoff summary, preview sections/rows, blockers, next
action, disabled reason, owner capability, evidence/activity/cost labels, and
all-false handoff, grant, write, execution, provider, dispatch, mutation,
network, and spend flags.

Command Center UX requirements: no source/test changes and no primary UX
surface. The dry-run stays hidden until a later scoped UX subphase.

Validation commands:
- `npm run check:p1254-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:p1253-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant appears only on scoped pages"`
- `git diff --check`

OS phase status update: P125 in progress, P125.4 complete, current phase
P125.4, previous phase P125.3, next phase P125.5.

Known risks: dry-run wording can imply live authority handoff. P125.4 keeps all
candidate counts zero, all action booleans false, all authority flags blocked,
and the preview hidden from primary UX.

Rollback plan: remove the P125.4 helper/checker/report/package script, revert
contract/docs/status/report updates, restore P125.4 to planned, and return
current phase to P125.3.

Status: complete.

## P125.5 Command Center Handoff UX

Phase: P125 Founder Runtime Approval Application Authority Grant Handoff
Subphase: P125.5 Command Center Handoff UX

Goal: render the P125.4 handoff dry-run as scoped, display-only Command Center
UX on Business Build and Agent Flow only.

Why this is needed: P125.4 created a safe handoff preview artifact. Founder
work pages need to show the handoff current state, next action, blockers,
owner, evidence/activity, and cost posture without enabling live authority.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `shared/founderApprovalApplicationAuthorityGrantHandoffSafeDryRun.js`
- `contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json`
- `docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md`
- `scripts/check-p1254-founder-runtime-approval-application-authority-grant-handoff.js`
- `scripts/check-p1255-founder-runtime-approval-application-authority-grant-handoff.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1254-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/p1255-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/** except dashboard/src/data/businessBuild.js and dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/** except dashboard/tests/routes.spec.js`
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
- `buildFounderApprovalApplicationAuthorityGrantHandoffDisplayModel`

Data shape: browser-safe display model with current state, founder idea,
preview mode, readiness counts, handoff/grant/activation/application/write/
execution/dispatch/mutation/network/spend candidate counts, summary rows,
readiness sections, readiness rows, safety rows, blockers, next action,
disabled reason, owner capability, evidence/activity labels, and cost impact.

Command Center UX requirements: render approval application authority grant
handoff status only on Business Build and Agent Flow using the existing
boundary card. Do not expose it on Chat with NEXUS, Lite, OS Roadmap, Live
Readiness, or unrelated pages. Do not add mutation controls or fake runnable
actions.

Validation commands:
- `npm run check:p1255-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:p1254-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff appears only on scoped pages"`
- `git diff --check`

OS phase status update: P125 in progress, P125.5 complete, current phase
P125.5, previous phase P125.4, next phase P125.6.

Known risks: adding another Command Center card can clutter founder pages.
P125.5 keeps the UX scoped to two work pages and reuses the existing compact
boundary card.

Rollback plan: remove the P125.5 checker/report/package script, revert the
Business Build data model, Command Center card wiring, route test, docs/status
updates, restore P125.5 to planned, and return current phase to P125.4.

Status: complete.

## P125.6 Handoff Validation / Docs

Phase: P125 Founder Runtime Approval Application Authority Grant Handoff
Subphase: P125.6 Handoff Validation / Docs

Goal: validate P125.1-P125.5 evidence, docs, reports, status, and scoped
Command Center handoff UX without changing runtime behavior.

Why this is needed: P125 has policy, metadata, intent model, safe dry-run, and
scoped UX. A validation/docs closure is required before final validation.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `scripts/check-p1256-founder-runtime-approval-application-authority-grant-handoff.js`
- `scripts/check-p1255-founder-runtime-approval-application-authority-grant-handoff.js`
- `contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json`
- `docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1255-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/p1256-founder-runtime-approval-application-authority-grant-handoff-report.md`
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

Data shape: validation/docs/report evidence only for P125.1-P125.5 checkers,
reports, scoped UX, docs, status, and safety posture.

Command Center UX requirements: preserve P125.5 scoped UX. No new controls,
routes, mutation actions, raw dumps, or theme changes.

Validation commands:
- `npm run check:p1256-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:p1255-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff appears only on scoped pages"`
- `git diff --check`

OS phase status update: P125 in progress, P125.6 complete, current phase
P125.6, previous phase P125.5, next phase P125.7.

Known risks: validation can go stale if it only checks docs. P125.6 checks
P125.1-P125.5 scripts/reports, scoped UX evidence, route coverage, docs,
status, and safe wording.

Rollback plan: remove the P125.6 checker/report/package script, revert
contract/docs/status/report updates, restore P125.6 to planned, and return
current phase to P125.5.

Status: complete.

## Planned Subphase Contracts

P125.7 Final Validation: final validation only, closes P125, stamps real
commits, creates the next planned handoff, and keeps live handoff blocked.
