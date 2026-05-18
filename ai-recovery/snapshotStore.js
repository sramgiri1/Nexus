import { createHash, randomUUID } from "node:crypto";
import {
  SNAPSHOT_RETENTION_CLASSES,
  SNAPSHOT_RETENTION_POLICY,
  previewSnapshotPrune,
  resolveSnapshotRetention,
} from "./retentionPolicy.js";
import { normalizeSnapshotRecord, validateSnapshotRecord } from "./snapshotContract.js";
import { buildRecoveryPoint, validateRecoveryPoint } from "./recoveryPointModel.js";

export const SNAPSHOT_STORE_VERSION = "p63.4-preview";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hashStoreRecord(record = {}) {
  const { storeHash, ...hashable } = record;
  return createHash("sha256").update(JSON.stringify(hashable)).digest("hex");
}

function buildStoreRecordId(snapshotId, recoveryPointId) {
  const seed = `${snapshotId}:${recoveryPointId}`;
  return `snapshot_store_${createHash("sha256").update(seed).digest("hex").slice(0, 12)}`;
}

export function buildSnapshotStoreRecord(input = {}) {
  const snapshot = input.snapshot || {};
  const recoveryPoint = input.recoveryPoint || {};
  const createdAt = normalizeString(input.createdAt) || normalizeString(snapshot.createdAt) || new Date().toISOString();
  const retention = resolveSnapshotRetention({
    retentionClass: input.retentionClass,
    createdAt,
  });
  const snapshotId = normalizeString(snapshot.snapshotId) || `snapshot_${randomUUID()}`;
  const recoveryPointId = normalizeString(recoveryPoint.recoveryPointId) || `recovery_${snapshotId}`;

  const record = {
    storeRecordId: normalizeString(input.storeRecordId) || buildStoreRecordId(snapshotId, recoveryPointId),
    snapshotId,
    recoveryPointId,
    displayTitle:
      normalizeString(input.displayTitle)
      || normalizeString(snapshot.displayTitle)
      || normalizeString(recoveryPoint.displayTitle)
      || "AI interaction recovery snapshot",
    scopeLabel: normalizeString(snapshot.scopeLabel) || "NEXUS OS",
    createdAt,
    expiresAt: retention.expiresAt,
    retentionClass: retention.retentionClass,
    retentionLabel: retention.retentionLabel,
    redactionLevel: normalizeString(snapshot.redactionLevel) || "internal_redacted",
    recoveryPosture: normalizeString(recoveryPoint.state) || normalizeString(snapshot.recoveryEligibility) || "inspect_only",
    recoveryPostureLabel: normalizeString(recoveryPoint.stateLabel) || "Inspect only",
    nextActionLabel:
      normalizeString(recoveryPoint.nextSafeActionLabel)
      || "Inspect redacted recovery snapshot.",
    evidenceRefs: normalizeArray(snapshot.evidenceRefs).map((ref) => ({
      label: normalizeString(ref.label),
      path: normalizeString(ref.path),
    })),
    previewOnly: true,
    durableDbWritesEnabled: false,
    executionEnabled: false,
    restoreEnabled: false,
    replayEnabled: false,
    resumeEnabled: false,
    prunePreview: {
      previewOnly: true,
      dryRun: true,
      deleteEnabled: false,
      blockedReason: "P63.4 only previews retention and pruning.",
    },
    storeHash: "",
  };

  record.storeHash = hashStoreRecord(record);
  return record;
}

export function validateSnapshotStoreRecord(record = {}) {
  const errors = [];
  const warnings = [];

  for (const field of [
    "storeRecordId",
    "snapshotId",
    "recoveryPointId",
    "displayTitle",
    "scopeLabel",
    "createdAt",
    "expiresAt",
    "retentionClass",
    "retentionLabel",
    "redactionLevel",
    "recoveryPosture",
    "recoveryPostureLabel",
    "nextActionLabel",
  ]) {
    if (!normalizeString(record[field])) errors.push(`missing_${field}`);
  }

  if (!SNAPSHOT_RETENTION_CLASSES.includes(record.retentionClass)) {
    errors.push("invalid_retention_class");
  }

  if (record.previewOnly !== true) errors.push("preview_only_required");
  if (record.durableDbWritesEnabled !== false) errors.push("db_writes_must_remain_disabled");
  if (record.executionEnabled !== false) errors.push("execution_must_remain_disabled");
  if (record.restoreEnabled !== false) errors.push("restore_must_remain_disabled");
  if (record.replayEnabled !== false) errors.push("replay_must_remain_disabled");
  if (record.resumeEnabled !== false) errors.push("resume_must_remain_disabled");
  if (record.prunePreview?.dryRun !== true) errors.push("prune_preview_dry_run_required");
  if (record.prunePreview?.deleteEnabled !== false) errors.push("prune_delete_must_remain_disabled");

  if (record.storeHash && record.storeHash !== hashStoreRecord(record)) {
    errors.push("store_hash_mismatch");
  }

  if (record.displayTitle.includes("project_") || record.displayTitle.includes("private_")) {
    errors.push("display_title_contains_raw_id");
  }

  if (record.evidenceRefs?.some((ref) => normalizeString(ref.recordId))) {
    errors.push("primary_store_evidence_refs_must_not_expose_record_ids");
  }

  if (!record.evidenceRefs || record.evidenceRefs.length === 0) {
    warnings.push("missing_evidence_refs");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildSnapshotStorePreview(inputs = [], options = {}) {
  const records = inputs.map(buildSnapshotStoreRecord);
  const prunePreview = previewSnapshotPrune(records, options);
  const validations = records.map(validateSnapshotStoreRecord);

  return {
    version: SNAPSHOT_STORE_VERSION,
    previewOnly: true,
    durableDbWritesEnabled: false,
    deleteEnabled: false,
    exportEnabled: false,
    records,
    prunePreview,
    validation: {
      valid: validations.every((result) => result.valid),
      results: validations,
    },
    display: records.map((record) => ({
      title: record.displayTitle,
      timestamp: record.createdAt,
      scope: record.scopeLabel,
      redaction: record.redactionLevel,
      retention: record.retentionLabel,
      recoveryPosture: record.recoveryPostureLabel,
      nextAction: record.nextActionLabel,
      disabledReason: "Recovery execution is not enabled in P63.4.",
    })),
  };
}

export function buildSnapshotStoreFixtureInputs(fixtures = {}) {
  return normalizeArray(fixtures.records).map((record) => {
    const snapshot = record.snapshot || {};
    const recoveryPoint = record.recoveryPoint || {};
    return {
      snapshot,
      recoveryPoint,
      retentionClass: record.retentionClass,
      createdAt: record.createdAt,
    };
  });
}

export function validateSnapshotStoreSource(input = {}) {
  const snapshot = normalizeSnapshotRecord(input.snapshot || {});
  const recoveryPoint = buildRecoveryPoint(input.recoveryPoint || {});
  const snapshotValidation = validateSnapshotRecord(snapshot);
  const recoveryValidation = validateRecoveryPoint(recoveryPoint);

  return {
    valid: snapshotValidation.valid && recoveryValidation.valid,
    snapshotValidation,
    recoveryValidation,
  };
}

export { SNAPSHOT_RETENTION_POLICY, previewSnapshotPrune };
