import { createBudgetPolicy } from "./budgetModel.js";
import { createCostLedgerRecord } from "./costLedgerSchema.js";

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBudgetCheckRequest(input = {}) {
  return {
    budgetCheckId: input.budgetCheckId || createId("budget_check"),
    phaseId: input.phaseId || "P57.5",
    projectId: input.projectId || "",
    taskId: input.taskId || "",
    agentId: input.agentId || "",
    skillId: input.skillId || "",
    sourceType: input.sourceType || "task",
    estimateId: input.estimateId || "",
    mode: input.mode || "local-private",
    requestedAction: input.requestedAction || "estimate",
    redacted: input.redacted !== false,
  };
}

export function validateBudgetCheckRequest(request = {}) {
  const errors = [];
  if (!request.budgetCheckId) errors.push("budgetCheckId is required");
  if (!["task", "tool", "provider", "api_batch", "worker", "test_suite"].includes(request.sourceType)) errors.push(`invalid sourceType: ${request.sourceType}`);
  if (!["local-private", "test", "demo", "public-safe"].includes(request.mode)) errors.push(`invalid mode: ${request.mode}`);
  if (!["estimate", "execute", "dispatch", "batch_submit", "tool_call", "worker_run"].includes(request.requestedAction)) errors.push(`invalid requestedAction: ${request.requestedAction}`);
  if (request.redacted !== true) errors.push("budget check requests must be redacted");
  return { valid: errors.length === 0, errors };
}

export function evaluateBudgetCheck(request = {}, budgetPolicy = {}, costEstimate = {}) {
  const normalizedRequest = createBudgetCheckRequest(request);
  const normalizedPolicy = createBudgetPolicy(budgetPolicy);
  const validation = validateBudgetCheckRequest(normalizedRequest);
  const estimatedUsd = Number(costEstimate.estimatedUsd || 0);
  let decision = "ALLOW";
  let reason = "Estimate preview is within budget.";
  let approvalRequired = false;
  let executionAllowed = false;

  if (normalizedRequest.requestedAction === "estimate") {
    decision = "RECORD_ONLY";
    reason = "Estimate-only request records cost preview without execution.";
  } else if (["dispatch", "batch_submit", "tool_call", "worker_run", "execute"].includes(normalizedRequest.requestedAction)) {
    if (normalizedRequest.sourceType === "provider" || normalizedRequest.requestedAction === "dispatch") {
      decision = "BLOCK";
      reason = "Provider dispatch is disabled by Cost Center policy.";
    } else if (normalizedRequest.requestedAction === "worker_run") {
      decision = "BLOCK";
      reason = "Worker runtime is not enabled.";
    } else if (estimatedUsd > normalizedPolicy.requiresApprovalAboveUsd && normalizedPolicy.requiresApprovalAboveUsd > 0) {
      decision = "REQUIRE_APPROVAL";
      reason = "Estimated cost exceeds approval threshold.";
      approvalRequired = true;
    } else if (estimatedUsd > normalizedPolicy.maxUsdPerRun && normalizedPolicy.maxUsdPerRun > 0 && normalizedPolicy.blockWhenExceeded) {
      decision = "BLOCK";
      reason = "Estimated cost exceeds per-run budget.";
    } else {
      decision = "ALLOW";
      reason = "Preview decision only; execution remains disabled in P57.";
    }
  }

  const output = {
    ok: validation.valid,
    budgetCheckId: normalizedRequest.budgetCheckId,
    decision,
    reason,
    budgetPolicyId: normalizedPolicy.budgetPolicyId,
    estimatedUsd,
    thresholdUsd: normalizedPolicy.requiresApprovalAboveUsd,
    providerDispatchAllowed: false,
    executionAllowed,
    approvalRequired,
    warnings: ["Budget enforcement is preview-only in P57."],
    errors: validation.errors,
  };
  output.ledgerRecord = createBudgetDecisionLedgerRecord(output);
  return output;
}

export function summarizeBudgetDecision(decision = {}) {
  return {
    budgetCheckId: decision.budgetCheckId || "",
    decision: decision.decision || "RECORD_ONLY",
    reason: decision.reason || "",
    estimatedUsd: Number(decision.estimatedUsd || 0),
    thresholdUsd: Number(decision.thresholdUsd || 0),
    providerDispatchAllowed: decision.providerDispatchAllowed === true,
    executionAllowed: decision.executionAllowed === true,
    approvalRequired: decision.approvalRequired === true,
  };
}

export function createBudgetDecisionLedgerRecord(decision = {}) {
  const eventType = decision.decision === "BLOCK"
    ? "budget_check_blocked"
    : decision.decision === "REQUIRE_APPROVAL"
      ? "approval_threshold_reached"
      : "budget_check_passed";
  return createCostLedgerRecord({
    eventType,
    sourceType: "task",
    phaseId: "P57.5",
    estimatedUsd: decision.estimatedUsd || 0,
    budgetPolicyId: decision.budgetPolicyId || "",
    decision: decision.decision || "RECORD_ONLY",
    status: decision.decision === "BLOCK" ? "blocked" : "preview",
    metadata: { budgetCheckId: decision.budgetCheckId || "", reason: decision.reason || "" },
  });
}
