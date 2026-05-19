import { createPassResult } from "../shared/resultEnvelope.js";
import { P75_2_SAMPLE_CONTRACTS, validateBackupInventoryContract } from "./p75-2-placeholder.js";

export const P75_3_REQUIRED_FIELDS = Object.freeze([
  "restorePlanId",
  "sourceBackupInventoryId",
  "restoreScope",
  "sourceBackup",
  "approvalRequired",
  "approvalState",
  "restoreExecutionAllowed",
  "backupCreationAllowed",
  "failoverAllowed",
  "overwriteAllowed",
  "deleteAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "providerDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "authMutationAllowed",
  "providerSpendAllowed",
  "previewRows",
  "blockedOperations",
  "disabledReason",
  "blockers",
  "forbiddenFiles",
  "evidenceRefs",
  "activityRefs",
  "costImpact",
  "ownerCapability",
  "nextAction",
]);

const DEFAULT_FORBIDDEN_FILES = Object.freeze([
  "projects/**",
  "project-roadmap/**",
  "db/**",
  "prisma/**",
  "migrations/**",
  "providers/**",
  "tools/**",
  "worker-runtime/**",
  "deploy/**",
  "release/**",
  "auth/**",
  "users/**",
  "rbac/**",
  ".env",
  ".env.*",
]);

function normalizeList(value = []) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
}

export function createRestorePlanPreview(input = {}) {
  const backupInventory = input.backupInventory || P75_2_SAMPLE_CONTRACTS[0];
  const backupValidation = validateBackupInventoryContract(backupInventory);
  const sourceBackupInventoryId = backupValidation.valid
    ? backupInventory.backupInventoryId
    : "backup-inventory-unavailable";

  return {
    restorePlanId: input.restorePlanId || "restore-plan-preview",
    sourceBackupInventoryId,
    restoreScope: input.restoreScope || "nexus_os_runtime_state_preview",
    sourceBackup: input.sourceBackup || "backup_inventory_contract_preview",
    approvalRequired: true,
    approvalState: input.approvalState || "required_before_future_runtime",
    restoreExecutionAllowed: false,
    backupCreationAllowed: false,
    failoverAllowed: false,
    overwriteAllowed: false,
    deleteAllowed: false,
    dbWritesAllowed: false,
    projectMutationAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    workerExecutionAllowed: false,
    networkCallsAllowed: false,
    deployExecutionAllowed: false,
    releaseExecutionAllowed: false,
    exportExecutionAllowed: false,
    packageCreationAllowed: false,
    authMutationAllowed: false,
    providerSpendAllowed: false,
    previewRows: [
      {
        label: "Restore source",
        currentState: sourceBackupInventoryId,
        executionState: "disabled",
      },
      {
        label: "Approval gate",
        currentState: "required",
        executionState: "not executable",
      },
    ],
    blockedOperations: [
      "Restore execution",
      "Overwrite operations",
      "Delete operations",
      "Backup creation",
      "DB writes",
      "Network or provider calls",
    ],
    disabledReason: "P75.3 records restore plan previews only; restore execution, overwrite, delete, backup creation, DB writes, network calls, and provider spend remain disabled.",
    blockers: [
      "Restore execution is disabled.",
      "Overwrite and delete operations are disabled.",
      "Backup creation and failover are disabled.",
      "DB writes and project mutation are disabled.",
      "Provider/tool/worker execution and network calls are disabled.",
      "Deploy, release, export, package, auth mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p753-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P75.3"])],
    costImpact: "No restore calls, backup storage calls, network calls, provider calls, DB service calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.backupDrRestorePreview",
    nextAction: input.nextAction || "Route this restore plan preview through P75.4 disaster recovery runbook gate.",
    commandCenterVisible: true,
  };
}

export function validateRestorePlanPreview(plan = {}) {
  const errors = [];
  for (const field of P75_3_REQUIRED_FIELDS) {
    if (!(field in plan)) errors.push(`missing ${field}`);
  }
  if (plan.restoreExecutionAllowed !== false || plan.backupCreationAllowed !== false || plan.failoverAllowed !== false) errors.push("restore, backup, and failover must be false");
  if (plan.overwriteAllowed !== false || plan.deleteAllowed !== false) errors.push("overwrite and delete must be false");
  if (plan.projectMutationAllowed !== false || plan.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (plan.providerDispatchAllowed !== false || plan.toolExecutionAllowed !== false || plan.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (plan.networkCallsAllowed !== false || plan.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (plan.deployExecutionAllowed !== false || plan.releaseExecutionAllowed !== false || plan.exportExecutionAllowed !== false || plan.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (plan.authMutationAllowed !== false) errors.push("auth mutation must be false");
  if (plan.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!Array.isArray(plan.previewRows) || plan.previewRows.length < 2) errors.push("previewRows must be visible");
  if (!Array.isArray(plan.blockedOperations) || plan.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!Array.isArray(plan.blockers) || plan.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(plan.forbiddenFiles) || !plan.forbiddenFiles.includes("projects/**") || !plan.forbiddenFiles.includes("db/**") || !plan.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!plan.disabledReason || /restore now|execute restore|overwrite now|delete now|backup now|failover now/i.test(plan.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(plan.evidenceRefs) || plan.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(plan.activityRefs) || plan.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildRestorePlanPreviewEnvelope(input = {}) {
  const plan = createRestorePlanPreview(input);
  return createPassResult({
    phase: "P75.3",
    mode: "preview-only",
    source: "backup-dr/p75-3-placeholder.js",
    summary: "Restore plan preview recorded without enabling restore execution, overwrite, delete, DB writes, or network calls.",
    data: { plan },
    evidence: plan.evidenceRefs,
  });
}

export const P75_3_SAMPLE_PREVIEWS = Object.freeze([
  createRestorePlanPreview({
    backupInventory: P75_2_SAMPLE_CONTRACTS[0],
    evidenceRefs: ["reports/p753-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P75.3"],
  }),
]);
