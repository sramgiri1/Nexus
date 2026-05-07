import { compareBehaviorToBaseline, classifyBehaviorEvent } from "./behaviorBaseline.js";
import { createEvidenceRecord } from "./evidenceRecord.js";
import { validateIdentityContext } from "./identityContext.js";
import { evaluateTrafficRequest as evaluatePolicyTrafficRequest } from "./policyDecision.js";

export function evaluateTrafficRequest(input = {}) {
  const trafficRequest = {
    ...(input.trafficRequest || {}),
    identityContext: input.identityContext || input.trafficRequest?.identityContext || {},
  };

  const identity = validateIdentityContext(trafficRequest.identityContext);
  const decision = evaluatePolicyTrafficRequest(trafficRequest);

  const behaviorEvent = classifyBehaviorEvent({
    agentId: trafficRequest.agentId || trafficRequest.identityContext?.agent?.agentId,
    agentVersion: trafficRequest.identityContext?.agent?.agentVersion,
    actionType: trafficRequest.actionType,
    toolName: trafficRequest.metadata?.toolName || trafficRequest.target,
    runtime: trafficRequest.runtime,
    provider: trafficRequest.provider,
    argumentShape: trafficRequest.metadata?.argumentShape || {},
    responseClass: trafficRequest.responseExpectedClass,
    chainDepth: trafficRequest.metadata?.chainDepth || 0,
    egressBytes: trafficRequest.metadata?.egressBytes || 0,
    costUsd: trafficRequest.metadata?.costUsd || 0,
    result: decision.result === "DENY" ? "BLOCKED" : "INFO",
    timestamp: new Date().toISOString(),
  });

  const behavior = input.baseline
    ? compareBehaviorToBaseline(input.baseline, behaviorEvent)
    : { status: "NORMAL", reasons: [], baselineSamples: 0 };

  const evidenceRecord = createEvidenceRecord({
    identityContext: trafficRequest.identityContext,
    trafficRequest,
    policyDecision: decision,
    downstreamToolCalls: trafficRequest.metadata?.downstreamToolCalls || [],
    inputForHash: input.inputForHash,
    outputForHash: input.outputForHash,
    promptClassification: trafficRequest.promptClassification,
    retrievedContextClassification:
      trafficRequest.metadata?.retrievedContextClassification,
    responseClassification: trafficRequest.responseExpectedClass,
  });

  const errors = [...identity.errors];
  const warnings = [...identity.warnings];

  if (decision.result === "DENY") {
    errors.push(decision.reason || "traffic_denied");
  } else if (decision.result === "ESCALATE") {
    errors.push(decision.reason || "traffic_escalated");
  } else if (decision.result === "REQUIRE_APPROVAL") {
    warnings.push(decision.reason || "approval_required");
  } else if (decision.result === "REDACT") {
    warnings.push(decision.reason || "redaction_required");
  }

  if (behavior.status === "WARNING") {
    warnings.push(...behavior.reasons);
  }

  if (behavior.status === "ESCALATE") {
    errors.push(...behavior.reasons);
  }

  return {
    allowed:
      identity.valid &&
      ["ALLOW", "REDACT"].includes(decision.result) &&
      behavior.status !== "ESCALATE",
    decision,
    identity,
    behavior,
    evidenceRecord,
    errors,
    warnings,
  };
}
