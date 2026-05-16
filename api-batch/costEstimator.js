import { getModelPolicy } from "./modelPolicy.js";

export function estimateRequestTokens(inputSummary = "", options = {}) {
  const inputWords = String(inputSummary).trim().split(/\s+/).filter(Boolean).length;
  const estimatedInputTokens = Math.max(1, Math.ceil(inputWords * 1.35));
  const estimatedOutputTokens = options.estimatedOutputTokens || Math.max(64, Math.ceil(estimatedInputTokens * 0.5));
  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    tokenEstimateMethod: "summary_word_count_placeholder",
  };
}

export function estimateRequestCost(request = {}, options = {}) {
  const policy = getModelPolicy(options.modelPolicy || request.modelPolicy || "unset");
  const tokens = estimateRequestTokens(request.inputSummary || "", options);
  const estimatedInputUsd = policy.pricingKnown ? (tokens.estimatedInputTokens / 1000) * policy.inputUsdPer1k : null;
  const estimatedOutputUsd = policy.pricingKnown ? (tokens.estimatedOutputTokens / 1000) * policy.outputUsdPer1k : null;
  const estimatedUsd =
    estimatedInputUsd === null || estimatedOutputUsd === null ? null : Number((estimatedInputUsd + estimatedOutputUsd).toFixed(6));
  return {
    providerId: request.providerId || "openai-preview",
    modelPolicy: policy.modelPolicy,
    pricingKnown: policy.pricingKnown,
    ...tokens,
    estimatedUsd,
    unknownCostWarning: policy.pricingKnown ? "" : "Pricing is unknown for this preview model policy.",
    executionAllowed: false,
    approvalRequired: estimatedUsd === null || estimatedUsd >= (options.approvalThresholdUsd || 1),
  };
}

export function estimateBatchCost(batchJob = {}, options = {}) {
  const requestEstimates = (batchJob.requests || []).map((request) =>
    estimateRequestCost({ ...request, providerId: batchJob.providerId }, options),
  );
  const knownEstimates = requestEstimates.filter((estimate) => estimate.estimatedUsd !== null);
  const estimatedUsd =
    knownEstimates.length === requestEstimates.length
      ? Number(knownEstimates.reduce((total, estimate) => total + estimate.estimatedUsd, 0).toFixed(6))
      : null;
  return {
    batchJobId: batchJob.batchJobId,
    providerId: batchJob.providerId || "openai-preview",
    requestCount: requestEstimates.length,
    modelPolicy: options.modelPolicy || "unset",
    estimatedInputTokens: requestEstimates.reduce((total, estimate) => total + estimate.estimatedInputTokens, 0),
    estimatedOutputTokens: requestEstimates.reduce((total, estimate) => total + estimate.estimatedOutputTokens, 0),
    estimatedUsd,
    unknownCostWarning: estimatedUsd === null ? "One or more request prices are unknown." : "",
    executionAllowed: false,
    approvalRequired: estimatedUsd === null || estimatedUsd >= (options.approvalThresholdUsd || 1),
  };
}

export function validateCostEstimate(estimate = {}) {
  const errors = [];
  if (typeof estimate.estimatedInputTokens !== "number") errors.push("Cost estimate requires estimated input tokens");
  if (typeof estimate.estimatedOutputTokens !== "number") errors.push("Cost estimate requires estimated output tokens");
  if (estimate.executionAllowed !== false) errors.push("Cost estimate must keep execution disabled");
  if (estimate.estimatedUsd === null && !estimate.unknownCostWarning) {
    errors.push("Unknown pricing must include warning");
  }
  if (typeof estimate.approvalRequired !== "boolean") errors.push("Cost estimate requires approvalRequired boolean");
  return { valid: errors.length === 0, errors };
}

export function buildCostApprovalSummary(estimate = {}) {
  return {
    providerId: estimate.providerId || "openai-preview",
    modelPolicy: estimate.modelPolicy || "unset",
    estimatedUsd: estimate.estimatedUsd,
    approvalRequired: estimate.approvalRequired !== false,
    executionAllowed: false,
    decision: "preview_only_blocked",
    reason: estimate.unknownCostWarning || "P54 requires approval before any future provider execution.",
  };
}
