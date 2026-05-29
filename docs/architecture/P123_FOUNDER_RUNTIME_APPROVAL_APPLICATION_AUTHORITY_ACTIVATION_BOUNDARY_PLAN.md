# P123 Founder Runtime Approval Application Authority Activation Boundary Plan

P123 defines the approval application authority activation boundary after P122
handoff closure. It does not activate authority, apply approvals, write
DB/runtime records, unlock execution, call providers/models, dispatch agents,
execute workers/tools, mutate projects, deploy, release, export, package, use
network calls, or spend.

Subphases:
- P123.1 Activation Boundary Contract / Policy
- P123.2 Activation Eligibility Metadata
- P123.3 Governed Activation Intent Model
- P123.4 Activation Safe Dry Run
- P123.5 Command Center Activation Boundary UX
- P123.6 Activation Validation / Docs
- P123.7 Final Validation

## P123.1 Activation Boundary Contract / Policy

Phase: P123 Founder Runtime Approval Application Authority Activation Boundary

Subphase: P123.1 Activation Boundary Contract / Policy

Goal: create the implementation-grade P123 contract and subphase split for a
future approval application authority activation boundary, without granting
authority or changing runtime behavior.

Why this is needed: P122 ended with an authority handoff, but live authority is
still blocked. P123 needs a narrow contract before any later phase can consider
activation, application, writes, execution, or spend.

User/operator impact: operators get a clear next phase that explains what
activation would require and what remains blocked.

Command Center impact: no UI changes in P123.1. Existing Business Build and
Agent Flow authority handoff cards remain as-is.

Safety impact: activation, approval decision application, approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, and provider spend remain blocked.

Cost impact: contract/checker/docs only. No provider calls, model calls, network
calls, worker runtime, deploy, package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE. No project source or CareLoop files are
allowed.

Starting branch and base commit: `codex/nexus-e2e-phase-validation` at
`1f3458f1`.

Files expected to change:
- `contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json`
- `docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md`
- `scripts/check-p1227-founder-runtime-approval-decision-application-authority-handoff.js`
- `scripts/check-p1231-founder-runtime-approval-application-authority-activation-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1227-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1231-founder-runtime-approval-application-authority-activation-boundary-report.md`
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

Expected exports, schemas, and data shapes: no runtime exports, schemas, DB
tables, or data model changes. P123.1 defines contract metadata and planned
subphase shapes only.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
the P122.7 checker handoff pattern, OS phase status checker conventions, and
phase validation coverage conventions. Do not duplicate report writers,
redaction helpers, result envelopes, mode guards, UI components, route
matrices, or activity/evidence/audit helpers.

Command Center UX requirements: preserve the existing scoped P122.5 authority
handoff card only on Business Build and Agent Flow. Do not add controls,
submit/apply/approve actions, raw JSON/logs/policy dumps, raw private IDs, raw
DB/schema names, raw report paths, internal phase labels in primary UX, or
DemoApp exposure.

Dark/light/system theme requirements: no theme source changes. Existing P122.5
Playwright coverage must remain the route/theme regression guard.

Playwright tests: do not edit dashboard tests in this subphase. Run the existing
P122.5 focused Playwright test to confirm the scoped authority handoff remains
present and theme-safe.

Checker updates: add
`scripts/check-p1231-founder-runtime-approval-application-authority-activation-boundary.js`,
update the P122.7 checker so it accepts P123.1 handoff, and update the OS phase
status checker so P123.1-P123.7 are recognized.

Docs to update: this P123 plan, `README.md`, and
`docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- `reports/p1227-founder-runtime-approval-decision-application-authority-handoff-report.md`
- `reports/p1231-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P123 is in progress. P123.1 is complete. Current phase
is P123.1, previous phase is P122.7, and next phase is P123.2.

