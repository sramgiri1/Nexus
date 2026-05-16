import { createSecretAccessRequest, evaluateSecretAccessRequest, getSecretAccessPolicy } from "./secretAccessPolicy.js";

export function buildSecretAccessDecision(requestInput = {}, policy = getSecretAccessPolicy(), context = {}) {
  const request = createSecretAccessRequest(requestInput);
  const decision = evaluateSecretAccessRequest(request, { ...context, policy });
  return {
    ok: decision === "ALLOW_METADATA",
    decision,
    valueAccessAllowed: false,
    reason:
      decision === "ALLOW_METADATA"
        ? "P59 allows metadata-only secret reference inspection; value resolution is disabled."
        : "P59 blocks raw secret value access and unsafe modes.",
    redacted: true,
    warnings: decision === "REQUIRE_APPROVAL" ? ["Approval is required for production-placeholder metadata."] : [],
    errors: decision === "DENY" || decision === "BLOCK_VALUE_ACCESS" ? ["Secret value access is not available in P59."] : [],
  };
}

export function summarizeSecretAccessDecisions(decisions = []) {
  return decisions.reduce(
    (summary, decision) => {
      summary.total += 1;
      summary.byDecision[decision.decision] = (summary.byDecision[decision.decision] || 0) + 1;
      if (decision.valueAccessAllowed) summary.valueAccessAllowed += 1;
      return summary;
    },
    { total: 0, valueAccessAllowed: 0, byDecision: {} },
  );
}
