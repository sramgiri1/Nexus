import { summarizeRedaction } from "../shared/redaction.js";
import { createBlockedResult, createPassResult } from "../shared/resultEnvelope.js";

export const SELF_HEALING_FAILURE_CLASSES = {
  transient_failure: {
    severity: "medium",
    retryEligible: true,
    ownerCapability: "runtime reliability",
    nextAction: "Prepare bounded recovery preview with cost and loop guards.",
  },
  provider_failure: {
    severity: "high",
    retryEligible: true,
    ownerCapability: "provider governance",
    nextAction: "Verify provider status, budget, and idempotency before recovery preview.",
  },
  verification_failure: {
    severity: "high",
    retryEligible: false,
    ownerCapability: "verification",
    nextAction: "Route remediation to owner; rerun only after remediation evidence exists.",
  },
  policy_block: {
    severity: "critical",
    retryEligible: false,
    ownerCapability: "policy governance",
    nextAction: "Wait for policy change or scoped approval.",
  },
  secret_or_security_failure: {
    severity: "critical",
    retryEligible: false,
    ownerCapability: "security",
    nextAction: "Escalate for human security review; do not retry automatically.",
  },
  data_protection_failure: {
    severity: "critical",
    retryEligible: false,
    ownerCapability: "data protection",
    nextAction: "Repair redaction or data policy before any recovery preview.",
  },
  contract_failure: {
    severity: "high",
    retryEligible: false,
    ownerCapability: "contract governance",
    nextAction: "Correct the contract before any recovery preview.",
  },
  state_transition_failure: {
    severity: "high",
    retryEligible: false,
    ownerCapability: "state machine",
    nextAction: "Correct state transition evidence before any recovery preview.",
  },
};

const DEFAULT_CLASS = "contract_failure";

function normalizeFailureClass(inputClass = "") {
  return SELF_HEALING_FAILURE_CLASSES[inputClass] ? inputClass : DEFAULT_CLASS;
}

function displayLabel(value = "") {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function classifySelfHealingFailure(input = {}) {
  const failureClass = normalizeFailureClass(input.failureClass);
  const policy = SELF_HEALING_FAILURE_CLASSES[failureClass];
  const redaction = summarizeRedaction({
    failureId: input.failureId || "",
    sourceSurface: input.sourceSurface || "",
    summary: input.summary || "",
  });
  const blockedReasons = [
    "Self-healing execution is disabled in P66.2.",
    "Automatic retry is disabled until healing gates and loop guards pass in later subphases.",
  ];
  if (!policy.retryEligible) blockedReasons.push(`${displayLabel(failureClass)} is not eligible for automatic retry.`);
  if (redaction.changed) blockedReasons.push("Sensitive input was redacted before display.");

  return {
    failureId: input.failureId || "failure-preview",
    failureClass,
    failureLabel: displayLabel(failureClass),
    severity: input.severity || policy.severity,
    sourceSurface: input.sourceSurface || "runtime",
    ownerCapability: input.ownerCapability || policy.ownerCapability,
    currentState: input.currentState || "classified",
    summary: redaction.redacted.summary || "Failure is classified for recovery planning.",
    retryEligible: policy.retryEligible,
    approvalRequired: true,
    mutationAllowed: false,
    executionAllowed: false,
    automaticRetryAllowed: false,
    providerSpendAllowed: false,
    disabledReason: "P66.2 classifies failures only; recovery execution is disabled.",
    blockers: blockedReasons,
    evidenceRefs: Array.isArray(input.evidenceRefs) ? input.evidenceRefs : [],
    activityRefs: Array.isArray(input.activityRefs) ? input.activityRefs : [],
    costImpact: input.costImpact || "none",
    nextAction: input.nextAction || policy.nextAction,
    redaction: {
      displaySafe: true,
      changed: redaction.changed,
      redactionCount: redaction.redactionCount,
    },
  };
}

export function validateSelfHealingFailureClassification(record = {}) {
  const errors = [];
  if (!record.failureId) errors.push("failureId is required");
  if (!SELF_HEALING_FAILURE_CLASSES[record.failureClass]) errors.push("failureClass is unsupported");
  if (!record.failureLabel) errors.push("failureLabel is required");
  if (!record.severity) errors.push("severity is required");
  if (!record.sourceSurface) errors.push("sourceSurface is required");
  if (!record.ownerCapability) errors.push("ownerCapability is required");
  if (!record.currentState) errors.push("currentState is required");
  if (record.mutationAllowed !== false) errors.push("mutationAllowed must be false");
  if (record.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (record.automaticRetryAllowed !== false) errors.push("automaticRetryAllowed must be false");
  if (record.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (!record.disabledReason) errors.push("disabledReason is required");
  if (!Array.isArray(record.blockers) || record.blockers.length === 0) errors.push("blockers must be a non-empty array");
  if (!Array.isArray(record.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(record.activityRefs)) errors.push("activityRefs must be an array");
  if (!record.nextAction) errors.push("nextAction is required");
  if (record.redaction?.displaySafe !== true) errors.push("redaction.displaySafe must be true");
  return { valid: errors.length === 0, errors };
}

export function buildFailureClassificationEnvelope(input = {}) {
  const classification = classifySelfHealingFailure(input);
  const validation = validateSelfHealingFailureClassification(classification);
  if (!validation.valid) {
    return createBlockedResult({
      phase: "P66.2",
      mode: "self-healing-preview",
      source: "self-healing/failureClassification.js",
      summary: "Failure classification is invalid.",
      data: { classification },
      errors: validation.errors,
    });
  }
  return createPassResult({
    phase: "P66.2",
    mode: "self-healing-preview",
    source: "self-healing/failureClassification.js",
    summary: "Failure classification is display-safe and non-executing.",
    data: { classification },
    evidence: classification.evidenceRefs,
  });
}
