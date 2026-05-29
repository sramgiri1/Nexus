# P127 Founder Runtime Approval Application Authority Grant Handoff Acceptance Capture Boundary Plan

P127 governs approval application authority grant handoff acceptance capture.
It does not capture acceptance, accept handoff, hand off authority, grant
authority, activate authority, apply approvals, write DB/runtime state, unlock
execution, call providers/models, dispatch agents, mutate projects, deploy,
release, export, package, use network calls, or spend.

## P127.1 Acceptance Capture Boundary Contract / Policy

Phase: P127 Founder Runtime Approval Application Authority Grant Handoff
Acceptance Capture Boundary
Subphase: P127.1 Acceptance Capture Boundary Contract / Policy

Goal: create the P127 implementation-grade contract, seven-subphase split,
safety rules, docs, status handoff, and checker while keeping acceptance
capture blocked.

Why this is needed: P126 closed with a planned-only P127 marker. P127.1 turns
that marker into a governed implementation contract before metadata, model,
dry-run, or UX work can proceed.

User/operator impact: OS Roadmap shows P127 in progress with P127.2 next and
clear blocked behavior for live acceptance capture.

Command Center impact: no dashboard source/test changes. Existing P126.5
scoped read-only acceptance boundary UX remains on Business Build and Agent
Flow only. Chat with NEXUS, Lite, OS Roadmap, Live Readiness, and unrelated
pages stay clean.

Safety impact: contract/policy-only. Acceptance capture, handoff acceptance,
authority handoff, authority grant, activation, approval application, approval
capture, approval persistence, approve/reject decision recording, DB/runtime
writes, runtime execution, execution unlock, provider/model calls, agent
dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL
interface, deploy, release, export, package, network call, and provider spend
remain blocked.

Cost impact: no provider calls, model calls, network calls, worker runtime,
deploy/package creation, or provider spend.

Project/OS scope: NEXUS_OS_CHANGE.

Files expected to change:
- `contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json`
- `docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md`
- `scripts/check-p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js`
- `scripts/check-p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md`
- `reports/p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
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
acceptance capture records, DB write shapes, provider envelopes, dispatch
packets, or project data are created.

Command Center UX requirements: no new cards, routes, controls, dashboard
source, or dashboard test changes. Do not show raw reports, raw IDs, raw JSON,
raw logs, raw policy dumps, DemoApp, or fake runnable actions.

Validation commands:
- `npm run check:p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:p1267-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance appears only on scoped pages"`
- `git diff --check`

OS phase status update: P127 in progress, P127.1 complete, current phase
P127.1, previous phase P126.7, next phase P127.2. P127.2-P127.7 remain
planned-only.

Known risks: capture language can imply live approval recording. P127.1 keeps
the phase contract-only and repeats that capture, writes, execution, providers,
dispatch, mutation, network, and spend remain blocked.

Rollback plan: remove the P127 contract/plan/checker/report/package script,
revert P126.7 checker and OS checker updates, restore P127 to planned, and
return current phase to P126.7.

Status: complete.

## Planned Subphase Contracts

P127.2 Acceptance Capture Eligibility Metadata: planned. Browser-safe metadata
only. No acceptance capture records, writes, execution, providers, dispatch,
mutation, network, or spend.

P127.3 Governed Acceptance Capture Intent Model: planned. Local model only.
No acceptance capture, writes, execution, providers, dispatch, mutation,
network, or spend.

P127.4 Acceptance Capture Safe Dry Run: planned. Local dry-run envelope only.
No acceptance capture, writes, execution, providers, dispatch, mutation,
network, or spend.

P127.5 Command Center Acceptance Capture UX: planned. Scoped read-only UX only
if explicitly implemented later. No Chat/Lite leakage and no runnable capture
controls.

P127.6 Acceptance Capture Validation / Docs: planned validation/docs closure
only.

P127.7 Final Validation: planned final validation only.
