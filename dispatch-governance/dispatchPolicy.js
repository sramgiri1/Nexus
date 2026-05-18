import { evaluateTrafficRequest, normalizePolicyDecision } from "../runtime/policyDecision.js";
import { createDispatchEnvelope, validateDispatchEnvelope } from "./dispatchEnvelope.js";

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildTrafficRequest(envelope = {}, input = {}) {
  return {
    actionType: envelope.requestType?.includes("tool") ? "tool_call" : "model_call",
    capabilityId: envelope.capabilityId,
    agentId: envelope.agentId,
    runtime: "nexus-governed-dispatch",
    provider: envelope.providerId,
    target: envelope.toolId || envelope.providerId || "dispatch-preview",
    dataClassification: envelope.dataClassification,
    promptClassification: envelope.promptClassification,
    responseExpectedClass: envelope.responseExpectedClass,
    riskLevel: envelope.riskLevel,
    identityContext: input.identityContext || {
      contextVersion: "1.0",
      session: { sessionId: "p64-dispatch-preview-session" },
      originatingUser: { userId: "operator-preview" },
      agent: { agentId: envelope.agentId, agentVersion: "p64.2" },
      request: { taskId: envelope.dispatchId, projectId: "nexus-os" },
      delegationChain: [],
    },
    metadata: {
      intent: "dispatch_preview",
      operation: envelope.requestType,
      toolName: envelope.toolId,
      costUsd: envelope.costEstimate?.estimatedUsd || 0,
      requestedAction: "preview_only",
    },
  };
}

export function evaluateDispatchPolicy(input = {}) {
  const envelope = input.envelope || createDispatchEnvelope(input);
  const envelopeValidation = validateDispatchEnvelope(envelope);
  const policyDecision = envelopeValidation.valid
    ? evaluateTrafficRequest(buildTrafficRequest(envelope, input))
    : normalizePolicyDecision({
        result: "DENY",
        reason: "Dispatch envelope failed validation.",
        blockedBy: ["dispatch-envelope-policy"],
        capabilityId: envelope.capabilityId,
        agentId: envelope.agentId,
        runtime: "nexus-governed-dispatch",
        provider: envelope.providerId,
        dataClassification: envelope.dataClassification,
        approvalRequired: true,
        evidenceRequired: ["dispatch_envelope"],
      });

  const executionAllowed = false;
  const state =
    policyDecision.result === "REQUIRE_APPROVAL"
      ? "REQUIRES_APPROVAL"
      : policyDecision.result === "ALLOW"
        ? "PREVIEW_ONLY"
        : "DENIED";

  return {
    dispatchId: envelope.dispatchId,
    phaseId: "P64.2",
    state,
    executionAllowed,
    providerDispatchAllowed: false,
    toolExecutionAllowed: false,
    approvalRequired: true,
    evidenceRequired: ["dispatch_envelope", ...(policyDecision.evidenceRequired || [])],
    auditRequired: true,
    policyDecision,
    envelopeValidation,
    disabledReason: normalizeString(
      envelope.disabledReason,
      "P64.2 policy evaluation is preview-only; dispatch remains disabled.",
    ),
    nextAction: "Review policy, approval, cost, evidence, and audit requirements before a later execution phase.",
  };
}

export function validateDispatchPolicyDecision(decision = {}) {
  const errors = [];
  if (!decision.dispatchId) errors.push("dispatchId is required");
  if (!["DENIED", "PREVIEW_ONLY", "REQUIRES_APPROVAL", "BLOCKED_NOT_ENABLED"].includes(decision.state)) {
    errors.push(`Unsupported dispatch policy state: ${decision.state || "missing"}`);
  }
  if (decision.executionAllowed !== false) errors.push("executionAllowed must remain false");
  if (decision.providerDispatchAllowed !== false) errors.push("providerDispatchAllowed must remain false");
  if (decision.toolExecutionAllowed !== false) errors.push("toolExecutionAllowed must remain false");
  if (decision.approvalRequired !== true) errors.push("approvalRequired must remain true for future execution");
  if (!Array.isArray(decision.evidenceRequired) || !decision.evidenceRequired.includes("dispatch_envelope")) {
    errors.push("dispatch_envelope evidence must be required");
  }
  if (decision.auditRequired !== true) errors.push("auditRequired must remain true");
  if (!decision.disabledReason) errors.push("disabledReason is required");
  if (!decision.nextAction) errors.push("nextAction is required");
  if (!decision.policyDecision?.result) errors.push("policyDecision.result is required");
  if (decision.envelopeValidation?.valid !== true) errors.push("envelopeValidation must be valid");
  return { valid: errors.length === 0, errors };
}
