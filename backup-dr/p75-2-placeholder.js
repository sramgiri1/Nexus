import { createPassResult } from "../shared/resultEnvelope.js";
import { summarizeRedaction } from "../shared/redaction.js";

export const P75_2_REQUIRED_FIELDS = Object.freeze([
  "backupInventoryId",
  "backupScope",
  "sourceSurface",
  "retentionState",
  "redactionState",
  "backupCreationAllowed",
  "restoreExecutionAllowed",
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
  "displayFields",
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

export function createBackupInventoryContract(input = {}) {
  const redaction = summarizeRedaction({
    backupScope: input.backupScope || "nexus_os_runtime_state_preview",
    sourceSurface: input.sourceSurface || "Command Center readiness",
    sampleValue: input.sampleValue || "metadata_only_no_private_ids",
  });

  return {
    backupInventoryId: input.backupInventoryId || "backup-inventory-contract-preview",
    backupScope: input.backupScope || "nexus_os_runtime_state_preview",
    sourceSurface: input.sourceSurface || "Command Center readiness",
    retentionState: input.retentionState || "policy_pending_preview_only",
    redactionState: redaction.changed ? "redacted" : "redaction_checked",
    backupCreationAllowed: false,
    restoreExecutionAllowed: false,
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
    displayFields: [
      "backup scope",
      "source surface",
      "retention state",
      "backup creation state",
      "restore execution state",
      "next action",
      "disabled reason",
    ],
    blockedOperations: [
      "Backup creation",
      "Restore execution",
      "Failover execution",
      "Overwrite or delete operations",
      "DB writes",
      "Network or provider calls",
    ],
    disabledReason: "P75.2 records backup inventory contracts only; backup creation, restore execution, failover, overwrite, delete, DB writes, network calls, and provider spend remain disabled.",
    blockers: [
      "Backup creation is disabled.",
      "Restore execution and failover are disabled.",
      "Overwrite and delete operations are disabled.",
      "DB writes and project mutation are disabled.",
      "Provider/tool/worker execution and network calls are disabled.",
      "Deploy, release, export, package, auth mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p752-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P75.2"])],
    costImpact: "No backup storage calls, restore calls, network calls, provider calls, DB service calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.backupDrInventoryPreview",
    nextAction: input.nextAction || "Route this backup inventory contract through P75.3 restore plan preview.",
    commandCenterVisible: true,
  };
}

export function validateBackupInventoryContract(contract = {}) {
  const errors = [];
  for (const field of P75_2_REQUIRED_FIELDS) {
    if (!(field in contract)) errors.push(`missing ${field}`);
  }
  if (contract.backupCreationAllowed !== false || contract.restoreExecutionAllowed !== false || contract.failoverAllowed !== false) errors.push("backup, restore, and failover must be false");
  if (contract.overwriteAllowed !== false || contract.deleteAllowed !== false) errors.push("overwrite and delete must be false");
  if (contract.projectMutationAllowed !== false || contract.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (contract.providerDispatchAllowed !== false || contract.toolExecutionAllowed !== false || contract.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (contract.networkCallsAllowed !== false || contract.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (contract.deployExecutionAllowed !== false || contract.releaseExecutionAllowed !== false || contract.exportExecutionAllowed !== false || contract.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (contract.authMutationAllowed !== false) errors.push("auth mutation must be false");
  if (!Array.isArray(contract.blockedOperations) || contract.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!Array.isArray(contract.blockers) || contract.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(contract.forbiddenFiles) || !contract.forbiddenFiles.includes("projects/**") || !contract.forbiddenFiles.includes("db/**") || !contract.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!contract.disabledReason || /backup now|create backup|restore now|execute restore|failover now|delete now/i.test(contract.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(contract.evidenceRefs) || contract.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(contract.activityRefs) || contract.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildBackupInventoryContractEnvelope(input = {}) {
  const contract = createBackupInventoryContract(input);
  return createPassResult({
    phase: "P75.2",
    mode: "preview-only",
    source: "backup-dr/p75-2-placeholder.js",
    summary: "Backup inventory contract recorded without enabling backup creation, restore execution, DB writes, or network calls.",
    data: { contract },
    evidence: contract.evidenceRefs,
  });
}

export const P75_2_SAMPLE_CONTRACTS = Object.freeze([
  createBackupInventoryContract({
    evidenceRefs: ["reports/p752-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P75.2"],
  }),
]);
