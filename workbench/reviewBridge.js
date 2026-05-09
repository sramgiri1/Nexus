/**
 * reviewBridge.js
 * Human Review Bridge — P38-LOCAL.
 *
 * Records human review decisions (approve / reject / request_changes) for
 * activated mission tasks. No task execution. No provider calls.
 * No network. No project mutation.
 */

import { randomUUID } from "node:crypto";
import { appendReviewRecord } from "./reviewStore.js";
import { readTasks } from "../local-state/taskStore.js";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { writeLocalStateEvent } from "../local-state/writeLocalState.js";
import { getNexusMode } from "../private-mode/privateMode.js";

const ALLOWED_ACTION_TYPES = new Set(["task.review"]);
const ALLOWED_MODES = new Set(["local-private", "test"]);
const ALLOWED_DECISIONS = new Set(["approve", "reject", "request_changes"]);

const EVIDENCE_RESULT_MAP = {
  approve: "PASS",
  reject: "FAIL",
  request_changes: "INFO",
};

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

// ─── createReviewRequest ──────────────────────────────────────────────────────

export function createReviewRequest(input = {}) {
  const errors = [];
  const warnings = [];

  const actionType = normalizeString(input.actionType);
  const mode = normalizeString(input.mode) || "local-private";
  const runtimeTaskId = normalizeString(input.runtimeTaskId);
  const decision = normalizeString(input.decision);
  const reason = normalizeString(input.reason);
  const source = normalizeString(input.source) || "command_center_v2";

  let requestedBy = input.requestedBy;
  if (!requestedBy || typeof requestedBy !== "object") {
    requestedBy = { userId: "local-operator", role: "founder", authType: "local" };
    warnings.push("requestedBy not provided; using default local-operator.");
  }

  if (!ALLOWED_ACTION_TYPES.has(actionType)) {
    errors.push(`actionType must be task.review. Got: ${actionType || "(empty)"}`);
  }
  if (!ALLOWED_MODES.has(mode)) {
    errors.push(`mode must be local-private or test. Got: ${mode}`);
  }
  if (!runtimeTaskId) errors.push("runtimeTaskId is required.");
  if (!ALLOWED_DECISIONS.has(decision)) {
    errors.push(`decision must be one of: ${[...ALLOWED_DECISIONS].join(", ")}. Got: ${decision || "(empty)"}`);
  }

  if (errors.length > 0) return { ok: false, request: null, errors, warnings };

  return {
    ok: true,
    request: {
      reviewId: randomUUID(),
      actionType,
      mode,
      projectId: "private-project-01",
      missionId: "private-project-governed-build-mission",
      runtimeTaskId,
      decision,
      reason,
      requestedBy,
      source,
      createdAt: new Date().toISOString(),
    },
    errors: [],
    warnings,
  };
}

// ─── validateReviewRequest ────────────────────────────────────────────────────

