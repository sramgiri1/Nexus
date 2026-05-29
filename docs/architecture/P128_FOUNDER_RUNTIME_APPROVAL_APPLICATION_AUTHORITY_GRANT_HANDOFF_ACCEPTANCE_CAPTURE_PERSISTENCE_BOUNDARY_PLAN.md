# P128 Founder Runtime Approval Application Authority Grant Handoff Acceptance Capture Persistence Boundary Plan

## Scope Classification

NEXUS_OS_CHANGE. P128 is NEXUS OS work only. It must not modify project,
CareLoop, generated project, provider, tool, worker runtime, deploy, release,
export, package, local runtime state, DB, or environment files unless a later
explicit subphase allows a narrow exception.

## P128 Subphase Split

P128 is split into seven implementation-grade subphases:

- P128.1 Capture Persistence Boundary Contract / Policy
- P128.2 Capture Persistence Schema Metadata
- P128.3 Capture Persistence Intent Model
- P128.4 Capture Persistence Safe Dry Run
- P128.5 Command Center Capture Persistence UX
- P128.6 Capture Persistence Validation / Docs
- P128.7 Final Validation

## P128.1 Capture Persistence Boundary Contract / Policy

Phase: P128
Subphase: P128.1
Goal: Create the P128 implementation-grade contract, seven-subphase split,
safety rules, docs, status handoff, and checker while keeping acceptance
capture persistence blocked.
Why this is needed: P127 proved local acceptance capture readiness. P128 needs
a governed persistence boundary before any later CRUD-backed capture can be
designed or exposed.
User/operator impact: Operators can see that persistence boundary planning has
started and that writes remain unavailable.
Command Center impact: No dashboard source or test changes. Existing P127.5
Business Build and Agent Flow read-only capture cards remain scoped. Chat with
NEXUS and Lite remain clean.
Safety impact: P128.1 does not persist acceptance capture, create DB schemas,
create migrations, write DB/runtime records, capture acceptance, accept
handoff, hand off authority, grant authority, activate authority, apply
approvals, record approve/reject decisions, unlock execution, call
providers/models, dispatch agents, execute workers/tools, mutate projects,
deploy, release, export, package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only.
Project/OS scope: NEXUS OS only.

Files expected to change:
- `contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json`
- `docs/architecture/P128_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_PLAN.md`
- `scripts/check-p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js`
- `scripts/check-p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md`
- `reports/p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
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

Tests to add/update/remove:
- Add `scripts/check-p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`.
- Update the P127.7 checker so it accepts the P128.1 handoff.
- Update `scripts/check-os-phase-status.js` so P128.1-P128.7 are recognized.
- Do not add or remove Playwright tests in P128.1 because no UX changes.

Docs to update:
- This P128 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P127.7 report.
- P128.1 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P128 in progress.
- P128.1 complete.
- Current phase P128.1.
- Previous phase P127.7.
- Next phase P128.2.

Known risks:
- Long phase names can make package script and checker coverage brittle.
- Public docs could accidentally imply persistence is live. The checker blocks
  unsafe positive claims.

Rollback plan:
- Revert the P128.1 implementation and stamp commits only. P127.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:p1277-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture appears only on scoped pages"`
- `git diff --check`

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P128.4 Capture Persistence Safe Dry Run

