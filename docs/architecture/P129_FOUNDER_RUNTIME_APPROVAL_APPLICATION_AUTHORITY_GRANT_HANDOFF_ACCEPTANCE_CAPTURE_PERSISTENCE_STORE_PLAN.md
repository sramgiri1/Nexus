# P129 Founder Runtime Approval Application Authority Grant Handoff Acceptance Capture Persistence Store Plan

## Scope Classification

NEXUS_OS_CHANGE. P129 is NEXUS OS work only. P129.1 must not modify project,
CareLoop, generated project, dashboard source/test, provider, tool, worker
runtime, deploy, release, export, package, local runtime state, DB, or
environment files.

## P129 Subphase Split

P129 is split into seven implementation-grade subphases:

- P129.1 Persistence Store Contract / Policy
- P129.2 Store Record Schema Metadata
- P129.3 Store Repository Intent Model
- P129.4 Store Migration Preview
- P129.5 Store CRUD Safe Dry Run
- P129.6 Command Center Store UX
- P129.7 Final Validation

## P129.1 Persistence Store Contract / Policy

Status: complete
Phase: P129
Subphase: P129.1
Goal: Create the P129 implementation-grade contract, seven-subphase split,
safety rules, docs, status handoff, and checker while keeping store CRUD and
DB/runtime writes blocked.
Why this is needed: P128 closed the acceptance capture persistence boundary.
P129 needs a store-specific contract before later local CRUD or DB work can be
implemented safely.
User/operator impact: Operators can see P129 started, P129.1 complete, P129.2
next, and exactly which store capabilities remain unavailable until narrower
subphases implement them.
Command Center impact: No dashboard source or route test changes. Existing
P128 read-only capture persistence cards stay scoped to Business Build and
Agent Flow; Chat with NEXUS and Lite stay clean.
Safety impact: P129.1 does not create DB schemas, create migrations, write
DB/runtime records, persist acceptance capture, run CRUD actions, capture
acceptance, accept handoff, hand off authority, grant authority, activate
authority, apply approvals, record approve/reject decisions, unlock execution,
call providers/models, dispatch agents, execute workers/tools, mutate projects,
deploy, release, export, package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.

Files expected to change:
- `contracts/os-roadmap/p129-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-contracts.json`
- `docs/architecture/P129_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_PLAN.md`
- `scripts/check-p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js`
- `scripts/check-p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md`
- `reports/p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
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
- Add `scripts/check-p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`.
- Update the P128.7 checker so it accepts the P129.1 handoff.
- Update `scripts/check-os-phase-status.js` so P129.1-P129.7 are recognized.
- Do not add or remove Playwright tests in P129.1 because primary UX does not
  change.

Docs to update:
- This P129 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P128.7 report.
- P129.1 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P129 in progress.
- P129.1 complete.
- Current phase P129.1.
- Previous phase P128.7.
- Next phase P129.2.

Known risks:
- Store wording can imply live CRUD exists. The checker blocks unsafe positive
  claims, raw table names, raw SQL wording, and fake runnable action phrases.

Rollback plan:
- Revert the P129.1 implementation and stamp commits only. P128.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1291-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:p1287-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Approval application authority grant handoff acceptance capture persistence appears only on scoped pages"`
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