Validation commands:
- `npm run check:p1231-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:p1227-founder-runtime-approval-decision-application-authority-handoff`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority handoff appears only on scoped pages"`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P123.1 files>`
- `git commit -m "feat(nexus): implement p1231 approval authority activation contract"`
- stamp P123/P123.1 status with the implementation commit
- `git add <allowed P123.1 status/report files>`
- `git commit -m "chore(nexus): stamp p1231 approval authority activation contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no forbidden project, CareLoop, generated project, dashboard source,
  dashboard test, DB, provider, tool, worker, deploy, release, export, package,
  local runtime state, or env paths changed.
- confirm no activation, approval decision application, approval capture,
  approval persistence, approve/reject decision recording, DB/runtime write,
  runtime execution, execution unlock, provider/model call, agent dispatch,
  worker/tool execution, project mutation, hosted DB mutation, raw SQL
  interface, deploy, release, export, package, network call, or provider spend
  has been enabled.
- confirm no stale `pending-final-commit` remains after the status stamp commit.

Final response checklist:
- branch name
- commit hash
- files changed
- what was implemented
- Command Center UX preservation
- tests/checkers run
- dashboard build/unit/page results
- docs/README/roadmap updates
- OS phase status update
- evidence/audit/activity/cost records if applicable
- safety confirmations
- forbidden paths confirmation
- known limitations
- next phase/subphase

Known risks: activation language can sound like live behavior. P123.1 is
contract-only and all activation/application/write/execution/spend paths remain
blocked.

Rollback plan: remove the P123 contract, plan, checker, report, package script,
contract/docs/status/report updates, restore P123 to planned, remove P123.1-P123.7
OS checker recognition, and return current phase to P122.7.

Status: complete.

## P123.2 Activation Eligibility Metadata

Phase: P123
Subphase: P123.2
Goal: add browser-safe activation eligibility metadata that reuses the P122
authority handoff metadata and defines the local activation sections P123.3 can
model without granting live authority.
Why this is needed: P123.1 defined the activation boundary contract. P123.2 adds
deterministic metadata for later local intent and safe dry-run work without
adding runtime behavior.
User/operator impact: operators get display-safe activation metadata for prior
handoff, activation scope, runtime write guard, operator evidence, blockers,
next action, owner capability, activity/evidence labels, and cost impact.
Command Center impact: no Command Center source change in P123.2. Preserve the
current Business Build and Agent Flow authority handoff UX. Chat with NEXUS and
Lite remain focused on chat.
Safety impact: metadata-only. Activation, authority grant, approval decision
application, approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, deploy, release, export, package, network calls,
and provider spend remain blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityActivationEligibilityMetadata.js`
- `contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json`
- `docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md`
- `scripts/check-p1231-founder-runtime-approval-application-authority-activation-boundary.js`
- `scripts/check-p1232-founder-runtime-approval-application-authority-activation-boundary.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1231-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1232-founder-runtime-approval-application-authority-activation-boundary-report.md`
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
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_METADATA_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_ELIGIBILITY_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_STATES`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_FLAGS`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_SECTIONS`
- `buildFounderApprovalApplicationAuthorityActivationEligibilityMetadata`

The metadata shape is local and browser-safe: `metadataVersion`, `phaseId`,
`sourceHandoffPhase`, `sourceHandoffVersion`, `metadataOnly`, `localOnly`,
`commandCenterVisible`, `activationPolicy`, `activationStates`,
`priorHandoff`, `sections`, `blockers`, `nextAction`, `ownerCapability`, and
`costImpactLabel`. All authority flags stay false.

Reuse check: reuse P122.2
`shared/founderApprovalDecisionApplicationAuthorityEligibilityMetadata.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `shared/resultEnvelope.js`, `shared/modeGuard.js`,
`shared/redaction.js`, `os-roadmap/updatePhaseStatus.js`, existing dashboard
cards/routes, route safety tests, OS phase status records, and P123.1 evidence.
Do not duplicate report writers, mode guards, redaction helpers, result
envelopes, phase status updaters, route matrices, UI cards, or
evidence/audit/activity appenders.

Command Center UX requirements: no source changes in P123.2. Preserve Business
Build and Agent Flow authority handoff display. Do not add activation buttons,
approval application controls, mutation controls, fake actions, raw report
paths, raw JSON/log/policy dumps, raw private IDs, DemoApp exposure, or primary
UX phase labels. Chat with NEXUS and Lite remain chat-only.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior. No CSS or theme tokens change in P123.2.

