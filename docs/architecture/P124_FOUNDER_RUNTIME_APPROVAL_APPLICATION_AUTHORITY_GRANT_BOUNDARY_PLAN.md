# P124 Founder Runtime Approval Application Authority Grant Boundary Plan

P124 defines the approval application authority grant boundary after P123
activation boundary closure. It does not grant authority, apply approvals, write
DB/runtime records, unlock execution, call providers/models, dispatch agents,
execute workers/tools, mutate projects, deploy, release, export, package, use
network calls, or spend.

Subphases:
- P124.1 Grant Boundary Contract / Policy
- P124.2 Grant Eligibility Metadata
- P124.3 Governed Grant Intent Model
- P124.4 Grant Safe Dry Run
- P124.5 Command Center Grant Boundary UX
- P124.6 Grant Validation / Docs
- P124.7 Final Validation

## P124.1 Grant Boundary Contract / Policy

Phase: P124 Founder Runtime Approval Application Authority Grant Boundary

Subphase: P124.1 Grant Boundary Contract / Policy

Goal: create the implementation-grade P124 contract and subphase split for a
future approval application authority grant boundary, without granting authority
or changing runtime behavior.

Why this is needed: P123 closed the activation boundary, but live authority
grant remains blocked. P124 needs a narrow contract before any later phase can
consider grant behavior, approval application, writes, execution, or spend.

User/operator impact: operators get a clear next phase that explains what grant
readiness would require and what remains blocked.

Command Center impact: no UI changes in P124.1. Existing Business Build and
Agent Flow activation boundary cards remain as-is.

Safety impact: authority grant, activation, approval application, approval
capture, approval persistence, approve/reject decision recording, DB/runtime
writes, runtime execution, execution unlock, provider/model calls, agent
dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL,
deploy, release, export, package, network calls, and provider spend remain
blocked.

Cost impact: contract/checker/docs only. No provider calls, model calls,
network calls, worker runtime, deploy, package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE. No project source or CareLoop files are
allowed.

Starting branch and base commit: `codex/nexus-e2e-phase-validation` at
`97151c8e`.

Files expected to change:
- `contracts/os-roadmap/p124-founder-runtime-approval-application-authority-grant-boundary-contracts.json`
- `docs/architecture/P124_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_BOUNDARY_PLAN.md`
- `scripts/check-p1237-founder-runtime-approval-application-authority-activation-boundary.js`
- `scripts/check-p1241-founder-runtime-approval-application-authority-grant-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1237-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1241-founder-runtime-approval-application-authority-grant-boundary-report.md`
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
tables, or data model changes. P124.1 defines contract metadata and planned
subphase shapes only.

Reuse check: reuse `shared/reportWriter.js`, `shared/checkResultFormatter.js`,
the P123.7 checker handoff pattern, OS phase status checker conventions, and
phase validation coverage conventions. Do not duplicate report writers,
redaction helpers, result envelopes, mode guards, UI components, route
matrices, or activity/evidence/audit helpers.

Command Center UX requirements: preserve the existing scoped P123.5 activation
boundary card only on Business Build and Agent Flow. Do not add controls,
submit/apply/approve/grant actions, raw JSON/logs/policy dumps, raw private IDs,
raw DB/schema names, raw report paths, internal phase labels in primary UX, or
DemoApp exposure.

Dark/light/system theme requirements: no theme source changes. Existing P123.5
Playwright coverage must remain the route/theme regression guard.

Playwright tests: do not edit dashboard tests in this subphase. Run the existing
P123.5 focused Playwright test to confirm the scoped activation boundary remains
present and theme-safe.

Checker updates: add
`scripts/check-p1241-founder-runtime-approval-application-authority-grant-boundary.js`,
update the P123.7 checker so it accepts P124.1 handoff, and update the OS phase
status checker so P124.1-P124.7 are recognized.

