import { buildReviewComment, summarizeReviewComments, validateReviewComment } from "./reviewCommentModel.js";

export function buildReviewIngestionPlan(input = {}) {
  const comments = Array.isArray(input.comments) && input.comments.length
    ? input.comments
    : [
        buildReviewComment({ classification: "architecture", assignedAgent: "AUDITOR" }),
        buildReviewComment({
          commentId: "review-comment-local-002",
          classification: "test-gap",
          assignedAgent: "SENTINEL",
          requiredCapability: "verification.test_gap_review",
        }),
      ];

  return {
    planVersion: "1.0",
    phase: "P44.5",
    status: "metadata-only",
    sourceSystems: ["local-review", "manual", "future"],
    githubApiCallsAllowed: false,
    gitlabApiCallsAllowed: false,
    externalNetworkCallsAllowed: false,
    taskCreationAllowed: false,
    comments,
    summary: summarizeReviewComments(comments),
  };
}

export function validateReviewIngestionPlan(plan) {
  const errors = [];
  if (plan?.planVersion !== "1.0") errors.push("planVersion must be 1.0");
  if (plan?.phase !== "P44.5") errors.push("phase must be P44.5");
  if (plan?.status !== "metadata-only") errors.push("status must be metadata-only");
  for (const field of ["githubApiCallsAllowed", "gitlabApiCallsAllowed", "externalNetworkCallsAllowed", "taskCreationAllowed"]) {
    if (plan?.[field] !== false) errors.push(`${field} must be false`);
  }
  if (!Array.isArray(plan?.comments) || !plan.comments.length) errors.push("comments are required");
  for (const comment of plan?.comments || []) {
    errors.push(...validateReviewComment(comment).errors);
  }
  if (plan?.summary?.externalSourcesFetched !== false) errors.push("external sources must not be fetched");
  if (plan?.summary?.tasksCreated !== false) errors.push("tasks must not be created");
  return { valid: errors.length === 0, errors };
}

export function triageReviewComment(comment) {
  return {
    commentId: comment.commentId,
    classification: comment.classification || "unknown",
    assignedAgent: comment.assignedAgent || "AUDITOR",
    recommendedStatus: "triaged",
    evidenceRequired: comment.evidenceRequired !== false,
    taskCreationAllowed: false,
  };
}