Playwright tests: no new Playwright test is added because dashboard source is
not in scope. Run the existing focused authority handoff route regression.

Tests to add/update/remove: add the dedicated P123.2 metadata checker and
package script. Update the P123.1 checker so it accepts the P123.2 handoff
state. No tests are removed.

Checker updates: validate P123.2 metadata shape, P122.2 reuse, blocked
activation flags, docs/status updates, allowed file scope, forbidden path
boundaries, and unsafe positive claim prevention.

Docs to update: this P123 plan, README, platform roadmap, P123 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1231-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1232-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P123 is in progress; P123.2 is complete; current phase
P123.2; previous P123.1; next P123.3.

Validation commands:
- `npm run check:p1232-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:p1231-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority handoff appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P123.2 files>`
- `git commit -m "feat(nexus): implement p1232 approval authority activation eligibility metadata"`
- stamp P123/P123.2 status with the implementation commit
- `git add <allowed P123.2 status/report files>`
- `git commit -m "chore(nexus): stamp p1232 approval authority activation eligibility metadata"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no activation, authority grant, approval decision application,
  approval capture, approval persistence, approve/reject decision recording,
  DB/runtime writes, runtime execution, execution unlock, provider/model calls,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  raw SQL, network, deploy, release, export, package, or spend authority is
  enabled
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

Known risks: P123.2 metadata can be mistaken for activation authority. The
metadata is hidden from primary UX and all authority flags remain false.

Rollback plan: remove the P123.2 helper, checker, report, package script,
contract/docs/status updates, restore P123.2 to planned, and return current
phase to P123.1.

Status: complete.

## P123.3 Governed Activation Intent Model

Phase: P123
Subphase: P123.3
Goal: add a pure local activation intent model that reuses P123.2 activation
eligibility metadata and describes future approval application authority
activation readiness without granting authority.
Why this is needed: P123.2 defines metadata only. P123.3 converts that metadata
into a deterministic model P123.4 can wrap in a safe dry-run preview.
User/operator impact: operators get a local activation intent state, readiness
rows, blockers, next action, disabled reason, owner capability,
activity/evidence labels, zero unsafe candidate counts, and cost posture.
Command Center impact: no Command Center source change in P123.3. Preserve the
current Business Build and Agent Flow authority handoff UX. Chat with NEXUS and
Lite remain focused on chat.
Safety impact: model-only. Activation, authority grant, approval decision
application, approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, deploy, release, export, package, network calls,
and provider spend remain blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityActivationIntentModel.js`
- `contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json`
- `docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md`
- `scripts/check-p1232-founder-runtime-approval-application-authority-activation-boundary.js`
- `scripts/check-p1233-founder-runtime-approval-application-authority-activation-boundary.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1232-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1233-founder-runtime-approval-application-authority-activation-boundary-report.md`
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
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES`
- `buildFounderApprovalApplicationAuthorityActivationIntentModel`
- `validateFounderApprovalApplicationAuthorityActivationIntentModel`

The model shape is local and browser-safe: `schemaVersion`, `phaseId`,
`sourceMetadataPhase`, `sourceMetadataVersion`, `modelOnly`, `localOnly`,
`commandCenterVisible`, `intentState`, `currentState`, `founderIdeaSummary`,
zero unsafe candidate counts, `readinessRows`, `blockers`, `nextAction`,
`disabledReason`, `ownerCapability`, `evidenceLabels`, `activityLabels`,
`costImpactLabel`, false activation/write/execution booleans,
`authorityFlags`, and `metadataSectionLabels`.

Reuse check: reuse P123.2
`shared/founderApprovalApplicationAuthorityActivationEligibilityMetadata.js`,
`shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `shared/resultEnvelope.js`, `shared/modeGuard.js`,
`shared/redaction.js`, `os-roadmap/updatePhaseStatus.js`, existing dashboard
cards/routes, route safety tests, OS phase status records, and P123.2 evidence.
Do not duplicate report writers, mode guards, redaction helpers, result
envelopes, phase status updaters, route matrices, UI cards, or
evidence/audit/activity appenders.

