import { createDisasterRecoveryRunbook } from "../../../backup-dr/p75-4-placeholder.js";
import { buildBackupRecoveryDrRestorePreview } from "../../../shared/backupRecoveryDrRestorePreview.js";

const runbook = createDisasterRecoveryRunbook({
  nextAction: "Keep Backup/DR readiness display-only until backup creation, restore execution, and failover are explicitly approved.",
});
const restorePreview = buildBackupRecoveryDrRestorePreview();

function displayLabel(value = "", fallback = "Restore preview") {
  const match = String(value).match(/(\d+)$/);
  return match ? `${fallback} ${match[1]}` : fallback;
}

function buildRestorePreviewRows() {
  return restorePreview.restorePreviewRows.map((row, index) => ({
    label: displayLabel(row.rowRef, "Restore preview"),
    source: displayLabel(row.sourceBackupLabel, "Backup record"),
    scope: row.restoreScope,
    approval: row.approvalRequired ? "Approval required" : "Approval unavailable",
    state: row.executionState === "blocked" ? "Blocked" : "Review",
    blockers: row.blockers.slice(0, 3),
    nextAction: row.nextAction,
    disabledReason: row.disabledReason,
    blockedOperations: row.blockedOperations.slice(0, 5),
    key: `${index}-${row.restoreScope}`,
  }));
}

export function buildBackupDrReadinessViewModel() {
  const restorePreviewRows = buildRestorePreviewRows();
  return {
    routeId: "backup-dr-readiness",
    pageTitle: "Backup / DR",
    whatChanged: "Backup inventory, retention posture, restore preview rows, and disaster recovery readiness are visible in Command Center.",
    currentState: "Display-only Backup/DR readiness; backup creation, restore execution, failover, overwrite, delete, and prune remain disabled.",
    nextAction: "Review the display-safe restore preview in Command Center before any runtime authority is considered.",
    ownerAgent: "WARDEN",
    ownerCapability: restorePreview.ownerCapability,
    evidenceLocation: "Backup / DR restore preview report",
    activityLocation: "OS phase status and Backup / DR activity",
    costImpact: "No storage, restore, network, DB, provider, or model spend.",
    disabledReason: "Backup/DR readiness is display-only; backup creation, restore execution, failover, overwrite, delete, prune, DB writes, network calls, and provider spend remain disabled.",
    readinessCards: [
      { label: "Backup posture", value: "Inventory ready", tone: "teal", detail: "Backup records are visible without creating backups." },
      { label: "Restore posture", value: `${restorePreviewRows.length} rows`, tone: "amber", detail: "Restore review rows are visible but cannot execute." },
      { label: "DR posture", value: "Safety gated", tone: "amber", detail: "DR runbooks are blocked until an explicit runtime phase." },
      { label: "Cost", value: "No spend", tone: "green", detail: "No storage, restore, network, DB, provider, or model calls are made." },
    ],
    postureRows: [
      { label: "Backup creation", value: "Disabled" },
      { label: "Restore execution", value: "Disabled" },
      { label: "Failover execution", value: "Disabled" },
      { label: "Overwrite operations", value: "Disabled" },
      { label: "Delete operations", value: "Disabled" },
      { label: "Prune operations", value: "Disabled" },
      { label: "DB writes", value: "Disabled" },
      { label: "Network calls", value: "Disabled" },
      { label: "Restore preview rows", value: String(restorePreviewRows.length) },
      { label: "Runnable actions", value: String(restorePreview.readinessSummary.runnableActionCount) },
    ],
    restorePreviewRows,
    restorePreviewSections: restorePreview.previewSections.map((section) => ({
      label: section.label,
      rowCount: section.rowCount,
      blockedCount: section.blockedCount,
      nextAction: section.nextAction,
    })),
    restorePreviewSummary: {
      rowCount: restorePreview.readinessSummary.rowCount,
      blockedRowCount: restorePreview.readinessSummary.blockedRowCount,
      runnableActionCount: restorePreview.readinessSummary.runnableActionCount,
      nextAction: restorePreview.readinessSummary.nextAction,
    },
    runbookRows: runbook.runbookRows,
    blockers: [...new Set([...restorePreviewRows.flatMap((row) => row.blockers), ...runbook.blockers])].slice(0, 6),
    disabledActions: [
      { label: "Backup creation", reason: "Backup creation is not enabled." },
      { label: "Restore execution", reason: "Restore execution is not enabled." },
      { label: "Failover execution", reason: "Failover execution is not enabled." },
      { label: "Overwrite or delete", reason: "Overwrite and delete operations are not enabled." },
      { label: "Prune retention", reason: "Prune and retention delete operations are not enabled." },
    ],
    safety: {
      backupCreationAllowed: runbook.backupCreationAllowed,
      restoreExecutionAllowed: runbook.restoreExecutionAllowed,
      failoverAllowed: runbook.failoverAllowed,
      overwriteAllowed: runbook.overwriteAllowed,
      deleteAllowed: runbook.deleteAllowed,
      pruneAllowed: restorePreview.pruneAllowed,
      dbWritesAllowed: runbook.dbWritesAllowed,
      networkCallsAllowed: runbook.networkCallsAllowed,
      providerSpendAllowed: runbook.providerSpendAllowed,
    },
  };
}

export const backupDrReadinessViewModel = buildBackupDrReadinessViewModel();