export function validateReviewRequest(request = {}) {
  const errors = [];
  const warnings = [];

  if (!request || typeof request !== "object") {
    return { valid: false, errors: ["request must be an object."], warnings };
  }
  if (!request.reviewId) errors.push("reviewId is required.");
  if (!ALLOWED_ACTION_TYPES.has(request.actionType)) {
    errors.push(`actionType must be task.review. Got: ${request.actionType}`);
  }
  if (!ALLOWED_MODES.has(request.mode)) {
    errors.push(`mode must be local-private or test. Got: ${request.mode}`);
  }
  if (!request.runtimeTaskId) errors.push("runtimeTaskId is required.");
  if (!ALLOWED_DECISIONS.has(request.decision)) {
    errors.push(`decision must be approve, reject, or request_changes. Got: ${request.decision}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── runReviewRequest ─────────────────────────────────────────────────────────

export async function runReviewRequest(request = {}) {
  // 1. Validate request
  const validation = validateReviewRequest(request);
  if (!validation.valid) {
    return buildReviewResponse({ ok: false, reviewId: request.reviewId || "", status: "failed",
      runtimeTaskId: request.runtimeTaskId || "", decision: request.decision || "",
      errors: validation.errors, warnings: validation.warnings, result: null });
  }

  // 2. Check mode
  const envMode = getNexusMode(process.env);
  if (!ALLOWED_MODES.has(envMode)) {
    return buildReviewResponse({ ok: false, reviewId: request.reviewId, status: "failed",
      runtimeTaskId: request.runtimeTaskId, decision: request.decision,
      errors: [`Review requires local-private mode. Got: ${envMode}`], warnings: [], result: null });
  }

  // 3. Block demo mode
  if (request.mode === "demo") {
    return buildReviewResponse({ ok: false, reviewId: request.reviewId, status: "blocked",
      runtimeTaskId: request.runtimeTaskId, decision: request.decision,
      errors: ["Task review is not available in demo mode."], warnings: [], result: null });
  }

  // 4. Find runtime task
  const tasksResult = readTasks();
  if (!tasksResult.ok) {
    return buildReviewResponse({ ok: false, reviewId: request.reviewId, status: "failed",
      runtimeTaskId: request.runtimeTaskId, decision: request.decision,
      errors: ["Failed to load task store: " + tasksResult.errors.join(", ")], warnings: [], result: null });
  }

  const task = tasksResult.document.tasks.find((t) => t.taskId === request.runtimeTaskId);
  if (!task) {
    return buildReviewResponse({ ok: false, reviewId: request.reviewId, status: "failed",
      runtimeTaskId: request.runtimeTaskId, decision: request.decision,
      errors: [`runtimeTaskId not found: ${request.runtimeTaskId}`], warnings: [], result: null });
  }

  // 5. Verify task is reviewable
  const reviewableStates = new Set(["queued", "running", "awaiting_approval", "implementation_done"]);
  if (!reviewableStates.has(task.state)) {
    return buildReviewResponse({ ok: false, reviewId: request.reviewId, status: "failed",
      runtimeTaskId: request.runtimeTaskId, decision: request.decision,
      errors: [`Task state "${task.state}" is not reviewable.`], warnings: [], result: null });
  }

  // 6. Append evidence
  const evidenceResult = appendEvidence({
    type: "task_review_decision",
    projectId: "private-project-01",
    taskId: request.runtimeTaskId,
    agentId: task.targetAgent,
    capabilityId: task.capabilityId || task.taskType,
    result: EVIDENCE_RESULT_MAP[request.decision] || "INFO",
    summary: `Task plan review: ${request.decision}. ${request.reason || ""}`.trim(),
    dataClassification: "confidential",
    redacted: true,
  });

  // 7. Append audit
  const auditResult = appendAuditEvent({
    eventType: "task_review_completed",
    actorId: "local-operator",
    actorType: "founder",
    projectId: "private-project-01",
    taskId: request.runtimeTaskId,
    capabilityId: task.capabilityId || task.taskType,
    summary: `Review decision: ${request.decision}. Reason: ${request.reason || "(none)"}`,
    previousState: task.state,
    nextState: task.state,
    redacted: true,
  });

  // 8. Append runtime event
  const eventResult = writeLocalStateEvent({
    type: "audit",
    record: {
      eventType: "governed_task_reviewed",
      actorId: "local-operator",
      actorType: "founder",
      projectId: "private-project-01",
      taskId: request.runtimeTaskId,
      capabilityId: task.capabilityId || task.taskType,
      summary: `Governed task reviewed. decision: ${request.decision}`,
      previousState: task.state,
      nextState: task.state,
      redacted: true,
    },
  });

  // 9. Store review record
  const reviewRecord = appendReviewRecord({
    reviewId: request.reviewId,
    runtimeTaskId: request.runtimeTaskId,
    sourcePlanTaskId: task.sourcePlanTaskId || "",
    missionId: request.missionId || "private-project-governed-build-mission",
    projectId: "private-project-01",
    decision: request.decision,
    reason: request.reason,
    reviewer: "local-operator",
    reviewerRole: "founder",
    reviewedObject: "task_plan",
    status: "completed",
    mode: request.mode,
    evidenceIds: evidenceResult.ok ? [evidenceResult.record.evidenceId] : [],
    auditIds: auditResult.ok ? [auditResult.record.auditId] : [],
    createdAt: request.createdAt,
  });

  // 10. Attempt task state update (informational — state machine may not support review states)
  const taskStateUpdated = false;
  const warnings = [...validation.warnings];
  warnings.push("Task state not updated: review states are tracked in review records, not task state machine.");

  return buildReviewResponse({
    ok: true, reviewId: request.reviewId, status: "completed",
    runtimeTaskId: request.runtimeTaskId, decision: request.decision,
    errors: [], warnings,
    result: {
      reviewRecorded: reviewRecord.ok,
      taskStateUpdated,
      newState: task.state,
      evidenceCreated: evidenceResult.ok,
      auditCreated: auditResult.ok,
      runtimeEventCreated: eventResult.ok,
    },
  });
}

// ─── getReviewResult ──────────────────────────────────────────────────────────

export function getReviewResult(reviewId) {
  const all = listReviewRecords();
  if (!all.ok) return { ok: false, record: null, errors: all.errors };
  const record = all.records.find((r) => r.reviewId === reviewId);
  if (!record) return { ok: false, record: null, errors: [`Review not found: ${reviewId}`] };
  return { ok: true, record };
}

// ─── listReviewRecords ────────────────────────────────────────────────────────

export { listReviewRecords } from "./reviewStore.js";

// ─── buildReviewResponse ──────────────────────────────────────────────────────

export function buildReviewResponse(opts = {}) {
  return {
    ok: opts.ok === true,
    reviewId: normalizeString(opts.reviewId),
    actionType: "task.review",
    status: normalizeString(opts.status) || "failed",
    mode: normalizeString(opts.mode) || "local-private",
    runtimeTaskId: normalizeString(opts.runtimeTaskId),
    decision: normalizeString(opts.decision),
    result: opts.result || null,
    warnings: Array.isArray(opts.warnings) ? opts.warnings : [],
    errors: Array.isArray(opts.errors) ? opts.errors : [],
  };
}
