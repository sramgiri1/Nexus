import { createHash, randomUUID } from "node:crypto";
import { createEvidenceRecord, verifyEvidenceRecord } from "../runtime/evidenceRecord.js";
import {
  SNAPSHOT_REDACTION_LEVELS,
  SNAPSHOT_REDACTION_POLICY,
  redactSnapshotPayload,
  validateRedactionLevel,
  validateSnapshotRedaction,
} from "./redactionPolicy.js";

export const SNAPSHOT_RECOVERY_ELIGIBILITY = Object.freeze([
  "inspect_only",
  "resume_plan_available",
  "not_recoverable",
]);

export const SNAPSHOT_REQUIRED_FIELDS = Object.freeze([
  "snapshotId",
  "displayTitle",
  "scopeLabel",
  "actorLabel",
  "correlationId",
  "commandIntent",
  "promptSummary",
  "responseSummary",
  "redactionLevel",
  "recoveryEligibility",
  "previewOnly",
  "executionEnabled",
  "createdAt",
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter((item) => item !== undefined) : [];
}

function hashSnapshot(record = {}) {
  const { snapshotHash, ...hashable } = record;
  return createHash("sha256").update(JSON.stringify(hashable)).digest("hex");
}

function normalizeEvidenceRefs(evidenceRefs = []) {
  return normalizeArray(evidenceRefs).map((ref) => ({
    label: normalizeString(ref.label),
    path: normalizeString(ref.path),
    recordId: normalizeString(ref.recordId),
  }));
}

export function normalizeSnapshotRecord(input = {}) {
  const redactionLevel = validateRedactionLevel(input.redactionLevel)
    ? input.redactionLevel
    : "internal_redacted";
  const recoveryEligibility = SNAPSHOT_RECOVERY_ELIGIBILITY.includes(input.recoveryEligibility)
    ? input.recoveryEligibility
    : "inspect_only";
  const redactedPayload = redactSnapshotPayload(input.redactedPayload || {});

  const record = {
    snapshotId: normalizeString(input.snapshotId) || `snapshot_${randomUUID()}`,
    displayTitle: normalizeString(input.displayTitle) || "AI interaction snapshot",
    scopeLabel: normalizeString(input.scopeLabel) || "NEXUS OS",
    actorLabel: normalizeString(input.actorLabel) || "NEXUS",
    correlationId: normalizeString(input.correlationId) || `corr_${randomUUID()}`,
    commandIntent: normalizeString(input.commandIntent) || "unknown",
    promptSummary: normalizeString(input.promptSummary) || "Prompt summary unavailable.",
    responseSummary: normalizeString(input.responseSummary) || "Response summary unavailable.",
    toolPreviewRefs: normalizeEvidenceRefs(input.toolPreviewRefs),
    evidenceRefs: normalizeEvidenceRefs(input.evidenceRefs),
    redactionLevel,
    recoveryEligibility,
    recoveryBlockedReasons: normalizeArray(input.recoveryBlockedReasons).map(normalizeString),
    redactedPayload,
    policy: {
      ...SNAPSHOT_REDACTION_POLICY,
      ...(input.policy || {}),
    },
    previewOnly: true,
    executionEnabled: false,
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
    snapshotHash: "",
  };

  record.snapshotHash = hashSnapshot(record);
  return record;
}

export function validateSnapshotRecord(record = {}) {
  const errors = [];
  const warnings = [];

  for (const field of SNAPSHOT_REQUIRED_FIELDS) {
    if (record[field] === undefined || record[field] === "") {
      errors.push(`missing_${field}`);
    }
  }

  if (!validateRedactionLevel(record.redactionLevel)) {
    errors.push("invalid_redaction_level");
  }

  if (!SNAPSHOT_RECOVERY_ELIGIBILITY.includes(record.recoveryEligibility)) {
    errors.push("invalid_recovery_eligibility");
  }

  if (record.previewOnly !== true) {
    errors.push("preview_only_required");
  }

  if (record.executionEnabled !== false) {
    errors.push("execution_must_remain_disabled");
  }

  const policy = record.policy || {};
  for (const [key, value] of Object.entries(SNAPSHOT_REDACTION_POLICY)) {
    if (policy[key] !== value) {
      errors.push(`policy_violation_${key}`);
    }
  }

  const redaction = validateSnapshotRedaction(record.redactedPayload || {});
  errors.push(...redaction.errors);
  warnings.push(...redaction.warnings);

  if (record.snapshotHash && record.snapshotHash !== hashSnapshot(record)) {
    errors.push("snapshot_hash_mismatch");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildSnapshotPreview(input = {}) {
  const snapshot = normalizeSnapshotRecord(input);
  const validation = validateSnapshotRecord(snapshot);

  return {
    ok: validation.valid,
    snapshot,
    validation,
    display: {
      title: snapshot.displayTitle,
      scope: snapshot.scopeLabel,
      actor: snapshot.actorLabel,
      state: snapshot.recoveryEligibility,
      redaction: snapshot.redactionLevel,
      nextAction: validation.valid
        ? "Inspect redacted snapshot details."
        : "Fix snapshot contract violations before surfacing this record.",
    },
  };
}

export function buildSnapshotEvidenceRecord(snapshot = {}, identityContext = {}) {
  return createEvidenceRecord({
    identityContext,
    trafficRequest: {
      agentId: "nexus",
      capabilityId: "ai-recovery.snapshot",
      actionType: "snapshot.preview",
      runtime: "local",
      provider: "none",
      metadata: {
        taskId: snapshot.snapshotId,
        projectId: "nexus-os",
      },
    },
    policyDecision: {
      allowed: true,
      mode: "preview",
      reason: "P63.1 snapshot contract preview only.",
    },
    inputForHash: snapshot,
    outputForHash: {
      snapshotId: snapshot.snapshotId,
      redactionLevel: snapshot.redactionLevel,
      recoveryEligibility: snapshot.recoveryEligibility,
    },
  });
}

export function validateSnapshotEvidenceRecord(record = {}) {
  return verifyEvidenceRecord(record);
}

export { SNAPSHOT_REDACTION_LEVELS, SNAPSHOT_REDACTION_POLICY };
