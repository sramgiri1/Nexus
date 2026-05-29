# P121 Founder Runtime Approval Decision Application Boundary Plan

Status: in progress

Scope classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit for P121.1: `d2c610dc`

Planned subphases:
- P121.1 Application Boundary Contract / Policy
- P121.2 Application Eligibility Metadata
- P121.3 Governed Application Intent Model
- P121.4 Application Safe Dry Run
- P121.5 Command Center Application Boundary UX
- P121.6 Application Validation / Docs
- P121.7 Final Validation

P121 starts from the completed P120 approval decision persistence boundary. It
does not enable approval decision application, approval capture, approval
persistence, approve/reject decision recording, DB/runtime writes, runtime
execution, execution unlock, provider/model calls, agent dispatch, worker/tool
execution, project mutation, hosted DB mutation, raw SQL, deploy, release,
export, package actions, network calls, or provider spend.

## P121.1 Application Boundary Contract / Policy

Phase: P121 Founder Runtime Approval Decision Application Boundary

Subphase: P121.1 Application Boundary Contract / Policy

Goal: define the P121 approval-decision application boundary contract, subphase
split, safety policy, reuse rules, validation commands, and OS handoff records
without implementation behavior.

Why this is needed: P120 closed persistence-boundary validation but did not
grant authority to apply an approval decision to runtime execution, project
mutation, dispatch, provider calls, or spend. P121 needs an implementation-grade
contract before any application metadata, intent model, preview, or UX work.

User/operator impact: OS Roadmap moves from planned P121 to P121.1 complete and
shows P121.2 as the next scoped subphase. Founder UX stays unchanged.

Command Center impact: no Command Center source change in P121.1. Preserve the
existing scoped P120 persistence-boundary UX and keep Chat with NEXUS and Lite
chat clean.

Safety impact: contract-only. P121.1 does not enable approval decision
application, approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, deploy, release, export, package actions, network
calls, or provider spend.

Cost impact: local docs/checkers/reports only. No provider/model/network/spend
path.

Project/OS scope: NEXUS_OS_CHANGE.

Allowed files:
- `contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json`
- `docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md`
- `scripts/check-p1211-founder-runtime-approval-decision-application-boundary-contract.js`
- `scripts/check-p1207-founder-runtime-approval-decision-persistence-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1207-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md`
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
- create `contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json`
- create `docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md`
- create `scripts/check-p1211-founder-runtime-approval-decision-application-boundary-contract.js`
- update `scripts/check-p1207-founder-runtime-approval-decision-persistence-boundary.js`
- update `scripts/check-os-phase-status.js`
- update package, README, platform roadmap, OS roadmap/status, and generated reports

Expected exports, schemas, and data shapes: no runtime exports, schemas, UI data
shape, persisted approval application record, DB table, runtime event, provider
request, tool call, worker dispatch, project mutation, hosted DB mutation,
deploy, release, export, package, network call, or spend path is implemented.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
`os-roadmap/updatePhaseStatus.js`, existing dashboard tabs/cards/badges, the
existing route matrix, and evidence/audit/activity helpers. Do not duplicate
report writers, checker formatters, phase status updaters, redaction helpers,
mode guards, route matrices, UI components, or audit/activity appenders.

Command Center UX requirements: preserve existing Command Center UX. Primary UX
must not show raw JSON, raw logs, raw policy dumps, raw DB names, private IDs,
internal phase labels outside OS Roadmap, DemoApp, approval application buttons,
approve/reject/save/run controls, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test because P121.1 has no UI source
changes. Preserve route-wide safety tests.

Checker updates: add a dedicated P121.1 contract checker, update P120.7 final
checker to accept the P121.1 started handoff, and update the OS phase status
checker to recognize P121.1-P121.7.

Docs/README/roadmap updates: P121.1 is recorded in this plan, README, platform
roadmap, P121 contract, OS roadmap/status, and generated reports. P121.2 is
next for eligibility metadata.

OS phase status update: P121 is in progress; P121.1 is complete; current phase
P121.1; previous P120.7; next P121.2.

