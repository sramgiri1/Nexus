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

Status: complete

Narrow goal: Add a read-only backup and retention model for display-safe
enterprise reliability planning without enabling backup creation, restore
execution, prune/delete, DB/runtime writes, provider/model calls, agent
dispatch, project mutation, deploy, network, or spend.

Scope classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit: `81a5dce4`

Allowed files:

- `package.json`
- `shared/backupRecoveryDrRetentionModel.js`
- `contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json`
- `scripts/check-p1401-backup-recovery-dr-retention.js`
- `scripts/check-p1402-backup-recovery-dr-retention.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `reports/p1401-backup-recovery-dr-retention-report.md`
- `reports/p1402-backup-recovery-dr-retention-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files: `projects/**`, `generated-projects/**`, private project roots,
dashboard source/tests unless P140.2 explicitly scopes them, DB/runtime write
paths, provider/tool/worker/deploy/release/export/package/env paths.

Expected exports, schemas, and data shapes:

- `BACKUP_RECOVERY_DR_RETENTION_PHASE`
- `BACKUP_RECOVERY_DR_RETENTION_VERSION`
- `BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES`
- `buildBackupRecoveryDrRetentionBackupRecord`
- `validateBackupRecoveryDrRetentionBackupRecord`
- `buildBackupRecoveryDrRetentionPolicy`
- `validateBackupRecoveryDrRetentionPolicy`
- `buildBackupRecoveryDrRetentionModel`
- `validateBackupRecoveryDrRetentionModel`
- `buildBackupRecoveryDrRetentionEnvelope`
- Data shape: read-only `backupRecords`, `retentionPolicies`,
  `restoreDrills`, `recoveryRunbooks`, `readinessSummary`, `safetyFlags`,
  `disabledReason`, `nextAction`, `evidenceRefs`, `activityRefs`, and
  zero-spend `costImpact`.

Command Center UX requirements:

- No Command Center source changes in P140.2.
- Preserve existing Backup / DR display-only route.
- Do not expose raw JSON, raw logs, raw policy dumps, raw storage locations,
  raw private project IDs, DemoApp, or fake runnable backup, restore, failover,
  overwrite, delete, or prune actions.
- P140.4 will consume the model for UX improvements.

Dark/light/system theme requirements:

- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through existing Backup / DR and route-wide Command Center
  Playwright coverage.

Safety rules:

- Do not create backups in P140.2.
- Do not execute restores, failovers, overwrites, deletes, or prune actions in
  P140.2.
- Do not write DB/runtime state in P140.2.
- Do not call providers or models in P140.2.
- Do not execute tools, start MCP servers, dispatch agents, mutate project
  files, apply patches, run project builds/tests, execute rollbacks, deploy,
  release, export, package, use network calls, or spend in P140.2.

Reuse check:

- Reuse `shared/resultEnvelope.js`.
- Reuse `shared/modeGuard.js`.
- Reuse `shared/redaction.js`.
- Reuse `shared/reportWriter.js`.
- Reuse `shared/checkResultFormatter.js`.
- Reuse `backup-dr/p75-2-placeholder.js`, `backup-dr/p75-3-placeholder.js`,
  and `backup-dr/p75-4-placeholder.js` as display-only prior art.
- Reuse `ai-recovery/retentionPolicy.js` for retention policy normalization.

Tests/checkers:

- Add `scripts/check-p1402-backup-recovery-dr-retention.js`.
- Update `scripts/check-p1401-backup-recovery-dr-retention.js` to accept the
  P140.2 current state.
- Update enterprise roadmap checker to accept the P140.2 handoff.
- Update OS phase status checker to accept P140.3 as next.

Docs/roadmap:

- Update this P140 plan.
- Update README.
- Update platform roadmap.
- Update enterprise readiness roadmap.
- Update OS phase status and phase index.
- Regenerate P140.1, P140.2, enterprise readiness, OS status, and phase
  validation reports.

OS phase status update:

- P140 remains in progress.
- P140.1 remains complete.
- P140.2 is complete.
- Current phase/subphase is P140.2.
- Previous phase/subphase is P140.1.
- Next phase/subphase is P140.3.
- P140.3 and P140.4 have since been completed; P140.5-P140.7 remain
  planned-only.

