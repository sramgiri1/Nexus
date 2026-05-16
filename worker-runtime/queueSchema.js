import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const POLICY_PATH = join(ROOT, "policy/worker-runtime-policy.json");

export const WORKER_QUEUE_VERSION = "1.0";
export const WORKER_QUEUE_PHASE = "P60.1";

export const QUEUE_SCOPES = new Set(["NEXUS_OS_CHANGE", "PROJECT_CHANGE", "CROSS_CUTTING_CHANGE"]);
export const QUEUE_PRIORITIES = new Set(["low", "normal", "high", "critical"]);
export const QUEUE_STATES = new Set(["queued", "blocked", "leased", "running", "completed", "failed", "dead_letter"]);

function nowIso() {
  return new Date().toISOString();
}

function safeId(prefix, value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized ? `${prefix}-${normalized}` : `${prefix}-${Date.now()}`;
}

export function getWorkerRuntimePolicy() {
  if (!existsSync(POLICY_PATH)) {
    return {
      workerRuntimeEnabled: "preview_only",
      taskExecutionAllowed: false,
      providerCallsAllowed: false,
      toolCallsAllowed: false,
      externalNetworkAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      evidenceAllowed: true,
      activityAllowed: true,
    };
  }
  return JSON.parse(readFileSync(POLICY_PATH, "utf8"));
}

export function createWorkerQueueItem(input = {}) {
  const timestamp = input.createdAt || nowIso();
  const taskId = input.taskId || "unassigned-task";
  return normalizeWorkerQueueItem({
    queueItemId: input.queueItemId || safeId("queue", `${taskId}-${timestamp}`),
    phase: input.phase || WORKER_QUEUE_PHASE,
    queueVersion: input.queueVersion || WORKER_QUEUE_VERSION,
    scope: input.scope || "NEXUS_OS_CHANGE",
    projectId: input.projectId || "",
    missionId: input.missionId || "",
    taskId,
    capabilityId: input.capabilityId || "worker-runtime-preview",
    ownerAgent: input.ownerAgent || "NEXUS",
    priority: input.priority || "normal",
    state: input.state || "queued",
    riskLevel: input.riskLevel || "medium",
    costPolicyRef: input.costPolicyRef || "cost-policy-preview",
    allowedRuntime: "preview_only",
    executionEnabled: false,
    providerCallsAllowed: false,
    toolCallsAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    createdAt: timestamp,
    updatedAt: input.updatedAt || timestamp,
    redacted: true,
    warnings: input.warnings || [],
    errors: input.errors || [],
  });
}

export function normalizeWorkerQueueItem(item = {}) {
  return {
    ...item,
    warnings: Array.isArray(item.warnings) ? item.warnings : [],
    errors: Array.isArray(item.errors) ? item.errors : [],
    executionEnabled: false,
    providerCallsAllowed: false,
    toolCallsAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    allowedRuntime: "preview_only",
    redacted: true,
  };
}

export function validateWorkerQueueItem(item = {}) {
  const errors = [];
  if (!item.queueItemId) errors.push("queueItemId is required");
  if (item.queueVersion !== WORKER_QUEUE_VERSION) errors.push("queueVersion must be 1.0");
  if (!QUEUE_SCOPES.has(item.scope)) errors.push(`scope must be one of: ${[...QUEUE_SCOPES].join(", ")}`);
  if (!item.taskId) errors.push("taskId is required");
  if (!item.capabilityId) errors.push("capabilityId is required");
  if (!item.ownerAgent) errors.push("ownerAgent is required");
  if (!QUEUE_PRIORITIES.has(item.priority)) errors.push(`priority must be one of: ${[...QUEUE_PRIORITIES].join(", ")}`);
  if (!QUEUE_STATES.has(item.state)) errors.push(`state must be one of: ${[...QUEUE_STATES].join(", ")}`);
  if (item.allowedRuntime !== "preview_only") errors.push("allowedRuntime must be preview_only");
  if (item.executionEnabled !== false) errors.push("executionEnabled must be false");
  if (item.providerCallsAllowed !== false) errors.push("providerCallsAllowed must be false");
  if (item.toolCallsAllowed !== false) errors.push("toolCallsAllowed must be false");
  if (item.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (item.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (item.redacted !== true) errors.push("redacted must be true");
  if (!Array.isArray(item.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(item.errors)) errors.push("errors must be an array");
  return { valid: errors.length === 0, errors };
}
