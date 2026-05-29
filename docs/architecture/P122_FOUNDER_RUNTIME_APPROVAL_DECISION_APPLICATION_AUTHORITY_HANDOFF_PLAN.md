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

## Planned Subphase Controls

P122.1 Authority Handoff Contract / Policy is complete. P122.2 Application
Authority Eligibility Metadata is complete. P122.3 is next for governed local
authority intent modeling. Approval decision application,
approval capture, approval persistence, approve/reject decision recording,
DB/runtime writes, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL, deploy, release, export, package, network calls, and provider spend
remain blocked unless a future subphase explicitly grants narrow authority.
