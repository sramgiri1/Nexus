# P126 Founder Runtime Approval Application Authority Grant Handoff Acceptance Boundary Plan

P126 defines a governed local acceptance boundary for approval application
authority grant handoff. It does not accept handoff, capture acceptance, hand
off authority, grant authority, activate authority, apply approvals, write
DB/runtime state, unlock execution, call providers/models, dispatch agents,
mutate projects, deploy, release, export, package, use network calls, or spend.

## P126.1 Acceptance Boundary Contract / Policy

Phase: P126 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Boundary
Subphase: P126.1 Acceptance Boundary Contract / Policy

Goal: create the P126 implementation-grade acceptance boundary contract,
seven-subphase split, safety rules, reuse requirements, validation commands,
docs, and status handoff without accepting live authority handoff.

Why this is needed: P126 existed as a planned marker after P125.7. P126.1
turns it into a governed implementation contract before any metadata, model,
dry-run, or UX work can proceed.

Scope classification: NEXUS_OS_CHANGE.

Files expected to change:
- `contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json`
- `docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md`
- `scripts/check-p1257-founder-runtime-approval-application-authority-grant-handoff.js`
- `scripts/check-p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1257-founder-runtime-approval-application-authority-grant-handoff-report.md`
- `reports/p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
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

Expected exports: none.

Data shape: contract/status/report evidence only. No runtime exports, schemas,
acceptance records, project data, provider envelopes, dispatch packets, or DB
write shapes are created.

Command Center UX requirements: no new cards, routes, controls, or dashboard
source/test changes. Preserve the existing scoped P125 handoff UX on Business
Build and Agent Flow only, with no DemoApp, raw dumps, raw private IDs, or fake
runnable actions.

Validation commands:
- `npm run check:p1261-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:p1257-founder-runtime-approval-application-authority-grant-handoff`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff appears only on scoped pages"`
- `git diff --check`

OS phase status update: P126 in progress, P126.1 complete, current phase
P126.1, previous phase P125.7, next phase P126.2. P126.2-P126.7 remain
planned-only.

Known risks: acceptance language can imply live approval capture. P126.1 keeps
the phase contract-only and repeats that acceptance, writes, execution,
providers, dispatch, mutation, network, and spend remain blocked.

Rollback plan: remove the P126 contract/checker/plan/package script/report,
revert P125.7 checker/report and status/docs changes, restore P126 to planned,
and return current phase to P125.7.

Status: complete.

## Planned Subphase Contracts

P126.2 Acceptance Eligibility Metadata: browser-safe local metadata only. No
handoff acceptance, writes, execution, providers, dispatch, mutation, network,
or spend.

P126.3 Governed Acceptance Intent Model: local readiness model only. No handoff
acceptance, writes, execution, providers, dispatch, mutation, network, or spend.

P126.4 Acceptance Safe Dry Run: local dry-run envelope only. No handoff
acceptance, writes, execution, providers, dispatch, mutation, network, or spend.

P126.5 Command Center Acceptance Boundary UX: scoped read-only Business Build
and Agent Flow UX only. No Chat/Lite/OS Roadmap leakage and no runnable
acceptance controls.

P126.6 Acceptance Validation / Docs: validation/docs closure only.

P126.7 Final Validation: final validation only, closes P126, stamps real
commits, creates the next planned handoff, and keeps live acceptance blocked.
