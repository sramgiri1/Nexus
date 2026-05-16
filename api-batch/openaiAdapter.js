const OPENAI_PREVIEW_ENDPOINTS = ["responses", "chat_completions", "embeddings", "batch"];
const MODEL_POLICIES = ["unset", "low_cost", "balanced", "high_quality"];

export function createOpenAIRequestPreview(options = {}) {
  return {
    requestPreviewId: options.requestPreviewId || `openai_preview_${Date.now()}`,
    providerId: "openai-preview",
    mode: "preview_only",
    endpoint: options.endpoint || "responses",
    modelPolicy: options.modelPolicy || "unset",
    externalCallAllowed: false,
    executionAllowed: false,
    apiKeyRequiredNow: false,
    apiKeyReadAllowed: false,
    inputSummary: options.inputSummary || "Redacted OpenAI request summary only.",
    rawInputStored: false,
    costEstimateRequired: true,
    evidenceRequired: true,
    humanApprovalRequiredForExecution: true,
    status: "preview_only",
  };
}

export function validateOpenAIRequestPreview(preview = createOpenAIRequestPreview()) {
  const errors = [];
  if (preview.providerId !== "openai-preview") errors.push("OpenAI preview providerId must be openai-preview");
  if (preview.mode !== "preview_only") errors.push("OpenAI preview mode must be preview_only");
  if (!OPENAI_PREVIEW_ENDPOINTS.includes(preview.endpoint)) {
    errors.push(`Unsupported OpenAI preview endpoint: ${preview.endpoint}`);
  }
  if (!MODEL_POLICIES.includes(preview.modelPolicy)) {
    errors.push(`Unsupported model policy: ${preview.modelPolicy}`);
  }
  if (preview.externalCallAllowed !== false) errors.push("OpenAI preview must not allow external calls");
  if (preview.executionAllowed !== false) errors.push("OpenAI preview must not allow execution");
  if (preview.apiKeyReadAllowed !== false) errors.push("OpenAI preview must not read API keys");
  if (preview.rawInputStored !== false) errors.push("OpenAI preview must not store raw input");
  if (preview.costEstimateRequired !== true) errors.push("OpenAI preview must require cost estimate");
  if (preview.evidenceRequired !== true) errors.push("OpenAI preview must require evidence");
  return { valid: errors.length === 0, errors };
}

export function summarizeOpenAIRequestPreview(preview = createOpenAIRequestPreview()) {
  return {
    requestPreviewId: preview.requestPreviewId,
    providerId: preview.providerId,
    endpoint: preview.endpoint,
    modelPolicy: preview.modelPolicy,
    mode: preview.mode,
    externalCallAllowed: preview.externalCallAllowed,
    rawInputStored: preview.rawInputStored,
    status: preview.status,
  };
}

export function blockOpenAIExecution(reason = "P54 is preview-only") {
  return {
    providerId: "openai-preview",
    executionAllowed: false,
    externalCallAllowed: false,
    blocked: true,
    reason,
    nextRequirement: "Provider dispatch governance is planned for a later phase.",
  };
}
