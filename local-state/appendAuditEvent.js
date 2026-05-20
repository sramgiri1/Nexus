import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRepoRoot } from "./safeFileReader.js";
import { LOCAL_AUDIT_FILE } from "./schema.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  assertWritePathAllowed,
  sanitizeRecord,
} from "./writeGuards.js";
import { appendSqliteAuditEvent } from "../db/sqliteRuntimeWrites.js";

function getAuditPath() {
  return path.join(getRepoRoot(), LOCAL_AUDIT_FILE);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildAuditEvent(event = {}) {
  const sanitized = sanitizeRecord(event);

  return {
    auditId: normalizeString(sanitized.auditId) || randomUUID(),
    eventType: normalizeString(sanitized.eventType),
    actorId: normalizeString(sanitized.actorId),
    actorType: normalizeString(sanitized.actorType) || "system",
    projectId: normalizeString(sanitized.projectId),
    taskId: normalizeString(sanitized.taskId),
    capabilityId: normalizeString(sanitized.capabilityId),
    policyDecisionId: normalizeString(sanitized.policyDecisionId),
    approvalId: normalizeString(sanitized.approvalId),
    summary: normalizeString(sanitized.summary),
    previousState: normalizeString(sanitized.previousState),
    nextState: normalizeString(sanitized.nextState),
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
  };
}

export function validateAuditEvent(event = {}) {
  const errors = [];
  const warnings = [];
  const record = buildAuditEvent(event);

  if (!record.eventType) {
    errors.push("eventType is required.");
  }

  if (!record.actorId) {
    errors.push("actorId is required.");
  }

  if (record.redacted !== true) {
    errors.push("redacted must be true.");
  }

  const secretCheck = assertNoSecretLikeContent(record);
  const privateCheck = assertNoPrivateProjectReference(record);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record,
  };
}

export function appendAuditEvent(event = {}) {
  const pathCheck = assertWritePathAllowed(LOCAL_AUDIT_FILE);
  const validation = validateAuditEvent(event);
  const errors = [...pathCheck.errors, ...validation.errors];

  if (errors.length > 0) {
    return {
      ok: false,
      path: LOCAL_AUDIT_FILE,
      record: validation.record,
      errors,
      warnings: validation.warnings,
    };
  }

  fs.appendFileSync(
    getAuditPath(),
    `${JSON.stringify(validation.record)}\n`,
    "utf8"
  );
  const sqlite = appendSqliteAuditEvent(validation.record);

  return {
    ok: true,
    path: LOCAL_AUDIT_FILE,
    record: validation.record,
    sqlite,
    errors: [],
    warnings: sqlite.ok ? validation.warnings : [...validation.warnings, ...sqlite.errors],
  };
}
