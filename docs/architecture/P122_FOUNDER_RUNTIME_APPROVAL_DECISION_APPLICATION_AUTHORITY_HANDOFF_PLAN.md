# P122 Founder Runtime Approval Decision Application Authority Handoff Plan

Status: in progress

Scope classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit for P122.1: `afb30703`

Planned subphases:
- P122.1 Authority Handoff Contract / Policy
- P122.2 Application Authority Eligibility Metadata
- P122.3 Governed Local Authority Intent Model
- P122.4 Authority Handoff Safe Dry Run
- P122.5 Command Center Authority Handoff UX
- P122.6 Authority Handoff Validation / Docs
- P122.7 Final Validation

P122 starts from completed P121 approval decision application boundary. P122.1
does not enable approval decision application, approval capture, approval
persistence, approve/reject decision recording, DB/runtime writes, runtime
execution, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, hosted DB mutation, raw SQL, deploy, release,
export, package, network calls, or provider spend.

## P122.1 Authority Handoff Contract / Policy

Phase: P122
Subphase: P122.1
Goal: define the P122 approval decision application authority handoff contract,
implementation-grade subphase split, safety policy, reuse rules, validation
commands, and OS handoff records without implementation behavior.
Why this is needed: P121 closed the approval decision application boundary but
did not grant live authority. P122 must define the narrow authority handoff
rules before any later subphase can propose live behavior.
User/operator impact: operators get a clear contract showing what is complete,
what is planned, what remains blocked, and which checks prove the phase is
safe to continue.
Command Center impact: no Command Center source change in P122.1. Preserve the
current Business Build and Agent Flow approval decision application boundary
UX.
Safety impact: contract-only. Approval decision application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, and provider spend remain blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json`
- `docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md`
- `scripts/check-p1221-founder-runtime-approval-decision-application-authority-handoff-contract.js`
- `scripts/check-p1217-founder-runtime-approval-decision-application-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1217-founder-runtime-approval-decision-application-boundary-report.md`
- `reports/p1221-founder-runtime-approval-decision-application-authority-handoff-contract-report.md`
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

Expected exports, schemas, and data shapes: no runtime export or schema is
introduced. The P122 contract records parent phase metadata, P122.1-P122.7
subphase records, safety rules, reuse requirements, validation commands, and
planned-only handoff fields.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `shared/resultEnvelope.js`, `shared/modeGuard.js`,
`shared/redaction.js`, `os-roadmap/updatePhaseStatus.js`, existing dashboard
cards/routes, route safety tests, OS phase status records, and P121 evidence.
Do not duplicate report writers, mode guards, redaction helpers, result
envelopes, phase status updaters, route matrices, UI cards, or
evidence/audit/activity appenders.

Tests to add/update/remove: add the dedicated P122.1 contract checker and
package script. Extend the OS phase status checker allowlist for P122
subphases. Do not edit dashboard tests in this subphase.

Docs to update: this P122 plan, README, platform roadmap, P122 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1217-founder-runtime-approval-decision-application-boundary-report.md`
- `reports/p1221-founder-runtime-approval-decision-application-authority-handoff-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P122 is in progress; P122.1 is complete; current phase
P122.1; previous P121.7; next P122.2.

Validation commands:
- `npm run check:p1221-founder-runtime-approval-decision-application-authority-handoff-contract`
- `npm run check:p1217-founder-runtime-approval-decision-application-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P122.1 files>`
- `git commit -m "feat(nexus): implement p1221 approval application authority handoff contract"`
- stamp P122/P122.1 status with the implementation commit
- `git add <allowed P122.1 status/report files>`
- `git commit -m "chore(nexus): stamp p1221 approval application authority handoff contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approve/reject decision recording, DB/runtime writes, runtime
  execution, execution unlock, provider/model calls, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL, network,
  deploy, release, export, package, or spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB/schema names, raw report
  paths in primary UX, JSON/log/policy dumps, internal primary UX phase labels,
  or fake actions are introduced

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: P122 can sound like live enablement. P122.1 is explicitly
contract-only and blocks live authority.

