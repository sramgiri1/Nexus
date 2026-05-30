# P132 Founder Runtime Store Live Admission Execution Plan

## Scope Classification

NEXUS_OS_CHANGE. P132 is NEXUS OS work only. P132.1 is
contract/checker/docs/status work only. It must not modify project, generated
project, provider, tool, worker runtime, deploy, release, export, package,
local runtime state, DB, or environment files.

## P132 Subphase Split

P132 is split into seven implementation-grade subphases:

- P132.1 Store Live Execution Contract / Safety Boundary
- P132.2 Execution Request Envelope Model
- P132.3 Store Adapter Capability Gate
- P132.4 DB Write Plan Preview
- P132.5 Command Center Execution Scope UX
- P132.6 Validation / Docs
- P132.7 Final Validation

## P132.1 Store Live Execution Contract / Safety Boundary

Status: complete
Phase: P132
Subphase: P132.1
Goal: Create the P132 implementation-grade execution contract, seven-subphase
split, safety boundary, checker, docs, status handoff, and planned P132.2
handoff while all live execution remains blocked.
Why this is needed: P131 defined store live admission scope. P132 must define
the execution contract before any governed request envelope, DB adapter, or
Command Center live execution workflow can be added.
User/operator impact: Operators can see that live execution has started as a
contract-gated phase with a narrow next step and no writable capability yet.
Command Center impact: No dashboard source changes. Business Build and Agent
Flow keep the scoped Store Live Admission Scope cards. Chat with NEXUS, Lite,
OS Roadmap, and Live Readiness remain clean.
Safety impact: P132.1 is contract-only. It does not create DB schemas, run
migrations, read or write DB/runtime records, persist requests, execute CRUD,
capture approvals, accept handoff, grant authority, unlock execution, call
providers/models, dispatch agents, mutate projects, deploy, release, export,
package, use network calls, or spend.
Cost impact: Local checkers, docs, build, and tests only. No provider spend.
Project/OS scope: NEXUS OS only.
Starting branch and expected base commit:
- Branch: `codex/nexus-e2e-phase-validation`
- Expected base commit: `39e2da0a`

Files expected to change:
- `contracts/os-roadmap/p132-founder-runtime-store-live-admission-execution-contracts.json`
- `docs/architecture/P132_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_PLAN.md`
- `scripts/check-p1321-founder-runtime-store-live-admission-execution.js`
- `scripts/check-p1317-founder-runtime-store-live-admission-scope.js`
- `scripts/check-os-phase-status.js`
- `package.json`
- `README.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `os-roadmap/phase-status.json`
- `os-roadmap/nexus-phases.json`
- `reports/p1321-founder-runtime-store-live-admission-execution-report.md`
- `reports/p1317-founder-runtime-store-live-admission-scope-report.md`
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
- Create `contracts/os-roadmap/p132-founder-runtime-store-live-admission-execution-contracts.json`.
- Create `docs/architecture/P132_FOUNDER_RUNTIME_STORE_LIVE_ADMISSION_EXECUTION_PLAN.md`.
- Create `scripts/check-p1321-founder-runtime-store-live-admission-execution.js`.
- Create `reports/p1321-founder-runtime-store-live-admission-execution-report.md`.
- Update P131.7 handoff checker/report to accept P132.1.
- Update package scripts, OS phase checker, README, platform roadmap, OS status,
  roadmap, and generated reports listed above.

Expected exports, schemas, and data shapes:
- No runtime exports.
- Data shape: contract/status/report evidence only, including P132 subphase
  definitions, allowed/forbidden file scope, validation commands, safe handoff
  checks, and planned-only P132.2.
- No DB schema, migration file, query, runtime record, write adapter, live CRUD
  executor, provider envelope, dispatch packet, raw private ID, raw table name,
  raw report dump, or project data.

Reuse check:
- Reuse P131.7 handoff checker behavior.
- Reuse P131.5 scoped Store Live Admission Scope UX evidence.
- Reuse `shared/reportWriter.js` and `shared/checkResultFormatter.js`.
- Reuse OS status and roadmap update patterns.
- Do not duplicate report writers, checker formatters, result envelopes, mode
  guards, redaction helpers, route matrices, status helpers, UI card/tab/status
  components, or evidence/audit/activity appenders.

Command Center UX requirements:
- Preserve Store Live Admission Scope cards on Business Build and Agent Flow.
- Chat with NEXUS and Lite remain chat-focused and clean.
- OS Roadmap remains the only surface for OS phase labels.
- Primary UX must not expose raw JSON, raw logs, raw policy dumps, raw table
  names, raw report paths, internal helper IDs, internal phase labels outside OS
  Roadmap, or private project IDs.
- No provider/tool/project mutation, DB write, runtime write, live CRUD,
  migration, approval capture, handoff acceptance, authority grant, or deploy
  controls appear.

Dark/light/system theme requirements:
- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Run existing scoped route coverage.

Tests to add/update/remove:
- Add `check:p1321-founder-runtime-store-live-admission-execution`.
- Update P131.7 checker for P132.1 handoff compatibility.
- Run OS phase status and phase validation coverage.
- Run the existing Playwright scoped route coverage without editing dashboard
  tests.

Checker updates:
- Validate P132.1 contract/subphase split.
- Validate P131.7 checker and report accept P132.1 handoff.
- Validate P131.5 scoped data, page labels, and route coverage remain intact.
- Validate P132 is in progress, P132.1 complete, and P132.2 planned-only.
- Validate docs, status, forbidden paths, reuse, and safe wording.

Docs to update:
- This P132 plan.
- `README.md`.
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`.

Reports to regenerate:
- P132.1 report.
- P131.7 report.
- OS phase status report.
- Phase validation coverage report.

OS phase status update:
- P132 in progress.
- P132.1 complete.
- Current phase P132.1.
- Previous phase P131.7.
- Next phase P132.2 planned-only.

Known risks:
- Execution wording can imply live write capability. P132.1 keeps execution
  contract-gated and states that all live actions remain blocked.
- Later DB-backed work must be implemented in separate subphases with explicit
  adapter boundaries, tests, rollback, and UX evidence.

Rollback plan:
- Revert only the P132.1 implementation and stamp commits. P131.7 remains the
  complete pushed baseline.

Validation commands:
- `npm run check:p1321-founder-runtime-store-live-admission-execution`
- `npm run check:p1317-founder-runtime-store-live-admission-scope`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "store live readiness gate appears only on scoped pages"`
- `git diff --check`

Git add/commit/push commands:
- `git add <P132.1 allowed files>`
- `git commit -m "chore(nexus): implement p1321 execution contract"`
- `git add <P132.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1321 execution contract"`
- `git push origin codex/nexus-e2e-phase-validation`

Final safety checks:
- No `projects/**`, `careloop/**`, or `generated-projects/**` changes.
- No dashboard source or dashboard test changes.
- No DB, runtime, provider, tool, worker, deploy, release, export, package, or
  env changes.
- DB schemas, migrations, DB/runtime reads or writes, request persistence, live
  CRUD execution, acceptance capture, handoff acceptance, authority grant,
  execution unlock, provider/model calls, agent dispatch, project mutation,
  network calls, and spend remain blocked.
- P132.2 remains planned-only.
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
