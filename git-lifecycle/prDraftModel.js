import { buildGitWorkflowPlan } from "./gitWorkflowModel.js";
import { buildPrEvidenceLinks, validatePrEvidenceLinks } from "./prEvidenceLinks.js";

export function buildPrDraft(input = {}) {
  const workflowPlan = input.workflowPlan || buildGitWorkflowPlan({
    changeId: input.changeId || "p44-4-pr-draft",
    scope: input.scope || "NEXUS_OS_CHANGE",
    projectId: input.projectId || "nexus-os",
    repoIds: input.repoIds || ["nexus-os"],
    summary: input.summary || "prepare PR draft metadata",
  });
  const evidenceLinks = buildPrEvidenceLinks(input);

  return {
    draftVersion: "1.0",
    phase: "P44.4",
    prDraftId: input.prDraftId || `pr-draft-${workflowPlan.changeId}`,
    title: input.title || "Draft: governed NEXUS change",
    summary: input.summary || "Local PR draft metadata for review planning.",
    scope: workflowPlan.scope,
    projectId: workflowPlan.projectId,
    repoIds: workflowPlan.repoIds,
    sourceBranch: workflowPlan.proposedBranchName,
    targetBranch: workflowPlan.baseBranch,
    linkedMissionId: input.linkedMissionId || "local-mission-reference",
    linkedTaskIds: Array.isArray(input.linkedTaskIds) ? input.linkedTaskIds : [],
    evidenceIds: evidenceLinks.evidenceIds,
    auditIds: evidenceLinks.auditIds,
    activityCorrelationIds: evidenceLinks.activityCorrelationIds,
    validationSummary: input.validationSummary || "Validation evidence required before merge approval.",
    riskSummary: input.riskSummary || "Human review required; no external PR created.",
    rollbackPlan: input.rollbackPlan || workflowPlan.rollbackBranchPlan,
    humanReviewRequired: true,
    status: "draft-metadata-only",
    githubApiCalled: false,
    gitlabApiCalled: false,
    externalNetworkCallsAllowed: false,
    prCreated: false,
  };
}

export function validatePrDraft(draft) {
  const errors = [];
  if (draft?.draftVersion !== "1.0") errors.push("draftVersion must be 1.0");
  if (draft?.phase !== "P44.4") errors.push("phase must be P44.4");
  for (const field of ["prDraftId", "title", "summary", "scope", "projectId", "sourceBranch", "targetBranch"]) {
    if (!draft?.[field]) errors.push(`${field} is required`);
  }
  for (const field of ["repoIds", "linkedTaskIds", "evidenceIds", "auditIds", "activityCorrelationIds"]) {
    if (!Array.isArray(draft?.[field])) errors.push(`${field} must be an array`);
  }
  if (draft?.humanReviewRequired !== true) errors.push("humanReviewRequired must be true");
  if (draft?.status !== "draft-metadata-only") errors.push("status must be draft-metadata-only");
  for (const field of ["githubApiCalled", "gitlabApiCalled", "externalNetworkCallsAllowed", "prCreated"]) {
    if (draft?.[field] !== false) errors.push(`${field} must be false`);
  }
  const evidenceValidation = validatePrEvidenceLinks({
    linkVersion: "1.0",
    phase: "P44.4",
    evidenceIds: draft?.evidenceIds,
    auditIds: draft?.auditIds,
    activityCorrelationIds: draft?.activityCorrelationIds,
    externalLinksResolved: false,
    externalNetworkCallsAllowed: false,
  });
  errors.push(...evidenceValidation.errors);
  return { valid: errors.length === 0, errors };
}

export function summarizePrDraft(draft) {
  return {
    prDraftId: draft.prDraftId,
    title: draft.title,
    repoCount: draft.repoIds.length,
    evidenceCount: draft.evidenceIds.length,
    auditCount: draft.auditIds.length,
    correlationCount: draft.activityCorrelationIds.length,
    status: draft.status,
    humanReviewRequired: draft.humanReviewRequired,
    prCreated: draft.prCreated,
    externalCallsAllowed: draft.externalNetworkCallsAllowed,
  };
}
