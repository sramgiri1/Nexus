import { createRestorePlanPreview, validateRestorePlanPreview } from "../backup-dr/p75-3-placeholder.js";
import { buildModeGuardResult } from "./modeGuard.js";
import { summarizeRedaction } from "./redaction.js";
import { createPassResult, validateResultEnvelope } from "./resultEnvelope.js";
import {
  BACKUP_RECOVERY_DR_RETENTION_PHASE,
  buildBackupRecoveryDrRetentionModel,
  validateBackupRecoveryDrRetentionModel,
} from "./backupRecoveryDrRetentionModel.js";

export const BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE = "P140.3";
export const BACKUP_RECOVERY_DR_RESTORE_PREVIEW_VERSION = "1.0";

export const BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS = Object.freeze([
  "restoreExecutionAllowed",
  "backupCreationAllowed",
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
  "rawJsonVisible",
  "rawLogsVisible",
  "rawPolicyDumpsVisible",
  "rawStorageLocationsVisible",
]);

const OWNER_CAPABILITY = "NEXUS Backup Recovery Restore Preview Guard";
const DEFAULT_DISABLED_REASON = "P140.3 builds a display-safe restore preview only. Restore execution, failover, overwrite, delete, prune, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, and spend remain blocked.";
const DEFAULT_ACTIVITY_REF = "os-roadmap/phase-status.json#P140.3";
const DEFAULT_REPORT_REF = "reports/p1403-backup-recovery-dr-restore-preview-report.md";

