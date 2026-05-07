import { randomUUID } from "node:crypto";

import { validateIdentityContext } from "./identityContext.js";

const POLICY_NAMES = [
  "identity-propagation-policy",
  "capability-policy",
  "data-classification-policy",
  "security-boundary-policy",
  "network-policy",
  "secret-boundary-policy",
  "mcp-security-policy",
  "approval-policy",
  "runtime-traffic-policy",
];

const HIGH_RISK_TARGETS = [
  "deploy",
  "secret",
  "secrets",
  "migration",
  "production_data_access",
  "production data access",
];

const BATCH_BLOCKED_TARGETS = [
  "verification",
  "gate",
  "release",
  "deploy",
  "secret",
  "migration",
  "security",
  "tool_loop",
  "tool loop",
  "code_edit",
  "code edit",
  "implementation",
];

const FALLBACK_BLOCKS = new Set([
  "safety",
  "budget",
  "permission",
  "secret",
  "verification",
]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function includesAnySignal(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

function getSignals(request) {
  return [
    request.capabilityId,
    request.target,
    request.metadata?.intent,
    request.metadata?.operation,
    request.metadata?.actionCategory,
    request.metadata?.requestedAction,
  ]
    .map((value) => normalizeString(value).toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function isOpenRouter(provider) {
  return normalizeString(provider).toLowerCase() === "openrouter";
}

function hasApprovalEvidence(request) {
  return normalizeArray(request.approvalEvidence).length > 0;
}

function requiresCapability(actionType) {
  return [
    "model_call",
    "tool_call",
    "skill_call",
    "runtime_call",
    "batch_call",
    "mcp_call",
  ].includes(actionType);
}

function logLikeTarget(target) {
  return /log|evidence|artifact|report|ui/i.test(normalizeString(target));
}

export function normalizePolicyDecision(decision = {}) {
  return {
    decisionId: normalizeString(decision.decisionId) || randomUUID(),
    result: normalizeString(decision.result) || "DENY",
    reason: normalizeString(decision.reason),
    blockedBy: normalizeArray(decision.blockedBy),
    policiesEvaluated:
      normalizeArray(decision.policiesEvaluated).length > 0
        ? normalizeArray(decision.policiesEvaluated)
        : [...POLICY_NAMES],
    capabilityId: normalizeString(decision.capabilityId),
    agentId: normalizeString(decision.agentId),
    runtime: normalizeString(decision.runtime),
    provider: normalizeString(decision.provider),
    dataClassification: normalizeString(decision.dataClassification) || "unknown",
    approvalRequired: decision.approvalRequired === true,
    evidenceRequired: normalizeArray(decision.evidenceRequired),
    createdAt: normalizeString(decision.createdAt) || new Date().toISOString(),
  };
}

export function createPolicyDecision(input = {}) {
  return normalizePolicyDecision(input);
}

export function evaluateTrafficRequest(request = {}) {
  const actionType = normalizeString(request.actionType);
  const provider = normalizeString(request.provider);
  const runtime = normalizeString(request.runtime);
  const dataClassification = normalizeString(request.dataClassification) || "unknown";
  const promptClassification =
    normalizeString(request.promptClassification) || "unknown";
  const responseExpectedClass =
    normalizeString(request.responseExpectedClass) || "unknown";
  const riskLevel = normalizeString(request.riskLevel) || "low";
  const identityValidation = validateIdentityContext(request.identityContext || {});
  const signals = getSignals(request);
  const fallbackReason = normalizeString(request.metadata?.fallbackReason).toLowerCase();

  const decision = {
    capabilityId: normalizeString(request.capabilityId),
    agentId: normalizeString(request.agentId),
    runtime,
    provider,
    dataClassification,
    blockedBy: [],
    policiesEvaluated: [...POLICY_NAMES],
    evidenceRequired: [],
    approvalRequired: false,
  };

  if (!identityValidation.valid) {
    return createPolicyDecision({
      ...decision,
      result: "DENY",
      reason: "Missing or invalid identity context.",
      blockedBy: ["identity-propagation-policy", "runtime-traffic-policy"],
    });
  }

  if (requiresCapability(actionType) && !normalizeString(request.capabilityId)) {
    return createPolicyDecision({
      ...decision,
      result: "DENY",
      reason: "Capability ID is required for this traffic request.",
      blockedBy: ["capability-policy", "runtime-traffic-policy"],
    });
  }

  if (
    dataClassification === "unknown" ||
    promptClassification === "unknown" ||
    responseExpectedClass === "unknown"
  ) {
    return createPolicyDecision({
      ...decision,
      result: "ESCALATE",
      reason: "Unknown data classification requires review.",
      blockedBy: ["data-classification-policy", "runtime-traffic-policy"],
    });
  }

  if (fallbackReason && FALLBACK_BLOCKS.has(fallbackReason)) {
    return createPolicyDecision({
      ...decision,
      result: "DENY",
      reason: "Fallback is blocked for this failure mode.",
      blockedBy: ["security-boundary-policy", "runtime-traffic-policy"],
    });
  }

  if (actionType === "approval_request") {
    const approvalAction = normalizeString(request.metadata?.approvalAction).toLowerCase();
    if (approvalAction === "approve" || signals.includes("approve_self")) {
      return createPolicyDecision({
        ...decision,
        result: "DENY",
        reason: "Approval requests may not self-approve.",
        blockedBy: ["approval-policy"],
      });
    }

    return createPolicyDecision({
      ...decision,
      result: "ALLOW",
      reason: "Approval request creation is allowed.",
      evidenceRequired: ["approval_request"],
    });
  }

  if (includesAnySignal(signals, HIGH_RISK_TARGETS) && !hasApprovalEvidence(request)) {
    return createPolicyDecision({
      ...decision,
      result: "REQUIRE_APPROVAL",
      reason: "This action requires approval evidence before execution.",
      blockedBy: ["approval-policy", "runtime-traffic-policy"],
      approvalRequired: true,
      evidenceRequired: ["approval_result"],
    });
  }

  if (
    actionType === "mcp_call" &&
    request.metadata?.mcpAllowed !== true &&
    request.metadata?.capabilityMetadata?.mcpAllowed !== true
  ) {
    return createPolicyDecision({
      ...decision,
      result: "REQUIRE_APPROVAL",
      reason: "MCP use requires explicit capability metadata or approval.",
      blockedBy: ["mcp-security-policy", "approval-policy"],
      approvalRequired: true,
      evidenceRequired: ["approval_result"],
    });
  }

  if (
    dataClassification === "secret" &&
    (["model_call", "batch_call", "mcp_call"].includes(actionType) ||
      logLikeTarget(request.target))
  ) {
    return createPolicyDecision({
      ...decision,
      result: "DENY",
      reason: "Secret data is blocked for this traffic path.",
      blockedBy: ["secret-boundary-policy", "data-classification-policy"],
    });
  }

  if (dataClassification === "restricted" && (actionType === "batch_call" || isOpenRouter(provider))) {
    return createPolicyDecision({
      ...decision,
      result: "DENY",
      reason: "Restricted data cannot be sent to batch or OpenRouter.",
      blockedBy: ["data-classification-policy", "network-policy"],
    });
  }

  if (
    dataClassification === "confidential" &&
    (actionType === "batch_call" || isOpenRouter(provider))
  ) {
    return createPolicyDecision({
      ...decision,
      result: "DENY",
      reason: "Confidential data is blocked for batch and OpenRouter by default.",
      blockedBy: ["data-classification-policy", "network-policy"],
    });
  }

  if (actionType === "batch_call" && includesAnySignal(signals, BATCH_BLOCKED_TARGETS)) {
    return createPolicyDecision({
      ...decision,
      result: "DENY",
      reason: "Batch traffic is not allowed for blocking or high-risk actions.",
      blockedBy: ["runtime-traffic-policy", "capability-policy"],
    });
  }

  if (isOpenRouter(provider)) {
    const lowRisk = riskLevel === "low";
    const lowClass = dataClassification === "public" || dataClassification === "internal";

    if (!lowRisk || !lowClass) {
      return createPolicyDecision({
        ...decision,
        result: "DENY",
        reason: "OpenRouter is limited to public or internal low-risk traffic.",
        blockedBy: ["network-policy", "security-boundary-policy"],
      });
    }
  }

  if (request.requiresApproval === true && !hasApprovalEvidence(request)) {
    return createPolicyDecision({
      ...decision,
      result: "REQUIRE_APPROVAL",
      reason: "Approval evidence is required before execution.",
      blockedBy: ["approval-policy"],
      approvalRequired: true,
      evidenceRequired: ["approval_result"],
    });
  }

  if (dataClassification === "confidential" && actionType === "model_call") {
    return createPolicyDecision({
      ...decision,
      result: "REDACT",
      reason: "Confidential model traffic must be redacted before execution.",
      blockedBy: ["data-classification-policy"],
      evidenceRequired: ["redaction_note"],
    });
  }

  return createPolicyDecision({
    ...decision,
    result: "ALLOW",
    reason: "Traffic request satisfies local runtime policy checks.",
  });
}