Reports to regenerate:
- `reports/p1207-founder-runtime-approval-decision-persistence-boundary-report.md`
- `reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1211-founder-runtime-approval-decision-application-boundary-contract`
- `npm run check:p1207-founder-runtime-approval-decision-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P121.1 files>`
- `git commit -m "feat(nexus): implement p1211 approval decision application contract"`
- stamp P121/P121.1 status with the implementation commit
- `git add <allowed P121.1 status/report files>`
- `git commit -m "chore(nexus): stamp p1211 approval decision application contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop paths changed
- confirm no dashboard source or dashboard test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approval decision recording, runtime execution, execution unlock,
  provider/model calls, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL, network, deploy, release, export, package, or
  spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB table names, raw
  JSON/log/policy dumps, internal primary UX phase labels, or fake actions are
  introduced

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

Known risks: contract language could imply live approval application. P121.1
keeps the subphase contract-only and validates that unsafe authority remains
blocked.

Rollback plan: remove the P121.1 checker/contract/docs/status/report changes,
restore P121 to planned, set current phase back to P120.7, and keep P120
complete.

Status: complete.

## P121.2 Application Eligibility Metadata

Phase: P121 Founder Runtime Approval Decision Application Boundary

Subphase: P121.2 Application Eligibility Metadata

Goal: define browser-safe approval decision application eligibility metadata
without DB files, DB writes, approval application, approval persistence, or
runtime execution.

Why this is needed: before P121 can model a governed application intent, NEXUS
needs a stable display-safe eligibility vocabulary that shows which future
inputs would be needed and which authority remains blocked.

User/operator impact: operators get a validated metadata shape for future
P121.3/P121.4 work. Founder UX stays unchanged.

Command Center impact: no Command Center source change in P121.2. Preserve the
existing scoped P120 persistence-boundary UX and keep Chat with NEXUS and Lite
chat clean.

Safety impact: metadata-only. P121.2 does not enable approval decision
application, approval capture, approval persistence, approve/reject decision
recording, DB/runtime writes, runtime execution, execution unlock,
provider/model calls, agent dispatch, worker/tool execution, project mutation,
hosted DB mutation, raw SQL, deploy, release, export, package actions, network
calls, or provider spend.

Cost impact: local metadata/checkers/reports only. No provider/model/network
path and no spend.

Project/OS scope: NEXUS_OS_CHANGE.

Allowed files:
- `shared/founderApprovalDecisionApplicationEligibilityMetadata.js`
- `scripts/check-p1212-founder-runtime-approval-decision-application-boundary.js`
- `scripts/check-p1211-founder-runtime-approval-decision-application-boundary-contract.js`
- `contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json`
- `docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md`
- `reports/p1212-founder-runtime-approval-decision-application-boundary-report.md`
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
- create `shared/founderApprovalDecisionApplicationEligibilityMetadata.js`
- create `scripts/check-p1212-founder-runtime-approval-decision-application-boundary.js`
- update P121 contract/docs/status/reports
- update package, README, and platform roadmap

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_METADATA_PHASE`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_VERSION`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_STATES`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_FLAGS`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_ELIGIBILITY_SECTIONS`
- `buildFounderApprovalDecisionApplicationEligibilityMetadata`

The metadata shape is browser-safe: version, phase id, metadataOnly true,
commandCenterVisible false, metadata-only write policy, eligibility states, and
three display-safe sections for decision source, runtime authority, and operator
evidence. No schema/table, DB row, runtime event, provider request, tool call,
worker dispatch, project mutation, hosted DB mutation, deploy, release, export,
package, network call, or spend path is implemented.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
existing phase status validation, and existing docs/status/report patterns. Do
not duplicate report writers, checker formatters, phase status updaters,
redaction helpers, mode guards, route matrices, UI components, or
audit/activity appenders.

Command Center UX requirements: no new Command Center UI in P121.2. Primary UX
must not show raw JSON, raw logs, raw policy dumps, raw DB names, private IDs,
internal phase labels outside OS Roadmap, DemoApp, approval application buttons,
approve/reject/save/run controls, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test because P121.2 has no UI source
changes. Preserve route-wide safety tests.

Checker updates: add a dedicated P121.2 metadata checker. Reuse P121.1 checker
handoff acceptance for the P121.2 started state.

Docs/README/roadmap updates: P121.2 is recorded in this plan, README, platform
roadmap, P121 contract, OS roadmap/status, and generated reports. P121.3 is
next for the governed application intent model.

OS phase status update: P121 is in progress; P121.2 is complete; current phase
P121.2; previous P121.1; next P121.3.

