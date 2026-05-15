import seedServers from "./seeds/mcp-registry.seed.json" with { type: "json" };
import { summarizeMcpRegistry, validateMcpRegistry } from "./mcpRegistrySchema.js";

export function getMcpRegistry() {
  return seedServers.map((server) => ({
    ...server,
    allowedAgents: [...server.allowedAgents],
    allowedProjects: [...server.allowedProjects],
    allowedMethods: [...server.allowedMethods],
    forbiddenMethods: [...server.forbiddenMethods],
    secretsRequired: [...server.secretsRequired],
  }));
}

export function getMcpServerById(mcpServerId) {
  return getMcpRegistry().find((server) => server.mcpServerId === mcpServerId) || null;
}

export function validateRegisteredMcpServers(servers = getMcpRegistry()) {
  return validateMcpRegistry(servers);
}

export function summarizeRegisteredMcpServers(servers = getMcpRegistry()) {
  return summarizeMcpRegistry(servers);
}
