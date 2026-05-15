export const MEMORY_ACCESS_DECISIONS = ["ALLOW", "DENY", "REDACT", "REQUIRE_APPROVAL"];

export function createMemoryAccessDecision(input = {}) {
  return {
    decision: input.decision || "DENY",
    allowed: input.decision === "ALLOW" || input.decision === "REDACT",
    memoryId: input.memoryId || "",
    agentId: input.agentId || "",
    scope: input.scope || "",
    reasons: Array.isArray(input.reasons) ? input.reasons : [],
    redactions: Array.isArray(input.redactions) ? input.redactions : [],
    approvalRequired: input.decision === "REQUIRE_APPROVAL",
    runtimeEnforcementEnabled: false,
    providerDispatchEnabled: false,
  };
}

export function explainMemoryAccessDecision(decision = {}) {
  const label = decision.decision || "DENY";
  const reasons = Array.isArray(decision.reasons) && decision.reasons.length > 0
    ? decision.reasons.join("; ")
    : "No reason supplied";
  return `${label}: ${reasons}`;
}