Docs to update: this P124 plan, `README.md`, and
`docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- `reports/p1237-founder-runtime-approval-application-authority-activation-boundary-report.md`
- `reports/p1241-founder-runtime-approval-application-authority-grant-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

OS phase status update: P124 is in progress. P124.1 is complete. Current phase
is P124.1, previous phase is P123.7, and next phase is P124.2.

Validation commands:
- `npm run check:p1241-founder-runtime-approval-application-authority-grant-boundary`
- `npm run check:p1237-founder-runtime-approval-application-authority-activation-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority activation appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <allowed P124.1 files>`
- `git commit -m "feat(nexus): implement p1241 approval authority grant contract"`
- stamp P124/P124.1 status with the implementation commit
- `git add <allowed P124.1 status/report files>`
- `git commit -m "chore(nexus): stamp p1241 approval authority grant contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- confirm no forbidden project, CareLoop, generated project, dashboard source,
  dashboard test, DB, provider, tool, worker, deploy, release, export, package,
  local runtime state, or env paths changed.
- confirm no authority grant, activation, approval application, approval
  capture, approval persistence, approve/reject decision recording, DB/runtime
  write, runtime execution, execution unlock, provider/model call, agent
  dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL
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

Known risks: grant language can sound like live behavior. P124.1 is
contract-only and all grant/application/write/execution/spend paths remain
blocked.

Rollback plan: remove the P124 contract, plan, checker, report, package script,
contract/docs/status/report updates, restore P124 to planned, remove
P124.1-P124.7 OS checker recognition, and return current phase to P123.7.

Status: complete.

## Planned Subphase Contracts

P124.2 Grant Eligibility Metadata: metadata-only, allowed files are the planned
shared grant eligibility metadata module plus P124 contract/docs/checker/status
and reports. It forbids project, CareLoop, generated project, dashboard source,
dashboard tests, DB/runtime, provider/tool/worker, deploy/release/export/package,
local runtime state, and env files. Expected exports are
`FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_ELIGIBILITY_METADATA` and
`getFounderApprovalApplicationAuthorityGrantEligibilityMetadata`. It must
preserve Command Center UX, theme behavior, checker coverage, docs, reports,
status, validation commands, safety checks, and commit/push flow.

P124.3 Governed Grant Intent Model: model-only, allowed files are the planned
shared grant intent module, P124.2 metadata, P124 contract/docs/checker/status,
and reports. It forbids the same unsafe paths. Expected export is
`buildFounderApprovalApplicationAuthorityGrantIntent`. It must return
display-safe blocked readiness data and zero unsafe candidate counts without
granting authority.

P124.4 Grant Safe Dry Run: preview-only, allowed files are the planned safe
dry-run module, P124.3 intent model, P124 contract/docs/checker/status, and
reports. It forbids unsafe runtime and project paths. Expected export is
`buildFounderApprovalApplicationAuthorityGrantSafeDryRun`. It must reuse result
envelopes and keep persistence, execution, provider calls, network calls, and
spend blocked.

P124.5 Command Center Grant Boundary UX: scoped UX only, allowed files are the
existing Command Center data/page/test files, the P124.4 dry-run module, P124
contract/docs/checker/status, and reports. It must reuse existing cards/tabs and
route matrix patterns, preserve system/dark/light themes, show useful grant
state only on Business Build and Agent Flow, and avoid DemoApp, raw IDs, raw
dumps, fake actions, and mutation controls.

P124.6 Grant Validation / Docs: validation/docs only, allowed files are P124.5
checker, P124.6 checker, P124 contract/docs/status, README, roadmap, package
script, and reports. It must validate P124.1-P124.5 evidence and scoped UX
without changing runtime behavior or Command Center source.

P124.7 Final Validation: final validation only, allowed files are P124.6/P124.7
checkers, OS phase status checker, P124 contract/docs/status, README, roadmap,
package script, and reports. It must close P124, stamp real commits, create the
next planned handoff, and keep live grants blocked.
