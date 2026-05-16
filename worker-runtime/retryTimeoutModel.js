const BACKOFF_STRATEGIES = new Set(["none", "linear", "exponential"]);

export function createRetryPolicy(input = {}) {
  return {
    retryPolicyId: input.retryPolicyId || "worker-runtime-preview-retry-policy",
    maxAttempts: Number.isFinite(input.maxAttempts) ? input.maxAttempts : 3,
    backoffStrategy: input.backoffStrategy || "exponential",
    baseDelaySeconds: Number.isFinite(input.baseDelaySeconds) ? input.baseDelaySeconds : 30,
    maxDelaySeconds: Number.isFinite(input.maxDelaySeconds) ? input.maxDelaySeconds : 300,
    timeoutSeconds: Number.isFinite(input.timeoutSeconds) ? input.timeoutSeconds : 900,
    retryableStatuses: Array.isArray(input.retryableStatuses) ? input.retryableStatuses : ["failed", "timeout"],
    nonRetryableStatuses: Array.isArray(input.nonRetryableStatuses) ? input.nonRetryableStatuses : ["policy_block", "cost_block"],
    costGuardRequired: input.costGuardRequired !== false,
    approvalRequiredAfterAttempts: Number.isFinite(input.approvalRequiredAfterAttempts)
      ? input.approvalRequiredAfterAttempts
      : 2,
    executionEnabled: false,
  };
}

export function validateRetryPolicy(policy = {}) {
  const errors = [];
  if (!policy.retryPolicyId) errors.push("retryPolicyId is required");
  if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 0) errors.push("maxAttempts must be a non-negative integer");
  if (!BACKOFF_STRATEGIES.has(policy.backoffStrategy)) {
    errors.push(`backoffStrategy must be one of: ${[...BACKOFF_STRATEGIES].join(", ")}`);
  }
  if (!Number.isFinite(policy.baseDelaySeconds) || policy.baseDelaySeconds < 0) errors.push("baseDelaySeconds must be non-negative");
  if (!Number.isFinite(policy.maxDelaySeconds) || policy.maxDelaySeconds < 0) errors.push("maxDelaySeconds must be non-negative");
  if (!Number.isFinite(policy.timeoutSeconds) || policy.timeoutSeconds <= 0) errors.push("timeoutSeconds must be positive");
  if (!Array.isArray(policy.retryableStatuses)) errors.push("retryableStatuses must be an array");
  if (!Array.isArray(policy.nonRetryableStatuses)) errors.push("nonRetryableStatuses must be an array");
  if (policy.costGuardRequired !== true) errors.push("costGuardRequired must be true");
  if (policy.executionEnabled !== false) errors.push("executionEnabled must be false");
  return { valid: errors.length === 0, errors };
}

export function calculateNextRetry(attempt = 0, policyInput = {}) {
  const policy = createRetryPolicy(policyInput);
  if (attempt >= policy.maxAttempts) {
    return {
      retryAllowed: false,
      delaySeconds: 0,
      requiresApproval: true,
      executionEnabled: false,
      reason: "Maximum retry attempts reached.",
    };
  }
  let delaySeconds = policy.baseDelaySeconds;
  if (policy.backoffStrategy === "linear") delaySeconds = policy.baseDelaySeconds * Math.max(1, attempt + 1);
  if (policy.backoffStrategy === "exponential") delaySeconds = policy.baseDelaySeconds * (2 ** Math.max(0, attempt));
  delaySeconds = Math.min(delaySeconds, policy.maxDelaySeconds);
  return {
    retryAllowed: true,
    delaySeconds,
    requiresApproval: attempt + 1 >= policy.approvalRequiredAfterAttempts,
    costGuardRequired: policy.costGuardRequired,
    executionEnabled: false,
    reason: "Retry is calculated as preview only. No automatic retry loop is enabled.",
  };
}

export function classifyTimeout(queueItem = {}, lease = {}, policyInput = {}) {
  const policy = createRetryPolicy(policyInput);
  const expiresAt = lease.expiresAt ? Date.parse(lease.expiresAt) : NaN;
  const updatedAt = queueItem.updatedAt ? Date.parse(queueItem.updatedAt) : NaN;
  const now = Date.now();
  const timedOutByLease = Number.isFinite(expiresAt) && expiresAt <= now;
  const timedOutByQueueAge = Number.isFinite(updatedAt) && now - updatedAt > policy.timeoutSeconds * 1000;
  return {
    queueItemId: queueItem.queueItemId || "",
    timedOut: timedOutByLease || timedOutByQueueAge,
    reason: timedOutByLease ? "lease_expired" : timedOutByQueueAge ? "queue_item_timeout" : "within_timeout",
    retryPreview: calculateNextRetry(queueItem.attempt || 0, policy),
    executionEnabled: false,
  };
}

export function summarizeRetryTimeoutState(items = []) {
  return {
    totalItems: items.length,
    modeled: true,
    automaticRetryExecutionEnabled: false,
    timeoutClassificationOnly: true,
    executionEnabled: false,
    warning: "Retry and timeout behavior is modeled only. No automatic retry loop is enabled.",
  };
}
