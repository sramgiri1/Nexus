export const ALLOWED_GIT_ACTIONS = ["status", "diff", "branch-plan", "commit-plan"];

export const FORBIDDEN_GIT_ACTIONS = [
  "force-push",
  "delete-branch",
  "direct-main-commit",
  "unreviewed-merge",
  "branch-create",
  "commit",
  "pr-create",
  "merge",
  "push",
];

export function buildGitSafetyPolicy() {
  return {
    policyVersion: "1.0",
    phase: "P44.3",
    readOnly: true,
    allowedGitActions: ALLOWED_GIT_ACTIONS,
    forbiddenGitActions: FORBIDDEN_GIT_ACTIONS,
    branchCreationAllowed: false,
    commitAllowed: false,
    prCreationAllowed: false,
    mergeAllowed: false,
    pushAllowed: false,
    directMainMutationAllowed: false,
    externalNetworkCallsAllowed: false,
    projectMutationAllowed: false,
  };
}

export function validateGitSafetyPolicy(policy = buildGitSafetyPolicy()) {
  const errors = [];
  if (policy.phase !== "P44.3") errors.push("phase must be P44.3");
  if (policy.readOnly !== true) errors.push("policy must be read-only");
  for (const field of [
    "branchCreationAllowed",
    "commitAllowed",
    "prCreationAllowed",
    "mergeAllowed",
    "pushAllowed",
    "directMainMutationAllowed",
    "externalNetworkCallsAllowed",
    "projectMutationAllowed",
  ]) {
    if (policy[field] !== false) errors.push(`${field} must be false`);
  }
  for (const action of ["status", "diff", "branch-plan", "commit-plan"]) {
    if (!policy.allowedGitActions.includes(action)) errors.push(`missing allowed action: ${action}`);
  }
  for (const action of ["force-push", "delete-branch", "direct-main-commit", "unreviewed-merge"]) {
    if (!policy.forbiddenGitActions.includes(action)) errors.push(`missing forbidden action: ${action}`);
  }
  return { valid: errors.length === 0, errors };
}