Command Center UX requirements: no source changes in P123.3. Preserve Business
Build and Agent Flow authority handoff display. Do not add activation buttons,
authority grant controls, approval application controls, mutation controls,
fake actions, raw report paths, raw JSON/log/policy dumps, raw private IDs,
DemoApp exposure, or primary UX phase labels. Chat with NEXUS and Lite remain
chat-only.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior. No CSS or theme tokens change in P123.3.

Playwright tests: no new Playwright test is added because dashboard source is
not in scope. Run the existing focused authority handoff route regression.

Tests to add/update/remove: add the dedicated P123.3 intent model checker and
package script. Confirm the P123.2 checker accepts the P123.3 handoff state.
No tests are removed.

Checker updates: validate P123.3 model shape, P123.2 metadata reuse, blocked
activation flags, zero unsafe counts, docs/status updates, allowed file scope,
forbidden path boundaries, and unsafe positive claim prevention.

Docs to update: this P123 plan, README, platform roadmap, P123 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1232-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1233-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P123 is in progress; P123.3 is complete; current phase
P123.3; previous P123.2; next P123.4.

Validation commands:
- `npm run check:p1233-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:p1232-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority handoff appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P123.3 files>`
- `git commit -m "feat(nexus): implement p1233 approval authority activation intent model"`
- stamp P123/P123.3 status with the implementation commit
- `git add <allowed P123.3 status/report files>`
- `git commit -m "chore(nexus): stamp p1233 approval authority activation intent model"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no activation, authority grant, approval decision application,
  approval capture, approval persistence, approve/reject decision recording,
  DB/runtime writes, runtime execution, execution unlock, provider/model calls,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  raw SQL, network, deploy, release, export, package, or spend authority is
  enabled
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

Known risks: P123.3 ready-for-dry-run state can be mistaken for live
activation. The model stays hidden from primary UX and all activation authority
flags remain false.

Rollback plan: remove the P123.3 helper, checker, report, package script,
contract/docs/status updates, restore P123.3 to planned, and return current
phase to P123.2.

Status: complete.

## P123.4 Activation Safe Dry Run

Phase: P123
Subphase: P123.4
Goal: add a local result-envelope safe dry-run preview that reuses P123.3
activation intent and P123.2 metadata without exposing it in primary UX or
enabling activation.
Why this is needed: P123.3 is model-only. P123.4 packages that model into a
validated preview artifact P123.5 can render as scoped Command Center UX.
User/operator impact: operators get a future display-safe preview model with
activation sections, readiness rows, blockers, disabled reasons, next actions,
owner capability, evidence/activity labels, zero unsafe counts, and cost
posture.
Command Center impact: no Command Center source change in P123.4. Preserve the
current Business Build and Agent Flow authority handoff UX. Chat with NEXUS and
Lite remain focused on chat.
Safety impact: dry-run only. Activation, authority grant, approval decision
application, approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, deploy, release, export, package, network calls,
and provider spend remain blocked.
Cost impact: none; no provider, model, network, worker, deploy, package, or
spend path is used.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityActivationPreview.js`
- `contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json`
- `docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md`
- `scripts/check-p1233-founder-runtime-approval-application-authority-activation-boundary.js`
- `scripts/check-p1234-founder-runtime-approval-application-authority-activation-boundary.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1233-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md`
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
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_PHASE`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_VERSION`
- `FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_PREVIEW_STATES`
- `buildFounderApprovalApplicationAuthorityActivationPreview`
- `validateFounderApprovalApplicationAuthorityActivationPreview`

The preview shape is a result envelope: `phase`, `mode`, `summary`,
`data.schemaVersion`, `currentState`, `previewMode`, `dryRunOnly`,
`commandCenterVisible`, source phases, `activationSummary`, `previewSections`,
`previewRows`, blockers, next action, disabled reason, owner, evidence,
activity, cost labels, and false authority flags.

