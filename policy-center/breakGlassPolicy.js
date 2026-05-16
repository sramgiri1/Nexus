import { redactObject } from "../shared/index.js";

function expiresSoon(hours = 2) {
  return new Date(Date.now() + Number(hours) * 60 * 60 * 1000).toISOString();
}

export function createBreakGlassRequest(input = {}) {
  return redactObject({
    requestId: input.requestId || `break_glass_${Date.now().toString(36)}`,
    requester: input.requester || "",
    reason: input.reason || "",
    scope: input.scope || "platform",
    requestedAction: input.requestedAction || "",
    riskLevel: input.riskLevel || "critical",
    expiresAt: input.expiresAt || expiresSoon(2),
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    auditRecordPreview: input.auditRecordPreview || true,
    recoveryPlan: input.recoveryPlan || "",
    mode: input.mode || "local-private",
  });
}

export function validateBreakGlassRequest(input = {}) {
  const request = createBreakGlassRequest(input);
  const errors = [];
  if (!request.requester) errors.push("requester is required");
  if (!request.reason || request.reason.length < 12) errors.push("reason must be explicit");
  if (!request.requestedAction) errors.push("requestedAction is required");
  if (!request.expiresAt || Date.parse(request.expiresAt) <= Date.now()) errors.push("future expiration is required");
  if (!request.evidence.length) errors.push("evidence is required");
  if (!request.recoveryPlan) errors.push("recoveryPlan is required");
  if (/disable audit|disable evidence|permanent|secret/i.test(request.requestedAction)) {
    errors.push("break-glass cannot disable audit/evidence, grant permanent power, or expose secrets");
  }
  return { valid: errors.length === 0, errors, request };
}

export function classifyBreakGlassRisk(input = {}) {
  const request = createBreakGlassRequest(input);
  if (/public|demo|secret|provider|db|network|permanent/i.test(request.requestedAction)) return "critical";
  return request.riskLevel || "critical";
}

export function buildBreakGlassDecision(input = {}) {
  const validation = validateBreakGlassRequest(input);
  const risk = classifyBreakGlassRisk(validation.request);
  const decision = validation.valid ? "REQUIRES_HUMAN_APPROVAL" : "DENY";
  return {
    decision,
    riskLevel: risk,
    expiresAt: validation.request.expiresAt,
    requiredApprovals: ["human operator", "WARDEN", "AUDITOR"],
    requiredEvidence: ["incident summary", "scope", "expiration", "recovery plan", "audit preview"],
    compensatingControls: ["time-boxed access", "post-action review", "recovery confirmation"],
    auditRequired: true,
    recoveryRequired: true,
    enabledByDefault: false,
    previewOnly: true,
    warnings: validation.valid ? ["Break-glass remains preview-only and disabled by default."] : [],
    errors: validation.errors,
  };
}

export function summarizeBreakGlassDecision(decision = {}) {
  return {
    decision: decision.decision,
    riskLevel: decision.riskLevel,
    approvalCount: (decision.requiredApprovals || []).length,
    evidenceCount: (decision.requiredEvidence || []).length,
    auditRequired: decision.auditRequired === true,
    recoveryRequired: decision.recoveryRequired === true,
    enabledByDefault: decision.enabledByDefault === true,
    previewOnly: decision.previewOnly === true,
  };
}
