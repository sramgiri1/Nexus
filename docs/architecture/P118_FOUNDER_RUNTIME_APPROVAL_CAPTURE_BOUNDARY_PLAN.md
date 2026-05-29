# P118 Founder Runtime Approval Capture Boundary Plan

## P118 Subphase Split

- P118.1 Approval Capture Contract / Policy
- P118.2 Approval Capture Schema Metadata
- P118.3 Governed Local Approval Intent Model
- P118.4 Approval Capture Safe Dry Run
- P118.5 Command Center Approval Capture Boundary UX
- P118.6 Approval Capture Validation / Docs
- P118.7 Final Validation

## P118.1 Approval Capture Contract / Policy

Status: complete

Phase: P118 Founder Runtime Approval Capture Boundary

Subphase: P118.1 Approval Capture Contract / Policy

Goal: define the approval-capture boundary, implementation-grade subphase split,
safety policy, reuse rules, validation commands, and OS handoff from P117
without implementing approval capture, approval persistence, DB writes, or
runtime execution.

Why this is needed: P117 closed the approval gate as readiness and preview.
P118 must define exactly what founder approval capture can mean before any UI
control, persistence path, or runtime admission flow is added.

User/operator impact: operators can see P118 started and split. No new
founder-facing approval action is enabled in P118.1; existing approval-gate
summaries remain read-only.

Command Center impact: no Command Center source changes in P118.1. Preserve the
P117 approval-gate UX on Business Build and Agent Flow. Keep Chat with NEXUS
and Lite chat clean.

Safety impact: P118.1 is contract-only. It does not enable approval capture,
approval persistence, approve/reject recording, DB writes, runtime execution,
execution unlock, provider/model calls, agent dispatch, worker/tool execution,
project mutation, hosted DB mutation, raw SQL, deploy, release, export,
package, network calls, or spend.

Cost impact: docs/checkers/status only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `5a78ec28`.

Allowed files:
- `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- `scripts/check-p1177-founder-runtime-execution-approval-gate.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- generated P117.7/P118.1/OS/coverage reports

Files expected to change:
- P118 contract
- P118.1 checker
- P117.7 checker handoff acceptance
- OS status checker P118.1-P118.7 recognition
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
- add `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- add `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- add `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- update `scripts/check-p1177-founder-runtime-execution-approval-gate.js`
- update `scripts/check-os-phase-status.js`
- update package/docs/status/reports

Expected exports, schemas, and data shapes: no runtime data shape, schema, DB
table, approval decision payload, or write path is introduced. P118.1 creates
only a contract JSON document and markdown validation report.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
existing P117 validation patterns, existing OS phase status validation, and
existing roadmap/status reporting. Do not duplicate report writers, checker
formatters, phase status updaters, redaction helpers, mode guards, route
matrices, UI card/tab/status components, or audit/activity appenders.

Command Center UX requirements: preserve P117.5 approval-gate UX. Do not add UI
controls, route labels, submit buttons, approval buttons, reject buttons, raw
JSON/log/policy dumps, raw private IDs, raw DB table names, internal phase
labels in primary UX, DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P118.1 because there is no
UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P118.1 contract checker covering contract
shape, subphase completeness, P117 closure, P118.1 status, docs/report
alignment, safety wording, allowed file scope, and P117.7 handoff acceptance.
Update OS phase status validation to recognize P118.1-P118.7.

Docs/README/roadmap updates: P118.1 is recorded in this plan, README, platform
roadmap, P118 contract, OS roadmap/status, and generated reports. P118.2 is
next for approval capture schema metadata.

OS phase status update: P118 is in progress; P118.1 is complete; current phase
P118.1; previous P117.7; next P118.2.

Reports to regenerate:
- `reports/p1177-founder-runtime-execution-approval-gate-report.md`
- `reports/p1181-founder-runtime-approval-capture-boundary-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1181-founder-runtime-approval-capture-boundary-contract`
- `npm run check:p1177-founder-runtime-execution-approval-gate`
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
- `git add <allowed P118.1 files>`
- `git commit -m "feat(nexus): implement p1181 approval capture contract"`
- stamp P118/P118.1 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1181 approval capture contract"`
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

Known risks: wording can imply live approval capture before the boundary is
implemented. The P118.1 checker rejects unsafe positive claims and fake runnable
actions.

Rollback plan: remove P118 contract/checker/docs/status/report updates, restore
P118 to a planned placeholder after P117.7, and keep P117 approval-gate UX
unchanged.

## P118.2 Approval Capture Schema Metadata

Status: complete

Phase: P118 Founder Runtime Approval Capture Boundary

Subphase: P118.2 Approval Capture Schema Metadata

Goal: add browser-safe approval capture schema metadata for future capture
requests, events, and evidence references without DB files, DB writes, approval
capture, approval persistence, or approval decision recording.

Why this is needed: P118.1 defines the boundary only. P118.2 gives later model
and UX subphases a typed metadata source for what would be captured while the
system remains read-only and blocked.

User/operator impact: no new action. Operators get clearer documentation and
validation of the approval capture data shape that future subphases may
preview.

Command Center impact: no Command Center source changes in P118.2. Preserve the
P117 approval-gate UX on Business Build and Agent Flow. Keep Chat with NEXUS
and Lite chat clean.

Safety impact: P118.2 is schema metadata only. It does not add DB schema files,
DB writes, approval capture, approval persistence, approve/reject recording,
runtime execution, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, or spend.

Cost impact: local checker/docs only. No provider/model/network/spend path.

Project/OS scope: NEXUS_OS_CHANGE.

Scope classification: NEXUS_OS_CHANGE.