Rollback plan: remove the P122.1 checker, report, contract, plan, package
script, docs/status updates, restore P122 to planned-only, and return current
phase to P121.7.

Status: complete.

## P122.2 Application Authority Eligibility Metadata

Phase: P122
Subphase: P122.2
Goal: add browser-safe authority handoff eligibility metadata that reuses the
P121 approval decision application eligibility metadata and defines the local
handoff sections P122.3 can model without enabling live authority.
Why this is needed: P122.1 defined the authority handoff contract. P122.2 adds
the deterministic metadata needed for later local intent and safe dry-run work
without adding runtime behavior.
User/operator impact: operators get display-safe handoff metadata for prior
boundary, authority scope, runtime guard, operator evidence, blockers, next
action, owner capability, activity/evidence labels, and cost impact.
Command Center impact: no Command Center source change in P122.2. Preserve the
current Business Build and Agent Flow approval decision application boundary
UX. Chat with NEXUS and Lite remain focused on chat.
Safety impact: metadata-only. Approval decision application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, and provider spend remain blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js`
- `contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json`
- `docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md`
- `scripts/check-p1222-founder-runtime-approval-decision-application-authority-handoff.js`
- `scripts/check-p1221-founder-runtime-approval-decision-application-authority-handoff-contract.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1221-founder-runtime-approval-decision-application-authority-handoff-contract-report.md`
- `reports/p1222-founder-runtime-approval-decision-application-authority-handoff-report.md`
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
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_METADATA_PHASE`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_ELIGIBILITY_VERSION`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_STATES`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_FLAGS`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_SECTIONS`
- `buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata`

The metadata shape is local and browser-safe:
`metadataVersion`, `phaseId`, `sourceBoundaryPhase`, `sourceBoundaryVersion`,
`metadataOnly`, `localOnly`, `commandCenterVisible`, `handoffPolicy`,
`handoffStates`, `priorBoundary`, `sections`, `blockers`, `nextAction`,
`ownerCapability`, and `costImpactLabel`. All authority flags stay false.

Reuse check: reuse P121.2
`shared/founderApprovalDecisionApplicationEligibilityMetadata.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `shared/resultEnvelope.js`, `shared/modeGuard.js`,
`shared/redaction.js`, `os-roadmap/updatePhaseStatus.js`, existing dashboard
cards/routes, route safety tests, OS phase status records, and P122.1 evidence.
Do not duplicate report writers, mode guards, redaction helpers, result
envelopes, phase status updaters, route matrices, UI cards, or
evidence/audit/activity appenders.

Tests to add/update/remove: add the dedicated P122.2 metadata checker and
package script. No Playwright test is added because dashboard source is not in
scope.

Docs to update: this P122 plan, README, platform roadmap, P122 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1221-founder-runtime-approval-decision-application-authority-handoff-contract-report.md`
- `reports/p1222-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P122 is in progress; P122.2 is complete; current phase
P122.2; previous P122.1; next P122.3.

Validation commands:
- `npm run check:p1222-founder-runtime-approval-decision-application-authority-handoff`
- `npm run check:p1221-founder-runtime-approval-decision-application-authority-handoff-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P122.2 files>`
- `git commit -m "feat(nexus): implement p1222 approval application authority eligibility metadata"`
- stamp P122/P122.2 status with the implementation commit
- `git add <allowed P122.2 status/report files>`
- `git commit -m "chore(nexus): stamp p1222 approval application authority eligibility metadata"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approve/reject decision recording, DB/runtime writes, runtime
  execution, execution unlock, provider/model calls, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL, network,
  deploy, release, export, package, or spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB/schema names, raw report
  paths in primary UX, JSON/log/policy dumps, internal primary UX phase labels,
  or fake actions are introduced

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: P122.2 metadata can be mistaken for authority enablement. The
metadata is hidden from primary UX and all authority flags remain false.

Rollback plan: remove the P122.2 helper, checker, report, package script,
contract/docs/status updates, restore P122.2 to planned, and return current
phase to P122.1.

