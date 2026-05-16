import { CANCELLATION_STATUSES, requirePreviewOnly, stablePreviewId, toIsoString, validateEnum } from "./concurrencySchema.js";
import { getCancellationPolicy } from "./cancellationPolicy.js";

export function createCancellationRequest(input = {}) {
  return {
    cancellationId: input.cancellationId || stablePreviewId("cancel_preview", [input.taskId, input.requestedBy, input.reason]),
    taskId: input.taskId || "",
    requestedBy: input.requestedBy || "local-operator",
    status: input.status || "requested_preview",
    reason: input.reason || "Operator requested safe-stop preview.",
    requestedAt: toIsoString(input.requestedAt),
    safeToCancel: input.safeToCancel !== false,
    previewOnly: true,
  };
}

export function validateCancellationRequest(request = {}) {
  const errors = [];
  if (!request.cancellationId) errors.push("cancellationId is required");
  if (!request.taskId) errors.push("taskId is required");
  if (!request.requestedBy) errors.push("requestedBy is required");
  validateEnum(request.status, CANCELLATION_STATUSES, "status", errors);
  requirePreviewOnly(request, errors, "cancellation request");
  return { valid: errors.length === 0, errors };
}

export function assessCancellationSafety(task = {}, context = {}) {
  const policy = context.policy || getCancellationPolicy();
  const state = String(task.state || task.status || "planned").toLowerCase();
  const blockedReason = policy.blockedStates.find((blockedState) => state.includes(blockedState));
  if (blockedReason) {
    return {
      safeToCancel: false,
      status: "blocked_preview",
      reason: `Task is in ${blockedReason} state; safe-stop needs a future governed cleanup path.`,
      cleanupRequired: ["operator review", "future recovery workflow"],
      previewOnly: true,
    };
  }
  return {
    safeToCancel: true,
    status: "accepted_preview",
    reason: "Task appears safe to cancel in preview because no execution side effects are active.",
    cleanupRequired: ["release preview lease", "write future cancellation evidence"],
    previewOnly: true,
  };
}

export function buildCancellationPlan(request, task = {}) {
  const safety = assessCancellationSafety(task);
  const plan = {
    ...request,
    status: safety.status,
    safeToCancel: safety.safeToCancel,
    safetyReason: safety.reason,
    cleanupRequired: safety.cleanupRequired,
    actualCancellationEnabled: false,
    workerTerminationEnabled: false,
    previewOnly: true,
  };
  return plan;
}

export function buildCancellationSummary(result = {}) {
  const plans = Array.isArray(result) ? result : [result].filter(Boolean);
  return {
    totalRequests: plans.length,
    acceptedPreview: plans.filter((plan) => plan.status === "accepted_preview").length,
    blockedPreview: plans.filter((plan) => plan.status === "blocked_preview").length,
    actualCancellationEnabled: false,
    previewOnly: true,
  };
}
