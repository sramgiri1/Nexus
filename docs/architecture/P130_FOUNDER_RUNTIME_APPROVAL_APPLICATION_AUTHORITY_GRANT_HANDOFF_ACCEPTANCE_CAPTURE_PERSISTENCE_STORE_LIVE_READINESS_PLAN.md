# P130 Founder Runtime Approval Application Authority Grant Handoff Acceptance Capture Persistence Store Live Readiness Plan

## Scope Classification

NEXUS_OS_CHANGE. P130 is NEXUS OS work only. P130.1 is contract/checker/docs/status
work only. It must not modify project, CareLoop, generated project, provider,
tool, worker runtime, deploy, release, export, package, local runtime state, DB,
or environment files.

## P130 Subphase Split

P130 is split into seven implementation-grade subphases:

- P130.1 Live Readiness Contract / Policy
- P130.2 Store Live Prerequisite Model
- P130.3 Store Live Approval Evidence Gate
- P130.4 Store Live Admission Safe Dry Run
- P130.5 Command Center Store Live Gate UX
- P130.6 Store Live Readiness Validation / Docs
- P130.7 Store Live Readiness Final Validation

## P130.1 Live Readiness Contract / Policy

Status: complete
Phase: P130
Subphase: P130.1
Goal: Create the P130 implementation-grade contract, seven-subphase split,
safety rules, docs, status handoff, and checker while keeping live store CRUD
and DB/runtime writes blocked.
Why this is needed: P129 completed the store metadata, repository intent,
migration preview, safe CRUD dry run, scoped Command Center readiness, and
final validation. P130 needs a narrow live-readiness gate before any future
store admission can be considered.
User/operator impact: OS Roadmap advances to P130.1 and shows P130 in progress
with P130.2 next for the prerequisite model.
Command Center impact: No dashboard source or route test changes. Business
Build and Agent Flow keep the P129.6 Capture Persistence Store Readiness card;
Chat with NEXUS and Lite stay clean.
Safety impact: P130.1 is contract/policy only. It does not create DB schemas,
migration files, raw SQL interfaces, DB reads, DB writes, runtime records, CRUD
actions, acceptance capture, handoff acceptance, authority handoff, authority
grant, activation, approval application, approve/reject recording, runtime
execution, provider/model calls, agent dispatch, project mutation, deploy,
release, export, package, network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `98b2d8da`

Files expected to change:
- `contracts/os-roadmap/p130-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-contracts.json`
- `docs/architecture/P130_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PLAN.md`
- `scripts/check-p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store.js`
- `scripts/check-p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-report.md`
- `reports/p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md`
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

Exact files/modules to create or update:
- Create `contracts/os-roadmap/p130-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-contracts.json`.
- Create `docs/architecture/P130_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_STORE_LIVE_READINESS_PLAN.md`.
- Create `scripts/check-p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js`.
- Update P129.7 checker so it accepts the P130.1 handoff.
- Update `scripts/check-os-phase-status.js` so P130.1-P130.7 are recognized.
- Update README, platform roadmap, package script, OS status, roadmap, and reports listed above.

Expected exports, schemas, and data shapes:
- No runtime exports.
- Data shape: validation/report/status evidence only. No DB schema, query,
  migration file, runtime record, live CRUD executor, provider envelope,
  dispatch packet, raw private ID, raw table name, or project data.

Reuse check:
- Reuse P129.6 display model and route coverage.
- Reuse P129.7 report/checker handoff evidence.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Do not duplicate report writers, checker formatters, result envelopes, mode
  guards, redaction helpers, route matrices, status helpers, UI components, or
  evidence/audit/activity appenders.

Command Center UX requirements:
- Preserve P129.6 Capture Persistence Store Readiness only on Business Build
  and Agent Flow.
- Chat with NEXUS and Lite remain chat-focused and clean.
- Do not expose raw JSON, raw logs, raw policy dumps, raw table names, DemoApp,
  raw report paths, internal phase labels, or private project IDs in primary UX.
- No provider/tool/project mutation, DB writes, live CRUD, migration execution,
  or deploy controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Run existing scoped route coverage that verifies all three themes for the
  store readiness card.

Tests to add/update/remove:
- Add `check:p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness`.
- Update P129.7 checker for P130.1 compatibility.
- Do not add or remove dashboard source or route tests in P130.1.

Checker updates:
- Validate P130 contract and seven-subphase split.
- Validate P130.1 status/docs/report handoff.
- Validate P129.7 accepts the P130.1 handoff.
- Validate forbidden paths and safe wording.

Docs to update:
- This P130 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P129.7 report.
- P130.1 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P130 in progress.
- P130.1 complete.
- Current phase P130.1.
- Previous phase P129.7.
- Next phase P130.2.

Known risks:
- P130 can be mistaken for live store execution. P130.1 explicitly keeps the
  work contract/policy-only and blocks live CRUD and DB/runtime writes.

Rollback plan:
- Revert only the P130.1 implementation and stamp commits. P129.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1301-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness`
- `npm run check:p1297-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "capture persistence store readiness appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P130.1 allowed files>`
- `git commit -m "feat(nexus): implement p1301 store live readiness contract"`
- `git add <P130.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1301 store live readiness contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source/test changes.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- Store CRUD execution, DB schemas, migrations, DB/runtime reads or writes,
  live capture, handoff acceptance, authority grant handoff, execution,
  provider/model calls, agent dispatch, project mutation, network calls, and
  spend remain blocked.
- No stale `pending-final-commit` remains after the status stamp commit.

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
- Evidence/report records.
- Safety confirmations.
- Forbidden paths confirmation.
- Known limitations.
- Next phase/subphase.
