export function buildRollbackBranchPlan(input = {}) {
  const changeId = input.changeId || "p44-6-merge-gate";
  return {
    planVersion: "1.0",
    phase: "P44.6",
    changeId,
    rollbackBranchName: input.rollbackBranchName || `rollback/${changeId}`,
    sourceBranch: input.sourceBranch || "nexus/p44/metadata-only",
    targetBranch: input.targetBranch || "main",
    rollbackEvidenceRequired: true,
    rollbackBranchCreated: false,
    rollbackCommitCreated: false,
    rollbackExecutionAllowed: false,
    pushAllowed: false,
    note: "Rollback branch plan is metadata-only in P44.6.",
  };
}

export function validateRollbackBranchPlan(plan) {
  const errors = [];
  if (plan?.planVersion !== "1.0") errors.push("planVersion must be 1.0");
  if (plan?.phase !== "P44.6") errors.push("phase must be P44.6");
  for (const field of ["changeId", "rollbackBranchName", "sourceBranch", "targetBranch"]) {
    if (!plan?.[field]) errors.push(`${field} is required`);
  }
  for (const field of ["rollbackBranchCreated", "rollbackCommitCreated", "rollbackExecutionAllowed", "pushAllowed"]) {
    if (plan?.[field] !== false) errors.push(`${field} must be false`);
  }
  if (plan?.rollbackEvidenceRequired !== true) errors.push("rollbackEvidenceRequired must be true");
  return { valid: errors.length === 0, errors };
}
