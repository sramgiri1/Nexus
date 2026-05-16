export function getSecretAccessPolicy() {
  return {
    version: "1.0",
    phase: "P59.2",
    previewOnly: true,
    valueAccessAllowed: false,
    metadataActions: ["read_reference_metadata"],
    blockedActions: ["resolve_value"],
    allowedModes: ["local-private", "test"],
    productionRequiresApproval: true,
    demoPublicDenied: true,
  };
}

export function createSecretAccessRequest(input = {}) {
  return {
    requestId: input.requestId || `secret-access-preview-${Date.now().toString(36)}`,
    referenceId: input.referenceId || "secret-ref-unconfigured",
    requestedBy: input.requestedBy || "NEXUS",
    scope: input.scope || "os",
    projectId: input.projectId ?? null,
    capabilityId: input.capabilityId || "credential.metadata.preview",
    reason: input.reason || "Preview secret reference metadata readiness",
    actionType: input.actionType || "read_reference_metadata",
    mode: input.mode || "local-private",
    approvalId: input.approvalId || null,
  };
}

export function evaluateSecretAccessRequest(request = {}, context = {}) {
  const policy = context.policy || getSecretAccessPolicy();
  if (!policy.allowedModes.includes(request.mode)) return "DENY";
  if (request.actionType === "resolve_value") return "BLOCK_VALUE_ACCESS";
  if (request.mode === "demo" || request.mode === "public") return "DENY";
  if (context.environment === "production-placeholder" && !request.approvalId) return "REQUIRE_APPROVAL";
  if (!policy.metadataActions.includes(request.actionType)) return "DENY";
  return "ALLOW_METADATA";
}
