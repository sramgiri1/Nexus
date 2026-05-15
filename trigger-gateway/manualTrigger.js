const ALLOWED_ACTIONS = ["plan", "review", "qa", "fix", "ship", "retro", "guard", "freeze", "explain"];
const ALLOWED_SCOPES = ["PROJECT_CHANGE", "NEXUS_OS_CHANGE", "CROSS_CUTTING_CHANGE"];
const ALLOWED_TRIGGER_TYPES = ["manual.command_center", "manual.command_palette"];

const ACTION_ROUTE_MAP = {
  plan: "/command-center",
  review: "/command-center/workbench",
  qa: "/command-center/gates",
  fix: "/command-center/implementation",
  ship: "/command-center/release",
  retro: "/command-center",
  guard: "/command-center/safety",
  freeze: "/command-center/safety",
  explain: "/command-center",
};

const ACTION_DISABLED_REASONS = {
  plan: "Preview only - trigger execution is not enabled yet.",
  review: "Requires an activated task before review can run.",
  qa: "Requires controlled validation bridge.",
  fix: "Requires failing validation evidence.",
  ship: "Requires release action bridge.",
  retro: "Requires activity/evidence history.",
  guard: "Runtime locks are not enabled yet.",
  freeze: "Requires runtime lock controls.",
  explain: "Preview only - trigger execution is not enabled yet.",
};

export function createManualTriggerRequest(input = {}) {
  return {
    triggerType: input.triggerType || "manual.command_center",
    source: input.source || "command_center_v2",
    mode: input.mode || "local-private",
    scope: input.scope || "PROJECT_CHANGE",
    projectId: input.projectId || "private-project-01",
    requestedAction: input.requestedAction || "explain",
    requestedBy: {
      userId: input.requestedBy?.userId || "local-operator",
      role: input.requestedBy?.role || "operator",
      authType: input.requestedBy?.authType || "local",
    },
    dryRunOnly: true,
    executionAllowed: false,
  };
}

export function validateManualTriggerRequest(request = {}) {
  const errors = [];
  if (!ALLOWED_TRIGGER_TYPES.includes(request.triggerType)) errors.push("Unsupported manual trigger type");
  if (request.source !== "command_center_v2" && request.source !== "command_palette") {
    errors.push("Manual trigger source must be command_center_v2 or command_palette");
  }
  if (!["local-private", "demo", "test"].includes(request.mode)) errors.push("Unsupported manual trigger mode");
  if (!ALLOWED_SCOPES.includes(request.scope)) errors.push("Unsupported manual trigger scope");
  if (!request.projectId) errors.push("Manual trigger requires projectId");
  if (!ALLOWED_ACTIONS.includes(request.requestedAction)) errors.push("Unsupported requested action");
  if (!request.requestedBy?.userId) errors.push("Manual trigger requires requestedBy.userId");
  if (request.executionAllowed !== false) errors.push("Manual trigger execution must be disabled");
  if (request.dryRunOnly !== true) errors.push("Manual trigger must be dry-run only");
  return { valid: errors.length === 0, errors };
}

export function previewManualTrigger(request = createManualTriggerRequest()) {
  const normalizedRequest = createManualTriggerRequest(request);
  const validation = validateManualTriggerRequest(normalizedRequest);
  const routeTarget = ACTION_ROUTE_MAP[normalizedRequest.requestedAction] || "/command-center";
  const disabledReason = ACTION_DISABLED_REASONS[normalizedRequest.requestedAction]
    || "Preview only - trigger execution is not enabled yet.";

  return {
    previewVersion: "1.0",
    phase: "P53.2",
    valid: validation.valid,
    errors: validation.errors,
    triggerType: normalizedRequest.triggerType,
    source: normalizedRequest.source,
    mode: normalizedRequest.mode,
    scope: normalizedRequest.scope,
    projectId: normalizedRequest.projectId,
    requestedAction: normalizedRequest.requestedAction,
    routeTarget,
    recommendedActionBridge: "governed_action_bridge_preview",
    status: "preview_only",
    dryRunOnly: true,
    executionAllowed: false,
    taskActivationAllowed: false,
    agentExecutionAllowed: false,
    providerCallsAllowed: false,
    toolCallsAllowed: false,
    projectMutationAllowed: false,
    disabledReason,
    evidencePreview: {
      evidenceType: "manual_trigger_preview",
      writeAllowed: false,
      summary: "Preview evidence only. No runtime evidence is written by P53.2.",
    },
  };
}

export function buildManualTriggerResponse(preview = previewManualTrigger()) {
  return {
    ok: preview.valid,
    source: "manual-trigger-preview",
    generatedAt: new Date().toISOString(),
    preview,
    message: preview.valid
      ? "Preview only - trigger execution is not enabled yet."
      : "Manual trigger preview is invalid.",
  };
}
