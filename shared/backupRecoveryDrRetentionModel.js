import { createBackupInventoryContract } from "../backup-dr/p75-2-placeholder.js";
import { createDisasterRecoveryRunbook } from "../backup-dr/p75-4-placeholder.js";
import { createRestorePlanPreview } from "../backup-dr/p75-3-placeholder.js";
import {
  SNAPSHOT_RETENTION_CLASSES,
  SNAPSHOT_RETENTION_POLICY,
  resolveSnapshotRetention,
  validateSnapshotRetentionPolicy,
} from "../ai-recovery/retentionPolicy.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";

export const BACKUP_RECOVERY_DR_RETENTION_PHASE = "P140.2";
export const BACKUP_RECOVERY_DR_RETENTION_VERSION = "1.0";

export const BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES = Object.freeze([
  "backupCreationAllowed",
  "restoreExecutionAllowed",
  "failoverAllowed",
  "overwriteAllowed",
  "deleteAllowed",
  "pruneAllowed",
  "dbRuntimeWritesAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "toolExecutionAllowed",
  "mcpServerStartupAllowed",
  "agentDispatchAllowed",
  "projectMutationAllowed",
  "patchApplicationAllowed",
  "buildExecutionAllowed",
  "testExecutionAllowed",
  "rollbackExecutionAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageCreationAllowed",
  "networkCallsAllowed",
  "providerSpendAllowed",
  "rawPrivateIdsVisible",
  "rawBackupPayloadVisible",
  "rawJsonVisible",
  "rawLogsVisible",
  "rawPolicyDumpsVisible",
  "rawStorageLocationsVisible",
]);

const OWNER_CAPABILITY = "NEXUS Backup Recovery DR Retention Guard";
const DEFAULT_SCOPE = "NEXUS OS reliability model";
const DEFAULT_CREATED_AT = "2026-05-31T01:24:00.000Z";
const DISABLED_REASON = "P140.2 defines a read-only backup and retention model. Backup creation, restore execution, failover, overwrite, delete, prune, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";

function blockedSafetyFlags() {
  return Object.fromEntries(BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES.map((flag) => [flag, false]));
}

