import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createAgentMeshMessage } from "./messageContract.js";
import { appendMeshMessage } from "./messageStore.js";

const ROOT = process.cwd();
const DEFAULT_HANDOFF_STORE = "local-state/runtime/agent-handoffs.jsonl";

function resolveStorePath(options = {}) {
  return join(ROOT, options.handoffStorePath || DEFAULT_HANDOFF_STORE);
}

function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function stableId(prefix, parts) {
  return `${prefix}-${parts.filter(Boolean).join("-").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

function ensureHandoffStore(options = {}) {
  const storePath = resolveStorePath(options);
  mkdirSync(dirname(storePath), { recursive: true });
  if (!existsSync(storePath)) writeFileSync(storePath, "", "utf8");
  return options.handoffStorePath || DEFAULT_HANDOFF_STORE;
}

function appendHandoff(handoff, options = {}) {
  const validation = validateHandoffRequest(handoff);
  if (!validation.ok) return { ok: false, written: false, errors: validation.errors };
  const storePath = resolveStorePath(options);
  mkdirSync(dirname(storePath), { recursive: true });
  const record = { ...handoff, redacted: true, taskOwnershipMutated: false };
  appendFileSync(storePath, `${JSON.stringify(record)}\n`, "utf8");
  return { ok: true, written: true, handoff: record, storePath: options.handoffStorePath || DEFAULT_HANDOFF_STORE, errors: [] };
}

function readHandoffs(options = {}) {
  const storePath = resolveStorePath(options);
  if (!existsSync(storePath)) return [];
  const latest = new Map();
  readFileSync(storePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(parseLine)
    .filter(Boolean)
    .forEach((handoff) => latest.set(handoff.handoffId, handoff));
  return [...latest.values()];
}

function requiresSensitiveReview(handoff) {
  return ["confidential", "local-private"].includes(handoff.dataClassification);
}

export function normalizeHandoffRequest(input = {}) {
  const requestedAt = input.requestedAt || new Date().toISOString();
  const scope = input.scope || "PROJECT_CHANGE";
  const handoff = {
    handoffId: input.handoffId || stableId("handoff", [input.fromAgent, input.toAgent, input.taskId, Date.parse(requestedAt)]),
    roomId: input.roomId || "",
    fromAgent: input.fromAgent || "",
    toAgent: input.toAgent || "",
    scope,
    sourceScope: input.sourceScope || scope,
    targetScope: input.targetScope || scope,
    projectId: input.projectId || null,
    missionId: input.missionId || null,
    taskId: input.taskId || null,
    reason: input.reason || "",
    requestedCapabilityId: input.requestedCapabilityId || "",
    providedEvidenceIds: input.providedEvidenceIds || [],
    requiredNextEvidence: input.requiredNextEvidence || [],
    dataClassification: input.dataClassification || "local-private",
    policyDecision: input.policyDecision || "ALLOW_METADATA_ONLY",
    requiresHumanReview: Boolean(input.requiresHumanReview),
    status: input.status || "requested",
    requestedAt,
    decidedAt: input.decidedAt || null,
    decisionReason: input.decisionReason || null,
    redacted: true,
    taskOwnershipMutated: false,
  };
  return {
    ...handoff,
    requiresHumanReview: handoff.requiresHumanReview || requiresSensitiveReview(handoff),
  };
}

export function validateHandoffRequest(handoff) {
  const errors = [];
  for (const field of ["handoffId", "fromAgent", "toAgent", "scope", "reason", "requestedCapabilityId", "policyDecision", "status"]) {
    if (!handoff?.[field]) errors.push(`Missing required field: ${field}`);
  }
  if (!Array.isArray(handoff?.providedEvidenceIds)) errors.push("providedEvidenceIds must be an array");
  if (!Array.isArray(handoff?.requiredNextEvidence)) errors.push("requiredNextEvidence must be an array");
  if (handoff?.fromAgent === handoff?.toAgent) errors.push("Handoff requires different source and target agents");
  if (handoff?.sourceScope && handoff?.targetScope && handoff.sourceScope !== handoff.targetScope && handoff.scope !== "CROSS_CUTTING_CHANGE") {
    errors.push("Cross-scope handoff requires CROSS_CUTTING_CHANGE scope");
  }
  if (handoff?.scope === "CROSS_CUTTING_CHANGE" && !/^ALLOW/.test(handoff.policyDecision || "")) {
    errors.push("Cross-cutting handoff requires an allowing policy decision");
  }
  if (requiresSensitiveReview(handoff) && handoff?.requiresHumanReview !== true) {
    errors.push("Sensitive handoffs require human review by governance agents");
  }
  if (handoff?.taskOwnershipMutated !== false) errors.push("Handoffs must not mutate task ownership");
  if (handoff?.redacted !== true) errors.push("Handoffs must be redacted");
  if (/api[_-]?key|password|-----BEGIN|raw source/i.test(handoff?.reason || "")) {
    errors.push("Handoff reason contains unsafe raw/private material");
  }
  return { ok: errors.length === 0, errors };
}

export function createHandoffRequest(input = {}, options = {}) {
  const handoff = normalizeHandoffRequest(input);
  const validation = validateHandoffRequest(handoff);
  if (!validation.ok) return { ok: false, handoff: null, message: null, errors: validation.errors };
  ensureHandoffStore(options);
  const handoffResult = appendHandoff(handoff, options);
  if (!handoffResult.ok) return { ok: false, handoff: null, message: null, errors: handoffResult.errors };
  const messageResult = createAgentMeshMessage({
    messageId: `meshmsg-${handoff.handoffId}`,
    roomId: handoff.roomId || `room-${handoff.scope.toLowerCase()}`,
    scope: handoff.scope,
    projectId: handoff.projectId,
    missionId: handoff.missionId,
    taskId: handoff.taskId,
    fromAgent: handoff.fromAgent,
    toAgent: handoff.toAgent,
    messageType: "handoff_request",
    capabilityId: handoff.requestedCapabilityId,
    dataClassification: handoff.dataClassification,
    payloadSummary: `Governed handoff requested: ${handoff.reason}`,
    requiresApproval: handoff.requiresHumanReview,
    policyDecision: handoff.policyDecision,
  });
  if (!messageResult.ok) return { ok: false, handoff, message: null, errors: messageResult.errors };
  const messageWrite = appendMeshMessage(messageResult.message, options);
  return {
    ok: messageWrite.ok,
    handoff,
    message: messageResult.message,
    errors: messageWrite.errors,
  };
}

export function listHandoffs(filters = {}, options = {}) {
  return readHandoffs(options).filter((handoff) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === "") continue;
      if (handoff[key] !== value) return false;
    }
    return true;
  });
}

function updateHandoffStatus(handoffId, status, decisionReason, options = {}) {
  const handoff = listHandoffs({}, options).find((entry) => entry.handoffId === handoffId);
  if (!handoff) return { ok: false, handoff: null, errors: [`Handoff not found: ${handoffId}`] };
  const updated = {
    ...handoff,
    status,
    decisionReason: decisionReason || null,
    decidedAt: new Date().toISOString(),
    taskOwnershipMutated: false,
    redacted: true,
  };
  return appendHandoff(updated, options);
}

export function approveHandoff(handoffId, options = {}) {
  return updateHandoffStatus(handoffId, "approved", "Approved for governed follow-up only; task ownership unchanged.", options);
}

export function rejectHandoff(handoffId, reason = "Rejected by governance review.", options = {}) {
  return updateHandoffStatus(handoffId, "rejected", reason, options);
}
