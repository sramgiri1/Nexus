export const REVIEW_DECISIONS = ["approved", "rejected", "changes_requested", "requires_human_approval"];

export function createAgentDefinitionReview(input = {}) {
  const reviewerAgent = input.reviewerAgent || "AUDITOR";
  const riskRequiresHuman = input.riskLevel === "high" || input.riskLevel === "critical" || input.riskyExpansion === true;
  const decision = input.decision || (riskRequiresHuman ? "requires_human_approval" : "approved");
  return {
    reviewVersion: "1.0",
    phase: "P49.3",
    reviewId: input.reviewId || `agent-def-review-${reviewerAgent.toLowerCase()}-${Date.now()}`,
    proposalId: input.proposalId,
    reviewerAgent,
    reviewFocus: reviewerAgent === "WARDEN" ? "safety_privacy_permission_expansion" : "correctness_tests_evidence",
    decision,
    findings: input.findings || [],
    requiredEvidence: input.requiredEvidence || ["boundary-diff", "proposal-summary", "rollback-plan"],
    requiresHumanApproval: riskRequiresHuman || decision === "requires_human_approval",
    createdAt: input.createdAt || new Date().toISOString(),
    mutationAllowed: false,
  };
}

export function validateAgentDefinitionReview(review = {}) {
  const errors = [];
  for (const field of ["reviewId", "proposalId", "reviewerAgent", "reviewFocus", "decision", "requiredEvidence"]) {
    if (!review[field]) errors.push(`Missing review field: ${field}`);
  }
  if (!["AUDITOR", "WARDEN", "SENTINEL"].includes(review.reviewerAgent)) errors.push(`Unexpected reviewer: ${review.reviewerAgent}`);
  if (!REVIEW_DECISIONS.includes(review.decision)) errors.push(`Invalid review decision: ${review.decision}`);
  if (review.mutationAllowed === true) errors.push("Review cannot mutate an agent definition.");
  return { ok: errors.length === 0, errors };
}

export function summarizeAgentDefinitionReviews(reviews = []) {
  const humanApprovalRequired = reviews.some((review) => review.requiresHumanApproval);
  return {
    reviewCount: reviews.length,
    reviewers: reviews.map((review) => review.reviewerAgent),
    decisions: reviews.map((review) => review.decision),
    humanApprovalRequired,
    allApproved: reviews.length > 0 && reviews.every((review) => review.decision === "approved" || review.decision === "requires_human_approval"),
  };
}
