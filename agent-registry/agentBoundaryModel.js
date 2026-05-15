import { NEXUS_AGENT_REGISTRY } from "./agentRegistrySchema.js";
import { getDataBoundaryForAgent } from "./dataBoundaryRules.js";
import { getPathBoundaryForAgent } from "./pathBoundaryRules.js";
import { getToolBoundaryForAgent } from "./toolBoundaryRules.js";

export const AGENT_BOUNDARY_MODEL_VERSION = "1.0";

export const PROJECT_SCOPE_BOUNDARIES = ["portfolio", "project", "os", "demo"];

export const APPROVAL_BOUNDARY_RULES = {
  highRiskImplementation: ["SENTINEL validation", "WARDEN policy review", "human approval"],
  crossCuttingChange: ["SHEPHERD handoff", "WARDEN boundary review"],
  releaseChange: ["AUDITOR evidence review", "SENTINEL verification", "human approval"],
  securitySensitiveChange: ["WARDEN approval", "AUDITOR evidence record"],
};

export function buildAgentBoundaryModel(registry = NEXUS_AGENT_REGISTRY) {
  return {
    boundaryModelVersion: AGENT_BOUNDARY_MODEL_VERSION,
    phase: "P45.3",
    runtimeEnforcementEnabled: false,
    toolDispatchEnabled: false,
    dimensions: [
      "path",
      "tool",
      "data",
      "projectScope",
      "changeScope",
      "approval",
    ],
    agents: registry.map((agent) => {
      const pathBoundary = getPathBoundaryForAgent(agent.agentId);
      const dataBoundary = getDataBoundaryForAgent(agent.agentId);
      const toolBoundary = getToolBoundaryForAgent(agent.agentId);
      return {
        agentId: agent.agentId,
        displayName: agent.displayName,
        agentType: agent.agentType,
        allowedProjectScopes: agent.allowedProjectScopes,
        allowedChangeScopes: agent.allowedChangeScopes,
        pathBoundary,
        dataBoundary,
        toolBoundary,
        approvalRequirements: agent.approvalRequirements,
        evidenceRequirements: agent.evidenceRequirements,
      };
    }),
    examples: {
      CORE: "Can propose scoped implementation, cannot touch secrets, policies, schema, deploy, or private source without approval.",
      SENTINEL: "Can validate and test, cannot mutate product code.",
      AUDITOR: "Can review evidence, cannot approve its own work if acting implementer.",
      WARDEN: "Can block security/privacy risk, cannot implement product feature code.",
      SWIFT: "iOS scope only when the iOS runner is enabled.",
    },
  };
}

export function validateAgentBoundaryModel(model = buildAgentBoundaryModel()) {
  const errors = [];
  const warnings = [];
  for (const agent of model.agents || []) {
    const allowed = agent.pathBoundary?.allowedPathPatterns || [];
    const forbidden = agent.pathBoundary?.forbiddenPathPatterns || [];
    if (allowed.includes("**/*") || allowed.includes("*")) {
      errors.push(`${agent.agentId}: overly broad allowed path boundary`);
    }
    if (!forbidden.some((pattern) => pattern.includes(".env"))) {
      errors.push(`${agent.agentId}: missing env/secrets path block`);
    }
    if (agent.toolBoundary?.dispatchEnabled !== false) {
      errors.push(`${agent.agentId}: tool dispatch must remain disabled`);
    }
    if ((agent.dataBoundary?.allowedDataClassifications || []).includes("secret")) {
      errors.push(`${agent.agentId}: secret data classification must not be allowed`);
    }
    if ((agent.approvalRequirements || []).length === 0 && agent.agentType !== "product") {
      warnings.push(`${agent.agentId}: no approval requirement recorded`);
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}
