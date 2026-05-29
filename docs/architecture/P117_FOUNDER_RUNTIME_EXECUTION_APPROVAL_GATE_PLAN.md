# P117 Founder Runtime Execution Approval Gate Plan

## P117 Subphase Split

- P117.1 Runtime Execution Approval Contract / Policy
- P117.2 Approval Evidence Schema Metadata
- P117.3 Governed Local Approval Decision Model
- P117.4 Approval Gate Preview / Safe Dry Run
- P117.5 Command Center Approval Gate UX
- P117.6 Approval Gate Validation / Docs
- P117.7 Final Validation

## P117.1 Runtime Execution Approval Contract / Policy

Status: complete

Scope classification: NEXUS_OS_CHANGE

Narrow goal: define the P117 approval-gate contract, subphase split, safety
policy, reuse rules, validation commands, and OS handoff records without
implementing approval behavior.

Allowed files:
- `contracts/os-roadmap/p117-founder-runtime-execution-approval-gate-contracts.json`
- `docs/architecture/P117_FOUNDER_RUNTIME_EXECUTION_APPROVAL_GATE_PLAN.md`
- `scripts/check-p1171-founder-runtime-execution-approval-gate-contract.js`
- `scripts/check-p1167-founder-live-runtime-execution-readiness.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1167-founder-live-runtime-execution-readiness-report.md`
- `reports/p1171-founder-runtime-execution-approval-gate-contract-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:
- `projects/**`
- `careloop/**`
- `generated-projects/*/Sources/**`
- `generated-projects/*/Tests/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `live-ready/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`
- `local-state/runtime/**`

Exact files/modules changed: added the P117 contract and P117.1 checker,
updated the P116.7 handoff checker, updated OS phase status checker IDs,
registered the package script, updated docs/roadmap/status, and regenerated
reports.

Expected exports and data shapes: no runtime approval data shape is introduced
in P117.1. Future subphases must add schemas/models only after scoped plans.

Command Center UX requirements: no Command Center source change. Preserve P116
runtime execution readiness UX. Do not add approval buttons, run buttons, raw
IDs, raw logs, raw policy dumps, or fake actions.

Dark/light/system theme requirements: preserve existing System, Dark, and Light
theme behavior. No UI source changes are made.

Playwright tests: no new Playwright test because P117.1 has no UI source
changes. Existing route-wide safety tests remain in place.

Checker updates: P117.1 adds a contract checker, updates P116.7 final handoff
validation to accept P117.1, and updates OS phase status validation to recognize
P117.1-P117.7.

Docs/README/roadmap updates: P117.1 is recorded in this plan, README, platform
roadmap, P117 contract, OS roadmap/status, and generated reports. P117.2 is
next for approval evidence schema metadata.

OS phase status update: P117 is in progress; P117.1 is complete; current phase
P117.1; previous P116.7; next P117.2.

Validation commands:
- `npm run check:p1171-founder-runtime-execution-approval-gate-contract`
- `npm run check:p1167-founder-live-runtime-execution-readiness`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `git diff --check`

Final safety checks: no project/CareLoop paths changed; no approval capture,
approval persistence, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL, deploy, release, export, package, network, or provider spend authority
is enabled; no DemoApp exposure, raw private IDs, raw DB table names, raw
JSON/log/policy dumps, or fake actions are introduced.

Git add/commit/push commands:
- `git add <allowed P117.1 files>`
- `git commit -m "feat(nexus): implement p1171 execution approval contract"`
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

Known risks: approval-gate language can be mistaken for live approval capture.
P117.1 keeps approval capture, approval persistence, runtime execution, and
execution unlock blocked.

Rollback plan: remove the P117 contract/checker/plan/status/report/package
updates, restore P117 to the planned placeholder, and restore current phase to
P116.7 complete.
