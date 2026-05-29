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

## Planned Subphase Controls

P120.1 Approval Decision Persistence Contract / Policy is complete. P120.2 is
next for browser-safe persistence schema metadata, with approval persistence,
DB/runtime writes, approve/reject decision recording, and execution still
blocked unless a future subphase explicitly grants narrow authority.
