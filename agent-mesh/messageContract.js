import {
  AGENT_MESH_DATA_CLASSIFICATIONS,
  AGENT_MESH_SCOPES,
  isAllowedMeshMessageType,
} from "./messageTypes.js";

function stableId(prefix, parts) {
  return `${prefix}-${parts.filter(Boolean).join("-").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

export function normalizeAgentMeshMessage(input = {}) {
  const createdAt = input.createdAt || new Date().toISOString();
  const messageType = input.messageType || input.type || "clarification_request";
  return {
    messageId: input.messageId || stableId("meshmsg", [input.roomId, input.fromAgent, input.toAgent, messageType, Date.parse(createdAt)]),
    roomId: input.roomId || "",
    scope: input.scope || "PROJECT_CHANGE",
    projectId: input.projectId || null,
    missionId: input.missionId || null,
    taskId: input.taskId || null,
    fromAgent: input.fromAgent || "",
    toAgent: input.toAgent || "",
    messageType,
    capabilityId: input.capabilityId || "agent_mesh.coordinate",
    dataClassification: input.dataClassification || "local-private",
    payloadSummary: input.payloadSummary || "",
    rawPayloadStored: false,
    trustedContextPacketId: input.trustedContextPacketId || null,
    requiresApproval: Boolean(input.requiresApproval),
    costEstimate: input.costEstimate || { estimatedTokens: 0, providerSpendAllowed: false },
    policyDecision: input.policyDecision || "ALLOW_METADATA_ONLY",
    redacted: true,
    createdAt,
  };
}

export function validateAgentMeshMessage(message) {
  const errors = [];
  for (const field of ["messageId", "roomId", "scope", "fromAgent", "toAgent", "messageType"]) {
    if (!message?.[field]) errors.push(`Missing required field: ${field}`);
  }
  if (!isAllowedMeshMessageType(message?.messageType)) errors.push(`Unknown message type: ${message?.messageType}`);
  if (!AGENT_MESH_SCOPES.includes(message?.scope)) errors.push(`Invalid scope: ${message?.scope}`);
  if (!AGENT_MESH_DATA_CLASSIFICATIONS.includes(message?.dataClassification)) {
    errors.push(`Invalid data classification: ${message?.dataClassification}`);
  }
  if (message?.rawPayloadStored !== false) errors.push("rawPayloadStored must be false");
  if (message?.redacted !== true) errors.push("Messages must be redacted");
  if (!message?.payloadSummary || /api[_-]?key|password|-----BEGIN|raw source/i.test(message.payloadSummary)) {
    errors.push("payloadSummary is missing or unsafe");
  }
  if (message?.mode && ["demo", "public-safe"].includes(message.mode) && ["local-private", "confidential"].includes(message.dataClassification)) {
    errors.push("demo/public-safe messages cannot include private project classification");
  }
  return { ok: errors.length === 0, errors };
}

export function createAgentMeshMessage(input = {}) {
  const message = normalizeAgentMeshMessage(input);
  const validation = validateAgentMeshMessage({ ...message, mode: input.mode });
  return {
    ok: validation.ok,
    message: validation.ok ? message : null,
    errors: validation.errors,
  };
}