Validation commands:

- `npm run check:p1402-backup-recovery-dr-retention`
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

- No project/private files changed.
- No dashboard source/test changes in P140.2.
- No backup creation, restore execution, failover, overwrite, delete, prune,
  DB/runtime writes, provider/model calls, tool execution, MCP startup, agent
  dispatch, project mutation, deploy, release, export, package, network calls,
  or spend.
- No raw/private IDs, raw JSON/log/policy/storage dumps, DemoApp leakage, stale
  labels, fake runnable actions, or unsafe positive claims.
- P140.3 and P140.4 have since been completed; P140.5 remains planned-only
  next.

Git commands:

- `git add <P140.2 allowed files>`
- `git commit -m "chore(nexus): implement p1402 backup recovery dr retention"`
- `git add <P140.2 status stamp files>`
- `git commit -m "chore(nexus): stamp p1402 backup recovery dr retention"`
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

## P140.3 Restore Preview

Status: complete

Narrow goal: Add a display-safe restore drill preview without executing restore,
failover, overwrite, delete, DB/runtime writes, network calls, or spend.

Scope classification: NEXUS_OS_CHANGE

Starting branch: `codex/nexus-e2e-phase-validation`

Expected base commit: `ae5402e3`

Allowed files:

- `package.json`
- `shared/backupRecoveryDrRestorePreview.js`
- `contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json`
- `scripts/check-p1401-backup-recovery-dr-retention.js`
- `scripts/check-p1402-backup-recovery-dr-retention.js`
- `scripts/check-p1403-backup-recovery-dr-restore-preview.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- `reports/p1401-backup-recovery-dr-retention-report.md`
- `reports/p1402-backup-recovery-dr-retention-report.md`
- `reports/p1403-backup-recovery-dr-restore-preview-report.md`
- `reports/enterprise-readiness-roadmap-report.md`
- `reports/os-phase-status-report.md`
- `reports/phase-validation-coverage-report.md`

Forbidden files: `projects/**`, `generated-projects/**`, private project roots,
dashboard source/tests, DB/runtime write paths,
provider/tool/worker/deploy/release/export/package/env paths.

Expected exports, schemas, and data shapes:

- `BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE`
- `BACKUP_RECOVERY_DR_RESTORE_PREVIEW_VERSION`
- `BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS`
- `buildBackupRecoveryDrRestorePreviewRow`
- `validateBackupRecoveryDrRestorePreviewRow`
- `buildBackupRecoveryDrRestorePreview`
- `validateBackupRecoveryDrRestorePreview`
- `buildBackupRecoveryDrRestorePreviewEnvelope`
- Data shape: display-safe `restorePreviewRows`, `previewSections`,
  `readinessSummary`, `safetyFlags`, `disabledReason`, `nextAction`,
  `evidenceRefs`, `activityRefs`, redaction state, and zero-spend
  `costImpact`.

Command Center UX requirements:

- No Command Center source changes in P140.3.
- Preserve existing Backup / DR display-only route.
- Do not add P140.3 metadata to Chat with NEXUS or Lite.
- Do not expose raw JSON, raw logs, raw policy dumps, raw storage locations,
  raw private project IDs, DemoApp, or fake runnable backup, restore, failover,
  overwrite, delete, or prune actions.
- P140.4 will consume the restore preview for UX improvements.

Dark/light/system theme requirements:

- Preserve System theme.
- Preserve Dark theme.
- Preserve Light theme.
- Validate through existing Backup / DR and route-wide Command Center
  Playwright coverage.

Safety rules:

- Do not create backups in P140.3.
- Do not execute restores, failovers, overwrites, deletes, or prune actions in
  P140.3.
- Do not write DB/runtime state in P140.3.
- Do not call providers or models in P140.3.
- Do not execute tools, start MCP servers, dispatch agents, mutate project
  files, apply patches, run project builds/tests, execute rollbacks, deploy,
  release, export, package, use network calls, or spend in P140.3.

Reuse check:

- Reuse `shared/backupRecoveryDrRetentionModel.js`.
- Reuse `backup-dr/p75-3-placeholder.js`.
- Reuse `shared/resultEnvelope.js`.
- Reuse `shared/modeGuard.js`.
- Reuse `shared/redaction.js`.
- Reuse `shared/reportWriter.js`.
- Reuse `shared/checkResultFormatter.js`.

Tests/checkers:

- Add `scripts/check-p1403-backup-recovery-dr-restore-preview.js`.
- Update P140.1 and P140.2 checkers to accept P140.3 current state.
- Update enterprise roadmap checker to accept the P140.3 handoff.
- Update OS phase status checker to accept P140.4 as next.

Docs/roadmap:

- Update this P140 plan.
- Update README.
- Update platform roadmap.
- Update enterprise readiness roadmap.
- Update OS phase status and phase index.
- Regenerate P140.1, P140.2, P140.3, enterprise readiness, OS status, and
  phase validation reports.

OS phase status update:

- P140 remains in progress.
- P140.1 remains complete.
- P140.2 remains complete.
- P140.3 is complete.
- Current phase/subphase is P140.3.
- Previous phase/subphase is P140.2.
- Next phase/subphase is P140.4.
- P140.4 has since been completed; P140.5-P140.7 remain planned-only.

Validation commands:

- `npm run check:p1403-backup-recovery-dr-restore-preview`
- `npm run check:p1402-backup-recovery-dr-retention`
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

- No project/private files changed.
- No dashboard source/test changes in P140.3.
- No backup creation, restore execution, failover, overwrite, delete, prune,
  DB/runtime writes, provider/model calls, tool execution, MCP startup, agent
  dispatch, project mutation, deploy, release, export, package, network calls,
  or spend.
- No raw/private IDs, raw JSON/log/policy/storage dumps, DemoApp leakage, stale
  labels, fake runnable actions, or unsafe positive claims.
- P140.4 has since been completed; P140.5 remains planned-only next.

Git commands:

- `git add <P140.3 allowed files>`
- `git commit -m "chore(nexus): implement p1403 backup recovery restore preview"`
- `git add <P140.3 status stamp files>`
- `git commit -m "chore(nexus): stamp p1403 backup recovery restore preview"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:

- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests/checkers added or updated
- Checker results
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

## P140.4 Recovery Command Center UX

Status: complete

Narrow goal: Improve Command Center Backup / DR UX using display-safe model and
restore preview data while keeping actions disabled.

Starting branch and expected base commit: `codex/nexus-e2e-phase-validation`
at `acc5fda1`.

Allowed files:

- `package.json`
- `dashboard/src/data/backupDrReadiness.js`
- `dashboard/src/data/commandCenterTabs.js`
- `dashboard/src/pages/CommandCenterV2.jsx`
- `dashboard/tests/routes.spec.js`
- `contracts/os-roadmap/p140-backup-recovery-dr-retention-contracts.json`
- `scripts/check-p1401-backup-recovery-dr-retention.js`
- `scripts/check-p1402-backup-recovery-dr-retention.js`
- `scripts/check-p1403-backup-recovery-dr-restore-preview.js`
- `scripts/check-p1404-backup-recovery-dr-command-center-ux.js`
- `scripts/check-enterprise-readiness-roadmap.js`
- `scripts/check-os-phase-status.js`
- `docs/architecture/P140_BACKUP_RECOVERY_DR_RETENTION_PLAN.md`
- `docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md`
- `docs/architecture/NEXUS_PLATFORM_ROADMAP.md`
- `README.md`
- `os-roadmap/nexus-phases.json`
- `os-roadmap/phase-status.json`
- P140.1-P140.4, enterprise readiness, OS status, and phase validation reports.

Forbidden files:

- `projects/**`
- `generated-projects/**`
- `careloop/**`
- private project roots
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

Exact files/modules updated:

- `dashboard/src/data/backupDrReadiness.js` now consumes the P140.3 restore
  preview model and exposes display-safe restore preview rows, sections, and
  summary counts.
- `dashboard/src/data/commandCenterTabs.js` adds the Backup / DR Restore
  Preview tab metadata.
- `dashboard/src/pages/CommandCenterV2.jsx` renders the Restore Preview tab
  with source, scope, approval gate, execution state, blockers, next action,
  and summary metrics.
- `dashboard/tests/routes.spec.js` covers the Backup / DR Restore Preview tab,
  disabled prune action, zero runnable actions, and no raw restore IDs.
- `scripts/check-p1404-backup-recovery-dr-command-center-ux.js` validates the
  P140.4 UX contract, display safety, docs/status, checker handoffs, and
  forbidden-path scope.

Expected exports, schemas, and data shapes:

- `buildBackupDrReadinessViewModel()` returns `restorePreviewRows`,
  `restorePreviewSections`, `restorePreviewSummary`, `disabledActions`, and
  safety flags with display-safe labels only.
- `restorePreviewRows[]` shape: `label`, `source`, `scope`, `approval`,
  `state`, `blockedOperations[]`, and `nextAction`.
- `restorePreviewSummary` shape: `rowCount`, `blockedRowCount`, and
  `runnableActionCount`.

Command Center UX requirements:

- Show what changed, current state, next action, blockers, disabled reason,
  owner capability, evidence/activity label, and cost impact.
- Show restore preview rows with approval gate, execution state, blocked
  operations, and next action.
- Show runnable action count as zero.
- Do not show raw JSON, raw logs, raw policy dumps, raw private project IDs,
  raw backup IDs, raw restore IDs, raw storage locations, DemoApp, or fake
  runnable backup/restore/failover/prune actions in primary UX.

Dark/light/system theme requirements:

- Reuse existing Command Center components and CSS variables.
- Preserve route-wide navigation and theme switcher behavior.
- Do not add one-off color palettes or nested card patterns.

Safety rules:

- No backup creation.
- No restore execution.
- No failover.
- No overwrite, delete, or prune operation.
- No DB/runtime writes, provider/model calls, tool execution, MCP startup,
  agent dispatch, project mutation, deploy, release, export, package, network
  calls, or spend.

Reuse check:

- Reuses P140.2 backup/retention model output.
- Reuses P140.3 restore preview primitives.
- Reuses existing Command Center tabs/cards/badges and route-wide Playwright
  safety tests.
- Reuses shared report/checker helpers instead of duplicating report writers or
  checker formatters.

Tests/checkers:

- Added `npm run check:p1404-backup-recovery-dr-command-center-ux`.
- Updated P140.1-P140.3 compatibility checkers to accept P140.4 current state
  and P140.5 handoff.
- Updated enterprise readiness and OS status checkers for P140.4/P140.5.
- Updated Backup / DR Playwright route coverage.

Docs/roadmap:

- README, P140 plan, platform roadmap, enterprise roadmap, OS phase status, and
  OS phase index now record P140.4 complete and P140.5 planned-only next.

OS phase status update:

- P140.4 complete.
- Current phase/subphase is P140.4.
- Previous phase/subphase is P140.3.
- Next phase/subphase is P140.5.
- P140.5-P140.7 remain planned-only.

Validation:

- `npm run check:p1404-backup-recovery-dr-command-center-ux`
- `npm run check:p1403-backup-recovery-dr-restore-preview`
- `npm run check:p1402-backup-recovery-dr-retention`
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

- No project/private files changed.
- No runtime authority, DB writes, provider/model calls, agent dispatch, project
  mutation, deploy/release/export/package action, network call, or spend is
  enabled.
- No raw IDs, raw dumps, raw storage locations, DemoApp leakage, or fake
  runnable actions are exposed in primary UX.

Git commands:

- `git add <P140.4 allowed files>`
- `git commit -m "chore(nexus): implement p1404 backup recovery command center ux"`
- `git add <P140.4 status stamp files>`
- `git commit -m "chore(nexus): stamp p1404 backup recovery command center ux"`
- `git push origin codex/nexus-e2e-phase-validation`

Final response checklist:

- Branch name
- Commit hash
- Files changed
- What was implemented
- Command Center UX changes
- Tests added/updated/removed
- Checker results
- Dashboard build/unit/page results
- Docs/README/roadmap updates
- OS phase status update
- Evidence/audit/activity/cost records if applicable
- Safety confirmations
- Forbidden paths confirmation
- Known limitations
- Next phase/subphase

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
