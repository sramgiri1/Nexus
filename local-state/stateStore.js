import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRepoRoot, readTextSafe } from "./safeFileReader.js";
import {
  LOCAL_APPROVALS_FILE,
  LOCAL_EVENTS_FILE,
  LOCAL_INCIDENTS_FILE,
} from "./schema.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  assertWritePathAllowed,
  sanitizeRecord,
} from "./writeGuards.js";

const APPROVAL_DECISIONS = new Set([
  "requested",
  "approved",
  "rejected",
  "expired",
]);
const INCIDENT_STATUSES = new Set(["open", "mitigating", "resolved", "closed"]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveRuntimePath(relativePath) {
  return path.join(getRepoRoot(), relativePath);
}

function appendJsonLine(relativePath, record) {
  fs.appendFileSync(
    resolveRuntimePath(relativePath),
    `${JSON.stringify(record)}\n`,
    "utf8"
  );
}

function buildRuntimeEvent(event = {}) {
  const sanitized = sanitizeRecord(event);

  return {
    eventId: normalizeString(sanitized.eventId) || randomUUID(),
    eventType: normalizeString(sanitized.eventType),
    projectId: normalizeString(sanitized.projectId),
    taskId: normalizeString(sanitized.taskId),
    agentId: normalizeString(sanitized.agentId),
    runtime: normalizeString(sanitized.runtime),
    summary: normalizeString(sanitized.summary),
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
  };
}

function buildApprovalRecord(record = {}) {
  const sanitized = sanitizeRecord(record);

  return {
    approvalId: normalizeString(sanitized.approvalId) || randomUUID(),
    type: normalizeString(sanitized.type),
    requestedBy: normalizeString(sanitized.requestedBy),
    projectId: normalizeString(sanitized.projectId),
    taskId: normalizeString(sanitized.taskId),
    riskLevel: normalizeString(sanitized.riskLevel),
    decision: normalizeString(sanitized.decision) || "requested",
    summary: normalizeString(sanitized.summary),
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
  };
}

function buildIncidentRecord(record = {}) {
  const sanitized = sanitizeRecord(record);

  return {
    incidentId: normalizeString(sanitized.incidentId) || randomUUID(),
    type: normalizeString(sanitized.type),
    severity: normalizeString(sanitized.severity),
    projectId: normalizeString(sanitized.projectId),
    taskId: normalizeString(sanitized.taskId),
    summary: normalizeString(sanitized.summary),
    status: normalizeString(sanitized.status) || "open",
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
  };
}

function validatePreparedRecord(relativePath, record, requiredFields) {
  const pathCheck = assertWritePathAllowed(relativePath);
  const errors = [...pathCheck.errors];
  const warnings = [];

  for (const fieldName of requiredFields) {
    if (!normalizeString(record[fieldName])) {
      errors.push(`${fieldName} is required.`);
    }
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

function appendPreparedRecord(relativePath, validation) {
  if (!validation.valid) {
    return {
      ok: false,
      path: relativePath,
      record: validation.record,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  appendJsonLine(relativePath, validation.record);

  return {
    ok: true,
    path: relativePath,
    record: validation.record,
    errors: [],
    warnings: validation.warnings,
  };
}

export function readJsonl(relativePath) {
  const pathCheck = assertWritePathAllowed(relativePath);
  if (!pathCheck.ok) {
    return {
      ok: false,
      path: relativePath,
      records: [],
      error: pathCheck.errors.join(" "),
    };
  }

  const result = readTextSafe(relativePath);
  if (!result.ok) {
    return {
      ok: false,
      path: relativePath,
      records: [],
      error: result.error,
    };
  }

  try {
    const records = result.text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    return {
      ok: true,
      path: relativePath,
      records,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      path: relativePath,
      records: [],
      error: error.message,
    };
  }
}

export function appendRuntimeEvent(event = {}) {
  const validation = validatePreparedRecord(
    LOCAL_EVENTS_FILE,
    buildRuntimeEvent(event),
    ["eventType"]
  );
  return appendPreparedRecord(LOCAL_EVENTS_FILE, validation);
}

export function appendApprovalRecord(record = {}) {
  const validation = validatePreparedRecord(
    LOCAL_APPROVALS_FILE,
    buildApprovalRecord(record),
    ["type", "requestedBy"]
  );

  if (
    validation.valid &&
    !APPROVAL_DECISIONS.has(validation.record.decision)
  ) {
    validation.errors.push(
      "decision must be requested, approved, rejected, or expired."
    );
    validation.valid = false;
  }

  return appendPreparedRecord(LOCAL_APPROVALS_FILE, validation);
}

export function appendIncidentRecord(record = {}) {
  const validation = validatePreparedRecord(
    LOCAL_INCIDENTS_FILE,
    buildIncidentRecord(record),
    ["type", "severity"]
  );

  if (
    validation.valid &&
    !INCIDENT_STATUSES.has(validation.record.status)
  ) {
    validation.errors.push(
      "status must be open, mitigating, resolved, or closed."
    );
    validation.valid = false;
  }

  return appendPreparedRecord(LOCAL_INCIDENTS_FILE, validation);
}
