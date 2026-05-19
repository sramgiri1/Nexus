# P75 Backup, Restore, Disaster Recovery

P75 formalizes backup, restore, and disaster recovery readiness for NEXUS OS.
It does not enable backup creation, restore execution, failover, overwrite,
delete, DB writes, project mutation, provider dispatch, tool execution, worker
execution, deploy execution, release execution, export execution, package
creation, auth mutation, external network calls, or provider spend.

Contract: `contracts/os-roadmap/p75-execution-contracts.json`

## Boundary

- Scope: NEXUS OS backup, restore, and disaster recovery readiness only.
- Project source files and project roadmap files remain forbidden.
- DB, Prisma, migration, provider, tool, worker, deploy, release, auth, user,
  and RBAC mutation files remain forbidden.
- Backup and restore execution remain disabled until a later explicit phase
  enables governed runtime operations.
- Backup posture, restore posture, DR posture, disabled reason, blockers,
  evidence, activity, safety posture, owner capability, next action, and cost
  impact must be visible before any future runtime backup, restore, or failover
  path is considered.

## Reuse

P75 must reuse existing helpers before adding new ones:

- `shared/reportWriter.js`
- `shared/checkResultFormatter.js`
- `shared/resultEnvelope.js`
- `shared/redaction.js`
- `ai-recovery/snapshotContract.js`
- existing Command Center route matrix, tabs, cards, pills, and theme controls
- existing evidence, audit, activity, and cost preview patterns

## Subphases

### P75.1 Execution Contract + DR Boundary

Define P75 execution contracts and backup/restore/DR boundary only. No backup
creation, restore execution, failover, overwrite, delete, DB writes, project
mutation, provider or tool execution, network calls, deploy/release/export/
package behavior, auth mutation, or provider spend.

Status: complete. P75.1 adds implementation-grade P75 subphase contracts,
the DR boundary plan, validation checker, roadmap handoff, and phase-status
records.

### P75.2 Backup Inventory Contract

Define backup inventory contract records without creating backups.

Status: complete. P75.2 adds preview-only `BackupInventoryContract` records
that capture source surface, backup scope, retention state, disabled backup
creation, disabled restore execution, disabled failover, disabled overwrite
and delete behavior, disabled runtime mutation, evidence/activity references,
cost impact, disabled reason, owner capability, and next action.

Implementation:

- `backup-dr/p75-2-placeholder.js` exports
  `createBackupInventoryContract`, `validateBackupInventoryContract`,
  `buildBackupInventoryContractEnvelope`, `P75_2_REQUIRED_FIELDS`, and
  `P75_2_SAMPLE_CONTRACTS`.
- `scripts/check-p752.js` validates backup inventory contract shape, disabled
  backup creation, disabled restore/failover, disabled overwrite/delete,
  disabled DB and project mutation, disabled provider/tool/worker execution,
  disabled network/spend, disabled deploy/release/export/package behavior,
  disabled auth mutation, hidden private IDs/tokens/storage URLs,
  evidence/activity, cost impact, and non-runnable disabled reasons.

### P75.3 Restore Plan Preview

Define restore plan preview records without restore execution.

Status: complete. P75.3 adds preview-only `RestorePlanPreview` records that
capture restore scope, source backup inventory, approval requirement, disabled
restore execution, disabled backup creation/failover, disabled overwrite and
delete behavior, disabled runtime mutation, evidence/activity references, cost
impact, disabled reason, owner capability, and next action.

Implementation:

- `backup-dr/p75-3-placeholder.js` exports `createRestorePlanPreview`,
  `validateRestorePlanPreview`, `buildRestorePlanPreviewEnvelope`,
  `P75_3_REQUIRED_FIELDS`, and `P75_3_SAMPLE_PREVIEWS`.
- `scripts/check-p753.js` validates source backup inventory reuse, restore
  preview shape, disabled restore/backup/failover, disabled overwrite/delete,
  disabled DB and project mutation, disabled provider/tool/worker execution,
  disabled network/spend, disabled deploy/release/export/package behavior,
  disabled auth mutation, hidden private IDs/tokens/storage URLs,
  evidence/activity, cost impact, approval gate, and non-runnable disabled
  reasons.

### P75.4 Disaster Recovery Runbook + Safety Gate

Define DR runbook and safety gate previews without failover or restore
execution.

Status: complete. P75.4 adds preview-only `DisasterRecoveryRunbook` records
that capture recovery objective, restore plan preview, DR mode, safety gate,
required approval, disabled failover, disabled restore execution, disabled
backup creation, disabled overwrite/delete behavior, disabled DB writes,
evidence/activity references, cost impact, disabled reason, owner capability,
and next action.