Status: complete.

## P122.3 Governed Local Authority Intent Model

Phase: P122
Subphase: P122.3
Goal: add a pure local authority intent model that reuses P122.2 authority
handoff eligibility metadata and describes future approval-decision application
authority readiness without granting authority.
Why this is needed: P122.2 defines metadata only. P122.3 converts that
metadata into a deterministic model P122.4 can wrap in a safe dry-run preview.
User/operator impact: operators get a local authority intent state, readiness
rows, blockers, next action, disabled reason, owner capability,
activity/evidence labels, zero unsafe candidate counts, and cost posture.
Command Center impact: no Command Center source change in P122.3. Preserve the
current Business Build and Agent Flow approval decision application boundary
UX. Chat with NEXUS and Lite remain focused on chat.
Safety impact: model-only. Approval decision application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, and provider spend remain blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalDecisionApplicationAuthorityIntentModel.js`
- `contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json`
- `docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md`
- `scripts/check-p1223-founder-runtime-approval-decision-application-authority-handoff.js`
- `scripts/check-p1222-founder-runtime-approval-decision-application-authority-handoff.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1222-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1223-founder-runtime-approval-decision-application-authority-handoff-report.md`
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
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES`
- `buildFounderApprovalDecisionApplicationAuthorityIntentModel`
- `validateFounderApprovalDecisionApplicationAuthorityIntentModel`

The model shape is local and browser-safe: `schemaVersion`, `phaseId`,
`sourceMetadataPhase`, `sourceMetadataVersion`, `modelOnly`, `localOnly`,
`commandCenterVisible`, `intentState`, `currentState`, `founderIdeaSummary`,
zero unsafe candidate counts, `readinessRows`, `blockers`, `nextAction`,
`disabledReason`, `ownerCapability`, `evidenceLabels`, `activityLabels`,
`costImpactLabel`, false authority booleans, `authorityFlags`, and
`metadataSectionLabels`.

Reuse check: reuse P122.2
`shared/founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `shared/resultEnvelope.js`, `shared/modeGuard.js`,
`shared/redaction.js`, `os-roadmap/updatePhaseStatus.js`, existing dashboard
cards/routes, route safety tests, OS phase status records, and P122.2 evidence.
Do not duplicate report writers, mode guards, redaction helpers, result
envelopes, phase status updaters, route matrices, UI cards, or
evidence/audit/activity appenders.

Tests to add/update/remove: add the dedicated P122.3 intent model checker and
package script. No Playwright test is added because dashboard source is not in
scope.

Docs to update: this P122 plan, README, platform roadmap, P122 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1222-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1223-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P122 is in progress; P122.3 is complete; current phase
P122.3; previous P122.2; next P122.4.

Validation commands:
- `npm run check:p1223-founder-runtime-approval-decision-application-authority-handoff`
- `npm run check:p1222-founder-runtime-approval-decision-application-authority-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P122.3 files>`
- `git commit -m "feat(nexus): implement p1223 approval application authority intent model"`
- stamp P122/P122.3 status with the implementation commit
- `git add <allowed P122.3 status/report files>`
- `git commit -m "chore(nexus): stamp p1223 approval application authority intent model"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approve/reject decision recording, DB/runtime writes, runtime
  execution, execution unlock, provider/model calls, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL, network,
  deploy, release, export, package, or spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB/schema names, raw report
  paths in primary UX, JSON/log/policy dumps, internal primary UX phase labels,
  or fake actions are introduced

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: a dry-run-ready local state can be mistaken for live authority.
The validation rejects nonzero unsafe counts and true authority/write/execution
booleans.

Rollback plan: remove the P122.3 helper, checker, report, package script,
contract/docs/status updates, restore P122.3 to planned, and return current
phase to P122.2.

Status: complete.

## P122.4 Authority Handoff Safe Dry Run

