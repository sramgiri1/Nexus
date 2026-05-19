import { createBlockedResult, createPassResult } from "../shared/resultEnvelope.js";
import { calculateNextRetry } from "../worker-runtime/retryTimeoutModel.js";
import {
  classifySelfHealingFailure,
  validateSelfHealingFailureClassification,
} from "./failureClassification.js";

const RECOVERY_ACTIONS = {
  transient_failure: [
    "Confirm failure evidence is linked.",
    "Prepare bounded retry preview with approval and loop guards.",
    "Require validation evidence before any follow-up action.",
  ],
  provider_failure: [
    "Confirm provider status and idempotency evidence.",
    "Estimate cost and block duplicate side effects.",
    "Require approval before any provider retry path.",
  ],
  verification_failure: [
    "Route remediation to the owning capability.",
    "Require remediation evidence before rerun preview.",
    "Keep failed verification visible until a fresh check passes.",
  ],
  policy_block: [
    "Keep recovery blocked pending policy review.",
    "Link approval or exception evidence if requested.",
    "Do not retry the blocked action automatically.",
  ],
  secret_or_security_failure: [
    "Escalate to security review.",
    "Require secret rotation or redaction evidence.",
    "Keep provider, tool, and deploy paths blocked.",
  ],
  data_protection_failure: [
    "Require redaction or data policy correction.",
    "Preserve affected evidence refs.",
    "Block provider and batch usage for unsafe payloads.",
  ],
  contract_failure: [
    "Correct the task or tool contract.",
    "Validate the corrected contract.",
    "Create a new reviewed recovery task if needed.",
  ],
  state_transition_failure: [
    "Preserve invalid transition evidence.",
    "Correct state-machine evidence before retry preview.",
    "Route state correction through governance review.",
  ],
};

export function createRecoveryPlanPreview(input = {}) {
  const classification = input.failureClass ? classifySelfHealingFailure(input) : input.classification || {};
  const validation = validateSelfHealingFailureClassification(classification);
  const retryPreview = calculateNextRetry(input.attempt || 0, {
    maxAttempts: input.maxAttempts ?? 2,
    approvalRequiredAfterAttempts: 1,
  });
  const blockedReasons = [
    ...new Set([
      ...(Array.isArray(classification.blockers) ? classification.blockers : []),
      "P66.3 creates recovery previews only. No recovery action is runnable.",
      retryPreview.requiresApproval ? "Recovery preview requires approval before any later execution phase." : "",
    ].filter(Boolean)),
  ];

  return {
    planId: input.planId || `${classification.failureId || "failure-preview"}-recovery-preview`,
    failureId: classification.failureId || "",
    failureClass: classification.failureClass || "",
    failureLabel: classification.failureLabel || "",
    currentState: "recovery_previewed",
    ownerCapability: classification.ownerCapability || "reliability",
    proposedRecovery: RECOVERY_ACTIONS[classification.failureClass] || RECOVERY_ACTIONS.contract_failure,
    retryPreview: {
      retryEligible: Boolean(classification.retryEligible),
      retryAllowedInPreview: Boolean(classification.retryEligible && retryPreview.retryAllowed),
      delaySeconds: retryPreview.delaySeconds || 0,
      requiresApproval: true,
      executionEnabled: false,
      reason: retryPreview.reason,
    },
    approvalRequired: true,
    mutationAllowed: false,
    executionAllowed: false,
    automaticRetryAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P66.3 recovery plans are preview-only; execution is disabled.",
    blockers: validation.valid ? blockedReasons : [...blockedReasons, ...validation.errors],
    evidenceRefs: Array.isArray(classification.evidenceRefs) ? classification.evidenceRefs : [],
    activityRefs: Array.isArray(classification.activityRefs) ? classification.activityRefs : [],
    costImpact: classification.costImpact || "none",
    nextAction: input.nextAction || "Run healing gate and loop guard preview in P66.4.",
    commandCenterVisible: true,
  };
}

export function validateRecoveryPlanPreview(plan = {}) {
  const errors = [];
  if (!plan.planId) errors.push("planId is required");
  if (!plan.failureId) errors.push("failureId is required");
  if (!plan.failureClass) errors.push("failureClass is required");
  if (!Array.isArray(plan.proposedRecovery) || plan.proposedRecovery.length === 0) {
    errors.push("proposedRecovery must be a non-empty array");
  }
  if (plan.retryPreview?.executionEnabled !== false) errors.push("retryPreview.executionEnabled must be false");
  if (plan.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (plan.mutationAllowed !== false) errors.push("mutationAllowed must be false");
  if (plan.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (plan.automaticRetryAllowed !== false) errors.push("automaticRetryAllowed must be false");
  if (plan.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!plan.disabledReason) errors.push("disabledReason is required");
  if (!Array.isArray(plan.blockers) || plan.blockers.length === 0) errors.push("blockers must be a non-empty array");
  if (!Array.isArray(plan.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(plan.activityRefs)) errors.push("activityRefs must be an array");
  if (!plan.nextAction) errors.push("nextAction is required");
  if (plan.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  return { valid: errors.length === 0, errors };
}

export function buildRecoveryPlanEnvelope(input = {}) {
  const plan = createRecoveryPlanPreview(input);
  const validation = validateRecoveryPlanPreview(plan);
  if (!validation.valid) {
    return createBlockedResult({
      phase: "P66.3",
      mode: "self-healing-preview",
      source: "self-healing/recoveryPlanPreview.js",
      summary: "Recovery plan preview is invalid.",
      data: { plan },
      errors: validation.errors,
    });
  }
  return createPassResult({
    phase: "P66.3",
    mode: "self-healing-preview",
    source: "self-healing/recoveryPlanPreview.js",
    summary: "Recovery plan preview is valid and non-executing.",
    data: { plan },
    evidence: plan.evidenceRefs,
  });
}
