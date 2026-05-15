import { buildToolGatewayDecision, createToolGatewayContext } from "./toolGateway.js";

export function previewToolExecution(request = {}) {
  const decision = buildToolGatewayDecision({
    ...request,
    requestType: "tool.execute.preview",
    context: createToolGatewayContext(request.context || {}),
  });

  return {
    previewOnly: true,
    executed: false,
    decision: decision.decision,
    allowed: decision.allowed,
    reason: decision.reason,
    toolId: decision.toolId,
    method: decision.method,
    expectedEvidence: decision.evidenceRequired ? "Evidence record required before any future execution" : "No evidence expectation registered",
    auditRequired: decision.auditRequired,
  };
}