Phase: P122
Subphase: P122.4
Goal: add a local-only result-envelope dry-run preview that reuses the P122.3
authority intent model and P122.2 metadata while keeping authority, approval
application, writes, execution, dispatch, network, and spend blocked.
Why this is needed: P122.3 models intent only. P122.4 produces the safe preview
artifact P122.5 can render without adding live controls or mutation behavior.
User/operator impact: operators get dry-run sections and rows for authority
handoff, prior boundary, runtime guard, and operator evidence with blockers,
disabled reasons, next actions, owner capability, evidence/activity labels,
zero unsafe counts, and cost posture.
Command Center impact: no Command Center source change in P122.4. The preview
remains hidden from primary UX until P122.5.
Safety impact: dry-run preview only. Approval decision application, approval
capture, approval persistence, approve/reject decision recording, DB/runtime
writes, runtime execution, execution unlock, provider/model calls, agent
dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL,
deploy, release, export, package, network calls, and provider spend remain
blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalDecisionApplicationAuthorityPreview.js`
- `contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json`
- `docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md`
- `scripts/check-p1224-founder-runtime-approval-decision-application-authority-handoff.js`
- `scripts/check-p1223-founder-runtime-approval-decision-application-authority-handoff.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1223-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1224-founder-runtime-approval-decision-application-authority-handoff-report.md`
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
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_PHASE`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_VERSION`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES`
- `buildFounderApprovalDecisionApplicationAuthorityPreview`
- `validateFounderApprovalDecisionApplicationAuthorityPreview`

The preview uses the existing result-envelope shape and keeps
`commandCenterVisible` false. `data` includes `schemaVersion`, `currentState`,
`previewMode`, `dryRunOnly`, source model/metadata phases,
`authorityHandoffSummary`, `previewSections`, `previewRows`, `blockers`,
`nextAction`, `disabledReason`, `ownerCapability`, `evidenceRefs`,
`activityLocation`, `costImpact`, and false authority flags.

Reuse check: reuse `shared/resultEnvelope.js`, P122.3
`shared/founderApprovalDecisionApplicationAuthorityIntentModel.js`, P122.2
`shared/founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `shared/modeGuard.js`, `shared/redaction.js`,
`os-roadmap/updatePhaseStatus.js`, existing dashboard cards/routes, route
safety tests, OS phase status records, and P122.3 evidence. Do not duplicate
report writers, mode guards, redaction helpers, result envelopes, phase status
updaters, route matrices, UI cards, or evidence/audit/activity appenders.

Tests to add/update/remove: add the dedicated P122.4 safe dry-run checker and
package script. No Playwright test is added because dashboard source is not in
scope.

Docs to update: this P122 plan, README, platform roadmap, P122 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1223-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1224-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P122 is in progress; P122.4 is complete; current phase
P122.4; previous P122.3; next P122.5.

Validation commands:
- `npm run check:p1224-founder-runtime-approval-decision-application-authority-handoff`
- `npm run check:p1223-founder-runtime-approval-decision-application-authority-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P122.4 files>`
- `git commit -m "feat(nexus): implement p1224 approval application authority safe dry run"`
- stamp P122/P122.4 status with the implementation commit
- `git add <allowed P122.4 status/report files>`
- `git commit -m "chore(nexus): stamp p1224 approval application authority safe dry run"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approve/reject decision recording, DB/runtime writes, runtime
  execution, execution unlock, provider/model calls, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL, network,
  deploy, release, export, package, or spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB/schema names, raw report
  paths in primary UX, JSON/log/policy dumps, internal primary UX phase labels,
  or fake actions are introduced

Final response checklist:
- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers run
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

Known risks: preview rows may be mistaken for runnable controls. The preview is
hidden from primary UX, validates every unsafe `would*` field as false, and has
no action labels that imply execution.

Rollback plan: remove the P122.4 preview, checker, report, package script,
contract/docs/status updates, restore P122.4 to planned, and return current
phase to P122.3.

Status: complete.

## P122.5 Command Center Authority Handoff UX

