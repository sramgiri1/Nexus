export const AGENT_MESH_MESSAGE_TYPES = [
  "clarification_request",
  "handoff_request",
  "evidence_request",
  "review_request",
  "context_update",
  "blocker_report",
  "approval_request",
  "validation_request",
  "implementation_ready",
  "failure_report",
];

export const AGENT_MESH_SCOPES = [
  "PROJECT_CHANGE",
  "NEXUS_OS_CHANGE",
  "CROSS_CUTTING_CHANGE",
  "DEMO_CHANGE",
];

export const AGENT_MESH_DATA_CLASSIFICATIONS = [
  "public-safe",
  "internal",
  "local-private",
  "confidential",
];

export function listAgentMeshMessageTypes() {
  return [...AGENT_MESH_MESSAGE_TYPES];
}

export function isAllowedMeshMessageType(type) {
  return AGENT_MESH_MESSAGE_TYPES.includes(type);
}