function blockedAuthorityFlags() {
  return Object.fromEntries(BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS.map((flag) => [flag, false]));
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

function uniqueList(values = []) {
  return [...new Set(asArray(values))];
}

function hasRawIdentifier(value) {
  return /(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|backup|restore|runbook|storage)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(JSON.stringify(value));
}

function buildDisplayRef(prefix, sequence) {
  return `${prefix}-${Number.isFinite(Number(sequence)) ? Number(sequence) : 1}`;
}

function buildRedactionState(row) {
  const redaction = summarizeRedaction({
    sourceScope: row.restoreScope || "NEXUS OS restore preview",
    sourceSurface: "Backup / DR restore preview",
    sampleValue: "display-safe restore preview metadata only",
  });
  return {
    redacted: true,
    redactionChecked: true,
    redactionChanged: redaction.changed,
    rawPrivateIdsVisible: false,
    rawJsonVisible: false,
    rawLogsVisible: false,
    rawPolicyDumpsVisible: false,
    rawStorageLocationsVisible: false,
  };
}

export function buildBackupRecoveryDrRestorePreviewRow(input = {}) {
  const sequence = Number.isFinite(Number(input.sequence)) ? Number(input.sequence) : 1;
  const sourceDrill = input.restoreDrill || {};
  const plan = createRestorePlanPreview({
    restorePlanId: normalizeText(input.restorePlanRef, buildDisplayRef("restore-preview-plan", sequence)),
    restoreScope: normalizeText(input.restoreScope, sourceDrill.restoreScope || "NEXUS OS reliability model"),
    sourceBackup: normalizeText(input.sourceBackup, sourceDrill.backupRef || buildDisplayRef("backup-record", sequence)),
    evidenceRefs: uniqueList([DEFAULT_REPORT_REF, ...asArray(input.evidenceRefs), ...asArray(sourceDrill.evidenceRefs)]),
    activityRefs: uniqueList([DEFAULT_ACTIVITY_REF, ...asArray(input.activityRefs)]),
    nextAction: "Review restore scope, approval gate, blockers, and evidence before any future runtime authority is considered.",
  });
  const planValidation = validateRestorePlanPreview(plan);
  const flags = blockedAuthorityFlags();
  const row = {
    rowRef: normalizeText(input.rowRef, buildDisplayRef("restore-preview-row", sequence)),
    schemaVersion: BACKUP_RECOVERY_DR_RESTORE_PREVIEW_VERSION,
    phase: BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE,
    sourceModelPhase: BACKUP_RECOVERY_DR_RETENTION_PHASE,
    restorePlanRef: plan.restorePlanId,
    sourceBackupLabel: plan.sourceBackup,
    restoreScope: plan.restoreScope,
    approvalRequired: true,
    approvalState: plan.approvalState,
    executionState: "blocked",
    previewState: planValidation.valid ? "ready-for-review" : "needs-model-review",
    blockedOperations: uniqueList([...plan.blockedOperations, "Failover", "Prune or retention delete"]),
    blockers: uniqueList([...plan.blockers, DEFAULT_DISABLED_REASON]),
    forbiddenFiles: uniqueList([...plan.forbiddenFiles, "generated-projects/**", "local-state/runtime/**"]),
    evidenceRefs: uniqueList([DEFAULT_REPORT_REF, ...plan.evidenceRefs]),
    activityRefs: uniqueList([DEFAULT_ACTIVITY_REF, ...plan.activityRefs]),
    ownerCapability: OWNER_CAPABILITY,
    disabledReason: DEFAULT_DISABLED_REASON,
    nextAction: plan.nextAction,
    redactionState: buildRedactionState(plan),
    costImpact: {
      estimatedUsd: 0,
      actualUsd: 0,
      restoreCalls: 0,
      storageCalls: 0,
      providerSpendAllowed: false,
    },
    safetyFlags: flags,
    ...flags,
  };
  return row;
}

export function validateBackupRecoveryDrRestorePreviewRow(row = {}) {
  const errors = [];
  if (!row.rowRef) errors.push("rowRef is required");
  if (row.phase !== BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE) errors.push("phase must be P140.3");
  if (row.sourceModelPhase !== BACKUP_RECOVERY_DR_RETENTION_PHASE) errors.push("source model phase must be P140.2");
  if (!row.restorePlanRef || !row.restoreScope || !row.sourceBackupLabel) errors.push("restore preview references are required");
  if (row.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (row.executionState !== "blocked") errors.push("executionState must stay blocked");
  if (!Array.isArray(row.blockedOperations) || row.blockedOperations.length < 8) errors.push("blockedOperations must be visible");
  if (!Array.isArray(row.blockers) || row.blockers.length < 7) errors.push("blockers must be visible");
  if (!Array.isArray(row.forbiddenFiles) || !row.forbiddenFiles.includes("projects/**") || !row.forbiddenFiles.includes("db/**") || !row.forbiddenFiles.includes("providers/**")) errors.push("forbidden files must include project, DB, and provider paths");
  if (!Array.isArray(row.evidenceRefs) || row.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(row.activityRefs) || row.activityRefs.length === 0) errors.push("activityRefs are required");
  if (!row.redactionState?.redacted || row.redactionState.rawPrivateIdsVisible !== false || row.redactionState.rawStorageLocationsVisible !== false) errors.push("redaction state must hide raw identifiers and storage locations");
  if (Object.values(row.safetyFlags || {}).some((value) => value !== false)) errors.push("row safety flags must be false");
  if (BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS.some((flag) => row[flag] !== false)) errors.push("row authority flags must be false");
  if (row.costImpact?.estimatedUsd !== 0 || row.costImpact?.actualUsd !== 0 || row.costImpact?.providerSpendAllowed !== false) errors.push("cost impact must be zero-spend");
  if (!row.disabledReason || /restore now|execute restore|failover now|overwrite now|delete now|prune now|backup now|deploy now|spend now/i.test(row.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (hasRawIdentifier(row)) errors.push("row must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildBackupRecoveryDrRestorePreview(input = {}) {
  const sourceModel = input.sourceModel || buildBackupRecoveryDrRetentionModel(input);
  const sourceValidation = validateBackupRecoveryDrRetentionModel(sourceModel);
  const restorePreviewRows = (sourceModel.restoreDrills || []).map((restoreDrill, index) => buildBackupRecoveryDrRestorePreviewRow({
    sequence: index + 1,
    restoreDrill,
    evidenceRefs: sourceModel.evidenceRefs,
    activityRefs: sourceModel.activityRefs,
  }));
  const flags = blockedAuthorityFlags();
  return {
    phase: BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE,
    schemaVersion: BACKUP_RECOVERY_DR_RESTORE_PREVIEW_VERSION,
    mode: "display-safe-restore-preview",
    sourceModelPhase: sourceModel.phase,
    sourceModelValid: sourceValidation.valid,
    ownerCapability: OWNER_CAPABILITY,
    modeGuard: buildModeGuardResult("public-safe", ["public-safe", "local-private", "test"]),
    restorePreviewRows,
    previewSections: [
      {
        sectionRef: "restore-source-review",
        label: "Restore source review",
        rowCount: restorePreviewRows.length,
        blockedCount: restorePreviewRows.length,
        nextAction: "Confirm display-safe source labels and evidence before any future restore authority.",
      },
      {
        sectionRef: "restore-authority-gate",
        label: "Restore authority gate",
        rowCount: restorePreviewRows.length,
        blockedCount: restorePreviewRows.length,
        nextAction: "Keep restore, failover, overwrite, delete, prune, write, deploy, network, and spend authority disabled.",
      },
    ],
    readinessSummary: {
      rowCount: restorePreviewRows.length,
      blockedRowCount: restorePreviewRows.length,
      runnableActionCount: 0,
      sourceModelValid: sourceValidation.valid,
      nextAction: "Route P140.3 restore preview into P140.4 Backup / DR Command Center UX.",
    },
    disabledReason: DEFAULT_DISABLED_REASON,
    nextAction: "Route display-safe restore preview to P140.4 Command Center UX before any runtime authority is considered.",
    evidenceRefs: uniqueList([DEFAULT_REPORT_REF, ...asArray(sourceModel.evidenceRefs)]),
    activityRefs: uniqueList([DEFAULT_ACTIVITY_REF, ...asArray(sourceModel.activityRefs)]),
    costImpact: {
      estimatedUsd: 0,
      actualUsd: 0,
      restoreCalls: 0,
      storageCalls: 0,
      networkCalls: 0,
      providerSpendAllowed: false,
    },
    safetyFlags: flags,
    ...flags,
  };
}

export function validateBackupRecoveryDrRestorePreview(preview = {}) {
  const errors = [];
  if (preview.phase !== BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE) errors.push("phase must be P140.3");
  if (preview.mode !== "display-safe-restore-preview") errors.push("mode must be display-safe-restore-preview");
  if (preview.sourceModelPhase !== BACKUP_RECOVERY_DR_RETENTION_PHASE) errors.push("sourceModelPhase must be P140.2");
  if (!preview.modeGuard?.ok) errors.push("mode guard must pass");
  if (!Array.isArray(preview.restorePreviewRows) || preview.restorePreviewRows.length < 2) errors.push("restorePreviewRows must be visible");
  for (const row of preview.restorePreviewRows || []) {
    const validation = validateBackupRecoveryDrRestorePreviewRow(row);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `row: ${error}`));
  }
  if (!Array.isArray(preview.previewSections) || preview.previewSections.length < 2) errors.push("previewSections must be visible");
  if (preview.readinessSummary?.runnableActionCount !== 0 || preview.readinessSummary?.blockedRowCount !== preview.restorePreviewRows?.length) errors.push("readiness summary must keep all rows blocked");
  if (Object.values(preview.safetyFlags || {}).some((value) => value !== false)) errors.push("preview safety flags must be false");
  if (BACKUP_RECOVERY_DR_RESTORE_PREVIEW_AUTHORITY_FLAGS.some((flag) => preview[flag] !== false)) errors.push("preview authority flags must be false");
  if (preview.costImpact?.estimatedUsd !== 0 || preview.costImpact?.actualUsd !== 0 || preview.costImpact?.providerSpendAllowed !== false) errors.push("cost impact must be zero-spend");
  if (!Array.isArray(preview.evidenceRefs) || preview.evidenceRefs.length === 0) errors.push("evidenceRefs are required");
  if (!Array.isArray(preview.activityRefs) || preview.activityRefs.length === 0) errors.push("activityRefs are required");
  if (!preview.disabledReason || /restore now|execute restore|failover now|overwrite now|delete now|prune now|backup now|deploy now|spend now/i.test(preview.disabledReason)) errors.push("disabledReason must not imply runnable behavior");
  if (hasRawIdentifier(preview)) errors.push("preview must not expose raw private identifiers");
  return { valid: errors.length === 0, errors };
}

export function buildBackupRecoveryDrRestorePreviewEnvelope(input = {}) {
  const preview = input.preview || buildBackupRecoveryDrRestorePreview(input);
  const validation = validateBackupRecoveryDrRestorePreview(preview);
  const envelope = createPassResult({
    phase: BACKUP_RECOVERY_DR_RESTORE_PREVIEW_PHASE,
    mode: "display-safe-restore-preview",
    source: "shared/backupRecoveryDrRestorePreview.js",
    summary: "Display-safe restore preview generated without enabling restore execution, failover, overwrite, delete, DB/runtime writes, network calls, or spend.",
    data: { preview },
    warnings: validation.valid ? [] : validation.errors,
    evidence: preview.evidenceRefs,
  });
  const envelopeValidation = validateResultEnvelope(envelope);
  return {
    ...envelope,
    envelopeValid: envelopeValidation.valid,
    envelopeErrors: envelopeValidation.errors,
  };
}
