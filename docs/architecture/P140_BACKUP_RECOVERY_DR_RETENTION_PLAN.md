# P140 Backup, Recovery, DR, and Retention Plan

P140 turns Backup / DR from a display-only readiness surface into an
enterprise-governed reliability chain. The chain must prove backup inventory,
retention policy, restore drills, disaster recovery runbooks, Command Center UX,
checker coverage, docs/status closure, and final validation before any runtime
authority is considered.

This phase does not enable backup creation, restore execution, failover,
overwrite, delete, prune, DB/runtime writes, live CRUD, provider/model calls,
tool execution, MCP startup, agent dispatch, project mutation, patch
application, project build/test execution, rollback execution, deploy, release,
export, package, network calls, or spend unless a later subphase explicitly
allows that behavior with its own implementation-grade plan and validation.

## P140.1 Contract / Policy / Safety Boundary

Status: complete

Scope classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit: `43c5dbc2`

Narrow goal: Define the enterprise backup, recovery, DR, and retention contract
and safety boundary without adding live backup creation, restore execution,
failover, prune/delete, DB/runtime writes, provider/model calls, agent dispatch,
project mutation, deploy, release, export, package, network calls, or spend.

Allowed files:

- `package.json`
- `contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json`
- `scripts/check-p1401-backup-recovery-dr-retention.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `reports/p1401-backup-recovery-dr-retention-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files:

- `projects/**`
- `generated-projects/**`
- private project roots
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

Expected exports, schemas, and data shapes:

- No runtime exports in P140.1.
- Future `backupRecordShape` is display-safe only: backup reference, source
  scope, source surface, retention class, recovery objective, evidence refs,
  audit refs, activity refs, redaction state, policy decision, disabled reason,
  owner capability, and created timestamp.
- Future `retentionPolicyShape` is display-safe only: retention class,
  retention window, legal hold state, prune state, delete state, export state,
  evidence refs, and disabled reason.
- Future `restoreDrillShape` is display-safe only: restore drill reference,
  backup reference, restore scope, approval state, restore execution state,
  failover state, overwrite state, evidence refs, and disabled reason.
- Future `recoveryRunbookShape` is display-safe only: runbook reference,
  recovery mode, recovery objective, safety gate, approval requirement, owner
  capability, blockers, evidence refs, and next action.

Command Center UX requirements:

- Preserve existing Backup / DR Command Center route and route-wide UX.
- OS Roadmap may show P140.1 complete/current and P140.2 planned next.
- Do not expose raw JSON, raw logs, raw policy dumps, raw storage locations,
  raw private project IDs, DemoApp, or fake runnable backup, restore, failover,
  overwrite, delete, or prune actions in primary UX.

Dark/light/system theme requirements:

- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through existing Backup / DR and route-wide Command Center
  Playwright coverage.

Safety rules:

- Do not create backups in P140.1.
- Do not execute restores, failovers, overwrites, deletes, or prune actions in
  P140.1.
- Do not write DB/runtime state in P140.1.
- Do not call providers or models in P140.1.
- Do not execute tools, start MCP servers, dispatch agents, mutate project
  files, apply patches, run project builds/tests, execute rollbacks, deploy,
  release, export, package, use network calls, or spend in P140.1.
- Do not expose raw/private identifiers, raw JSON, raw logs, raw policy dumps,
  raw storage locations, or fake working actions in primary UX.

Reuse check:

- Reuse `shared/reportWriter.js`.
- Reuse `shared/checkResultFormatter.js`.
- Reuse `shared/reportMetadata.js` when report metadata is required.
- Reuse `shared/resultEnvelope.js` for future backup/recovery result envelopes.
- Reuse `shared/modeGuard.js` and `shared/redaction.js` for future admission
  and redaction checks.
- Reuse `backup-dr/p75-2-placeholder.js`, `backup-dr/p75-3-placeholder.js`,
  `backup-dr/p75-4-placeholder.js`, and
  `dashboard/src/data/backupDrReadiness.js` as display-only prior art.
- Reuse `ai-recovery/retentionPolicy.js` as retention prior art.
- Reuse `scripts/db-sqlite-backup.js` only as an existing dry-run interface
  reference; do not enable runtime writes in P140.1.

Tests/checkers:

- Add `scripts/check-p1401-backup-recovery-dr-retention.js`.
- Update `scripts/check-enterprise-readiness-roadmap.js` for the P140.1
  handoff.
- Update `scripts/check-os-phase-status.js` for P140.1 and P140.2 handoff
  states.
- Preserve route-wide safety coverage for no DemoApp leakage, no raw dumps,
  theme switching, sidebar navigation, OS Roadmap separation, project milestone
  separation, and Backup / DR disabled-action UX.

Docs/roadmap:

