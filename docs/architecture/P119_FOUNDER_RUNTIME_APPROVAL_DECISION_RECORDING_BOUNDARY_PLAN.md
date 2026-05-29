# P119 Founder Runtime Approval Decision Recording Boundary Plan

## P119 Subphase Split

- P119.1 Approval Decision Recording Contract / Policy
- P119.2 Approval Decision Schema Metadata
- P119.3 Governed Local Approval Decision Intent Model
- P119.4 Approval Decision Safe Dry Run
- P119.5 Command Center Approval Decision Boundary UX
- P119.6 Approval Decision Validation / Docs
- P119.7 Final Validation

## P119.1 Approval Decision Recording Contract / Policy

Status: complete

Phase: P119 Founder Runtime Approval Decision Recording Boundary

Subphase: P119.1 Approval Decision Recording Contract / Policy

Goal: define the approval-decision recording boundary, implementation-grade
subphase split, safety policy, reuse rules, validation commands, and OS
handoff from P118 without implementing approval capture, approval persistence,
approve/reject decision recording, DB/runtime writes, or runtime execution.

Why this is needed: P118 closed the approval capture boundary as read-only.
P119 must define exactly what founder approval decision recording can mean
before any UI control, persistence path, or runtime admission flow is added.

User/operator impact: operators can see P119 started and split. No new
founder-facing approve/reject action is enabled in P119.1; existing approval
capture boundary summaries remain read-only.

Command Center impact: no Command Center source changes in P119.1. Preserve
the P118 approval capture boundary UX on Business Build and Agent Flow. Keep
Chat with NEXUS and Lite chat clean.

Safety impact: P119.1 is contract-only. It does not enable approval capture,
approval persistence, approve/reject decision recording, DB/runtime writes,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, or spend.

Cost impact: docs/checkers/status only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `8ad466c0`.

Allowed files:
- `contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json`
- `docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md`
- `scripts/check-p1191-founder-runtime-approval-decision-recording-boundary-contract.js`
- `scripts/check-p1187-founder-runtime-approval-capture-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1187-founder-runtime-approval-capture-boundary-report.md`
- `reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files expected to change:
- P119 contract
- P119.1 checker
- P118.7 checker handoff acceptance
- OS status checker P119.1-P119.7 recognition
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
- add `contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json`
- add `docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md`
- add `scripts/check-p1191-founder-runtime-approval-decision-recording-boundary-contract.js`
- update `scripts/check-p1187-founder-runtime-approval-capture-boundary.js`
- update `scripts/check-os-phase-status.js`
- update package/docs/status/reports

Expected exports, schemas, and data shapes: no runtime data shape, schema, DB
table, approval decision payload, or write path is introduced. P119.1 creates
only a contract JSON document and markdown validation report.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
existing P118 validation patterns, existing OS phase status validation, and
existing roadmap/status reporting. Do not duplicate report writers, checker
formatters, phase status updaters, redaction helpers, mode guards, route
matrices, UI card/tab/status components, or audit/activity appenders.

Command Center UX requirements: preserve P118.5 approval-capture boundary UX.
Do not add UI controls, route labels, submit buttons, approve/reject buttons,
save decision buttons, raw JSON/log/policy dumps, raw private IDs, raw DB table
names, internal phase labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P119.1 because there is
no UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P119.1 contract checker covering contract
shape, subphase completeness, P118 closure, P119.1 status, docs/report
alignment, safety wording, allowed file scope, and P118.7 handoff acceptance.
Update OS phase status validation to recognize P119.1-P119.7.

Docs/README/roadmap updates: P119.1 is recorded in this plan, README, platform
roadmap, P119 contract, OS roadmap/status, and generated reports. P119.2 is
next for approval decision schema metadata.

OS phase status update: P119 is in progress; P119.1 is complete; current phase
P119.1; previous P118.7; next P119.2.

Reports to regenerate:
- `reports/p1187-founder-runtime-approval-capture-boundary-report.md`
- `reports/p1191-founder-runtime-approval-decision-recording-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1191-founder-runtime-approval-decision-recording-boundary-contract`
- `npm run check:p1187-founder-runtime-approval-capture-boundary`
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
- `git add <allowed P119.1 files>`
- `git commit -m "feat(nexus): implement p1191 approval decision contract"`
- stamp P119/P119.1 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1191 approval decision contract"`
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

Known risks: decision-recording language can imply live approve/reject
authority. P119.1 keeps the work contract-only and repeats the blocked decision
recording, DB write, execution, dispatch, project mutation, deploy/package,
network, and spend posture.

Rollback plan: remove the P119.1 contract/checker/docs/status/report changes,
restore P119 to planned, set current phase back to P118.7, and keep P118
complete.

## Planned Subphase Controls

P119.2 Approval Decision Schema Metadata: define browser-safe metadata for
future approval decision requests, events, and evidence references without DB
files or writes.

P119.3 Governed Local Approval Decision Intent Model: add a pure local model
that describes future approve/reject decision intent while recording no
decision.

P119.4 Approval Decision Safe Dry Run: produce a local preview that summarizes
decision readiness while keeping approve/reject decisions, persistence, writes,
and runtime execution blocked.

P119.5 Command Center Approval Decision Boundary UX: show scoped readiness on
Business Build and Agent Flow only, with no approve/reject or save controls.

P119.6 Approval Decision Validation / Docs: validate P119.1-P119.5 together,
regenerate reports, and preserve UX without adding new UI or controls. No
approval decision recording or runtime authority may be added.

P119.7 Final Validation: close P119, record a planned next phase, rerun
aggregate checks, ensure no stale phase status remains, and keep approval
capture/persistence/decision recording/execution blocked unless a future phase
explicitly grants narrow authority.
