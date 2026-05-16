import { createBudgetPolicy } from "./budgetModel.js";
import { createCostLedgerRecord } from "./costLedgerSchema.js";

const PREVIEW_PRICE_TABLE = {
  "none": { inputPer1k: 0, outputPer1k: 0, toolCall: 0, runtimeSecond: 0 },
  "preview": { inputPer1k: 0.001, outputPer1k: 0.002, toolCall: 0.001, runtimeSecond: 0.0001 },
  "openai-preview": { inputPer1k: 0.002, outputPer1k: 0.006, toolCall: 0.002, runtimeSecond: 0.0002 },
  "anthropic-preview": { inputPer1k: 0.003, outputPer1k: 0.015, toolCall: 0.002, runtimeSecond: 0.0002 },
  "local": { inputPer1k: 0, outputPer1k: 0, toolCall: 0, runtimeSecond: 0.00005 },
};

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCostEstimateRequest(input = {}) {
  return {
    estimateId: input.estimateId || createId("estimate"),
    phaseId: input.phaseId || "P57.3",
    sourceType: input.sourceType || "task",
    sourceId: input.sourceId || "",
    projectId: input.projectId || "",
    taskId: input.taskId || "",
    agentId: input.agentId || "",
    skillId: input.skillId || "",
    capabilityId: input.capabilityId || "",
    mode: input.mode || "local-private",
    estimatedInputTokens: Number(input.estimatedInputTokens || 0),
    estimatedOutputTokens: Number(input.estimatedOutputTokens || 0),
    estimatedToolCalls: Number(input.estimatedToolCalls || 0),
    estimatedRuntimeSeconds: Number(input.estimatedRuntimeSeconds || 0),
    providerProfile: input.providerProfile || "preview",
    budgetPolicyId: input.budgetPolicyId || "",
    requestedBy: input.requestedBy || "system",
    redacted: input.redacted !== false,
  };
}

export function validateCostEstimateRequest(request = {}) {
  const errors = [];
  if (!request.estimateId) errors.push("estimateId is required");
  if (!["task", "api_batch", "tool", "provider", "test_suite", "os_phase"].includes(request.sourceType)) errors.push(`invalid sourceType: ${request.sourceType}`);
  if (!["local-private", "test", "demo", "public-safe"].includes(request.mode)) errors.push(`invalid mode: ${request.mode}`);
  if (!PREVIEW_PRICE_TABLE[request.providerProfile]) errors.push(`invalid providerProfile: ${request.providerProfile}`);
  for (const key of ["estimatedInputTokens", "estimatedOutputTokens", "estimatedToolCalls", "estimatedRuntimeSeconds"]) {
    if (Number(request[key] || 0) < 0) errors.push(`${key} cannot be negative`);
  }
  if (request.redacted !== true) errors.push("estimate requests must be redacted");
  return { valid: errors.length === 0, errors };
}

function estimateCost(request, context = {}, sourceType = request.sourceType) {
  const normalized = createCostEstimateRequest({ ...request, sourceType });
  const validation = validateCostEstimateRequest(normalized);
  const price = PREVIEW_PRICE_TABLE[normalized.providerProfile] || PREVIEW_PRICE_TABLE.preview;
  const estimatedUsd = (
    (normalized.estimatedInputTokens / 1000) * price.inputPer1k
    + (normalized.estimatedOutputTokens / 1000) * price.outputPer1k
    + normalized.estimatedToolCalls * price.toolCall
    + normalized.estimatedRuntimeSeconds * price.runtimeSecond
  );
  const estimatedTokens = normalized.estimatedInputTokens + normalized.estimatedOutputTokens;
  const policy = context.budgetPolicy ? createBudgetPolicy(context.budgetPolicy) : null;
  const warnings = [
    "Estimate preview only; no provider dispatch occurred.",
    ...(policy?.allowEstimatesOnly ? ["Budget policy is estimates-only."] : []),
  ];
  const estimate = {
    ok: validation.valid,
    estimateId: normalized.estimateId,
    phaseId: normalized.phaseId,
    sourceType: normalized.sourceType,
    sourceId: normalized.sourceId,
    estimatedUsd: Number(estimatedUsd.toFixed(6)),
    estimatedTokens,
    estimateOnly: true,
    providerDispatchAllowed: false,
    confidence: context.confidence || "medium",
    assumptions: [
      "Static preview price table only.",
      "No real billing data or provider token accounting is used.",
    ],
    warnings,
    errors: validation.errors,
    costLedgerRecord: createCostLedgerRecord({
      eventType: "cost_estimate_created",
      sourceType: normalized.sourceType,
      sourceId: normalized.sourceId,
      projectId: normalized.projectId,
      taskId: normalized.taskId,
      agentId: normalized.agentId,
      phaseId: normalized.phaseId,
      estimatedUsd,
      estimatedTokens,
      budgetPolicyId: normalized.budgetPolicyId,
      decision: "RECORD_ONLY",
      metadata: { estimateId: normalized.estimateId, providerProfile: normalized.providerProfile },
    }),
  };
  return estimate;
}

export function estimateTaskCost(request, context = {}) {
  return estimateCost(request, context, "task");
}

export function estimateBatchCost(request, context = {}) {
  return estimateCost(request, context, "api_batch");
}

export function estimateToolCost(request, context = {}) {
  return estimateCost(request, context, "tool");
}

export function estimateProviderCost(request, context = {}) {
  return estimateCost(request, context, "provider");
}

export function summarizeCostEstimate(estimate = {}) {
  return {
    estimateId: estimate.estimateId,
    sourceType: estimate.sourceType,
    estimatedUsd: Number(estimate.estimatedUsd || 0),
    estimatedTokens: Number(estimate.estimatedTokens || 0),
    estimateOnly: estimate.estimateOnly === true,
    providerDispatchAllowed: estimate.providerDispatchAllowed === true,
    confidence: estimate.confidence || "unknown",
    warningCount: estimate.warnings?.length || 0,
    errorCount: estimate.errors?.length || 0,
  };
}
