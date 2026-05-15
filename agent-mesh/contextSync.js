import {
  buildTrustedContextPacket,
  summarizeTrustedContextPacket,
  validateTrustedContextPacket,
} from "../trusted-context/index.js";
import { getAgentRoom } from "./roomStore.js";

function stableId(prefix, parts) {
  return `${prefix}-${parts.filter(Boolean).join("-").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

export function createContextSyncRequest(input = {}) {
  const requestedAt = input.requestedAt || new Date().toISOString();
  return {
    contextSyncId: input.contextSyncId || stableId("ctxsync", [input.roomId, input.agentId, Date.parse(requestedAt)]),
    roomId: input.roomId || "",
    scope: input.scope || "PROJECT_CHANGE",
    projectId: input.projectId || "private-project",
    missionId: input.missionId || null,
    taskId: input.taskId || null,
    agentId: input.agentId || "NEXUS",
    capabilityId: input.capabilityId || "agent_mesh.context_sync",
    mode: input.mode || "local-private",
    summariesOnly: input.summariesOnly !== false,
    includeRawContext: false,
    runtimeAgentInjectionAllowed: false,
    requestedAt,
  };
}

export function validateContextSyncRequest(request) {
  const errors = [];
  for (const field of ["contextSyncId", "roomId", "scope", "projectId", "agentId", "capabilityId", "mode"]) {
    if (!request?.[field]) errors.push(`Missing required field: ${field}`);
  }
  if (request?.summariesOnly !== true) errors.push("Context sync must be summaries-only");
  if (request?.includeRawContext !== false) errors.push("Raw context inclusion is not allowed");
  if (request?.runtimeAgentInjectionAllowed !== false) errors.push("Runtime agent injection is not allowed");
  if (["demo", "public-safe"].includes(request?.mode) && request?.projectId && request.projectId !== "demo-project") {
    errors.push("demo/public-safe context sync cannot target private project context");
  }
  return { ok: errors.length === 0, errors };
}

function requestForRoom(room, options = {}) {
  return createContextSyncRequest({
    roomId: room.roomId,
    scope: room.scope,
    projectId: room.projectId || "private-project",
    missionId: room.missionId,
    taskId: room.taskId,
    agentId: room.ownerAgent || "NEXUS",
    capabilityId: options.capabilityId || "agent_mesh.context_sync",
    mode: options.mode || "local-private",
  });
}

export function buildMeshContextSummary(roomId, options = {}) {
  const room = getAgentRoom(roomId, options);
  if (!room) {
    return {
      ok: false,
      roomId,
      summary: null,
      allowedContext: [],
      excludedContext: [],
      staleContext: [],
      errors: [`Room not found: ${roomId}`],
    };
  }
  const request = requestForRoom(room, options);
  const requestValidation = validateContextSyncRequest(request);
  if (!requestValidation.ok) {
    return { ok: false, roomId, summary: null, allowedContext: [], excludedContext: [], staleContext: [], errors: requestValidation.errors };
  }
  const packet = buildTrustedContextPacket(request);
  const packetValidation = validateTrustedContextPacket(packet);
  if (!packetValidation.ok) {
    return { ok: false, roomId, summary: null, allowedContext: [], excludedContext: [], staleContext: [], errors: packetValidation.errors };
  }
  const allowedContext = packet.includedSources.map((source) => ({
    sourceId: source.sourceId,
    label: source.label,
    trustBand: source.trustBand,
    freshnessStatus: source.freshnessStatus,
    dataClassification: source.dataClassification,
    summaryOnly: true,
    redacted: true,
  }));
  const excludedContext = packet.excludedSources.map((source) => ({
    sourceId: source.sourceId,
    label: source.label,
    reasons: source.reasons || ["Excluded by context policy."],
    redacted: true,
  }));
  return {
    ok: true,
    roomId,
    contextSyncId: request.contextSyncId,
    summary: {
      ...summarizeTrustedContextPacket(packet),
      trustedContextPacketId: packet.lineageSummary?.lineageId || "trusted-context-packet-preview",
      rawContentIncluded: false,
      runtimeAgentInjectionAllowed: false,
      redacted: true,
    },
    allowedContext,
    excludedContext,
    staleContext: allowedContext.filter((source) => source.freshnessStatus !== "fresh"),
    errors: [],
  };
}

export function listAllowedContextForRoom(roomId, options = {}) {
  return buildMeshContextSummary(roomId, options).allowedContext || [];
}

export function listExcludedContextForRoom(roomId, options = {}) {
  return buildMeshContextSummary(roomId, options).excludedContext || [];
}
