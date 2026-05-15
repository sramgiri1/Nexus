export const AGENT_ROOM_TYPES = [
  "mission_room",
  "task_room",
  "validation_room",
  "implementation_review_room",
  "release_review_room",
  "os_update_room",
];

const KNOWN_OR_PLANNED_AGENTS = [
  "NEXUS",
  "SHEPHERD",
  "CORE",
  "AUDITOR",
  "WARDEN",
  "SENTINEL",
  "PRISM",
  "SWIFT",
  "FORGE",
  "PLANNED_AGENT",
];

function stableId(prefix, parts) {
  return `${prefix}-${parts.filter(Boolean).join("-").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
}

export function createAgentRoom(input = {}) {
  const createdAt = input.createdAt || new Date().toISOString();
  return {
    roomId: input.roomId || stableId("room", [input.roomType, input.scope, input.projectId, input.taskId, Date.parse(createdAt)]),
    roomType: input.roomType || "task_room",
    scope: input.scope || "PROJECT_CHANGE",
    projectId: input.projectId || null,
    missionId: input.missionId || null,
    taskId: input.taskId || null,
    title: input.title || "Governed Agent Room",
    participants: input.participants || ["NEXUS"],
    ownerAgent: input.ownerAgent || "NEXUS",
    allowedMessageTypes: input.allowedMessageTypes || ["clarification_request", "handoff_request", "evidence_request", "review_request", "context_update", "blocker_report"],
    dataClassification: input.dataClassification || "local-private",
    status: input.status || "open",
    createdAt,
    redacted: true,
  };
}

export function validateAgentRoom(room, options = {}) {
  const errors = [];
  for (const field of ["roomId", "roomType", "scope", "title", "participants", "ownerAgent", "allowedMessageTypes", "dataClassification", "status", "createdAt"]) {
    if (!room?.[field]) errors.push(`Missing required field: ${field}`);
  }
  if (!AGENT_ROOM_TYPES.includes(room?.roomType)) errors.push(`Invalid room type: ${room?.roomType}`);
  if (!Array.isArray(room?.participants) || room.participants.length === 0) errors.push("participants must be non-empty");
  if (!Array.isArray(room?.allowedMessageTypes) || room.allowedMessageTypes.length === 0) errors.push("allowedMessageTypes must be non-empty");
  if (room?.redacted !== true) errors.push("Rooms must be redacted");
  if (options.mode && ["demo", "public-safe"].includes(options.mode) && ["local-private", "confidential"].includes(room?.dataClassification)) {
    errors.push("demo/public-safe rooms cannot include private project data");
  }
  for (const agent of room?.participants || []) {
    if (!KNOWN_OR_PLANNED_AGENTS.includes(agent)) errors.push(`Unknown participant: ${agent}`);
  }
  return { ok: errors.length === 0, errors };
}
