import { getToolById, getToolRegistry } from "./toolRegistry.js";
import { createToolGatewayDecision, TOOL_GATEWAY_DECISIONS } from "./toolDecision.js";
import { TOOL_GATEWAY_DEFAULT_POLICY, TOOL_GATEWAY_REQUEST_TYPES, summarizeToolGatewayPolicy } from "./toolGatewayPolicy.js";

const DEFAULT_CONTEXT = Object.freeze({
  mode: "local-private",
  agentId: "NEXUS",
  projectId: "private-project",
  scope: "NEXUS_OS_CHANGE",
  dataClassification: "internal",
  costEstimateUsd: 0,
});

export function createToolGatewayContext(input = {}) {
  return {
    ...DEFAULT_CONTEXT,
    ...input,
    mode: input.mode || DEFAULT_CONTEXT.mode,
    agentId: input.agentId || DEFAULT_CONTEXT.agentId,
    projectId: input.projectId || DEFAULT_CONTEXT.projectId,
    scope: input.scope || DEFAULT_CONTEXT.scope,
    dataClassification: input.dataClassification || DEFAULT_CONTEXT.dataClassification,
    costEstimateUsd: Number.isFinite(input.costEstimateUsd) ? input.costEstimateUsd : DEFAULT_CONTEXT.costEstimateUsd,
  };
}

export function validateToolGatewayRequest(input = {}) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, errors: ["Tool gateway request must be an object"] };
  }
  if (!TOOL_GATEWAY_REQUEST_TYPES.includes(input.requestType)) {
    errors.push(`Invalid requestType: ${input.requestType}`);
  }
  if (!input.toolId || typeof input.toolId !== "string") errors.push("toolId is required");
  if (input.method && typeof input.method !== "string") errors.push("method must be a string when provided");
  return { valid: errors.length === 0, errors };
}

function safeToolSummary(tool) {
  if (!tool) return null;
  return {
    toolId: tool.toolId,
    displayName: tool.displayName,
    category: tool.category,
    interfaceType: tool.interfaceType,
    status: tool.status,
    riskLevel: tool.riskLevel,
    owner: tool.owner,
    runtimeEnabled: tool.runtimeEnabled,
    executionEnabled: tool.executionEnabled,
    lazyContractAvailable: tool.lazyContractAvailable,
  };
}

function denied(decision, reason, request, tool = null) {
  return createToolGatewayDecision({
    decision,
    allowed: false,
    reason,
    toolId: request.toolId || null,
    requestType: request.requestType || null,
    method: request.method || null,
    requiredApproval: decision === TOOL_GATEWAY_DECISIONS.REQUIRE_APPROVAL,
    evidenceRequired: true,
    auditRequired: true,
    safeSummary: { tool: safeToolSummary(tool) },
  });
}

export function evaluateToolGatewayDecision(input = {}) {
  const request = {
    ...input,
    context: createToolGatewayContext(input.context || {}),
  };
  const validation = validateToolGatewayRequest(request);
  if (!validation.valid) {
    return denied(TOOL_GATEWAY_DECISIONS.DENY, validation.errors.join("; "), request);
  }

  const policy = { ...TOOL_GATEWAY_DEFAULT_POLICY, ...(request.policy || {}) };
  const tool = getToolById(request.toolId);
  if (!tool) return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_NOT_ENABLED, "Tool is not registered", request);

  if (!policy.allowedRequestTypes.includes(request.requestType)) {
    return denied(TOOL_GATEWAY_DECISIONS.DENY, "Request type is not allowed by gateway policy", request, tool);
  }
  if (request.requestType === "tool.execute.preview") {
    return denied(
      TOOL_GATEWAY_DECISIONS.BLOCKED_RUNTIME_DISABLED,
      "Tool execution is disabled in P52; preview returns decision only",
      request,
      tool,
    );
  }
  if (tool.runtimeEnabled || tool.executionEnabled) {
    return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_RUNTIME_DISABLED, "Runtime execution is disabled by policy", request, tool);
  }
  if (!tool.allowedScopes.includes(request.context.scope)) {
    return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_SCOPE, "Tool is not allowed for the requested scope", request, tool);
  }
  if (!tool.allowedAgents.includes(request.context.agentId)) {
    return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_AGENT, "Agent is not allowed to use this tool metadata", request, tool);
  }
  if (!tool.allowedProjects.includes(request.context.projectId)) {
    return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_PROJECT, "Project is not allowed for this tool metadata", request, tool);
  }
  if (!tool.dataClassificationsAllowed.includes(request.context.dataClassification)) {
    return denied(
      TOOL_GATEWAY_DECISIONS.BLOCKED_DATA_CLASSIFICATION,
      "Data classification is not allowed for this tool metadata",
      request,
      tool,
    );
  }
  if (request.context.costEstimateUsd > policy.maxCostEstimateUsd) {
    return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_COST, "Cost estimate exceeds zero-cost metadata policy", request, tool);
  }
  if (request.method && !tool.allowedMethods.includes(request.method)) {
    return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_METHOD, "Method is not in the tool allowedMethods list", request, tool);
  }
  if (request.method && tool.forbiddenMethods.includes(request.method)) {
    return denied(TOOL_GATEWAY_DECISIONS.BLOCKED_METHOD, "Method is explicitly forbidden", request, tool);
  }

  return createToolGatewayDecision({
    decision: TOOL_GATEWAY_DECISIONS.ALLOW_METADATA_ONLY,
    allowed: true,
    reason: "Metadata-only request is allowed by current tool gateway policy",
    toolId: tool.toolId,
    requestType: request.requestType,
    method: request.method || null,
    requiredApproval: false,
    evidenceRequired: tool.evidenceRequired,
    auditRequired: tool.auditRequired,
    safeSummary: { tool: safeToolSummary(tool) },
  });
}

export function buildToolGatewayDecision(input = {}) {
  return evaluateToolGatewayDecision(input);
}

export function summarizeToolGatewayPosture() {
  const tools = getToolRegistry();
  return {
    gateway: "governed-tool-gateway",
    policy: summarizeToolGatewayPolicy(),
    registeredTools: tools.length,
    metadataOnlyTools: tools.filter((tool) => tool.status === "available_metadata_only").length,
    executionEnabledTools: tools.filter((tool) => tool.executionEnabled).length,
    runtimeEnabledTools: tools.filter((tool) => tool.runtimeEnabled).length,
    supportedRequestTypes: [...TOOL_GATEWAY_REQUEST_TYPES],
  };
}
