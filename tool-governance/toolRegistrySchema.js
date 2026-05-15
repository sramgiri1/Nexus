import {
  TOOL_CATEGORIES,
  TOOL_DATA_CLASSIFICATIONS,
  TOOL_INTERFACE_TYPES,
  TOOL_RISK_LEVELS,
  TOOL_STATUSES,
} from "./toolTypes.js";

const REQUIRED_STRING_FIELDS = [
  "toolId",
  "displayName",
  "description",
  "category",
  "interfaceType",
  "status",
  "riskLevel",
  "costPolicyRef",
  "contractPath",
  "owner",
  "version",
  "createdAt",
  "updatedAt",
];

const REQUIRED_ARRAY_FIELDS = [
  "allowedScopes",
  "allowedProjects",
  "allowedAgents",
  "requiredCapabilities",
  "dataClassificationsAllowed",
  "allowedMethods",
  "forbiddenMethods",
  "policyRefs",
];

export function validateToolDefinition(tool) {
  const errors = [];

  if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
    return { valid: false, errors: ["Tool definition must be an object"] };
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!tool[field] || typeof tool[field] !== "string") {
      errors.push(`Missing string field: ${field}`);
    }
  }

  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(tool[field])) errors.push(`Missing array field: ${field}`);
  }

  if (!TOOL_CATEGORIES.includes(tool.category)) errors.push(`Invalid category: ${tool.category}`);
  if (!TOOL_INTERFACE_TYPES.includes(tool.interfaceType)) {
    errors.push(`Invalid interfaceType: ${tool.interfaceType}`);
  }
  if (!TOOL_STATUSES.includes(tool.status)) errors.push(`Invalid status: ${tool.status}`);
  if (!TOOL_RISK_LEVELS.includes(tool.riskLevel)) errors.push(`Invalid riskLevel: ${tool.riskLevel}`);

  for (const classification of tool.dataClassificationsAllowed || []) {
    if (!TOOL_DATA_CLASSIFICATIONS.includes(classification)) {
      errors.push(`Invalid data classification: ${classification}`);
    }
  }

  for (const field of [
    "runtimeEnabled",
    "executionEnabled",
    "providerCallsAllowed",
    "externalNetworkAllowed",
    "projectMutationAllowed",
    "evidenceRequired",
    "auditRequired",
    "lazyContractAvailable",
  ]) {
    if (typeof tool[field] !== "boolean") errors.push(`${field} must be boolean`);
  }

  if (tool.runtimeEnabled !== false) errors.push("runtimeEnabled must be false in P52");
  if (tool.executionEnabled !== false) errors.push("executionEnabled must be false in P52");
  if (tool.providerCallsAllowed !== false) errors.push("providerCallsAllowed must be false in P52");
  if (tool.externalNetworkAllowed !== false) errors.push("externalNetworkAllowed must be false in P52");
  if (tool.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false in P52");
  if (tool.evidenceRequired !== true) errors.push("evidenceRequired must be true");
  if (tool.auditRequired !== true) errors.push("auditRequired must be true");

  return { valid: errors.length === 0, errors };
}

export function validateToolRegistry(tools) {
  const errors = [];
  const seen = new Set();

  if (!Array.isArray(tools)) return { valid: false, errors: ["Tool registry must be an array"] };

  for (const tool of tools) {
    const validation = validateToolDefinition(tool);
    if (!validation.valid) {
      errors.push(...validation.errors.map((error) => `${tool?.toolId || "unknown"}: ${error}`));
    }
    if (seen.has(tool.toolId)) errors.push(`Duplicate toolId: ${tool.toolId}`);
    seen.add(tool.toolId);
  }

  return { valid: errors.length === 0, errors };
}

export function summarizeToolRegistry(tools = []) {
  const categoryCounts = {};
  const interfaceCounts = {};
  const statusCounts = {};

  for (const tool of tools) {
    categoryCounts[tool.category] = (categoryCounts[tool.category] || 0) + 1;
    interfaceCounts[tool.interfaceType] = (interfaceCounts[tool.interfaceType] || 0) + 1;
    statusCounts[tool.status] = (statusCounts[tool.status] || 0) + 1;
  }

  return {
    toolCount: tools.length,
    runtimeEnabledCount: tools.filter((tool) => tool.runtimeEnabled).length,
    executionEnabledCount: tools.filter((tool) => tool.executionEnabled).length,
    providerAllowedCount: tools.filter((tool) => tool.providerCallsAllowed).length,
    externalNetworkAllowedCount: tools.filter((tool) => tool.externalNetworkAllowed).length,
    projectMutationAllowedCount: tools.filter((tool) => tool.projectMutationAllowed).length,
    categoryCounts,
    interfaceCounts,
    statusCounts,
  };
}