function normalizeText(value = "", fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function asArray(value = []) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function hasRawIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function buildDisplayRef(prefix, sequence) {
  return `${prefix}-${Number.isFinite(Number(sequence)) ? Number(sequence) : 1}`;
}

function buildRedactionState(input = {}) {
  const redaction = summarizeRedaction({
    sourceScope: input.sourceScope || DEFAULT_SCOPE,
    sourceSurface: input.sourceSurface || "Backup / DR model",
    sampleValue: input.sampleValue || "metadata only, no raw private IDs or storage locations",
  });
  return {
    redacted: true,
    redactionChecked: true,
    redactionChanged: redaction.changed,
    rawPrivateIdsVisible: false,
    rawBackupPayloadVisible: false,
    rawJsonVisible: false,
    rawLogsVisible: false,
    rawPolicyDumpsVisible: false,
    rawStorageLocationsVisible: false,
  };
}

export function buildBackupRecoveryDrRetentionBackupRecord(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const createdAt = normalizeText(input.createdAt, DEFAULT_CREATED_AT);
  const inventory = input.inventory || createBackupInventoryContract({
    backupInventoryId: buildDisplayRef("backup-readiness-model", sequence),
    backupScope: normalizeText(input.sourceScope, DEFAULT_SCOPE),
    sourceSurface: normalizeText(input.sourceSurface, "Backup / DR readiness"),
    retentionState: "read-only policy model",
    evidenceRefs: ["reports/p1402-backup-recovery-dr-retention-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P140.2"],
    nextAction: "Route the read-only backup record to restore preview planning before any runtime authority is considered.",
  });
  return {
    backupRef: normalizeText(input.backupRef, buildDisplayRef("backup-record", sequence)),
    schemaVersion: BACKUP_RECOVERY_DR_RETENTION_VERSION,
    phase: BACKUP_RECOVERY_DR_RETENTION_PHASE,
    sourceScope: normalizeText(input.sourceScope, DEFAULT_SCOPE),
    sourceSurface: normalizeText(input.sourceSurface, "Backup / DR readiness"),
    retentionClass: SNAPSHOT_RETENTION_CLASSES.includes(input.retentionClass)
      ? input.retentionClass
      : "phase_evidence",
    recoveryObjective: normalizeText(input.recoveryObjective, "Document recovery path before future runtime reliance."),
    inventoryState: {
      backupInventoryId: inventory.backupInventoryId,
      backupCreationAllowed: false,
      restoreExecutionAllowed: false,
      failoverAllowed: false,
      blockedOperations: [...inventory.blockedOperations],
    },
    evidenceRefs: [...new Set(["reports/p1402-backup-recovery-dr-retention-report.md", ...asArray(input.evidenceRefs)])],
    auditRefs: [...new Set(["reports/enterprise-readiness-roadmap-report.md", ...asArray(input.auditRefs)])],
    activityRefs: [...new Set(["os-roadmap/phase-status.json#P140.2", ...asArray(input.activityRefs)])],
    redactionState: buildRedactionState(input),
    policyDecision: {
      decision: "READ_ONLY_MODEL",
      executionAllowed: false,
      approvalRequiredBeforeRuntime: true,
      disabledReason: DISABLED_REASON,
    },
    ownerCapability: OWNER_CAPABILITY,
    disabledReason: DISABLED_REASON,
    createdAt,
    safetyFlags: blockedSafetyFlags(),
  };
}

export function validateBackupRecoveryDrRetentionBackupRecord(record = {}) {
  const errors = [];
  if (!record.backupRef) errors.push("backupRef is required");
  if (record.phase !== BACKUP_RECOVERY_DR_RETENTION_PHASE) errors.push("phase must be P140.2");
  if (!record.sourceScope || !record.sourceSurface) errors.push("source scope and surface are required");
  if (!SNAPSHOT_RETENTION_CLASSES.includes(record.retentionClass)) errors.push("retentionClass must be known");
  if (!Array.isArray(record.evidenceRefs) || record.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(record.activityRefs) || record.activityRefs.length === 0) errors.push("activityRefs are required");
  if (record.inventoryState?.backupCreationAllowed !== false || record.inventoryState?.restoreExecutionAllowed !== false || record.inventoryState?.failoverAllowed !== false) errors.push("inventory authority must remain false");
  if (!record.redactionState?.redacted || record.redactionState.rawPrivateIdsVisible !== false || record.redactionState.rawStorageLocationsVisible !== false) errors.push("redaction state must hide raw identifiers and storage locations");
  if (Object.values(record.safetyFlags || {}).some((value) => value !== false)) errors.push("all safety flags must be false");
  if (hasRawIdentifier(record)) errors.push("record must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildBackupRecoveryDrRetentionPolicy(input = {}) {
  const createdAt = normalizeText(input.createdAt, DEFAULT_CREATED_AT);
  const retentionClass = SNAPSHOT_RETENTION_CLASSES.includes(input.retentionClass)
    ? input.retentionClass
    : "phase_evidence";
  const retention = resolveSnapshotRetention({ retentionClass, createdAt });
  const classPolicy = SNAPSHOT_RETENTION_POLICY.classes[retentionClass];
  return {
    policyRef: normalizeText(input.policyRef, `${retentionClass.replace(/_/g, "-")}-retention-policy`),
    schemaVersion: BACKUP_RECOVERY_DR_RETENTION_VERSION,
    phase: BACKUP_RECOVERY_DR_RETENTION_PHASE,
    retentionClass,
    retentionLabel: classPolicy.label,
    retentionWindowDays: classPolicy.days,
    createdAt,
    expiresAt: retention.expiresAt,
    legalHoldState: normalizeText(input.legalHoldState, "not requested"),
    pruneAllowed: false,
    deleteAllowed: false,
    exportAllowed: false,
    dbRuntimeWritesAllowed: false,
    evidenceRefs: [...new Set(["reports/p1402-backup-recovery-dr-retention-report.md", ...asArray(input.evidenceRefs)])],
    disabledReason: DISABLED_REASON,
    ownerCapability: OWNER_CAPABILITY,
  };
}

export function validateBackupRecoveryDrRetentionPolicy(policy = {}) {
  const errors = [];
  const retentionValidation = validateSnapshotRetentionPolicy();
  if (!policy.policyRef) errors.push("policyRef is required");
  if (policy.phase !== BACKUP_RECOVERY_DR_RETENTION_PHASE) errors.push("phase must be P140.2");
  if (!SNAPSHOT_RETENTION_CLASSES.includes(policy.retentionClass)) errors.push("retentionClass must be known");
  if (!Number.isInteger(policy.retentionWindowDays) || policy.retentionWindowDays <= 0) errors.push("retentionWindowDays must be a positive integer");
  if (policy.pruneAllowed !== false || policy.deleteAllowed !== false || policy.exportAllowed !== false || policy.dbRuntimeWritesAllowed !== false) errors.push("retention runtime authority must remain false");
  if (!Array.isArray(policy.evidenceRefs) || policy.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!retentionValidation.valid) errors.push(...retentionValidation.errors);
  if (hasRawIdentifier(policy)) errors.push("policy must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

function buildRestoreDrill(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const backupRecord = input.backupRecord || buildBackupRecoveryDrRetentionBackupRecord({ sequence });
  const restorePreview = createRestorePlanPreview({
    restorePlanId: buildDisplayRef("restore-drill-preview", sequence),
    restoreScope: backupRecord.sourceScope,
    sourceBackup: backupRecord.backupRef,
    evidenceRefs: ["reports/p1402-backup-recovery-dr-retention-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P140.2"],
    nextAction: "Route this read-only restore drill to P140.3 restore preview before runtime authority.",
  });
  return {
    drillRef: buildDisplayRef("restore-drill", sequence),
    backupRef: backupRecord.backupRef,
    restoreScope: backupRecord.sourceScope,
    approvalState: restorePreview.approvalState,
    restoreExecutionAllowed: false,
    failoverAllowed: false,
    overwriteAllowed: false,
    deleteAllowed: false,
    evidenceRefs: [...restorePreview.evidenceRefs],
    blockedOperations: [...restorePreview.blockedOperations],
    disabledReason: DISABLED_REASON,
  };
}

function buildRecoveryRunbook(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const restoreDrill = input.restoreDrill || buildRestoreDrill({ sequence });
  const runbook = createDisasterRecoveryRunbook({
    disasterRecoveryRunbookId: buildDisplayRef("recovery-runbook-preview", sequence),
    restorePlanPreview: createRestorePlanPreview({
      restorePlanId: restoreDrill.drillRef,
      restoreScope: restoreDrill.restoreScope,
      sourceBackup: restoreDrill.backupRef,
    }),
    evidenceRefs: ["reports/p1402-backup-recovery-dr-retention-report.md"],
    activityRefs: ["os-roadmap/phase-status.json#P140.2"],
    nextAction: "Keep recovery runbook read-only until a later P140 subphase explicitly approves runtime authority.",
  });
  return {
    runbookRef: buildDisplayRef("recovery-runbook", sequence),
    recoveryMode: runbook.disasterRecoveryMode,
    recoveryObjective: runbook.recoveryObjective,
    safetyGateState: runbook.safetyGateState,
    approvalRequired: true,
    failoverAllowed: false,
    restoreExecutionAllowed: false,
    ownerCapability: OWNER_CAPABILITY,
    blockers: [...runbook.blockers],
    evidenceRefs: [...runbook.evidenceRefs],
    nextAction: runbook.nextAction,
    disabledReason: DISABLED_REASON,
  };
}

export function buildBackupRecoveryDrRetentionModel(input = {}) {
  const createdAt = normalizeText(input.createdAt, DEFAULT_CREATED_AT);
  const backupRecords = input.backupRecords || [
    buildBackupRecoveryDrRetentionBackupRecord({ sequence: 1, createdAt, retentionClass: "phase_evidence" }),
    buildBackupRecoveryDrRetentionBackupRecord({
      sequence: 2,
      createdAt,
      retentionClass: "final_validation",
      sourceSurface: "Final validation evidence",
      recoveryObjective: "Keep final validation evidence restorable for review without enabling restore execution.",
    }),
  ];
  const retentionPolicies = input.retentionPolicies || [
    buildBackupRecoveryDrRetentionPolicy({ retentionClass: "phase_evidence", createdAt }),
    buildBackupRecoveryDrRetentionPolicy({ retentionClass: "final_validation", createdAt }),
  ];
  const restoreDrills = backupRecords.map((backupRecord, index) => buildRestoreDrill({ sequence: index + 1, backupRecord }));
  const recoveryRunbooks = restoreDrills.map((restoreDrill, index) => buildRecoveryRunbook({ sequence: index + 1, restoreDrill }));
  const modeGuard = buildModeGuardResult("public-safe", ["public-safe", "local-private", "test"]);
  const safetyFlags = blockedSafetyFlags();
  return {
    phase: BACKUP_RECOVERY_DR_RETENTION_PHASE,
    schemaVersion: BACKUP_RECOVERY_DR_RETENTION_VERSION,
    mode: "read-only-model",
    ownerCapability: OWNER_CAPABILITY,
    modeGuard,
    sourceScope: DEFAULT_SCOPE,
    backupRecords,
    retentionPolicies,
    restoreDrills,
    recoveryRunbooks,
    readinessSummary: {
      backupRecordCount: backupRecords.length,
      retentionPolicyCount: retentionPolicies.length,
      restoreDrillCount: restoreDrills.length,
      recoveryRunbookCount: recoveryRunbooks.length,
      runnableActionCount: 0,
      nextAction: "Route P140.2 model output to P140.3 restore preview.",
    },
    safetyFlags,
    ...safetyFlags,
    disabledReason: DISABLED_REASON,
    nextAction: "Route the read-only backup and retention model to P140.3 restore preview before any runtime authority.",
    evidenceRefs: [
      "reports/p1402-backup-recovery-dr-retention-report.md",
      "reports/p1401-backup-recovery-dr-retention-report.md",
    ],
    activityRefs: ["os-roadmap/phase-status.json#P140.2"],
    costImpact: {
      estimatedUsd: 0,
      actualUsd: 0,
      storageCalls: 0,
      restoreCalls: 0,
      providerSpendAllowed: false,
    },
    createdAt,
  };
}

export function validateBackupRecoveryDrRetentionModel(model = {}) {
  const errors = [];
  if (model.phase !== BACKUP_RECOVERY_DR_RETENTION_PHASE) errors.push("phase must be P140.2");
  if (model.mode !== "read-only-model") errors.push("mode must be read-only-model");
  if (!model.modeGuard?.ok) errors.push("mode guard must pass for public-safe model rendering");
  if (!Array.isArray(model.backupRecords) || model.backupRecords.length < 2) errors.push("at least two backup records are required");
  if (!Array.isArray(model.retentionPolicies) || model.retentionPolicies.length < 2) errors.push("at least two retention policies are required");
  if (!Array.isArray(model.restoreDrills) || model.restoreDrills.length !== model.backupRecords?.length) errors.push("restore drill count must match backup records");
  if (!Array.isArray(model.recoveryRunbooks) || model.recoveryRunbooks.length !== model.restoreDrills?.length) errors.push("recovery runbook count must match restore drills");
  for (const record of model.backupRecords || []) {
    const validation = validateBackupRecoveryDrRetentionBackupRecord(record);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `backup: ${error}`));
  }
  for (const policy of model.retentionPolicies || []) {
    const validation = validateBackupRecoveryDrRetentionPolicy(policy);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `retention: ${error}`));
  }
  if ((model.restoreDrills || []).some((drill) => drill.restoreExecutionAllowed !== false || drill.failoverAllowed !== false || drill.overwriteAllowed !== false || drill.deleteAllowed !== false)) errors.push("restore drills must remain non-runnable");
  if ((model.recoveryRunbooks || []).some((runbook) => runbook.failoverAllowed !== false || runbook.restoreExecutionAllowed !== false || runbook.approvalRequired !== true)) errors.push("recovery runbooks must remain gated");
  if (Object.values(model.safetyFlags || {}).some((value) => value !== false)) errors.push("all safety flags must be false");
  if (BACKUP_RECOVERY_DR_RETENTION_SAFETY_FLAG_NAMES.some((flag) => model[flag] !== false)) errors.push("top-level safety flags must be false");
  if (model.costImpact?.estimatedUsd !== 0 || model.costImpact?.actualUsd !== 0 || model.costImpact?.providerSpendAllowed !== false) errors.push("cost impact must remain zero-spend");
  if (!Array.isArray(model.evidenceRefs) || model.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(model.activityRefs) || model.activityRefs.length === 0) errors.push("activityRefs are required");
  if (hasRawIdentifier(model)) errors.push("model must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildBackupRecoveryDrRetentionEnvelope(input = {}) {
  const model = input.model || buildBackupRecoveryDrRetentionModel(input);
  const validation = validateBackupRecoveryDrRetentionModel(model);
  const envelope = createPassResult({
    phase: BACKUP_RECOVERY_DR_RETENTION_PHASE,
    mode: "read-only-model",
    source: "shared/backupRecoveryDrRetentionModel.js",
    summary: "Read-only backup, recovery, DR, and retention model generated without enabling backup creation, restore execution, failover, prune/delete, DB/runtime writes, network calls, or spend.",
    data: { model },
    warnings: validation.valid ? [] : validation.errors,
    evidence: model.evidenceRefs,
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    envelopeValid: envelopeValidation.valid,
    envelopeErrors: envelopeValidation.errors,
  };
}