- Add this P140 plan.
- Update README.
- Update platform roadmap.
- Update enterprise readiness roadmap.
- Update OS phase status and phase index.
- Regenerate P140.1, enterprise readiness, OS status, and phase validation
  reports.

OS phase status update:

- P140 parent is in progress.
- P140.1 is complete.
- Current phase/subphase is P140.1.
- Previous phase/subphase is P139.7.
- Next phase/subphase is P140.2.
- P140.2-P140.7 remain planned-only.
- P141 remains planned-only.

Validation commands:

- `npm run check:p1401-backup-recovery-dr-retention`
- `npm run check:enterprise-readiness-roadmap`
- `npm run check:os-phase-status`
- `npm run check:phase-validation-coverage`
- `cd dashboard && npm run build`
- `cd dashboard && npm run test:unit`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Backup DR"`
- `cd dashboard && npx playwright test tests/routes.spec.js -g "Command Center route-wide UX"`
- `git diff --check`

Final safety checks:

- No project, generated project, private project root, dashboard source/test,
  DB/runtime, provider, tool, worker runtime, deploy, release, export, package,
  or env changes.
- No backup creation, restore execution, failover, overwrite, delete, prune,
  DB/runtime writes, live CRUD, provider/model calls, tool execution, MCP
  startup, agent dispatch, project mutation, patch application, project
  build/test execution, rollback execution, deploy, release, export, package,
  network calls, or spend.
- No raw/private IDs, raw JSON/log/policy/storage dumps, DemoApp leakage, stale
  labels, fake runnable actions, or unsafe positive claims.
- P140.2 remains planned-only.
- No stale P140.1 pending marker remains after the stamp commit.

Git commands:

- `git add <P140.1 allowed files>`
- `git commit -m "chore(nexus): implement p1401 backup recovery dr retention"`
- `git add <P140.1 status stamp files>`
- `git commit -m "chore(nexus): stamp p1401 backup recovery dr retention"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:

- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX preservation
- Tests/checkers run
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/report records
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

## P140.2 Backup and Retention Model

Status: planned

Narrow goal: Add a read-only backup and retention model for display-safe
enterprise reliability planning without enabling backup creation, restore
execution, prune/delete, DB/runtime writes, provider/model calls, agent
dispatch, project mutation, deploy, network, or spend.

Allowed files: P140 contract, shared read-only model, P140.2 checker, package
script, docs, roadmap/status files, and generated reports.

Forbidden files: `projects/**`, `generated-projects/**`, private project roots,
dashboard source/tests unless P140.2 explicitly scopes them, DB/runtime write
paths, provider/tool/worker/deploy/release/export/package/env paths.

Validation: P140.2 checker, P140.1 checker compatibility, enterprise roadmap
checker, OS status checker, phase coverage, dashboard build/unit, route-wide
Command Center Playwright, and `git diff --check`.

## P140.3 Restore Preview

Status: planned

Narrow goal: Add a display-safe restore drill preview without executing restore,
failover, overwrite, delete, DB/runtime writes, network calls, or spend.

Validation: P140.3 checker, prior P140 checker compatibility, enterprise
roadmap checker, OS status checker, phase coverage, dashboard build/unit,
route-wide Command Center Playwright, and `git diff --check`.

## P140.4 Recovery Command Center UX

Status: planned

Narrow goal: Improve Command Center Backup / DR UX using display-safe model and
restore preview data while keeping actions disabled.

Validation: P140.4 checker, Playwright coverage for Backup / DR route,
route-wide Command Center safety, dashboard build/unit, enterprise roadmap
checker, OS status checker, phase coverage, and `git diff --check`.

## P140.5 Tests / Checkers

Status: planned

Narrow goal: Add aggregate P140 checker and route coverage for backup, recovery,
DR, retention, disabled actions, docs/status, and forbidden-path safety.

Validation: P140.5 checker, P140.1-P140.4 checker compatibility, dashboard
build/unit, Backup / DR Playwright, route-wide Command Center Playwright,
enterprise roadmap checker, OS status checker, phase coverage, and
`git diff --check`.

## P140.6 Docs / Roadmap / Status

Status: planned

Narrow goal: Close P140 docs, README, roadmap, OS status, checker handoffs, and
reports without enabling runtime authority.

Validation: P140.6 checker, P140.1-P140.5 checker compatibility, enterprise
roadmap checker, OS status checker, phase coverage, dashboard build/unit,
route-wide Command Center Playwright, and `git diff --check`.

## P140.7 Final Validation

Status: planned

Narrow goal: Final P140 validation across reports, checker compatibility,
docs/status closure, route-wide Command Center safety, and planned-only P141
handoff.

Validation: P140.7 checker, all prior P140 checkers, enterprise roadmap checker,
OS status checker, phase coverage, dashboard build/unit, Backup / DR
Playwright, route-wide Command Center Playwright, and `git diff --check`.