Implementation:

- `backup-dr/p75-4-placeholder.js` exports
  `createDisasterRecoveryRunbook`, `validateDisasterRecoveryRunbook`,
  `buildDisasterRecoveryRunbookEnvelope`, `P75_4_REQUIRED_FIELDS`, and
  `P75_4_SAMPLE_RUNBOOKS`.
- `scripts/check-p754.js` validates source restore preview reuse, DR runbook
  shape, blocked safety gate, disabled failover/restore/backup, disabled
  overwrite/delete, disabled DB and project mutation, disabled
  provider/tool/worker execution, disabled network/spend, disabled
  deploy/release/export/package behavior, disabled auth mutation, hidden
  private IDs/tokens/storage URLs, evidence/activity, cost impact, and
  non-runnable disabled reasons.

### P75.5 Command Center Backup/DR UX

Expose backup, restore, and disaster recovery readiness in Command Center
without runnable backup, restore, failover, overwrite, or delete actions.

Status: complete. P75.5 adds a display-only Command Center route that shows
backup posture, restore posture, DR posture, current state, next action,
blockers, disabled reason, owner capability, evidence/activity location,
safety posture, and cost impact. Primary UX does not show raw JSON, raw logs,
raw policy dumps, raw private project IDs, raw tokens, internal phase labels
outside OS Roadmap, or DemoApp in full Command Center. System, Dark, and Light
themes remain covered by focused Playwright validation.

Implementation:

- `dashboard/src/data/backupDrReadiness.js` exports
  `buildBackupDrReadinessViewModel` and `backupDrReadinessViewModel`.
- `dashboard/src/data/commandCenterRoutes.js` adds the
  `/command-center/backup-dr` route.
- `dashboard/src/data/commandCenterTabs.js` adds `BACKUP_DR_TABS`.
- `dashboard/src/pages/CommandCenterV2.jsx` renders Backup/DR readiness,
  posture, runbook gate, blockers, disabled reason, and disabled actions as
  display-only content.
- `dashboard/tests/routes.spec.js` adds focused Playwright coverage for the
  Backup/DR route across dark, light, and system themes.
- `scripts/check-p755-command-center-backup-dr-ux.js` validates display data,
  disabled runtime flags, raw-output safety, DemoApp boundary, and Playwright
  coverage registration.

### P75.6 Tests / Checkers / Docs

Aggregate P75 validation coverage before final validation.

Status: complete. P75.6 verifies P75 checker scripts, package scripts,
reports, docs, phase status, Command Center route coverage, disabled runtime
backup/restore/failover behavior, and no project-file changes.

Implementation:

- `scripts/check-p756-tests-checkers-docs.js` exports no runtime behavior; it
  reads local P75 files and reports, then writes
  `reports/p756-tests-checkers-docs-report.md`.
- The checker validates package scripts, checker files, reports, docs,
  roadmap/status entries, stamped commits for completed subphases, Backup/DR
  route and tab registration, Playwright coverage, hidden DemoApp/private IDs,
  disabled backup/restore/failover/overwrite/delete flags, disabled DB and
  project mutation, disabled provider/tool/worker execution, disabled
  network/spend, disabled deploy/release/export/package/auth behavior, and
  forbidden path visibility.

### P75.7 Final Validation

Run final validation, close P75, and hand off to P76.

Status: complete. P75.7 verifies all P75 subphases are complete, Command
Center Backup/DR UX remains display-only, roadmap/status evidence is current,
and backup creation, restore execution, failover, overwrite, delete, DB writes,
project mutation, provider/tool/worker execution, network calls, deploy/
release/export/package behavior, auth mutation, and provider spend remain
disabled.

Implementation:

- `scripts/check-p757-final-validation.js` writes
  `reports/p757-final-validation-report.md` and validates package scripts,
  reports, roadmap/status completion, P76 handoff, status checker coverage,
  docs closure, Command Center Backup/DR route preservation, focused
  Playwright registration, hidden DemoApp/private IDs/tokens, disabled runtime
  flags, forbidden paths, and final report separation.
- P75 is complete and hands off to P76 Tenant / Project Isolation.

## Validation

P75.1 validation:

- `npm run check:p75-execution-plan`
- `npm run check:phase-validation-coverage`
- `npm run check:os-phase-status`
- `npm run check:format-readability`
- `git diff --check`
