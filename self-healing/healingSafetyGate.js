import { createBlockedResult, createPassResult } from "../shared/resultEnvelope.js";
import {
  createRecoveryPlanPreview,
  validateRecoveryPlanPreview,
} from "./recoveryPlanPreview.js";

const HARD_BLOCK_CLASSES = new Set([
  "policy_block",
  "secret_or_security_failure",
  "data_protection_failure",
  "contract_failure",
  "state_transition_failure",
  "verification_failure",
]);

export function evaluateHealingSafetyGate(input = {}) {
  const plan = input.planId ? createRecoveryPlanPreview(input) : input.plan || {};
  const planValidation = validateRecoveryPlanPreview(plan);
  const loopLimit = Number.isInteger(input.loopLimit) ? input.loopLimit : 2;
  const priorAttempts = Number.isInteger(input.priorAttempts) ? input.priorAttempts : 0;
  const approvalEvidencePresent = input.approvalEvidencePresent === true;
  const costApproved = input.costApproved === true || plan.costImpact === "none";
  const hardBlocked = HARD_BLOCK_CLASSES.has(plan.failureClass);
  const loopBlocked = priorAttempts >= loopLimit;
  const blockedReasons = [
    ...new Set([
      ...(Array.isArray(plan.blockers) ? plan.blockers : []),
      ...planValidation.errors,
      hardBlocked ? `${plan.failureLabel || plan.failureClass} requires human remediation review.` : "",
      loopBlocked ? "Loop guard blocked recovery preview after reaching the attempt limit." : "",
      approvalEvidencePresent ? "" : "Approval evidence is required before any later execution phase.",
      costApproved ? "" : "Cost approval is required before any later execution phase.",
      "P66.4 evaluates healing safety only. Execution remains disabled.",
    ].filter(Boolean)),
  ];
  const reviewAllowed = planValidation.valid && !hardBlocked && !loopBlocked && approvalEvidencePresent && costApproved;

  return {
    gateId: input.gateId || `${plan.planId || "recovery"}-healing-gate`,
    planId: plan.planId || "",
    failureId: plan.failureId || "",
    failureClass: plan.failureClass || "",
    decision: reviewAllowed ? "review_allowed" : "blocked",
    reviewAllowed,
    approvalRequired: true,
    approvalEvidencePresent,
    costApproved,
    loopGuard: {
      loopLimit,
      priorAttempts,
      blocked: loopBlocked,
      executionEnabled: false,
    },
    mutationAllowed: false,
    executionAllowed: false,
    automaticRetryAllowed: false,
    providerSpendAllowed: false,
    dbWriteAllowed: false,
    deployAllowed: false,
    disabledReason: "P66.4 healing gates are preview-only; recovery execution is disabled.",
    blockers: blockedReasons,
    evidenceRefs: Array.isArray(plan.evidenceRefs) ? plan.evidenceRefs : [],
    activityRefs: Array.isArray(plan.activityRefs) ? plan.activityRefs : [],
    costImpact: plan.costImpact || "none",
    ownerCapability: plan.ownerCapability || "reliability",
    nextAction: reviewAllowed
      ? "Show review-ready recovery proposal in Command Center UX without runnable actions."
      : "Resolve blockers before recovery can advance to review.",
    commandCenterVisible: true,
  };
}

export function validateHealingSafetyGate(gate = {}) {
  const errors = [];
  if (!gate.gateId) errors.push("gateId is required");
  if (!gate.planId) errors.push("planId is required");
  if (!gate.failureId) errors.push("failureId is required");
  if (!["blocked", "review_allowed"].includes(gate.decision)) errors.push("decision must be blocked or review_allowed");
  if (gate.approvalRequired !== true) errors.push("approvalRequired must be true");
  if (gate.loopGuard?.executionEnabled !== false) errors.push("loopGuard.executionEnabled must be false");
  if (gate.mutationAllowed !== false) errors.push("mutationAllowed must be false");
  if (gate.executionAllowed !== false) errors.push("executionAllowed must be false");
  if (gate.automaticRetryAllowed !== false) errors.push("automaticRetryAllowed must be false");
  if (gate.providerSpendAllowed !== false) errors.push("providerSpendAllowed must be false");
  if (gate.dbWriteAllowed !== false) errors.push("dbWriteAllowed must be false");
  if (gate.deployAllowed !== false) errors.push("deployAllowed must be false");
  if (!gate.disabledReason) errors.push("disabledReason is required");
  if (!Array.isArray(gate.blockers) || gate.blockers.length === 0) errors.push("blockers must be a non-empty array");
  if (!Array.isArray(gate.evidenceRefs)) errors.push("evidenceRefs must be an array");
  if (!Array.isArray(gate.activityRefs)) errors.push("activityRefs must be an array");
  if (!gate.nextAction) errors.push("nextAction is required");
  if (gate.commandCenterVisible !== true) errors.push("commandCenterVisible must be true");
  return { valid: errors.length === 0, errors };
}

export function buildHealingSafetyGateEnvelope(input = {}) {
  const gate = evaluateHealingSafetyGate(input);
  const validation = validateHealingSafetyGate(gate);
  if (!validation.valid) {
    return createBlockedResult({
      phase: "P66.4",
      mode: "self-healing-preview",
      source: "self-healing/healingSafetyGate.js",
      summary: "Healing safety gate is invalid.",
      data: { gate },
      errors: validation.errors,
    });
  }
  return createPassResult({
    phase: "P66.4",
    mode: "self-healing-preview",
    source: "self-healing/healingSafetyGate.js",
    summary: "Healing safety gate is valid and non-executing.",
    data: { gate },
    evidence: gate.evidenceRefs,
  });
}
