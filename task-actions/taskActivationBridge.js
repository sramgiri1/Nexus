/**
 * taskActivationBridge.js
 * Command Center Task Activation Bridge — P37-LOCAL
 *
 * Converts planned mission tasks into governed runtime tasks.
 * No provider calls. No network calls. No DB access.
 * No task execution. No agent dispatch. No project mutation.
 * All writes stay within local-state/runtime/ boundaries.
 */

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { appendTaskActivationAction, listTaskActivationActionRecords } from "./taskActivationStore.js";
import { addTask } from "../local-state/taskStore.js";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { writeLocalStateEvent } from "../local-state/writeLocalState.js";
import { getNexusMode } from "../private-mode/privateMode.js";

const ROOT = process.cwd();
const ALLOWED_ACTION_TYPES = new Set(["task.activate"]);
const ALLOWED_MODES = new Set(["local-private", "test"]);

const MISSION_CONTRACT_PATH = "contracts/missions/private-project-mission-contract.json";
const TASK_PLAN_PATH = "contracts/missions/private-project-task-plan.json";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readJsonFile(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return { ok: false, data: null, error: `File not found: ${relPath}` };
  try {
    return { ok: true, data: JSON.parse(readFileSync(full, "utf8")), error: null };
  } catch (e) {
    return { ok: false, data: null, error: `Parse error in ${relPath}: ${e.message}` };
  }
}

// ─── createTaskActivationRequest ─────────────────────────────────────────────

export function createTaskActivationRequest(input = {}) {
  const errors = [];
  const warnings = [];

  const actionType = normalizeString(input.actionType);
  const mode = normalizeString(input.mode) || "local-private";
  const projectId = normalizeString(input.projectId) || "private-project-01";
  const missionId = normalizeString(input.missionId) || "private-project-governed-build-mission";
  const planTaskId = normalizeString(input.planTaskId);
  const source = normalizeString(input.source) || "command_center_v2";

  let requestedBy = input.requestedBy;
  if (!requestedBy || typeof requestedBy !== "object") {
    requestedBy = { userId: "local-operator", role: "founder", authType: "local" };
    warnings.push("requestedBy not provided; using default local-operator.");
  }

  if (!ALLOWED_ACTION_TYPES.has(actionType)) {
    errors.push(`actionType must be one of: ${[...ALLOWED_ACTION_TYPES].join(", ")}. Got: ${actionType || "(empty)"}`);
  }
  if (!ALLOWED_MODES.has(mode)) {
    errors.push(`mode must be one of: ${[...ALLOWED_MODES].join(", ")}. Got: ${mode}`);
  }
  if (!planTaskId) {
    errors.push("planTaskId is required.");
  }

  if (errors.length > 0) return { ok: false, request: null, errors, warnings };

  return {
    ok: true,
    request: {
      actionId: randomUUID(),
      actionType,
      mode,
      projectId,
      missionId,
      planTaskId,
      requestedBy,
      source,
      createdAt: new Date().toISOString(),
    },
    errors: [],
    warnings,
  };
}

// ─── validateTaskActivationRequest ───────────────────────────────────────────

export function validateTaskActivationRequest(request = {}) {
  const errors = [];
  const warnings = [];

  if (!request || typeof request !== "object") {
    return { valid: false, errors: ["request must be an object."], warnings };
  }
  if (!request.actionId) errors.push("actionId is required.");
  if (!ALLOWED_ACTION_TYPES.has(request.actionType)) {
    errors.push(`actionType must be task.activate. Got: ${request.actionType}`);
  }
  if (!ALLOWED_MODES.has(request.mode)) {
    errors.push(`mode must be local-private or test. Got: ${request.mode}`);
  }
  if (!request.planTaskId) errors.push("planTaskId is required.");
  if (!request.missionId) errors.push("missionId is required.");
  if (!request.projectId) errors.push("projectId is required.");

  return { valid: errors.length === 0, errors, warnings };
}

// ─── runTaskActivationRequest ─────────────────────────────────────────────────

