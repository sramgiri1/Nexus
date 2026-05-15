import seedTools from "./seeds/tool-registry.seed.json" with { type: "json" };
import { summarizeToolRegistry, validateToolRegistry } from "./toolRegistrySchema.js";

export function getToolRegistry() {
  return seedTools.map((tool) => ({
    ...tool,
    allowedScopes: [...tool.allowedScopes],
    allowedProjects: [...tool.allowedProjects],
    allowedAgents: [...tool.allowedAgents],
    requiredCapabilities: [...tool.requiredCapabilities],
    dataClassificationsAllowed: [...tool.dataClassificationsAllowed],
    allowedMethods: [...tool.allowedMethods],
    forbiddenMethods: [...tool.forbiddenMethods],
    policyRefs: [...tool.policyRefs],
  }));
}

export function getToolById(toolId) {
  return getToolRegistry().find((tool) => tool.toolId === toolId) || null;
}

export function validateRegisteredTools(tools = getToolRegistry()) {
  return validateToolRegistry(tools);
}

export function summarizeRegisteredTools(tools = getToolRegistry()) {
  return summarizeToolRegistry(tools);
}