Starting branch and expected base commit:
`codex/nexus-e2e-phase-validation` at `e6695c2b`.

Allowed files:
- `shared/founderApprovalCaptureSchemaMetadata.js`
- `scripts/check-p1182-founder-runtime-approval-capture-boundary.js`
- `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- `contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json`
- `docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- generated P118.1/P118.2/OS/coverage reports

Files expected to change:
- approval capture schema metadata helper
- P118.2 checker
- P118.1 checker handoff acceptance
- P118 contract and plan
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
- add `shared/founderApprovalCaptureSchemaMetadata.js`
- add `scripts/check-p1182-founder-runtime-approval-capture-boundary.js`
- update `scripts/check-p1181-founder-runtime-approval-capture-boundary-contract.js`
- update P118 contract/docs/status/reports

Expected exports, schemas, and data shapes:
- `FOUNDER_APPROVAL_CAPTURE_SCHEMA_METADATA_PHASE`
- `FOUNDER_APPROVAL_CAPTURE_SCHEMA_VERSION`
- `FOUNDER_APPROVAL_CAPTURE_ENTITY_NAMES`
- `FOUNDER_APPROVAL_CAPTURE_AUTHORITY_FLAGS`
- `FOUNDER_APPROVAL_CAPTURE_SCHEMA_ENTITIES`
- `buildFounderApprovalCaptureSchemaMetadata`

The data shape is metadata-only: capture request, capture event, and capture
evidence reference descriptions with display-safe labels, disabled reason,
owner/capability, evidence/activity labels, cost posture, redaction requirement,
and explicit false authority flags for every approval, write, execution,
provider, dispatch, project, deploy/release/export/package, network, and spend
capability.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
P118.1 checker/report patterns, existing OS phase status validation, and
existing phase coverage reporting. No existing shared approval-capture schema
metadata helper exists; the new helper is scoped for reuse by P118.3-P118.5.
Do not duplicate report writers, checker formatters, phase status updaters,
redaction helpers, mode guards, route matrices, UI components, or
audit/activity appenders.

Command Center UX requirements: no UI source change. Do not add submit buttons,
approval buttons, reject buttons, run controls, route labels, raw JSON/log/policy
dumps, raw private IDs, raw DB table names, internal phase labels in primary UX,
DemoApp, or fake working actions.

Dark/light/system theme requirements: preserve System, Dark, and Light theme
behavior by avoiding dashboard source changes in this subphase.

Playwright tests: no new Playwright test is added in P118.2 because there is no
UI source change. Existing route-wide safety tests remain the required UX
backstop.

Checker updates: add a dedicated P118.2 checker for metadata shape, exports,
blocked authority flags, docs/status alignment, allowed file scope, and safety
wording. Update the P118.1 checker to accept P118.2/P118.3 handoff.

Docs/README/roadmap updates: P118.2 is recorded in this plan, README, platform
roadmap, P118 contract, OS roadmap/status, and generated reports. P118.3 is
next for governed local approval intent modeling.

OS phase status update: P118 is in progress; P118.2 is complete; current phase
P118.2; previous P118.1; next P118.3.

Reports to regenerate:
- `reports/p1181-founder-runtime-approval-capture-boundary-contract-report.md`
- `reports/p1182-founder-runtime-approval-capture-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Validation commands:
- `npm run check:p1182-founder-runtime-approval-capture-boundary`
- `npm run check:p1181-founder-runtime-approval-capture-boundary-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`
- `find local-state/runtime -maxdepth 1 -name 'check-p118*.sqlite' -print`

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
- `git add <allowed P118.2 files>`
- `git commit -m "feat(nexus): implement p1182 approval capture schema"`
- stamp P118/P118.2 status with the implementation commit
- `git commit -m "chore(nexus): stamp p1182 approval capture schema"`
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

Known risks: metadata can drift into implementation behavior if it exposes
write handles or DB names. P118.2 keeps the helper metadata-only and the checker
rejects DB/runtime imports, raw table names in public docs, and unsafe positive
claims.

Rollback plan: remove the P118.2 helper/checker/docs/status/report changes,
restore P118.2 to planned, set current phase back to P118.1, and keep P118.1
complete.

## Planned Subphase Controls

P118.2 Approval Capture Schema Metadata is complete. The metadata helper is
available for reuse by later P118 model, preview, and UX subphases, while DB
writes and approval decision recording remain unavailable.

P118.3 Governed Local Approval Intent Model: create a pure local model only if
the subphase plan confirms no persistence or execution authority. Reuse shared
helpers and existing display-safe patterns. Validation must include a P118.3
checker and regression coverage. No approve/reject decision recording is
allowed.

P118.4 Approval Capture Safe Dry Run: build preview output for capture readiness
and blockers without accepting approvals or writing records. Reuse P118 model
helpers. Validation must prove all write, execution, provider, dispatch, and
project mutation counts remain zero.

P118.5 Command Center Approval Capture Boundary UX: if implemented, scoped
non-chat pages must show current state, next action, blockers, disabled reason,
owner/capability, evidence/activity location, and cost impact. Chat with NEXUS
and Lite must remain clean. Playwright must prove the boundary UI appears only
on scoped pages and preserves System/Dark/Light behavior.

P118.6 Approval Capture Validation / Docs: validate P118.1-P118.5 together,
regenerate reports, and preserve UX without adding new UI or controls. No
approval capture or runtime authority may be added.

P118.7 Final Validation: close P118, record a planned next phase, rerun
aggregate checks, ensure no stale phase status remains, and keep approval
capture/persistence/execution blocked unless a future phase explicitly grants
narrow authority.
