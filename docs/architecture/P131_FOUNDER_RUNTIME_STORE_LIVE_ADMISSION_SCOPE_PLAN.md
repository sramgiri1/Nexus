# P131 Founder Runtime Store Live Admission Scope Plan

## Scope Classification

NEXUS_OS_CHANGE. P131 is NEXUS OS work only. P131.1 is
contract/checker/docs/status work only. It must not modify project, generated
project, provider, tool, worker runtime, deploy, release, export, package,
local runtime state, DB, or environment files.

## P131 Subphase Split

P131 is split into seven implementation-grade subphases:

- P131.1 Store Live Admission Contract / Safety Boundary
- P131.2 Live Admission Request Model
- P131.3 Approval Evidence Readiness Resolver
- P131.4 Write Boundary Admission Dry Run
- P131.5 Command Center Admission Scope UX
- P131.6 Validation / Docs
- P131.7 Final Validation

## P131.1 Store Live Admission Contract / Safety Boundary

Status: complete
Phase: P131
Subphase: P131.1
Goal: Create the P131 implementation-grade contract, seven-subphase split,
safety boundary, docs, checker, status handoff, and planned P131.2 handoff.
Why this is needed: P130 closed store live readiness. P131 needs an explicit
admission-scope contract before any future store admission lane can be
evaluated.
User/operator impact: OS Roadmap advances to P131.1 and shows P131 in progress
with P131.2 planned. Operators get clear wording that this is scope/admission
planning only.
Command Center impact: No dashboard source changes. The existing Business Build
and Agent Flow Store Live Readiness Gate remains scoped. Chat with NEXUS and
Lite stay clean.
Safety impact: P131.1 is contract/checker/docs/status only. It does not create
DB schemas, run migrations, read or write DB/runtime records, persist approval
or acceptance decisions, run CRUD actions, capture handoff acceptance, hand off
authority, grant authority, activate authority, unlock execution, call
providers/models, dispatch agents, mutate projects, deploy, release, export,
package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `d63816a9`

Files expected to change:
- `contracts/os-roadmap/p131-founder-runtime-store-live-admission-scope-contracts.json`
- `docs/architecture/P131_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_PLAN.md`
- `scripts/check-p1307-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness.js`
- `scripts/check-p1311-founder-runtime-store-live-admission-scope.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1307-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness-report.md`
- `reports/p1311-founder-runtime-store-live-admission-scope-report.md`
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
- Create `contracts/os-roadmap/p131-founder-runtime-store-live-admission-scope-contracts.json`.
- Create `docs/architecture/P131_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_SCOPE_PLAN.md`.
- Create `scripts/check-p1311-founder-runtime-store-live-admission-scope.js`.
- Update P130.7 checker so it accepts the P131.1 handoff.
- Update `scripts/check-os-phase-status.js` so P131.1-P131.7 are recognized.
- Update README, platform roadmap, package script, OS status, roadmap, and
  reports listed above.

Expected exports, schemas, and data shapes:
- No runtime exports.
- Data shape: contract/status/report evidence only. No DB schema, query,
  migration file, runtime record, live CRUD executor, provider envelope,
  dispatch packet, raw private ID, raw table name, or project data.

Reuse check:
- Reuse P130.5 scoped Command Center UX evidence.
- Reuse P130.7 final validation handoff evidence.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Do not duplicate report writers, checker formatters, result envelopes, mode
  guards, redaction helpers, route matrices, status helpers, UI components, or
  evidence/audit/activity appenders.

Command Center UX requirements:
- Preserve the P130.5 scoped Store Live Readiness Gate on Business Build and
  Agent Flow.
- Chat with NEXUS and Lite remain chat-focused and clean.
- Do not expose raw JSON, raw logs, raw policy dumps, raw table names, raw
  report paths, internal helper IDs, internal phase labels outside OS Roadmap,
  or private project IDs in primary UX.
- No provider/tool/project mutation, DB writes, live CRUD, migration execution,
  or deploy controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Run the scoped route coverage that guards the store live readiness gate
  placement.

Tests to add/update/remove:
- Add `check:p1311-founder-runtime-store-live-admission-scope`.
- Update P130.7 checker for P131.1 compatibility.
- Do not add, remove, or edit dashboard source or route tests in P131.1.

Checker updates:
- Validate P131 contract and seven-subphase split.
- Validate P131.1 status/docs/report handoff.
- Validate P130.7 accepts the P131.1 handoff.
- Validate forbidden paths and safe wording.

Docs to update:
- This P131 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P130.7 report.
- P131.1 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P131 in progress.
- P131.1 complete.
- Current phase P131.1.
- Previous phase P130.7.
- Next phase P131.2.

Known risks:
- P131 can be mistaken for live store admission. P131.1 explicitly keeps the
  work contract/safety-boundary only and blocks live CRUD and DB/runtime writes.

Rollback plan:
- Revert only the P131.1 implementation and stamp commits. P130.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1311-founder-runtime-store-live-admission-scope`
- `npm run check:p1307-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-store-live-readiness`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "store live readiness gate appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P131.1 allowed files>`
- `git commit -m "feat(nexus): implement p1311 store live admission scope"`
- `git add <P131.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1311 store live admission scope"`
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
