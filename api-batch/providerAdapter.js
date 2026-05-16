const PROVIDER_ADAPTER_STATUSES = ["preview_only", "planned", "disabled"];
const SUPPORTED_MODES = ["request_preview", "batch_preview"];

export function createProviderAdapter(overrides = {}) {
  return {
    providerId: "openai-preview",
    label: "OpenAI API Preview",
    status: "preview_only",
    externalCallsEnabled: false,
    supportedModes: ["request_preview", "batch_preview"],
    supportedWorkloads: [
      "classification",
      "summarization",
      "test_gap_analysis",
      "docs_generation",
      "review_assistance",
    ],
    forbiddenWorkloads: [
      "unreviewed_source_mutation",
      "deployment",
      "secret_handling",
      "production_data_access",
    ],
    requiresCostEstimate: true,
    requiresEvidence: true,
    requiresHumanApprovalForExecution: true,
    ...overrides,
  };
}

export function validateProviderAdapter(adapter = createProviderAdapter()) {
  const errors = [];
  if (!adapter.providerId) errors.push("Provider adapter requires providerId");
  if (!adapter.label) errors.push("Provider adapter requires label");
  if (!PROVIDER_ADAPTER_STATUSES.includes(adapter.status)) {
    errors.push(`Provider adapter status is invalid: ${adapter.status}`);
  }
  if (adapter.externalCallsEnabled !== false) {
    errors.push("Provider adapter external calls must be disabled in P54");
  }
  if (!Array.isArray(adapter.supportedModes) || adapter.supportedModes.length === 0) {
    errors.push("Provider adapter requires supported modes");
  }
  for (const mode of adapter.supportedModes || []) {
    if (!SUPPORTED_MODES.includes(mode)) errors.push(`Unsupported adapter mode: ${mode}`);
  }
  if (!Array.isArray(adapter.supportedWorkloads) || adapter.supportedWorkloads.length === 0) {
    errors.push("Provider adapter requires supported workloads");
  }
  if (!Array.isArray(adapter.forbiddenWorkloads) || adapter.forbiddenWorkloads.length === 0) {
    errors.push("Provider adapter requires forbidden workloads");
  }
  if (adapter.requiresCostEstimate !== true) errors.push("Provider adapter must require cost estimate");
  if (adapter.requiresEvidence !== true) errors.push("Provider adapter must require evidence");
  if (adapter.requiresHumanApprovalForExecution !== true) {
    errors.push("Provider adapter must require human approval before future execution");
  }
  return { valid: errors.length === 0, errors };
}

export function createProviderRequestPreview(options = {}) {
  const adapterOverrides = options.providerId ? { providerId: options.providerId } : {};
  const adapter = options.adapter || createProviderAdapter(adapterOverrides);
  return {
    requestPreviewId: options.requestPreviewId || `provider_preview_${Date.now()}`,
    providerId: adapter.providerId,
    mode: options.mode || "request_preview",
    workloadType: options.workloadType || "summarization",
    externalCallAllowed: false,
    executionAllowed: false,
    rawInputStored: false,
    inputSummary: options.inputSummary || "Redacted request summary only.",
    costEstimateRequired: true,
    evidenceRequired: true,
    humanApprovalRequiredForExecution: true,
    status: "preview_only",
  };
}

export function validateProviderRequestPreview(preview = createProviderRequestPreview()) {
  const errors = [];
  if (!preview.requestPreviewId) errors.push("Provider request preview requires requestPreviewId");
  if (!preview.providerId) errors.push("Provider request preview requires providerId");
  if (!SUPPORTED_MODES.includes(preview.mode)) errors.push(`Unsupported preview mode: ${preview.mode}`);
  if (!preview.workloadType) errors.push("Provider request preview requires workloadType");
  if (preview.externalCallAllowed !== false) errors.push("Provider request preview must not allow external calls");
  if (preview.executionAllowed !== false) errors.push("Provider request preview must not allow execution");
  if (preview.rawInputStored !== false) errors.push("Provider request preview must not store raw input");
  if (preview.costEstimateRequired !== true) errors.push("Provider request preview must require cost estimate");
  if (preview.evidenceRequired !== true) errors.push("Provider request preview must require evidence");
  return { valid: errors.length === 0, errors };
}
