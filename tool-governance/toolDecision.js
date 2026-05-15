export const TOOL_GATEWAY_DECISIONS = Object.freeze({
  ALLOW_METADATA_ONLY: "ALLOW_METADATA_ONLY",
  DENY: "DENY",
  REQUIRE_APPROVAL: "REQUIRE_APPROVAL",
  BLOCKED_NOT_ENABLED: "BLOCKED_NOT_ENABLED",
  BLOCKED_SCOPE: "BLOCKED_SCOPE",
  BLOCKED_AGENT: "BLOCKED_AGENT",
  BLOCKED_PROJECT: "BLOCKED_PROJECT",
  BLOCKED_DATA_CLASSIFICATION: "BLOCKED_DATA_CLASSIFICATION",
  BLOCKED_COST: "BLOCKED_COST",
  BLOCKED_METHOD: "BLOCKED_METHOD",
  BLOCKED_RUNTIME_DISABLED: "BLOCKED_RUNTIME_DISABLED",
});

export function createToolGatewayDecision({
  decision,
  allowed = false,
  reason,
  toolId = null,
  requestType = null,
  method = null,
  requiredApproval = false,
  evidenceRequired = true,
  auditRequired = true,
  safeSummary = {},
}) {
  return {
    decision,
    allowed,
    reason,
    toolId,
    requestType,
    method,
    requiredApproval,
    evidenceRequired,
    auditRequired,
    safeSummary,
  };
}
