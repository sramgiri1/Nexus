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

## Planned Subphase Controls

P123.1 Activation Boundary Contract / Policy is complete. P123.2 is next for
activation eligibility metadata. Activation, approval decision application,
approval capture, approval persistence, approve/reject decision recording,
DB/runtime writes, runtime execution, execution unlock, provider/model calls,
agent dispatch, worker/tool execution, project mutation, hosted DB mutation,
raw SQL, deploy, release, export, package, network calls, and provider spend
remain blocked unless a future subphase explicitly grants narrow authority.
