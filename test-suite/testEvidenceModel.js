/**
 * test-suite/testEvidenceModel.js
 * Evidence model for test result records.
 * All records have redacted: true — no raw payloads are stored.
 * No test execution occurs from this module.
 */

import { TEST_RESULT_FIELDS, createEmptyTestResult } from "./testResultSchema.js";
import { RUN_MODES, RESULT_STATUSES } from "./testTypes.js";

let _resultCounter = 0;

function generateResultId(suiteId) {
  _resultCounter += 1;
  const ts = Date.now();
  return `result-${suiteId}-${ts}-${_resultCounter}`;
}

function generateEvidenceId(resultId) {
  return `ev-${resultId}`;
}

/**
 * Create a test result record.
 * Input: { suiteId, projectId?, osScope?, runMode, status, commandPreview, ... }
 * Returns a result record with resultId, redacted: true, all required fields.
 */
export function createTestResultRecord(input = {}) {
  if (!input.suiteId) throw new Error("suiteId is required.");
  if (!RUN_MODES.includes(input.runMode || "preview")) {
    throw new Error(`Invalid runMode: ${input.runMode}`);
  }
  const status = input.status || "not_run";
  if (!RESULT_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const resultId = generateResultId(input.suiteId);

  return {
    ...createEmptyTestResult(),
    resultId,
    suiteId: input.suiteId,
    projectId: input.projectId || undefined,
    osScope: input.osScope || undefined,
    runMode: input.runMode || "preview",
    status,
    commandPreview: input.commandPreview || "",
    startedAt: input.startedAt || undefined,
    finishedAt: input.finishedAt || undefined,
    durationMs: input.durationMs || undefined,
    evidenceType: input.evidenceType || "test-result",
    redacted: true, // always forced
    sourceReportPath: input.sourceReportPath || undefined,
    linkedTaskId: input.linkedTaskId || undefined,
    linkedAgentId: input.linkedAgentId || undefined,
    correlationId: input.correlationId || undefined,
  };
}

/**
 * Validate a test result record.
 */
export function validateTestResultRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") {
    errors.push("Record must be a non-null object.");
    return { valid: false, errors };
  }

  for (const field of TEST_RESULT_FIELDS) {
    if (field.required) {
      const val = record[field.name];
      if (val === undefined || val === null || val === "") {
        if (field.name !== "projectId" && field.name !== "osScope") {
          errors.push(`Missing required field: '${field.name}'.`);
        }
      }
      if (field.enum && val !== undefined && !field.enum.includes(val)) {
        errors.push(`Invalid value for '${field.name}': '${val}'. Must be one of: ${field.enum.join(", ")}.`);
      }
    }
  }

  if (record.redacted !== true) {
    errors.push("'redacted' must always be true.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create an evidence preview from a result record.
 * Returns a redacted, audit-safe evidence record.
 */
export function createTestEvidencePreview(resultRecord) {
  if (!resultRecord || typeof resultRecord !== "object") {
    throw new Error("resultRecord is required.");
  }

  const evidenceId = generateEvidenceId(resultRecord.resultId || "unknown");

  return {
    evidenceId,
    suiteId: resultRecord.suiteId,
    projectId: resultRecord.projectId || undefined,
    osScope: resultRecord.osScope || undefined,
    resultId: resultRecord.resultId,
    runMode: resultRecord.runMode,
    status: resultRecord.status,
    evidenceType: resultRecord.evidenceType || "test-result",
    redacted: true, // always true
    commandPreviewSummary: resultRecord.commandPreview
      ? `[preview] ${resultRecord.commandPreview.slice(0, 80)}`
      : "[no preview]",
    startedAt: resultRecord.startedAt || undefined,
    finishedAt: resultRecord.finishedAt || undefined,
    durationMs: resultRecord.durationMs || undefined,
    sourceReportPath: resultRecord.sourceReportPath || undefined,
    linkedTaskId: resultRecord.linkedTaskId || undefined,
    linkedAgentId: resultRecord.linkedAgentId || undefined,
    correlationId: resultRecord.correlationId || undefined,
    generatedAt: new Date().toISOString(),
    safetyNote: "Raw output is redacted. Only metadata and status are visible.",
  };
}

/**
 * Validate an evidence preview record.
 */
export function validateTestEvidencePreview(evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== "object") {
    errors.push("Evidence must be a non-null object.");
    return { valid: false, errors };
  }
  if (!evidence.evidenceId) errors.push("Missing evidenceId.");
  if (!evidence.suiteId) errors.push("Missing suiteId.");
  if (!evidence.resultId) errors.push("Missing resultId.");
  if (!evidence.runMode) errors.push("Missing runMode.");
  if (!evidence.status) errors.push("Missing status.");
  if (evidence.redacted !== true) errors.push("redacted must be true.");
  if (!evidence.evidenceType) errors.push("Missing evidenceType.");
  return { valid: errors.length === 0, errors };
}

/**
 * Summarize an array of test result records.
 */
export function summarizeTestEvidence(records) {
  if (!Array.isArray(records)) return { total: 0, passed: 0, failed: 0, blocked: 0, skipped: 0, notRun: 0 };
  const counts = { total: records.length, passed: 0, failed: 0, blocked: 0, skipped: 0, notRun: 0 };
  for (const r of records) {
    switch (r.status) {
      case "pass": counts.passed += 1; break;
      case "fail": counts.failed += 1; break;
      case "blocked": counts.blocked += 1; break;
      case "skipped": counts.skipped += 1; break;
      case "not_run": counts.notRun += 1; break;
    }
  }
  return counts;
}
