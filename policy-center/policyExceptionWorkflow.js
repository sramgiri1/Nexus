import { redactObject } from "../shared/index.js";

const RISK_ORDER = ["low", "medium", "high", "critical"];

function addHours(hours = 24) {
  return new Date(Date.now() + Number(hours) * 60 * 60 * 1000).toISOString();
}

export function createPolicyExceptionRequest(input = {}) {
  return redactObject({
    exceptionId: input.exceptionId || `exception_${Date.now().toString(36)}`,
    policyId: input.policyId || "policy-preview",
    requester: input.requester || "operator",
    reason: input.reason || "",
    scope: input.scope || "project",
    projectId: input.projectId || "private-project",
    requestedChange: input.requestedChange || "preview exception",
    riskLevel: input.riskLevel || "medium",
    duration: input.duration || "24h",
    expiresAt: input.expiresAt || addHours(24),
    requiredApprovals: Array.isArray(input.requiredApprovals) ? input.requiredApprovals : [],
    evidenceRequired: Array.isArray(input.evidenceRequired) ? input.evidenceRequired : [],
    mode: input.mode || "local-private",
  });
}

export function validatePolicyExceptionRequest(input = {}) {
  const request = createPolicyExceptionRequest(input);
  const errors = [];
  if (!request.policyId) errors.push("policyId is required");
  if (!request.reason || request.reason.length < 8) errors.push("reason must describe the exception");
  if (!RISK_ORDER.includes(request.riskLevel)) errors.push(`invalid riskLevel ${request.riskLevel}`);
  if (!request.expiresAt || Number.isNaN(Date.parse(request.expiresAt))) errors.push("expiresAt must be valid");
  if (request.expiresAt && Date.parse(request.expiresAt) <= Date.now()) errors.push("exception must not be expired");
  if (/permanent|indefinite/i.test(request.duration)) errors.push("indefinite exceptions are not allowed");
  if (request.mode !== "local-private" && /public|demo|private/i.test(request.requestedChange)) {
    errors.push("public/demo boundary exceptions require denial");
  }
  return { valid: errors.length === 0, errors, request };
}

export function classifyPolicyExceptionRisk(input = {}) {
  const request = createPolicyExceptionRequest(input);
  if (/public|demo|provider|db write|network|secret|break.?glass/i.test(request.requestedChange)) {
    return "critical";
  }
  return request.riskLevel;
}

export function buildPolicyExceptionDecision(input = {}) {
  const validation = validatePolicyExceptionRequest(input);
  const request = validation.request;
  const risk = classifyPolicyExceptionRisk(request);
  let status = "draft";
  const requiredApprovals = new Set(request.requiredApprovals || []);
  const evidenceRequired = new Set(request.evidenceRequired || ["reason", "scope", "expiration"]);

  if (!validation.valid) status = "denied";
  else if (risk === "critical") status = "denied";
  else if (risk === "high") {
    status = "requires_warden_review";
    requiredApprovals.add("WARDEN");
    requiredApprovals.add("AUDITOR");
  } else if (risk === "medium") {
    status = "requires_auditor_review";
    requiredApprovals.add("AUDITOR");
  } else {
    status = "requires_human_approval";
    requiredApprovals.add("human operator");
  }

  return {
    exceptionId: request.exceptionId,
    policyId: request.policyId,
    status,
    riskLevel: risk,
    scope: request.scope,
    expiresAt: request.expiresAt,
    requiredApprovals: [...requiredApprovals],
    evidenceRequired: [...evidenceRequired],
    previewOnly: true,
    liveOverrideEnabled: false,
    warnings: risk === "critical" ? ["Critical exceptions are denied in preview."] : [],
    errors: validation.errors,
    redacted: true,
  };
}

export function summarizePolicyException(decision = {}) {
  return {
    exceptionId: decision.exceptionId,
    policyId: decision.policyId,
    status: decision.status,
    riskLevel: decision.riskLevel,
    approvalCount: (decision.requiredApprovals || []).length,
    evidenceCount: (decision.evidenceRequired || []).length,
    expiresAt: decision.expiresAt,
    previewOnly: decision.previewOnly === true,
    liveOverrideEnabled: decision.liveOverrideEnabled === true,
  };
}
