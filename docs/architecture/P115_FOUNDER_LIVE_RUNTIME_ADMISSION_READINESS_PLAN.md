# P115 Founder Live Runtime Admission Readiness Plan

## P115.1 Runtime Admission Contract / Policy

Phase: P115 Founder Live Runtime Admission Readiness

Subphase: P115.1 Runtime Admission Contract / Policy

Status: complete

Goal: define the P115 implementation-grade contract for moving dispatch
readiness toward governed runtime admission readiness without enabling runtime
admission or execution.

Why this is needed: P114 closed dispatch readiness and handed off to P115. P115
needs its own contract, safety rules, reuse requirements, checker coverage, and
OS status entries before any runtime-admission work can begin.

User/operator impact: operators get a clear next phase and know runtime
admission remains blocked until a later explicitly scoped subphase.

Command Center impact: no UI source changes in P115.1. Existing Command Center
UX is preserved.

Safety impact: P115.1 is contract, docs, checker, and status only. It does not
add runtime admission, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy,
release, export, package, network calls, or provider spend.

Cost impact: local checkers only. No provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`. No project source or CareLoop files are
modified.

Allowed files:
- `contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json`
- `scripts/check-p1151-founder-live-runtime-admission-contract.js`
- `scripts/check-p1147-founder-live-agent-dispatch-readiness.js`
- `scripts/check-os-phase-status.js`
- `docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1151-founder-live-runtime-admission-contract-report.md`
- `reports/p1147-founder-live-agent-dispatch-readiness-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/*/Sources/**`
- `generated-projects/*/Tests/**`
- `db/**`
- `live-ready/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules changed: added the P115 contract, added the P115.1 checker,
updated P114.7 and OS phase-status compatibility checkers, registered the
package script, created this plan, updated README/platform roadmap and OS
status, and regenerated reports.

Expected exports, schemas, and data shapes: no runtime exports, schemas, or
data shapes are added in P115.1.

Command Center UX requirements: preserve existing Command Center UX. Do not add
runtime admission controls, fake run controls, raw IDs, raw logs, raw policy
dumps, or chat-page clutter.

Dark/light/system theme requirements: preserve existing theme behavior. No UI
source changes are made.

Playwright tests: no new Playwright test is added because P115.1 has no UI
source changes. Existing route-wide safety tests remain in place.

Checker updates: P115.1 adds a dedicated contract checker and updates the P114.7
and OS phase-status checkers to accept the P115.1/P115.2 handoff.

Docs/README/roadmap updates: P115.1 is recorded in this plan, README, platform
roadmap, P115 contract, OS roadmap/status, and generated reports. P115.2 is
next for local admission schema metadata.

OS phase status update: P115 is in progress; P115.1 is complete; current phase
P115.1; previous P114.7; next P115.2.

Validation commands:
- `npm run check:p1151-founder-live-runtime-admission-contract`
- `npm run check:p1147-founder-live-agent-dispatch-readiness`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no runtime admission,
execution unlock, provider/model calls, agent dispatch, worker/tool execution,
project mutation, hosted DB mutation, raw SQL, deploy, release, export,
package, network, or provider spend authority is enabled; no DemoApp exposure,
raw private IDs, raw DB table names, raw JSON/log/policy dumps, or fake actions
are introduced.

Git add/commit/push commands:
- `git add <allowed P115.1 files>`
- `git commit -m "feat(nexus): implement p1151 runtime admission contract"`
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

Known risks: P115.1 only names the runtime admission readiness phase. It does
not prove schema, CRUD, preview, UX, or final runtime-admission readiness yet.

Rollback plan: remove P115.1 contract/checker/docs/status/package/report
updates, restore P114.7 as current with P115 as a placeholder, and keep P114
complete.

## P115.2 Local Admission Schema Metadata

Phase: P115 Founder Live Runtime Admission Readiness

Subphase: P115.2 Local Admission Schema Metadata

Status: complete

Goal: add local schema metadata and isolated SQLite validation for runtime
admission readiness records, runtime admission events, and runtime admission
evidence references.

Why this is needed: P115.1 created the implementation contract only. P115.2
gives later CRUD and preview subphases a typed local schema boundary without
enabling runtime admission.

User/operator impact: operators can trace runtime-admission readiness state in
future local flows, while runtime admission and execution remain blocked.

Command Center impact: no UI source changes in P115.2. Existing Command Center
UX is preserved.

Safety impact: P115.2 is local schema metadata and isolated checker validation
only. It does not add persistent runtime writes, hosted DB mutation, raw SQL,
runtime admission, execution unlock, provider/model calls, agent dispatch,
worker/tool execution, project mutation, deploy/release/export/package actions,
network calls, or provider spend.

Cost impact: isolated local SQLite validation only. No provider spend.

Project/OS scope: `NEXUS_OS_CHANGE`. No project source or CareLoop files are
modified.

Allowed files:
- `db/schema.json`
- `db/schema.sql`
- `scripts/check-p1151-founder-live-runtime-admission-contract.js`
- `reports/p1151-founder-live-runtime-admission-contract-report.md`
- `scripts/check-p1152-founder-live-runtime-admission-readiness.js`
- `contracts/os-roadmap/p115-founder-live-runtime-admission-readiness-contracts.json`
- `docs/architecture/P115_FOUNDER_LIVE_RUNTIME_ADMISSION_READINESS_PLAN.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `package.json`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1152-founder-live-runtime-admission-readiness-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/*/Sources/**`
- `generated-projects/*/Tests/**`
- `live-ready/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Exact files/modules changed: updated `db/schema.json` and `db/schema.sql`;
added `scripts/check-p1152-founder-live-runtime-admission-readiness.js`;
updated the P115.1 compatibility checker; registered the package script;
updated P115 contract/status/docs; and regenerated reports.

Expected exports, schemas, and data shapes: P115.2 adds local schema metadata
for runtime admission readiness items, runtime admission events, and runtime
admission evidence references. The schema records blocked admission, execution,
worker, project, provider, and spend authority flags only.

Command Center UX requirements: preserve existing Command Center UX. Future UX
must not expose raw runtime admission table names, raw IDs, raw logs, raw policy
dumps, or fake live run controls.

Dark/light/system theme requirements: preserve existing theme behavior. No UI
source changes are made.

Playwright tests: no new Playwright test is added because P115.2 has no UI
source changes. Existing route-wide safety tests remain in place.

Checker updates: P115.2 adds an isolated SQLite schema checker and updates the
P115.1 checker to accept the P115.2/P115.3 handoff.

Docs/README/roadmap updates: P115.2 is recorded in this plan, README, platform
roadmap, P115 contract, OS roadmap/status, and generated reports. P115.3 is
next for governed local admission CRUD modeling.

OS phase status update: P115 is in progress; P115.2 is complete; current phase
P115.2; previous P115.1; next P115.3.

Validation commands:
- `npm run check:p1152-founder-live-runtime-admission-readiness`
- `npm run check:p1151-founder-live-runtime-admission-contract`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no persistent runtime
DB remains; no runtime admission, execution unlock, provider/model calls, agent
dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL,
deploy, release, export, package, network, or provider spend authority is
enabled; no DemoApp exposure, raw private IDs, raw DB table names, raw
JSON/log/policy dumps, or fake actions are introduced.

Git add/commit/push commands:
- `git add <allowed P115.2 files>`
- `git commit -m "feat(nexus): implement p1152 runtime admission schema"`
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

Known risks: P115.2 adds local schema metadata only. CRUD behavior, preview
models, and Command Center UX are not complete until later P115 subphases.

Rollback plan: remove P115.2 schema/checker/docs/status/package/report updates,
restore P115 to P115.1 complete with P115.2 planned, and keep P115.1 contract
unchanged.