Reports to regenerate:
- `reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md`
- `reports/p1212-founder-runtime-approval-decision-application-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1212-founder-runtime-approval-decision-application-boundary`
- `npm run check:p1211-founder-runtime-approval-decision-application-boundary-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P121.2 files>`
- `git commit -m "feat(nexus): implement p1212 approval decision application metadata"`
- stamp P121/P121.2 status with the implementation commit
- `git add <allowed P121.2 status/report files>`
- `git commit -m "chore(nexus): stamp p1212 approval decision application metadata"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop paths changed
- confirm no dashboard source or dashboard test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approval decision recording, runtime execution, execution unlock,
  provider/model calls, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL, network, deploy, release, export, package, or
  spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB table names, raw
  JSON/log/policy dumps, internal primary UX phase labels, or fake actions are
  introduced

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

Known risks: metadata names can leak as raw schema names in public docs. P121.2
keeps raw metadata identifiers in source only and checks public docs for raw
application table names.

Rollback plan: remove the P121.2 helper/checker/docs/status/report changes,
restore P121.2 to planned, set current phase back to P121.1, and keep P121.1
complete.

Status: complete.

## P121.3 Governed Application Intent Model

Phase: P121 Founder Runtime Approval Decision Application Boundary
Subphase: P121.3 Governed Application Intent Model
Scope classification: NEXUS_OS_CHANGE
Starting branch: `codex/nexus-e2e-phase-validation`
Expected base commit: `b0092697`

Goal: define a pure local approval-decision application intent model that
reuses P121.2 eligibility metadata without DB files, DB writes, approval
application, approval persistence, approval decision recording, runtime
execution, or execution unlock.

Why this is needed: P121.2 only defines browser-safe eligibility metadata.
P121.3 gives later dry-run and UX phases a stable, validated model shape before
any application behavior is considered.

User/operator impact: operators get a deterministic, display-safe summary of
what would be required before applying a founder approval decision. No live
application action is exposed.

Command Center impact: no Command Center source changes in P121.3. Chat with
NEXUS, Lite, OS Roadmap, Live Readiness, Business Build, and Agent Flow keep
their existing behavior. No apply, approve, reject, save, run, or execution
control is introduced.

Safety impact: all application/write/execution/provider/dispatch/project
mutation authority flags remain false, all candidate counts remain zero, and
the checker validates that the model has no DB/runtime/provider/tool imports.

Cost impact: no provider calls, model calls, network calls, or provider spend.

Project/OS scope: OS-only. No project-owned files, CareLoop files, generated
project files, dashboard source/test files, DB/runtime/provider/tool/worker
files, deploy/release/export/package files, or env files are allowed.

Files expected to change:
- `shared/founderApprovalDecisionApplicationIntentModel.js`
- `scripts/check-p1213-founder-runtime-approval-decision-application-boundary.js`
- `scripts/check-p1211-founder-runtime-approval-decision-application-boundary-contract.js`
- `contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json`
- `docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md`
- `reports/p1212-founder-runtime-approval-decision-application-boundary-report.md`
- `reports/p1213-founder-runtime-approval-decision-application-boundary-report.md`
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
- `FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION`
- `FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES`
- `buildFounderApprovalDecisionApplicationIntentModel(input?)`
- `validateFounderApprovalDecisionApplicationIntentModel(model?)`
- Data shape: local/model-only object with P121.2 source metadata phase/version,
  allowlisted intent state, display-safe readiness rows, blockers, next action,
  disabled reason, owner capability, evidence/activity labels, cost impact,
  zero candidate counts, false action booleans, copied false authority flags,
  and display-safe metadata section labels.

Reuse check: reuse P121.2 eligibility metadata, `shared/reportWriter.js`,
`shared/checkResultFormatter.js`, OS phase status records, existing report
formatting, and existing route safety posture. Do not duplicate report writers,
mode guards, redaction helpers, result envelopes, phase status updaters, route
matrices, UI cards, or evidence/audit/activity appenders.

Command Center UX requirements: no dashboard source change in P121.3. Primary
UX must not show raw JSON, raw logs, raw policy dumps, raw DB names, private
IDs, internal phase labels outside OS Roadmap, DemoApp, approval application
buttons, approve/reject/save/run controls, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test because P121.3 has no UI source
changes. Preserve route-wide safety tests.

Checker updates: add a dedicated P121.3 intent model checker and update P121.1
contract checker handoff acceptance for the P121.3 current state.

Docs/README/roadmap updates: P121.3 is recorded in this plan, README, platform
roadmap, P121 contract, OS roadmap/status, and generated reports. P121.4 is
next for safe dry-run preview.

OS phase status update: P121 is in progress; P121.3 is complete; current phase
P121.3; previous P121.2; next P121.4.

Reports to regenerate:
- `reports/p1211-founder-runtime-approval-decision-application-boundary-contract-report.md`
- `reports/p1212-founder-runtime-approval-decision-application-boundary-report.md`
- `reports/p1213-founder-runtime-approval-decision-application-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1213-founder-runtime-approval-decision-application-boundary`
- `npm run check:p1212-founder-runtime-approval-decision-application-boundary`
- `npm run check:p1211-founder-runtime-approval-decision-application-boundary-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P121.3 files>`
- `git commit -m "feat(nexus): implement p1213 approval decision application intent"`
- stamp P121/P121.3 status with the implementation commit
- `git add <allowed P121.3 status/report files>`
- `git commit -m "chore(nexus): stamp p1213 approval decision application intent"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no project/CareLoop paths changed
- confirm no dashboard source or dashboard test files changed
- confirm no DB/runtime provider, tool, worker, deploy, release, export,
  package, or env paths changed
- confirm no approval decision application, approval capture, approval
  persistence, approval decision recording, runtime execution, execution unlock,
  provider/model calls, agent dispatch, worker/tool execution, project mutation,
  hosted DB mutation, raw SQL, network, deploy, release, export, package, or
  spend authority is enabled
- confirm no DemoApp exposure, raw private IDs, raw DB table names, raw
  JSON/log/policy dumps, internal primary UX phase labels, or fake actions are
  introduced

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

Known risks: the model can sound like application is live if copy is not
careful. P121.3 keeps all user-facing copy explicit that application, writes,
execution, dispatch, project mutation, network, and spend are unavailable.

Rollback plan: remove the P121.3 helper/checker/docs/status/report changes,
restore P121.3 to planned, set current phase back to P121.2, and keep P121.1
and P121.2 complete.

Status: complete.

## Planned Subphase Controls

P121.3 Governed Application Intent Model is complete. P121.4 is next for a
safe dry-run preview, with approval decision application, persistence,
approve/reject decision recording, DB/runtime writes, and execution still
blocked unless a future subphase explicitly grants narrow authority.
