import seedPermissions from "./seeds/tool-permissions.seed.json" with { type: "json" };

export const TOOL_PERMISSION_STATES = Object.freeze([
  "allowed_metadata",
  "requires_approval",
  "blocked_not_enabled",
  "blocked_scope",
  "blocked_agent",
  "blocked_project",
  "blocked_method",
  "blocked_classification",
]);

export function getToolPermissionMatrix() {
  return seedPermissions.map((entry) => ({
    ...entry,
    allowedScopes: [...entry.allowedScopes],
    allowedMethods: [...entry.allowedMethods],
    dataClassificationsAllowed: [...entry.dataClassificationsAllowed],
  }));
}

export function validateToolPermissionEntry(entry) {
  const errors = [];
  for (const field of [
    "permissionId",
    "toolId",
    "agentId",
    "projectScope",
    "riskLevelAllowed",
    "permission",
    "reason",
  ]) {
    if (!entry?.[field] || typeof entry[field] !== "string") errors.push(`Missing string field: ${field}`);
  }
  for (const field of ["allowedScopes", "allowedMethods", "dataClassificationsAllowed"]) {
    if (!Array.isArray(entry?.[field])) errors.push(`Missing array field: ${field}`);
  }
  if (typeof entry?.approvalRequired !== "boolean") errors.push("approvalRequired must be boolean");
  if (!TOOL_PERMISSION_STATES.includes(entry?.permission)) errors.push(`Invalid permission: ${entry?.permission}`);
  return { valid: errors.length === 0, errors };
}

export function validateToolPermissionMatrix(matrix = getToolPermissionMatrix()) {
  const errors = [];
  const seen = new Set();
  for (const entry of matrix) {
    const validation = validateToolPermissionEntry(entry);
    if (!validation.valid) errors.push(...validation.errors.map((error) => `${entry?.permissionId || "unknown"}: ${error}`));
    if (seen.has(entry.permissionId)) errors.push(`Duplicate permissionId: ${entry.permissionId}`);
    seen.add(entry.permissionId);
  }
  return { valid: errors.length === 0, errors };
}

export function evaluateToolPermission(request = {}, matrix = getToolPermissionMatrix()) {
  const entries = matrix.filter((entry) => entry.toolId === request.toolId || entry.toolId === "*");
  const explicit = entries.find(
    (entry) =>
      entry.agentId === request.agentId &&
      entry.projectScope === request.projectId &&
      entry.allowedScopes.includes(request.scope) &&
      entry.allowedMethods.includes(request.method) &&
      entry.dataClassificationsAllowed.includes(request.dataClassification),
  );

  if (explicit) {
    return {
      allowed: explicit.permission === "allowed_metadata",
      permission: explicit.permission,
      approvalRequired: explicit.approvalRequired,
      reason: explicit.reason,
      permissionId: explicit.permissionId,
    };
  }

  if (!entries.some((entry) => entry.agentId === request.agentId)) {
    return { allowed: false, permission: "blocked_agent", approvalRequired: false, reason: "Agent is not allowed for this tool", permissionId: null };
  }
  if (!entries.some((entry) => entry.projectScope === request.projectId)) {
    return { allowed: false, permission: "blocked_project", approvalRequired: false, reason: "Project is not allowed for this tool", permissionId: null };
  }
  if (!entries.some((entry) => entry.allowedScopes.includes(request.scope))) {
    return { allowed: false, permission: "blocked_scope", approvalRequired: false, reason: "Scope is not allowed for this tool", permissionId: null };
  }
  if (!entries.some((entry) => entry.allowedMethods.includes(request.method))) {
    return { allowed: false, permission: "blocked_method", approvalRequired: false, reason: "Method is not allowed for this tool", permissionId: null };
  }
  return {
    allowed: false,
    permission: "blocked_classification",
    approvalRequired: false,
    reason: "Data classification is not allowed for this tool",
    permissionId: null,
  };
}

export function summarizeToolPermissionMatrix(matrix = getToolPermissionMatrix()) {
  const permissionCounts = {};
  for (const entry of matrix) permissionCounts[entry.permission] = (permissionCounts[entry.permission] || 0) + 1;
  return {
    permissionCount: matrix.length,
    permissionCounts,
    approvalRequiredCount: matrix.filter((entry) => entry.approvalRequired).length,
    agents: [...new Set(matrix.map((entry) => entry.agentId))],
  };
}
