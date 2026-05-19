import { createDisasterRecoveryRunbook } from "../../../backup-dr/p75-4-placeholder.js";

const runbook = createDisasterRecoveryRunbook({
  nextAction: "Keep Backup/DR readiness display-only until backup creation, restore execution, and failover are explicitly approved.",
});

export function buildBackupDrReadinessViewModel() {
  return {
    routeId: "backup-dr-readiness",
    pageTitle: "Backup / DR",
    whatChanged: "Backup inventory, restore plan, and disaster recovery readiness are visible in Command Center.",
    currentState: "Display-only Backup/DR readiness; backup creation, restore execution, failover, overwrite, and delete remain disabled.",
    nextAction: runbook.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS Backup DR Readiness",
    evidenceLocation: "reports/command-center-backup-dr-ux-report.md",
    activityLocation: "os-roadmap/phase-status.json backup-dr entry",
    costImpact: runbook.costImpact,
    disabledReason: "Backup/DR readiness is display-only; backup creation, restore execution, failover, overwrite, delete, DB writes, network calls, and provider spend remain disabled.",
    readinessCards: [
      { label: "Backup posture", value: "Inventory ready", tone: "teal", detail: "Backup inventory contracts are defined without creating backups." },
      { label: "Restore posture", value: "Preview", tone: "amber", detail: "Restore plans are visible but cannot execute." },
      { label: "DR posture", value: "Safety gated", tone: "amber", detail: "DR runbooks are blocked until an explicit runtime phase." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No storage, restore, network, DB, or provider calls are made." },
    ],
    postureRows: [
      { label: "Backup creation", value: "Disabled" },
      { label: "Restore execution", value: "Disabled" },
      { label: "Failover execution", value: "Disabled" },
      { label: "Overwrite operations", value: "Disabled" },
      { label: "Delete operations", value: "Disabled" },
      { label: "DB writes", value: "Disabled" },
      { label: "Network calls", value: "Disabled" },
    ],
    runbookRows: runbook.runbookRows,
    blockers: runbook.blockers.slice(0, 6),
    disabledActions: [
      { label: "Backup creation", reason: "Backup creation is not enabled." },
      { label: "Restore execution", reason: "Restore execution is not enabled." },
      { label: "Failover execution", reason: "Failover execution is not enabled." },
      { label: "Overwrite or delete", reason: "Overwrite and delete operations are not enabled." },
    ],
    safety: {
      backupCreationAllowed: runbook.backupCreationAllowed,
      restoreExecutionAllowed: runbook.restoreExecutionAllowed,
      failoverAllowed: runbook.failoverAllowed,
      overwriteAllowed: runbook.overwriteAllowed,
      deleteAllowed: runbook.deleteAllowed,
      dbWritesAllowed: runbook.dbWritesAllowed,
      networkCallsAllowed: runbook.networkCallsAllowed,
      providerSpendAllowed: runbook.providerSpendAllowed,
    },
  };
}

export const backupDrReadinessViewModel = buildBackupDrReadinessViewModel();