Reuse check: reuse P123.3
`shared/founderApprovalApplicationAuthorityActivationIntentModel.js`, P123.2
`shared/founderApprovalApplicationAuthorityActivationEligibilityMetadata.js`,
`shared/resultEnvelope.js`, `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `shared/reportMetadata.js`,
`shared/modeGuard.js`, `shared/redaction.js`, `os-roadmap/updatePhaseStatus.js`,
existing dashboard cards/routes, route safety tests, OS phase status records,
and P123.3 evidence. Do not duplicate report writers, mode guards, redaction
helpers, result envelopes, phase status updaters, route matrices, UI cards, or
evidence/audit/activity appenders.

Command Center UX requirements: no source changes in P123.4. Preserve Business
Build and Agent Flow authority handoff display. Do not add activation buttons,
authority grant controls, approval application controls, mutation controls,
fake actions, raw report paths, raw JSON/log/policy dumps, raw private IDs,
DemoApp exposure, or primary UX phase labels. Chat with NEXUS and Lite remain
chat-only.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior. No CSS or theme tokens change in P123.4.

Playwright tests: no new Playwright test is added because dashboard source is
not in scope. Run the existing focused authority handoff route regression.

Tests to add/update/remove: add the dedicated P123.4 safe dry-run checker and
package script. Confirm the P123.3 checker accepts the P123.4 handoff state.
No tests are removed.

Checker updates: validate P123.4 result envelope shape, P123.3/P123.2 reuse,
blocked activation flags, zero unsafe counts, docs/status updates, allowed file
scope, forbidden path boundaries, and unsafe positive claim prevention.

Docs to update: this P123 plan, README, platform roadmap, P123 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1233-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P123 is in progress; P123.4 is complete; current phase
P123.4; previous P123.3; next P123.5.

Validation commands:
- `npm run check:p1234-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:p1233-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority handoff appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P123.4 files>`
- `git commit -m "feat(nexus): implement p1234 approval authority activation safe dry run"`
- stamp P123/P123.4 status with the implementation commit
- `git add <allowed P123.4 status/report files>`
- `git commit -m "chore(nexus): stamp p1234 approval authority activation safe dry run"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no activation, authority grant, approval decision application,
  approval capture, approval persistence, approve/reject decision recording,
  DB/runtime writes, runtime execution, execution unlock, provider/model calls,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  raw SQL, network, deploy, release, export, package, or spend authority is
  enabled
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

Known risks: preview rows may be mistaken for runnable controls. The preview is
hidden from primary UX, validates every unsafe `would*` field as false, and has
no action labels that imply execution.

Rollback plan: remove the P123.4 helper, checker, report, package script,
contract/docs/status updates, restore P123.4 to planned, and return current
phase to P123.3.

Status: complete.

## P123.5 Command Center Activation Boundary UX

Phase: P123 Founder Runtime Approval Application Authority Activation Boundary
Subphase: P123.5 Command Center Activation Boundary UX
Goal: render the P123.4 activation dry-run boundary on scoped founder work
pages without adding activation or mutation controls.
Why this is needed: operators need display-safe activation readiness, blockers,
owner, evidence, activity, and cost posture before any later authority
activation work can be considered.
User/operator impact: Business Build and Agent Flow now show the activation
boundary state for the founder idea and explain why activation, writes, and
execution remain unavailable.
Command Center impact: adds an Approval Application Authority Activation card
to Business Build and Agent Flow only. Chat with NEXUS, Lite, Command Center
home, OS Roadmap, and Live Readiness do not show this card. The card reuses the
existing approval boundary component and preserves route-wide navigation.
Safety impact: display-only. It cannot activate authority, grant authority,
apply approvals, accept approvals, persist approvals, record approve/reject
decisions, write DB/runtime records, unlock execution, dispatch agents, run
workers/tools, mutate projects, call providers/models, use hosted DBs, deploy,
release, export, package, use network calls, or spend.
Cost impact: local deterministic preview only. No provider calls, model calls,
network calls, worker runtime, deploy, package creation, or provider spend.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `dashboard/src/data/businessBuild.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `scripts/check-p1234-founder-runtime-approval-application-authority-activation-boundary.js`
- `scripts/check-p1235-founder-runtime-approval-application-authority-activation-boundary.js`
- `contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json`
- `docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1235-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`
- `package.json`

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
- `buildFounderApprovalApplicationAuthorityActivationBoundaryDisplayModel`

The display model shape is browser-safe: `currentState`, `founderIdea`,
`previewMode`, readiness counts, zero activation/authority/write/execution
candidate counts, `nextAction`, `blockers`, `disabledReason`,
`ownerCapability`, display-safe evidence/activity labels, `costImpact`,
`readinessSections`, `readinessRows`, `safetyRows`, and `summaryRows`.

Reuse check: reuse P123.4
`shared/founderApprovalApplicationAuthorityActivationPreview.js`, P123.3 intent
model, P123.2 metadata, existing `FounderApprovalDecisionBoundaryCard`, route
safety tests, `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`shared/reportMetadata.js`, `shared/resultEnvelope.js`,
`os-roadmap/updatePhaseStatus.js`, existing dashboard badges/cards, and OS
phase status records. Do not duplicate UI cards, report writers, mode guards,
redaction helpers, checker formatters, result envelopes, route matrices, phase
status updaters, or evidence/activity appenders.

