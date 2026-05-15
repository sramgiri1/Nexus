export const REVIEW_COMMENT_SOURCES = ["github", "gitlab", "local-review", "manual", "future"];
export const REVIEW_COMMENT_CLASSIFICATIONS = [
  "bug",
  "style",
  "security",
  "test-gap",
  "architecture",
  "product",
  "unknown",
];
export const REVIEW_COMMENT_STATUSES = ["new", "triaged", "accepted", "rejected", "converted-to-task"];

export function buildReviewComment(input = {}) {
  return {
    commentVersion: "1.0",
    phase: "P44.5",
    commentId: input.commentId || "review-comment-local-001",
    source: input.source || "local-review",
    repoId: input.repoId || "nexus-os",
    prDraftId: input.prDraftId || "pr-draft-p44-4",
    filePath: input.filePath || "docs/architecture/MULTI_REPO_WORKSPACE.md",
    lineRange: input.lineRange || { start: 1, end: 1 },
    authorRole: input.authorRole || "human-reviewer",
    classification: input.classification || "architecture",
    assignedAgent: input.assignedAgent || "AUDITOR",
    requiredCapability: input.requiredCapability || "review.comment_triage",
    status: input.status || "new",
    evidenceRequired: input.evidenceRequired !== false,
    externalSourceFetched: false,
    taskCreated: false,
  };
}

export function validateReviewComment(comment) {
  const errors = [];
  if (comment?.commentVersion !== "1.0") errors.push("commentVersion must be 1.0");
  if (comment?.phase !== "P44.5") errors.push("phase must be P44.5");
  for (const field of ["commentId", "source", "repoId", "prDraftId", "filePath", "authorRole", "classification", "assignedAgent", "requiredCapability", "status"]) {
    if (!comment?.[field]) errors.push(`${field} is required`);
  }
  if (!REVIEW_COMMENT_SOURCES.includes(comment?.source)) errors.push(`invalid source: ${comment?.source}`);
  if (!REVIEW_COMMENT_CLASSIFICATIONS.includes(comment?.classification)) {
    errors.push(`invalid classification: ${comment?.classification}`);
  }
  if (!REVIEW_COMMENT_STATUSES.includes(comment?.status)) errors.push(`invalid status: ${comment?.status}`);
  if (typeof comment?.lineRange?.start !== "number" || typeof comment?.lineRange?.end !== "number") {
    errors.push("lineRange start/end must be numbers");
  }
  if (comment?.externalSourceFetched !== false) errors.push("externalSourceFetched must be false");
  if (comment?.taskCreated !== false) errors.push("taskCreated must be false");
  return { valid: errors.length === 0, errors };
}

export function summarizeReviewComments(comments = []) {
  const byClassification = {};
  const byStatus = {};
  for (const comment of comments) {
    byClassification[comment.classification] = (byClassification[comment.classification] || 0) + 1;
    byStatus[comment.status] = (byStatus[comment.status] || 0) + 1;
  }
  return {
    commentCount: comments.length,
    byClassification,
    byStatus,
    externalSourcesFetched: comments.some((comment) => comment.externalSourceFetched === true),
    tasksCreated: comments.some((comment) => comment.taskCreated === true),
  };
}
