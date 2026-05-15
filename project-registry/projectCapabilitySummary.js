import { getCapabilityStatusCounts, validateProjectCapabilityMatrix } from "./projectCapabilityMatrix.js";

const STATUS_LABELS = {
  available: "Available",
  available_limited: "Available with limits",
  requires_runner: "Requires runner",
  not_enabled: "Not enabled",
  disabled_by_policy: "Disabled by policy",
  unknown: "Unknown",
};

export function summarizeProjectCapabilityMatrix(matrix = {}) {
  const validation = validateProjectCapabilityMatrix(matrix);
  const statusCounts = getCapabilityStatusCounts(matrix);
  const capabilities = Array.isArray(matrix.capabilities) ? matrix.capabilities : [];
  const enabledCapabilities = capabilities.filter((capability) =>
    ["available", "available_limited"].includes(capability.status),
  );
  const disabledCapabilities = capabilities.filter((capability) =>
    ["not_enabled", "disabled_by_policy", "requires_runner"].includes(capability.status),
  );

  return {
    projectId: matrix.project?.projectId || "",
    projectLabel: matrix.project?.label || "Private Project",
    stackProfileId: matrix.stackProfile?.stackId || matrix.project?.stackProfileId || "unknown-stack",
    capabilityCount: capabilities.length,
    enabledCapabilityCount: enabledCapabilities.length,
    disabledCapabilityCount: disabledCapabilities.length,
    statusCounts,
    capabilityRows: capabilities.map((capability) => ({
      capabilityId: capability.capabilityId,
      label: capability.label,
      status: STATUS_LABELS[capability.status] || STATUS_LABELS.unknown,
      reason: capability.reason,
      source: capability.source,
      supportedByStack: capability.supportedByStack,
    })),
    safetyPosture: {
      adapterRuntime: matrix.adapterRuntimeEnabled ? "enabled" : "disabled",
      projectMutation: matrix.projectMutationAllowed ? "enabled" : "disabled",
      providerDispatch: matrix.providerDispatchEnabled ? "enabled" : "not enabled",
      workerRuntime: matrix.workerRuntimeEnabled ? "enabled" : "not enabled",
      mcpTools: matrix.mcpToolsEnabled ? "enabled" : "not enabled",
      dbWrites: matrix.dbWritesAllowed ? "enabled" : "disabled",
    },
    valid: validation.valid,
    errors: validation.errors,
  };
}

export function getCapabilityStatusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS.unknown;
}
