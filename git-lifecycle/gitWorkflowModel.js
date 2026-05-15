import { summarizeRepoBlastRadius } from "../repo-workspace/index.js";
import { ALLOWED_GIT_ACTIONS, FORBIDDEN_GIT_ACTIONS, buildGitSafetyPolicy } from "./gitSafetyPolicy.js";

function slug(value) {
  return String(value || "change")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function buildGitWorkflowPlan(input = {}) {
  const scope = input.scope || "CROSS_CUTTING_REVIEW_REQUIRED";
  const projectId = input.projectId || "nexus-os";
  const repoIds = Array.isArray(input.repoIds) && input.repoIds.length ? input.repoIds : ["nexus-os"];
  const changeId = input.changeId || `change-${slug(scope)}-${Date.now().toString(36)}`;
  const baseBranch = input.baseBranch || "main";
  const proposedBranchName = input.proposedBranchName || `nexus/${slug(scope)}/${slug(changeId)}`;
  const policy = buildGitSafetyPolicy();
  const blastRadius = summarizeRepoBlastRadius({ repoIds });

  return {
    workflowVersion: "1.0",
    phase: "P44.3",
    status: "plan-only",
    changeId,
    scope,
    projectId,
    repoIds,
    baseBranch,
    proposedBranchName,
    commitMessageTemplate: `${input.commitType || "chore"}: ${input.summary || "describe governed change"}`,
    allowedGitActions: ALLOWED_GIT_ACTIONS,
    forbiddenGitActions: FORBIDDEN_GIT_ACTIONS,
    requiresReview: true,
    requiresEvidence: true,
    rollbackBranchPlan: {
      planned: true,
      branchName: `rollback/${slug(changeId)}`,
      executionAllowed: false,
      note: "Rollback branch is metadata-only in P44.3.",
    },
    safetyPolicy: policy,
    blastRadius,
    gitActionsExecuted: false,
    branchCreated: false,
    commitCreated: false,
    prCreated: false,
  };
}

export function validateGitWorkflowPlan(plan) {
  const errors = [];
  if (plan?.workflowVersion !== "1.0") errors.push("workflowVersion must be 1.0");
  if (plan?.phase !== "P44.3") errors.push("phase must be P44.3");
  if (plan?.status !== "plan-only") errors.push("status must be plan-only");
  for (const field of ["changeId", "scope", "projectId", "baseBranch", "proposedBranchName"]) {
    if (!plan?.[field]) errors.push(`${field} is required`);
  }
  if (!Array.isArray(plan?.repoIds) || !plan.repoIds.length) errors.push("repoIds are required");
  if (["main", "master"].includes(plan?.proposedBranchName)) {
    errors.push("proposedBranchName cannot be main or master");
  }
  if (!plan?.allowedGitActions?.includes("branch-plan")) errors.push("branch-plan must be allowed");
  if (!plan?.allowedGitActions?.includes("commit-plan")) errors.push("commit-plan must be allowed");
  for (const forbidden of ["direct-main-commit", "unreviewed-merge", "force-push"]) {
    if (!plan?.forbiddenGitActions?.includes(forbidden)) errors.push(`missing forbidden action: ${forbidden}`);
  }
  if (plan?.requiresReview !== true) errors.push("requiresReview must be true");
  if (plan?.requiresEvidence !== true) errors.push("requiresEvidence must be true");
  if (plan?.rollbackBranchPlan?.executionAllowed !== false) errors.push("rollback execution must be disabled");
  for (const field of ["gitActionsExecuted", "branchCreated", "commitCreated", "prCreated"]) {
    if (plan?.[field] !== false) errors.push(`${field} must be false`);
  }
  return { valid: errors.length === 0, errors };
}

export function summarizeGitWorkflowPlan(plan) {
  return {
    changeId: plan.changeId,
    scope: plan.scope,
    repoCount: plan.repoIds.length,
    baseBranch: plan.baseBranch,
    proposedBranchName: plan.proposedBranchName,
    requiresReview: plan.requiresReview,
    requiresEvidence: plan.requiresEvidence,
    executionAllowed: false,
    branchCreated: false,
    commitCreated: false,
    prCreated: false,
  };
}
