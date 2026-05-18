import { listProviderAdapters, validateProviderRegistry } from "../api-batch/providerRegistry.js";
import { getToolPermissionMatrix, summarizeToolPermissionMatrix } from "../tool-governance/toolPermissionMatrix.js";
import { getToolRegistry, validateRegisteredTools } from "../tool-governance/toolRegistry.js";

const READINESS_STATES = Object.freeze([
  "preview_only",
  "planned",
  "approval_required",
  "blocked_not_enabled",
]);

function readablePermission(permission = "") {
  if (permission === "allowed_metadata") return "preview_only";
  if (permission === "requires_approval") return "approval_required";
  return "blocked_not_enabled";
}

function buildProviderRecords(providers = listProviderAdapters()) {
  return providers.map((provider) => ({
    kind: "provider",
    capabilityId: `provider:${provider.providerId}`,
    displayLabel: provider.label,
    providerId: provider.providerId,
    providerLabel: provider.label,
    toolId: "",
    toolLabel: "",
    readinessState: provider.status === "preview_only" ? "preview_only" : "planned",
    disabledReason: "P64.3 readiness is read-only; provider dispatch remains disabled.",
    approvalRequired: true,
    costEstimateRequired: provider.requiresCostEstimate === true,
    evidenceRequired: provider.requiresEvidence === true,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    projectMutationAllowed: false,
    dbWritesAllowed: false,
    deployAllowed: false,
    externalNetworkAllowed: false,
    ownerCapability: "provider-governance",
    nextAction: "Review policy, approval, cost, and evidence requirements before future dispatch.",
  }));
}

function buildToolRecords(tools = getToolRegistry(), permissions = getToolPermissionMatrix()) {
  return tools.map((tool) => {
    const matchingPermissions = permissions.filter((permission) => permission.toolId === tool.toolId);
    const approvalRequired = matchingPermissions.some((permission) => permission.approvalRequired);
    const state = matchingPermissions.some((permission) => permission.permission === "allowed_metadata")
      ? "preview_only"
      : readablePermission(matchingPermissions[0]?.permission);

    return {
      kind: "tool",
      capabilityId: `tool:${tool.toolId}`,
      displayLabel: tool.displayName,
      providerId: "",
      providerLabel: "",
      toolId: tool.toolId,
      toolLabel: tool.displayName,
      readinessState: state,
      disabledReason: "P64.3 readiness is read-only; tool execution remains disabled.",
      approvalRequired,
      costEstimateRequired: false,
      evidenceRequired: true,
      executionAllowed: false,
      providerDispatchAllowed: false,
      toolExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployAllowed: false,
      externalNetworkAllowed: false,
      ownerCapability: tool.owner || "tool-governance",
      nextAction: "Review permission, method, scope, and evidence requirements before future tool execution.",
    };
  });
}

export function buildDispatchReadinessMatrix(options = {}) {
  const providers = options.providers || listProviderAdapters();
  const tools = options.tools || getToolRegistry();
  const permissions = options.permissions || getToolPermissionMatrix();
  const records = [
    ...buildProviderRecords(providers),
    ...buildToolRecords(tools, permissions),
  ];

  return {
    phaseId: "P64.3",
    previewOnly: true,
    executionAllowed: false,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    records,
    summary: {
      providerCount: providers.length,
      toolCount: tools.length,
      approvalRequiredCount: records.filter((record) => record.approvalRequired).length,
      readinessStates: [...new Set(records.map((record) => record.readinessState))],
      toolPermissionSummary: summarizeToolPermissionMatrix(permissions),
    },
  };
}

export function validateDispatchReadinessRecord(record = {}) {
  const errors = [];
  for (const field of [
    "kind",
    "capabilityId",
    "displayLabel",
    "readinessState",
    "disabledReason",
    "ownerCapability",
    "nextAction",
  ]) {
    if (!record[field]) errors.push(`Missing ${field}`);
  }
  if (!["provider", "tool"].includes(record.kind)) errors.push(`Invalid kind: ${record.kind}`);
  if (!READINESS_STATES.includes(record.readinessState)) {
    errors.push(`Invalid readinessState: ${record.readinessState}`);
  }
  for (const field of [
    "executionAllowed",
    "providerDispatchAllowed",
    "toolExecutionAllowed",
    "projectMutationAllowed",
    "dbWritesAllowed",
    "deployAllowed",
    "externalNetworkAllowed",
  ]) {
    if (record[field] !== false) errors.push(`${field} must remain false`);
  }
  for (const field of ["approvalRequired", "costEstimateRequired", "evidenceRequired"]) {
    if (typeof record[field] !== "boolean") errors.push(`${field} must be boolean`);
  }
  if (record.displayLabel.includes("projects/") || record.disabledReason.includes("projects/")) {
    errors.push("Primary readiness labels must not expose project paths");
  }
  return { valid: errors.length === 0, errors };
}

export function validateDispatchReadinessMatrix(matrix = buildDispatchReadinessMatrix()) {
  const errors = [];
  const providerValidation = validateProviderRegistry();
  const toolValidation = validateRegisteredTools();

  if (!providerValidation.valid) errors.push(...providerValidation.errors.map((error) => `provider.${error}`));
  if (!toolValidation.valid) errors.push(...toolValidation.errors.map((error) => `tool.${error}`));
  if (matrix.previewOnly !== true) errors.push("previewOnly must be true");
  if (matrix.executionAllowed !== false) errors.push("executionAllowed must remain false");
  if (matrix.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must remain false");
  if (matrix.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must remain false");
  if (!Array.isArray(matrix.records) || matrix.records.length === 0) {
    errors.push("records must not be empty");
  }
  for (const record of matrix.records || []) {
    const validation = validateDispatchReadinessRecord(record);
    if (!validation.valid) errors.push(`${record.capabilityId || "unknown"}: ${validation.errors.join("; ")}`);
  }
  return { valid: errors.length === 0, errors };
}