Status: complete
Phase: P128
Subphase: P128.4
Goal: Add a local result-envelope safe dry-run preview for acceptance capture
persistence while keeping every persistence, DB/runtime write, authority, and
execution action blocked.
Why this is needed: P128.3 modeled acceptance capture persistence intent.
P128.4 turns that model into a checker-validated preview artifact that P128.5
can expose in scoped Command Center UX without creating live persistence.
User/operator impact: Operators can inspect display-safe persistence preview
rows, blockers, owner, evidence/activity labels, and cost impact before any
live persistence path exists.
Command Center impact: No dashboard source or test changes. The preview remains
hidden from primary UX until P128.5. Existing route-wide navigation, Lite,
Chat with NEXUS, System/Dark/Light themes, and DemoApp isolation stay intact.
Safety impact: P128.4 does not persist acceptance capture, create DB schemas,
create migrations, write DB/runtime records, capture acceptance, accept
handoff, hand off authority, grant authority, activate authority, apply
approvals, record approve/reject decisions, unlock execution, call
providers/models, dispatch agents, execute workers/tools, mutate projects,
deploy, release, export, package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun.js`
- `scripts/check-p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json`
- `docs/architecture/P128_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
- `reports/p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Files forbidden to change:
- `projects/**`
- `careloop/**`
- `generated-projects/**`
- `dashboard/src/**`
- `dashboard/tests/**`
- `db/**`
- `local-state/runtime/**`
- `providers/**`
- `tools/**`
- `worker-runtime/**`
- `deploy/**`
- `release/**`
- `exports/**`
- `packages/**`
- `.env*`

Tests to add/update/remove:
- Add `scripts/check-p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`.
- Update the P128.3 checker so it accepts the P128.4 handoff.
- Do not add or remove Playwright tests in P128.4 because no UX changes.

Docs to update:
- This P128 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P128.3 report.
- P128.4 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P128 in progress.
- P128.4 complete.
- Current phase P128.4.
- Previous phase P128.3.
- Next phase P128.5.

Known risks:
- Dry-run wording could imply live persistence. The checker enforces
  local-only dry-run mode, zero candidate counts, false authority flags, and
  blocked write/execution actions.

Rollback plan:
- Revert the P128.4 implementation and stamp commits only. P128.3 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture appears only on scoped pages"`
- `git diff --check`

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P128.3 Capture Persistence Intent Model

Status: complete
Phase: P128
Subphase: P128.3
Goal: Add a local intent model that normalizes acceptance capture persistence
readiness, blockers, owner/evidence/activity labels, and zero candidate counts
without creating records or write paths.
Why this is needed: P128.2 defined schema metadata. P128.3 turns it into a
reusable intent surface for P128.4 safe dry-run planning.
User/operator impact: Operators can see exactly why persistence is blocked and
what the next safe planning action is without any live persistence.
Command Center impact: No dashboard source or test changes. Existing P127.5
Business Build and Agent Flow read-only capture cards remain scoped. Chat with
NEXUS and Lite remain clean.
Safety impact: P128.3 does not persist acceptance capture, create DB schemas,
create migrations, write DB/runtime records, capture acceptance, accept
handoff, hand off authority, grant authority, activate authority, apply
approvals, record approve/reject decisions, unlock execution, call
providers/models, dispatch agents, execute workers/tools, mutate projects,
deploy, release, export, package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only.
Project/OS scope: NEXUS OS only.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel.js`
- `scripts/check-p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-os-phase-status.js`
- `contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json`
- `docs/architecture/P128_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
- `reports/p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
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

Tests to add/update/remove:
- Add `scripts/check-p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`.
- Update the P128.2 checker so it accepts the P128.3 handoff.
- Do not add or remove Playwright tests in P128.3 because no UX changes.

Docs to update:
- This P128 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P128.2 report.
- P128.3 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P128 in progress.
- P128.3 complete.
- Current phase P128.3.
- Previous phase P128.2.
- Next phase P128.4.

Known risks:
- Intent state names could imply live persistence. The checker enforces
  allowlisted states, zero candidate counts, and false persistence/write flags.

Rollback plan:
- Revert the P128.3 implementation and stamp commits only. P128.2 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture appears only on scoped pages"`
- `git diff --check`

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.

## P128.2 Capture Persistence Schema Metadata

Status: complete
Phase: P128
Subphase: P128.2
Goal: Add browser-safe local metadata for the acceptance capture persistence
record shape without creating DB tables, migrations, writes, or runtime state.
Why this is needed: P128.1 created the boundary. P128.2 gives later intent,
dry-run, and UX subphases a reusable local metadata shape without implying
live persistence.
User/operator impact: Operators can inspect the future persistence draft,
event, and evidence concepts in docs/reports while all writes remain blocked.
Command Center impact: No dashboard source or test changes. Existing P127.5
Business Build and Agent Flow read-only capture cards remain scoped. Chat with
NEXUS and Lite remain clean.
Safety impact: P128.2 does not persist acceptance capture, create DB schemas,
create migrations, write DB/runtime records, capture acceptance, accept
handoff, hand off authority, grant authority, activate authority, apply
approvals, record approve/reject decisions, unlock execution, call
providers/models, dispatch agents, execute workers/tools, mutate projects,
deploy, release, export, package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only.
Project/OS scope: NEXUS OS only.

Files expected to change:
- `shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata.js`
- `scripts/check-p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-os-phase-status.js`
- `contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json`
- `docs/architecture/P128_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_PLAN.md`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
- `reports/p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
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

Tests to add/update/remove:
- Add `scripts/check-p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`.
- Update the P128.1 checker so it accepts the P128.2 handoff.
- Do not add or remove Playwright tests in P128.2 because no UX changes.

Docs to update:
- This P128 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P128.1 report.
- P128.2 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P128 in progress.
- P128.2 complete.
- Current phase P128.2.
- Previous phase P128.1.
- Next phase P128.3.

Known risks:
- Metadata could be mistaken for a live DB schema. The checker enforces
  metadata-only wording, no raw SQL, and all write/runtime flags false.

Rollback plan:
- Revert the P128.2 implementation and stamp commits only. P128.1 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:p1281-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture appears only on scoped pages"`
- `git diff --check`

Final response checklist:
- Branch name.
- Commit hash.
- Files changed.
- What was implemented.
- Command Center UX preservation.
- Tests/checkers run.
- Dashboard build/unit/page results.
- Docs/README/roadmap updates.
- OS phase status update.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.