Phase: P122
Subphase: P122.5
Goal: render the P122.4 authority handoff safe dry-run preview as display-safe
Command Center cards on Business Build and Agent Flow only.
Why this is needed: P122.4 creates a hidden preview artifact. P122.5 gives
operators scoped visibility into authority handoff state before aggregate
validation and docs closure.
User/operator impact: operators can inspect authority handoff current state,
readiness rows, blockers, disabled reason, next action, owner capability,
evidence/activity labels, and cost posture on the founder work pages.
Command Center impact: Business Build and Agent Flow show an Approval
Application Authority Handoff read-only card. Chat with NEXUS, Lite, OS
Roadmap, Live Readiness, and other routes stay clean.
Safety impact: UX-only. Approval decision application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, and provider spend remain blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json`
- `docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md`
- `scripts/check-p1225-founder-runtime-approval-decision-application-authority-handoff.js`
- `scripts/check-p1224-founder-runtime-approval-decision-application-authority-handoff.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1224-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1225-founder-runtime-approval-decision-application-authority-handoff-report.md`
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
- `buildFounderApprovalDecisionApplicationAuthorityBoundaryDisplayModel`

The display model includes `currentState`, `founderIdea`, `previewMode`,
readiness counts, zero unsafe candidate counts, `nextAction`, `blockers`,
`disabledReason`, `ownerCapability`, `evidenceLocation`, `activityLocation`,
`costImpact`, `readinessSections`, `readinessRows`, `safetyRows`, and
`summaryRows`.

Reuse check: reuse P122.4
`shared/founderApprovalDecisionApplicationAuthorityPreview.js`, existing
`FounderApprovalDecisionBoundaryCard`, existing Command Center route placement,
existing theme controls, existing route tests, `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `shared/reportMetadata.js`,
`shared/resultEnvelope.js`, `shared/modeGuard.js`, `shared/redaction.js`, and
`os-roadmap/updatePhaseStatus.js`. Do not duplicate UI cards, route matrices,
report writers, result envelopes, redaction helpers, mode guards, phase status
updaters, or evidence/activity appenders.

Tests to add/update/remove: add focused Playwright coverage for the authority
handoff card across dark, light, and system themes; assert Business Build and
Agent Flow presence; assert Lite, Chat, OS Roadmap, and Live Readiness absence.
Add the dedicated P122.5 checker and package script.

Docs to update: this P122 plan, README, platform roadmap, P122 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1224-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1225-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P122 is in progress; P122.5 is complete; current phase
P122.5; previous P122.4; next P122.6.

Validation commands:
- `npm run check:p1225-founder-runtime-approval-decision-application-authority-handoff`
- `npm run check:p1224-founder-runtime-approval-decision-application-authority-handoff`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority handoff appears only on scoped pages"`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P122.5 files>`
- `git commit -m "feat(nexus): implement p1225 approval application authority ux"`
- stamp P122/P122.5 status with the implementation commit
- `git add <allowed P122.5 status/report files>`
- `git commit -m "chore(nexus): stamp p1225 approval application authority ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approve/reject decision recording, DB/runtime writes, runtime
  execution, execution unlock, provider/model calls, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL, network,
  deploy, release, export, package, or spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB/schema names, raw report
  paths in primary UX, JSON/log/policy dumps, internal primary UX phase labels,
  or fake actions are introduced

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

Known risks: adding another card can clutter the founder pages. The card is
scoped to the two work-planning pages and uses the existing compact boundary
card style.

Rollback plan: remove the P122.5 display model, card render calls, Playwright
test, checker, report, package script, contract/docs/status updates, restore
P122.5 to planned, and return current phase to P122.4.

Status: complete.

## Planned Subphase Controls

P122.1 Authority Handoff Contract / Policy is complete. P122.2 Application
Authority Eligibility Metadata is complete. P122.3 Governed Local Authority
Intent Model is complete. P122.4 Authority Handoff Safe Dry Run is complete.
P122.5 Command Center Authority Handoff UX is complete. P122.6 is next for
authority handoff validation and docs. Approval decision application,
approval capture, approval persistence, approve/reject decision recording,
DB/runtime writes, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL, deploy, release, export, package, network calls, and provider spend
remain blocked unless a future subphase explicitly grants narrow authority.
