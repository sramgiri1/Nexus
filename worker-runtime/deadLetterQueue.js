const REASON_CODES = new Set([
  "policy_block",
  "max_retries",
  "timeout",
  "invalid_contract",
  "cost_block",
  "manual_stop",
  "unknown",
]);

const RECOVERABLE_REASONS = new Set(["timeout", "manual_stop", "unknown"]);

export function classifyDeadLetterReason(reason = {}) {
  const reasonCode = REASON_CODES.has(reason.reasonCode) ? reason.reasonCode : "unknown";
  const recoverable = typeof reason.recoverable === "boolean" ? reason.recoverable : RECOVERABLE_REASONS.has(reasonCode);
  const recommendedAction = reason.recommendedAction || (
    recoverable
      ? "Inspect blocker and wait for a future governed requeue workflow."
      : "Resolve policy, cost, or contract issue before creating new work."
  );
  return {
    reasonCode,
    reasonSummary: reason.reasonSummary || `Dead-letter reason: ${reasonCode}`,
    recoverable,
    recommendedAction,
  };
}

export function createDeadLetterItem(input = {}) {
  const reason = classifyDeadLetterReason(input);
  const sourceQueueItemId = input.sourceQueueItemId || input.queueItemId || "";
  return {
    deadLetterId: input.deadLetterId || `dlq-${String(sourceQueueItemId || Date.now()).replace(/[^a-zA-Z0-9-]/g, "-")}`,
    sourceQueueItemId,
    taskId: input.taskId || "",
    projectId: input.projectId || "",
    agentId: input.agentId || input.ownerAgent || "",
    reasonCode: reason.reasonCode,
    reasonSummary: reason.reasonSummary,
    recoverable: reason.recoverable,
    recommendedAction: reason.recommendedAction,
    createdAt: input.createdAt || new Date().toISOString(),
    redacted: true,
    correlationId: input.correlationId || "",
    evidenceIds: Array.isArray(input.evidenceIds) ? input.evidenceIds : [],
    activityIds: Array.isArray(input.activityIds) ? input.activityIds : [],
    warnings: Array.isArray(input.warnings) ? input.warnings : [],
    errors: Array.isArray(input.errors) ? input.errors : [],
  };
}

export function validateDeadLetterItem(item = {}) {
  const errors = [];
  if (!item.deadLetterId) errors.push("deadLetterId is required");
  if (!item.sourceQueueItemId) errors.push("sourceQueueItemId is required");
  if (!REASON_CODES.has(item.reasonCode)) errors.push(`reasonCode must be one of: ${[...REASON_CODES].join(", ")}`);
  if (!item.reasonSummary) errors.push("reasonSummary is required");
  if (typeof item.recoverable !== "boolean") errors.push("recoverable must be boolean");
  if (!item.recommendedAction) errors.push("recommendedAction is required");
  if (!item.createdAt) errors.push("createdAt is required");
  if (item.redacted !== true) errors.push("redacted must be true");
  if (!Array.isArray(item.evidenceIds)) errors.push("evidenceIds must be an array");
  if (!Array.isArray(item.activityIds)) errors.push("activityIds must be an array");
  if (!Array.isArray(item.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(item.errors)) errors.push("errors must be an array");
  return { valid: errors.length === 0, errors };
}

export function moveToDeadLetterPreview(queueItem = {}, reason = {}) {
  return createDeadLetterItem({
    sourceQueueItemId: queueItem.queueItemId,
    taskId: queueItem.taskId,
    projectId: queueItem.projectId,
    agentId: queueItem.ownerAgent,
    correlationId: queueItem.correlationId || "",
    ...reason,
    warnings: [
      ...(reason.warnings || []),
      "Moved to dead-letter queue preview only. Automatic requeue is not enabled.",
    ],
  });
}

export function summarizeDeadLetterQueue(items = []) {
  const normalized = items.map(createDeadLetterItem);
  const recoverable = normalized.filter((item) => item.recoverable).length;
  return {
    totalItems: normalized.length,
    modeled: true,
    recoverable,
    nonRecoverable: normalized.length - recoverable,
    requeueEnabled: false,
    executionEnabled: false,
    warning: "Dead-letter queue is modeled only. Automatic requeue is not enabled.",
  };
}
