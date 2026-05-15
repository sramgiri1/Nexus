import { getCapabilityById } from "./capabilityRules.js";

export function validateBoundaryEnvelope(envelope) {
  const errors = [];
  const warnings = [...(envelope.warnings || [])];

  if (envelope.dryRun !== true) errors.push("Boundary envelope must be dry-run only");
  if (envelope.runtimeEnforcementEnabled !== false) errors.push("Runtime enforcement must be disabled");
  if (envelope.toolDispatchEnabled !== false) errors.push("Tool dispatch must be disabled");
  if (envelope.providerCallsEnabled !== false) errors.push("Provider calls must be disabled");
  if (envelope.dbWritesEnabled !== false) errors.push("DB writes must be disabled");
  if (!envelope.agent?.agentId) errors.push("agent.agentId is required");
  if (!envelope.project?.projectId) errors.push("project.projectId is required");
  if (!envelope.scope?.scopeType) errors.push("scope.scopeType is required");

  const capabilityId = envelope.task?.capabilityId;
  if (capabilityId && !getCapabilityById(capabilityId)) {
    warnings.push(`Capability ${capabilityId} is not in the catalog yet`);
  }
  if (capabilityId && !(envelope.allowedCapabilities || []).includes(capabilityId)) {
    warnings.push(`Capability ${capabilityId} is not allowed for ${envelope.agent?.agentId}`);
  }
  if ((envelope.allowedPaths || []).some((pattern) => pattern === "*" || pattern === "**/*")) {
    errors.push("Allowed paths are too broad");
  }
  if ((envelope.dataClassificationLimits || []).includes("secret")) {
    errors.push("Secret data classification cannot be allowed");
  }

  return { ok: errors.length === 0, errors, warnings };
}
