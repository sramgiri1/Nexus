import { randomUUID } from "node:crypto";

export const LOCAL_ACTIONS_FILE = "local-state/runtime/actions.jsonl";

export const ACTION_TYPES = {
  PRIVATE_BACKEND_VALIDATION_REQUEST: "private_project_backend_validation_request",
  REFRESH_PRIVATE_VALIDATION_SNAPSHOT: "refresh_private_validation_snapshot",
  DEMO_NOOP: "demo_noop",
};

export const ACTION_STATUSES = {
  REQUESTED: "requested",
  VALIDATED: "validated",
  BLOCKED: "blocked",
  READY_FOR_EXECUTION: "ready_for_execution",
  EXECUTED: "executed",
  FAILED: "failed",
};

export const ALLOWED_ACTION_TYPES = new Set(Object.values(ACTION_TYPES));

export const ALLOWED_MODES = new Set(["local-private", "test", "demo"]);

export const PRIVATE_ACTION_TYPES = new Set([
  ACTION_TYPES.PRIVATE_BACKEND_VALIDATION_REQUEST,
  ACTION_TYPES.REFRESH_PRIVATE_VALIDATION_SNAPSHOT,
]);

export const ACTION_CAPABILITY_MAP = {
  [ACTION_TYPES.PRIVATE_BACKEND_VALIDATION_REQUEST]: "verification.code_quality_gate",
  [ACTION_TYPES.REFRESH_PRIVATE_VALIDATION_SNAPSHOT]: "orchestration.plan_flow",
  [ACTION_TYPES.DEMO_NOOP]: "demo.noop",
};

export const ACTION_RISK_MAP = {
  [ACTION_TYPES.PRIVATE_BACKEND_VALIDATION_REQUEST]: "medium",
  [ACTION_TYPES.REFRESH_PRIVATE_VALIDATION_SNAPSHOT]: "low",
  [ACTION_TYPES.DEMO_NOOP]: "low",
};

export const APPROVAL_REQUIRED_TYPES = new Set([
  ACTION_TYPES.PRIVATE_BACKEND_VALIDATION_REQUEST,
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function buildAction(params = {}) {
  const p = normalizeObject(params);
  const actionType = normalizeString(p.actionType);

  return {
    actionId: normalizeString(p.actionId) || randomUUID(),
    actionType,
    requestedBy: normalizeString(p.requestedBy) || "system",
    source: "command_center",
    projectId: normalizeString(p.projectId) || "private-project-01",
    privateProject: p.privateProject !== false,
    mode: normalizeString(p.mode) || "demo",
    target: {
      capabilityId:
        normalizeString(normalizeObject(p.target).capabilityId) ||
        ACTION_CAPABILITY_MAP[actionType] ||
        "",
      targetAgent: normalizeString(normalizeObject(p.target).targetAgent) || "auditor",
      riskLevel:
        normalizeString(normalizeObject(p.target).riskLevel) ||
        ACTION_RISK_MAP[actionType] ||
        "medium",
      dataClassification:
        normalizeString(normalizeObject(p.target).dataClassification) || "confidential",
    },
    requestedCommand: null,
    mutationRequested: false,
    status: ACTION_STATUSES.REQUESTED,
    createdAt: normalizeString(p.createdAt) || new Date(Date.now()).toISOString(),
    redacted: true,
    evidenceIds: [],
    auditIds: [],
  };
}

export function validateActionSchema(action) {
  const errors = [];
  const warnings = [];

  if (!action || typeof action !== "object") {
    return { valid: false, errors: ["action must be an object."], warnings };
  }

  if (!action.actionId) {
    errors.push("actionId is required.");
  }

  if (!ALLOWED_ACTION_TYPES.has(action.actionType)) {
    errors.push(`actionType must be one of: ${[...ALLOWED_ACTION_TYPES].join(", ")}.`);
  }

  if (!action.requestedBy) {
    errors.push("requestedBy is required.");
  }

  if (action.source !== "command_center") {
    errors.push("source must be command_center.");
  }

  if (!ALLOWED_MODES.has(action.mode)) {
    errors.push(`mode must be one of: ${[...ALLOWED_MODES].join(", ")}.`);
  }

  if (action.mutationRequested !== false) {
    errors.push("mutationRequested must be false.");
  }

  if (action.requestedCommand !== null) {
    errors.push("requestedCommand must be null (no direct command bridging from UI).");
  }

  if (action.redacted !== true) {
    errors.push("redacted must be true.");
  }

  if (!action.target || typeof action.target !== "object") {
    errors.push("target is required.");
  } else {
    if (!action.target.capabilityId) {
      errors.push("target.capabilityId is required.");
    }
    if (!action.target.targetAgent) {
      errors.push("target.targetAgent is required.");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