export async function runTaskActivationRequest(request = {}) {
  // 1. Validate request
  const validation = validateTaskActivationRequest(request);
  if (!validation.valid) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId || "", status: "failed",
      mode: request.mode || "local-private", planTaskId: request.planTaskId || "",
      errors: validation.errors, warnings: validation.warnings, result: null,
    });
  }

  // 2. Check mode
  const envMode = getNexusMode(process.env);
  if (!ALLOWED_MODES.has(envMode)) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "failed",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: [`Task activation requires local-private mode. Got: ${envMode}`],
      warnings: [], result: null,
    });
  }

  // 3. Block demo/public mode activations
  if (request.mode === "demo") {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "blocked",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: ["Task activation is not available in demo mode."],
      warnings: [], result: null,
    });
  }

  // 4. Load mission contract
  const contractResult = readJsonFile(MISSION_CONTRACT_PATH);
  if (!contractResult.ok) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "failed",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: [contractResult.error], warnings: [], result: null,
    });
  }

  // 5. Load task plan
  const planResult = readJsonFile(TASK_PLAN_PATH);
  if (!planResult.ok) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "failed",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: [planResult.error], warnings: [], result: null,
    });
  }

  // 6. Find plan task
  const planTasks = Array.isArray(planResult.data?.tasks) ? planResult.data.tasks : [];
  const planTask = planTasks.find((t) => t.taskId === request.planTaskId);
  if (!planTask) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "failed",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: [`planTaskId not found in task plan: ${request.planTaskId}`],
      warnings: [], result: null,
    });
  }

  // 7. Validate plan task fields
  const requiredFields = ["taskId", "targetAgent", "taskType", "objective", "riskLevel"];
  const missingFields = requiredFields.filter((f) => !planTask[f]);
  if (missingFields.length > 0) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "failed",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: [`Plan task missing required fields: ${missingFields.join(", ")}`],
      warnings: [], result: null,
    });
  }

  // 8. Block if mutation/execution requested (extra safety)
  if (planTask.mutationAllowed || planTask.executionAllowed) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "blocked",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: ["Task has mutationAllowed or executionAllowed; cannot activate in P37."],
      warnings: [], result: null,
    });
  }

  // 9. Check for duplicate activation (idempotent)
  const existingActivations = listTaskActivationActionRecords();
  const alreadyActivated = existingActivations.records?.some(
    (r) => r.target?.planTaskId === request.planTaskId && r.status === "completed"
  );
  if (alreadyActivated) {
    const existingRecord = existingActivations.records.find(
      (r) => r.target?.planTaskId === request.planTaskId && r.status === "completed"
    );
    return buildTaskActivationResponse({
      ok: true, actionId: request.actionId, status: "completed",
      mode: request.mode, planTaskId: request.planTaskId,
      runtimeTaskId: existingRecord?.target?.runtimeTaskId || "",
      warnings: ["Task already activated (idempotent response)."], errors: [],
      result: {
        taskCreated: false, initialState: "queued",
        targetAgent: planTask.targetAgent, capabilityId: planTask.taskType,
        riskLevel: planTask.riskLevel, mutationAllowed: false, executionAllowed: false,
        evidenceCreated: false, auditCreated: false, runtimeEventCreated: false,
      },
    });
  }

  // 10. Create runtime task
  const runtimeTaskId = randomUUID();
  const taskResult = addTask({
    taskId: runtimeTaskId,
    projectId: "private-project-01",
    sourceAgent: "nexus",
    targetAgent: planTask.targetAgent,
    taskType: "mission_task_activation",
    objective: planTask.objective,
    state: "queued",
    riskLevel: planTask.riskLevel,
    blocking: false,
    dependsOn: [],
    capabilityId: planTask.taskType,
    contractId: contractResult.data?.contractId || "",
    redacted: true,
  });

  if (!taskResult.ok) {
    return buildTaskActivationResponse({
      ok: false, actionId: request.actionId, status: "failed",
      mode: request.mode, planTaskId: request.planTaskId,
      errors: ["Failed to create runtime task: " + taskResult.errors.join(", ")],
      warnings: taskResult.warnings, result: null,
    });
  }

  // 11. Append evidence
  const evidenceResult = appendEvidence({
    type: "task_activation",
    projectId: "private-project-01",
    taskId: runtimeTaskId,
    agentId: planTask.targetAgent,
    capabilityId: planTask.taskType,
    result: "PASS",
    summary: `Mission task activated: ${planTask.objective}`,
    dataClassification: "confidential",
    redacted: true,
  });

  // 12. Append audit event
  const auditResult = appendAuditEvent({
    eventType: "task_activation_completed",
    actorId: "local-operator",
    actorType: "founder",
    projectId: "private-project-01",
    taskId: runtimeTaskId,
    capabilityId: planTask.taskType,
    summary: `Task activated from mission plan. planTaskId: ${request.planTaskId}`,
    previousState: "planned",
    nextState: "queued",
    redacted: true,
  });

  // 13. Append runtime event
  const eventResult = writeLocalStateEvent({
    type: "audit",
    record: {
      eventType: "governed_task_activated",
      actorId: "local-operator",
      actorType: "founder",
      projectId: "private-project-01",
      taskId: runtimeTaskId,
      capabilityId: planTask.taskType,
      summary: `Governed task activated. objective: ${planTask.objective}`,
      previousState: "planned",
      nextState: "queued",
      redacted: true,
    },
  });

  // 14. Store activation action record
  appendTaskActivationAction({
    actionId: request.actionId,
    mode: request.mode,
    projectId: "private-project-01",
    planTaskId: request.planTaskId,
    runtimeTaskId,
    targetAgent: planTask.targetAgent,
    capabilityId: planTask.taskType,
    riskLevel: planTask.riskLevel,
    status: "completed",
    createdAt: request.createdAt,
    evidenceIds: evidenceResult.ok ? [evidenceResult.record.evidenceId] : [],
    auditIds: auditResult.ok ? [auditResult.record.auditId] : [],
  });

  return buildTaskActivationResponse({
    ok: true, actionId: request.actionId, status: "completed",
    mode: request.mode, planTaskId: request.planTaskId, runtimeTaskId,
    missionId: request.missionId, projectId: "private-project-01",
    errors: [], warnings: validation.warnings,
    result: {
      taskCreated: taskResult.ok,
      initialState: "queued",
      targetAgent: planTask.targetAgent,
      capabilityId: planTask.taskType,
      riskLevel: planTask.riskLevel,
      mutationAllowed: false,
      executionAllowed: false,
      evidenceCreated: evidenceResult.ok,
      auditCreated: auditResult.ok,
      runtimeEventCreated: eventResult.ok,
    },
  });
}