Command Center UX requirements: Business Build and Agent Flow show what
changed, current state, next action, blockers, disabled reason, owner
capability, display-safe evidence/activity labels, and cost impact for the
activation boundary. Primary UX must not show raw JSON, raw logs, raw policy
dumps, raw report paths, raw private IDs, internal phase labels outside OS
Roadmap, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior through the existing card styles and focused Playwright coverage.

Playwright tests: add scoped coverage for the activation card on Business Build
and Agent Flow, verify absence from Lite, Command Center home, OS Roadmap, and
Live Readiness, cover dark/light/system themes, and assert no raw dumps,
private IDs, raw report paths, DemoApp, or fake runnable actions leak.

Tests to add/update/remove: add P123.5 checker and package script; add focused
route test. No tests are removed.

Checker updates: validate display model shape, P123.4 preview reuse, scoped
Command Center placement, route coverage, docs/status updates, allowed file
scope, forbidden path boundaries, safe labels, zero unsafe counts, and unsafe
positive claim prevention.

Docs to update: this P123 plan, README, platform roadmap, P123 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1235-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P123 is in progress; P123.5 is complete; current phase
P123.5; previous P123.4; next P123.6.

Validation commands:
- `npm run check:p1235-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:p1234-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority activation appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P123.5 files>`
- `git commit -m "feat(nexus): implement p1235 approval authority activation command center ux"`
- stamp P123/P123.5 status with the implementation commit
- `git add <allowed P123.5 status/report files>`
- `git commit -m "chore(nexus): stamp p1235 approval authority activation command center ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no activation, authority grant, approval decision application,
  approval capture, approval persistence, approve/reject decision recording,
  DB/runtime writes, runtime execution, execution unlock, provider/model calls,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  raw SQL, network, deploy, release, export, package, or spend authority is
  enabled
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

Known risks: the reused boundary card is dense. The activation card is scoped
to founder work pages, limits row count, and uses display-safe labels instead
of raw records or raw reports.

Rollback plan: remove the activation display model, scoped card placements,
Playwright test, checker, report, package script, docs/status updates, restore
P123.5 to planned, and return current phase to P123.4.

Status: complete.

## P123.6 Activation Validation / Docs

Phase: P123 Founder Runtime Approval Application Authority Activation Boundary
Subphase: P123.6 Activation Validation / Docs
Goal: close aggregate validation/docs for P123.1-P123.5 before final
validation without changing Command Center source.
Why this is needed: P123 needs one evidence pass proving the contract,
activation metadata, intent model, safe dry run, and scoped UX are complete,
covered, and still non-runnable.
User/operator impact: operators can see P123.6 status, docs, and reports that
confirm the activation boundary is validated and still blocked.
Command Center impact: preserve the P123.5 activation card on Business Build
and Agent Flow. P123.6 adds no new UI controls, pages, routes, or dashboard
source changes.
Safety impact: validation/docs only. It cannot activate authority, grant
authority, apply approvals, accept approvals, persist approvals, record
approve/reject decisions, write DB/runtime records, unlock execution, dispatch
agents, run workers/tools, mutate projects, call providers/models, use hosted
DBs, deploy, release, export, package, use network calls, or spend.
Cost impact: local validation only. No provider calls, model calls, network
calls, worker runtime, deploy, package creation, or provider spend.
Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `scripts/check-p1236-founder-runtime-approval-application-authority-activation-boundary.js`
- `package.json`
- `contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json`
- `docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1235-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1236-founder-runtime-approval-application-authority-activation-boundary-report.md`
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
- No runtime exports.
- P123.6 checker report uses the shared markdown report shape.
- P123.6 status records include phaseId, title, status, branch, commit,
  completedAt, summary, checksRun, knownLimitations, nextPhase, and
  commandCenterVisible.

Reuse check: reuse P123.5 display model and route coverage, P123.4 preview,
P123.3 intent model, P123.2 metadata, `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, `shared/reportMetadata.js`,
`shared/resultEnvelope.js`, `os-roadmap/updatePhaseStatus.js`, existing
dashboard cards/routes, and OS phase status records. Do not duplicate UI cards,
report writers, mode guards, redaction helpers, checker formatters, result
envelopes, route matrices, phase status updaters, or evidence/activity
appenders.

