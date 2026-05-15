import { NEXUS_AGENT_REGISTRY } from "./agentRegistrySchema.js";
import {
  CAPABILITIES,
  FORBIDDEN_RUNTIME_CAPABILITIES,
  getCapabilityById,
  validateCapabilityCatalog,
  validateCapabilityId,
} from "./capabilityRules.js";

export const AGENT_CAPABILITY_MATRIX_VERSION = "1.0";

export function buildAgentCapabilityMatrix(registry = NEXUS_AGENT_REGISTRY) {
  return {
    matrixVersion: AGENT_CAPABILITY_MATRIX_VERSION,
    phase: "P45.2",
    runtimeEnforcementEnabled: false,
    capabilityCatalog: CAPABILITIES,
    agents: registry.map((agent) => ({
      agentId: agent.agentId,
      displayName: agent.displayName,
      agentType: agent.agentType,
      status: agent.status,
      allowedCapabilities: agent.allowedCapabilities,
      forbiddenCapabilities: [
        ...new Set([...(agent.forbiddenCapabilities || []), ...FORBIDDEN_RUNTIME_CAPABILITIES]),
      ],
      categoryCoverage: [
        ...new Set(
          (agent.allowedCapabilities || [])
            .map((capabilityId) => getCapabilityById(capabilityId)?.category)
            .filter(Boolean),
        ),
      ],
      approvalRequirements: agent.approvalRequirements,
      reviewSeparationPolicy: agent.reviewSeparationPolicy,
    })),
  };
}

export function validateSeparationOfDuties(matrix = buildAgentCapabilityMatrix()) {
  const errors = [];
  const warnings = [];

  for (const agent of matrix.agents) {
    const allowed = new Set(agent.allowedCapabilities || []);
    const forbidden = new Set(agent.forbiddenCapabilities || []);

    for (const capabilityId of allowed) {
      if (!validateCapabilityId(capabilityId)) errors.push(`${agent.agentId}: unstable capability ID ${capabilityId}`);
      if (forbidden.has(capabilityId)) errors.push(`${agent.agentId}: capability is both allowed and forbidden ${capabilityId}`);
    }

    if (agent.agentType === "implementer" && allowed.has("verification.approve_own_work")) {
      errors.push(`${agent.agentId}: implementer cannot approve its own implementation`);
    }
    if (agent.agentType === "verifier" && allowed.has("implementation.scoped_patch")) {
      errors.push(`${agent.agentId}: verifier cannot silently mutate code`);
    }
    if (agent.agentType === "security" && allowed.has("implementation.scoped_patch")) {
      errors.push(`${agent.agentId}: security/privacy agent can block but not implement product code`);
    }
    if (agent.agentType === "coordinator" && allowed.has("security.override_policy")) {
      errors.push(`${agent.agentId}: coordinator cannot bypass approval`);
    }
    if ((agent.categoryCoverage || []).length === 0) {
      warnings.push(`${agent.agentId}: no known capability category coverage`);
    }
  }

  const catalogValidation = validateCapabilityCatalog();
  errors.push(...catalogValidation.errors);

  return { ok: errors.length === 0, errors, warnings };
}

export function summarizeAgentCapabilityMatrix(matrix = buildAgentCapabilityMatrix()) {
  const riskyPermissions = [];
  const categoryCounts = new Map();

  for (const agent of matrix.agents) {
    for (const category of agent.categoryCoverage || []) {
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
    for (const capabilityId of agent.allowedCapabilities || []) {
      const capability = getCapabilityById(capabilityId);
      if (capability?.risk === "high") riskyPermissions.push({ agentId: agent.agentId, capabilityId });
    }
  }

  return {
    agentCount: matrix.agents.length,
    capabilityCount: matrix.capabilityCatalog.length,
    riskyPermissionCount: riskyPermissions.length,
    riskyPermissions,
    categoryCounts: Object.fromEntries(categoryCounts.entries()),
    runtimeEnforcementEnabled: matrix.runtimeEnforcementEnabled,
  };
}