// ─── getTaskActivationResult ──────────────────────────────────────────────────

export function getTaskActivationResult(actionId) {
  const store = listTaskActivationActionRecords();
  if (!store.ok) return { ok: false, record: null, errors: store.errors };
  const record = store.records.find((r) => r.actionId === actionId);
  if (!record) return { ok: false, record: null, errors: ["Action not found: " + actionId] };
  return { ok: true, record, errors: [] };
}

// ─── listTaskActivationActions ────────────────────────────────────────────────

export function listTaskActivationActions() {
  return listTaskActivationActionRecords();
}

// ─── buildTaskActivationResponse ─────────────────────────────────────────────

export function buildTaskActivationResponse(opts = {}) {
  return {
    ok: opts.ok === true,
    actionId: normalizeString(opts.actionId),
    actionType: "task.activate",
    status: normalizeString(opts.status) || "failed",
    mode: normalizeString(opts.mode) || "local-private",
    projectId: normalizeString(opts.projectId) || "private-project-01",
    missionId: normalizeString(opts.missionId) || "private-project-governed-build-mission",
    planTaskId: normalizeString(opts.planTaskId),
    runtimeTaskId: normalizeString(opts.runtimeTaskId),
    result: opts.result || null,
    warnings: Array.isArray(opts.warnings) ? opts.warnings : [],
    errors: Array.isArray(opts.errors) ? opts.errors : [],
  };
}
