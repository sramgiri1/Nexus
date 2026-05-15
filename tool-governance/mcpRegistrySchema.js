const TRANSPORTS = ["stdio", "http", "sse", "local_placeholder"];
const STATUSES = ["planned", "disabled", "metadata_only", "blocked"];

export function validateMcpServerDefinition(server) {
  const errors = [];
  const stringFields = [
    "mcpServerId",
    "displayName",
    "purpose",
    "transport",
    "status",
    "authMode",
    "dataClassification",
    "egressPolicy",
    "rateLimit",
    "costPolicyRef",
    "healthCheck",
  ];
  const arrayFields = [
    "allowedAgents",
    "allowedProjects",
    "allowedMethods",
    "forbiddenMethods",
    "secretsRequired",
  ];

  if (!server || typeof server !== "object" || Array.isArray(server)) {
    return { valid: false, errors: ["MCP server definition must be an object"] };
  }

  for (const field of stringFields) {
    if (!server[field] || typeof server[field] !== "string") errors.push(`Missing string field: ${field}`);
  }
  for (const field of arrayFields) {
    if (!Array.isArray(server[field])) errors.push(`Missing array field: ${field}`);
  }
  for (const field of [
    "serverEnabled",
    "schemasLoadedByDefault",
    "lazySchemaLoadingRequired",
    "approvalRequired",
    "mockTestRequired",
    "evidenceRequired",
    "auditRequired",
  ]) {
    if (typeof server[field] !== "boolean") errors.push(`${field} must be boolean`);
  }

  if (!TRANSPORTS.includes(server.transport)) errors.push(`Invalid transport: ${server.transport}`);
  if (!STATUSES.includes(server.status)) errors.push(`Invalid status: ${server.status}`);
  if (server.serverEnabled !== false) errors.push("serverEnabled must be false in P52");
  if (server.schemasLoadedByDefault !== false) errors.push("schemasLoadedByDefault must be false");
  if (server.lazySchemaLoadingRequired !== true) errors.push("lazySchemaLoadingRequired must be true");
  if (server.egressPolicy !== "none") errors.push("egressPolicy must be none in P52");
  if ((server.secretsRequired || []).length > 0) errors.push("secretsRequired must be empty in P52");
  if (server.evidenceRequired !== true) errors.push("evidenceRequired must be true");
  if (server.auditRequired !== true) errors.push("auditRequired must be true");

  return { valid: errors.length === 0, errors };
}

export function validateMcpRegistry(servers) {
  const errors = [];
  const seen = new Set();

  if (!Array.isArray(servers)) return { valid: false, errors: ["MCP registry must be an array"] };

  for (const server of servers) {
    const validation = validateMcpServerDefinition(server);
    if (!validation.valid) {
      errors.push(...validation.errors.map((error) => `${server?.mcpServerId || "unknown"}: ${error}`));
    }
    if (seen.has(server.mcpServerId)) errors.push(`Duplicate mcpServerId: ${server.mcpServerId}`);
    seen.add(server.mcpServerId);
  }

  return { valid: errors.length === 0, errors };
}

export function summarizeMcpRegistry(servers = []) {
  return {
    serverCount: servers.length,
    serverEnabledCount: servers.filter((server) => server.serverEnabled).length,
    schemasLoadedByDefaultCount: servers.filter((server) => server.schemasLoadedByDefault).length,
    lazySchemaRequiredCount: servers.filter((server) => server.lazySchemaLoadingRequired).length,
    secretsRequiredCount: servers.filter((server) => (server.secretsRequired || []).length > 0).length,
    networkEgressCount: servers.filter((server) => server.egressPolicy !== "none").length,
  };
}
