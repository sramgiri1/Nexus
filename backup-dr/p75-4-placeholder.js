import { createPassResult } from "../shared/resultEnvelope.js";
import { P75_3_SAMPLE_PREVIEWS, validateRestorePlanPreview } from "./p75-3-placeholder.js";

export const P75_4_REQUIRED_FIELDS = Object.freeze([
  "disasterRecoveryRunbookId",
  "sourceRestorePlanId",
  "disasterRecoveryMode",
  "recoveryObjective",
  "restorePlanPreview",
  "safetyGateState",
  "approvalRequired",
  "failoverAllowed",
  "restoreExecutionAllowed",
  "backupCreationAllowed",
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
  "runbookRows",
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

export function createDisasterRecoveryRunbook(input = {}) {
  const restorePlan = input.restorePlanPreview || P75_3_SAMPLE_PREVIEWS[0];
  const restoreValidation = validateRestorePlanPreview(restorePlan);
  const sourceRestorePlanId = restoreValidation.valid ? restorePlan.restorePlanId : "restore-plan-unavailable";

  return {
    disasterRecoveryRunbookId: input.disasterRecoveryRunbookId || "disaster-recovery-runbook-preview",
    sourceRestorePlanId,
    disasterRecoveryMode: input.disasterRecoveryMode || "preview_only_no_failover",
    recoveryObjective: input.recoveryObjective || "documented_recovery_path_not_executable",
    restorePlanPreview: sourceRestorePlanId,
    safetyGateState: input.safetyGateState || "blocked_until_explicit_runtime_phase",
    approvalRequired: true,
    failoverAllowed: false,
    restoreExecutionAllowed: false,
    backupCreationAllowed: false,
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
    runbookRows: [
      {
        label: "Recovery objective",
        currentState: "defined",
        executionState: "not executable",
      },
      {
        label: "Restore source",
        currentState: sourceRestorePlanId,
        executionState: "disabled",
      },
      {
        label: "Safety gate",
        currentState: "blocked",
        executionState: "requires explicit future phase",
      },
    ],
    blockedOperations: [
      "Failover execution",
      "Restore execution",
      "Backup creation",
      "Overwrite or delete operations",
      "DB writes",
      "Network or provider calls",
    ],
    disabledReason: "P75.4 records disaster recovery runbooks only; failover, restore execution, backup creation, overwrite, delete, DB writes, network calls, and provider spend remain disabled.",
    blockers: [
      "Failover execution is disabled.",
      "Restore execution is disabled.",
      "Backup creation, overwrite, and delete operations are disabled.",
      "DB writes and project mutation are disabled.",
      "Provider/tool/worker execution and network calls are disabled.",
      "Deploy, release, export, package, auth mutation, and provider spend remain disabled.",
      ...normalizeList(input.blockers),
    ],
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES],
    evidenceRefs: [...new Set([...normalizeList(input.evidenceRefs), "reports/p754-report.md"])],
    activityRefs: [...new Set([...normalizeList(input.activityRefs), "os-roadmap/phase-status.json#P75.4"])],
    costImpact: "No failover calls, restore calls, backup storage calls, network calls, provider calls, DB service calls, or provider spend.",
    ownerCapability: input.ownerCapability || "NEXUS.backupDrRunbookPreview",
    nextAction: input.nextAction || "Route this disaster recovery runbook through P75.5 Command Center Backup/DR readiness UX.",
    commandCenterVisible: true,
  };
}

export function validateDisasterRecoveryRunbook(runbook = {}) {
  const errors = [];
  for (const field of P75_4_REQUIRED_FIELDS) {
    if (!(field in runbook)) errors.push(`missing ${field}`);
  }
  if (runbook.failoverAllowed !== false || runbook.restoreExecutionAllowed !== false || runbook.backupCreationAllowed !== false) errors.push("failover, restore, and backup must be false");
  if (runbook.overwriteAllowed !== false || runbook.deleteAllowed !== false) errors.push("overwrite and delete must be false");
  if (runbook.projectMutationAllowed !== false || runbook.dbWritesAllowed !== false) errors.push("project mutation and DB writes must be false");
  if (runbook.providerDispatchAllowed !== false || runbook.toolExecutionAllowed !== false || runbook.workerExecutionAllowed !== false) errors.push("provider/tool/worker execution must be false");
  if (runbook.networkCallsAllowed !== false || runbook.providerSpendAllowed !== false) errors.push("network/spend must be false");
  if (runbook.deployExecutionAllowed !== false || runbook.releaseExecutionAllowed !== false || runbook.exportExecutionAllowed !== false || runbook.packageCreationAllowed !== false) errors.push("deploy/release/export/package execution must be false");
  if (runbook.authMutationAllowed !== false) errors.push("auth mutation must be false");
  if (runbook.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (!String(runbook.safetyGateState || "").includes("blocked")) errors.push("safetyGateState must be blocked");
  if (!Array.isArray(runbook.runbookRows) || runbook.runbookRows.length < 3) errors.push("runbookRows must be visible");
  if (!Array.isArray(runbook.blockedOperations) || runbook.blockedOperations.length < 6) errors.push("blockedOperations must be visible");
  if (!Array.isArray(runbook.blockers) || runbook.blockers.length < 6) errors.push("blockers must be visible");
  if (!Array.isArray(runbook.forbiddenFiles) || !runbook.forbiddenFiles.includes("projects/**") || !runbook.forbiddenFiles.includes("db/**") || !runbook.forbiddenFiles.includes("providers/**")) errors.push("project, DB, and provider files must remain forbidden");
  if (!runbook.disabledReason || /failover now|restore now|execute restore|create backup|overwrite now|delete now/i.test(runbook.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (!Array.isArray(runbook.evidenceRefs) || runbook.evidenceRefs.length === 0) errors.push("evidenceRefs must be visible");
  if (!Array.isArray(runbook.activityRefs) || runbook.activityRefs.length === 0) errors.push("activityRefs must be visible");
  return { valid: errors.length === 0, errors };
}

export function buildDisasterRecoveryRunbookEnvelope(input = {}) {
  const runbook = createDisasterRecoveryRunbook(input);
  return createPassResult({
    phase: "P75.4",
    mode: "preview-only",
    source: "backup-dr/p75-4-placeholder.js",
    summary: "Disaster recovery runbook recorded without enabling failover, restore execution, DB writes, or network calls.",
    data: { runbook },
    evidence: runbook.evidenceRefs,
  });
}

export const P75_4_SAMPLE_RUNBOOKS = Object.freeze([
  createDisasterRecoveryRunbook({
    restorePlanPreview: P75_3_SAMPLE_PREVIEWS[0],
    evidenceRefs: ["reports/p754-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P75.4"],
  }),
]);
