import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRepoRoot } from "./safeFileReader.js";
import { LOCAL_EVIDENCE_FILE } from "./schema.js";
import {
  assertNoPrivateProjectReference,
  assertNoSecretLikeContent,
  assertWritePathAllowed,
  sanitizeRecord,
} from "./writeGuards.js";
import { appendSqliteEvidence } from "../db/sqliteRuntimeWrites.js";

const ALLOWED_RESULTS = new Set(["PASS", "FAIL", "INFO", "BLOCKED"]);
const ALLOWED_CLASSIFICATIONS = new Set([
  "public",
  "internal",
  "confidential",
  "restricted",
  "secret",
  "unknown",
]);

function getEvidencePath() {
  return path.join(getRepoRoot(), LOCAL_EVIDENCE_FILE);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function buildEvidenceRecord(record = {}) {
  const sanitized = sanitizeRecord(record);

  return {
    evidenceId: normalizeString(sanitized.evidenceId) || randomUUID(),
    type: normalizeString(sanitized.type),
    projectId: normalizeString(sanitized.projectId),
    taskId: normalizeString(sanitized.taskId),
    agentId: normalizeString(sanitized.agentId),
    capabilityId: normalizeString(sanitized.capabilityId),
    result: normalizeString(sanitized.result) || "INFO",
    summary: normalizeString(sanitized.summary),
    artifactPaths: normalizeArray(sanitized.artifactPaths),
    traceIds: normalizeArray(sanitized.traceIds),
    policyDecisionId: normalizeString(sanitized.policyDecisionId),
    dataClassification:
      normalizeString(sanitized.dataClassification) || "unknown",
    createdAt: normalizeString(sanitized.createdAt) || new Date().toISOString(),
    redacted: true,
  };
}

export function validateEvidence(record = {}) {
  const errors = [];
  const warnings = [];
  const evidence = buildEvidenceRecord(record);

  if (!evidence.type) {
    errors.push("type is required.");
  }

  if (!ALLOWED_RESULTS.has(evidence.result)) {
    errors.push("result must be PASS, FAIL, INFO, or BLOCKED.");
  }

  if (!ALLOWED_CLASSIFICATIONS.has(evidence.dataClassification)) {
    errors.push("dataClassification must be a supported classification.");
  }

  if (evidence.dataClassification === "secret") {
    errors.push("secret dataClassification is blocked.");
  }

  if (evidence.dataClassification === "restricted" && evidence.redacted !== true) {
    errors.push("restricted evidence must remain redacted.");
  }

  if (evidence.redacted !== true) {
    errors.push("redacted must be true.");
  }

  const secretCheck = assertNoSecretLikeContent(evidence);
  const privateCheck = assertNoPrivateProjectReference(evidence);
  errors.push(...secretCheck.errors, ...privateCheck.errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    record: evidence,
  };
}

export function appendEvidence(record = {}) {
  const pathCheck = assertWritePathAllowed(LOCAL_EVIDENCE_FILE);
  const validation = validateEvidence(record);
  const errors = [...pathCheck.errors, ...validation.errors];

  if (errors.length > 0) {
    return {
      ok: false,
      path: LOCAL_EVIDENCE_FILE,
      record: validation.record,
      errors,
      warnings: validation.warnings,
    };
  }

  fs.appendFileSync(
    getEvidencePath(),
    `${JSON.stringify(validation.record)}\n`,
    "utf8"
  );
  const sqlite = appendSqliteEvidence(validation.record);

  return {
    ok: true,
    path: LOCAL_EVIDENCE_FILE,
    record: validation.record,
    sqlite,
    errors: [],
    warnings: sqlite.ok ? validation.warnings : [...validation.warnings, ...sqlite.errors],
  };
}