Command Center UX requirements: preserve scoped activation UX on Business Build
and Agent Flow. Chat with NEXUS, Lite, Command Center home, OS Roadmap, and
Live Readiness remain free of the activation card. Primary UX must not show raw
JSON, raw logs, raw policy dumps, raw report paths, raw private IDs, internal
phase labels outside OS Roadmap, DemoApp, mutation controls, or fake working
actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior. No CSS or theme token changes in P123.6.

Playwright tests: no new Playwright test file edits. Run the existing focused
activation route coverage for scoped page visibility and theme modes.

Tests to add/update/remove: add P123.6 aggregate checker and package script. No
tests are removed.

Checker updates: validate P123.1-P123.6 scripts, reports, docs/status,
P123.5 UX preservation, route coverage preservation, zero unsafe counts,
forbidden path boundaries, and unsafe positive claim prevention.

Docs to update: this P123 plan, README, platform roadmap, P123 contract, OS
roadmap/status, and generated reports.

Reports to regenerate:
- `reports/p1234-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1235-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1236-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P123 is in progress; P123.6 is complete; current phase
P123.6; previous P123.5; next P123.7.

Validation commands:
- `npm run check:p1236-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:p1235-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:p1234-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority activation appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P123.6 files>`
- `git commit -m "feat(nexus): implement p1236 approval authority activation validation docs"`
- stamp P123/P123.6 status with the implementation commit
- `git add <allowed P123.6 status/report files>`
- `git commit -m "chore(nexus): stamp p1236 approval authority activation validation docs"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop/generated project paths changed
- confirm no dashboard source or test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, local runtime state, or env paths changed
- confirm no activation, authority grant, approval decision application,
  approval capture, approval persistence, approve/reject decision recording,
  DB/runtime writes, runtime execution, execution unlock, provider/model calls,
  agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
  raw SQL, network, deploy, release, export, package, or spend authority is
  enabled
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

Known risks: docs can accidentally imply live activation. P123.6 validates
blocked/future/read-only wording and rejects unsafe positive claims.

Rollback plan: remove the P123.6 checker, package script, report, docs/status
updates, restore P123.6 to planned, and return current phase to P123.5.

Status: complete.

## Planned Subphase Controls

P123.1 Activation Boundary Contract / Policy, P123.2 Activation Eligibility
Metadata, P123.3 Governed Activation Intent Model, P123.4 Activation Safe Dry
Run, P123.5 Command Center Activation Boundary UX, and P123.6 Activation
Validation / Docs are complete. P123.7 is next for final validation.
Activation, authority grant, approval
decision application,
approval capture, approval persistence, approve/reject decision recording,
DB/runtime writes, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL, deploy, release, export, package, network calls, and provider spend
remain blocked unless a future subphase explicitly grants narrow authority.
