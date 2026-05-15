const METHODS = ["status-preview", "diff-preview", "branch-preview"];

export function describeAdapter() {
  return {
    adapterId: "git-adapter-preview",
    label: "Git Adapter Preview",
    purpose: "Describe future git metadata actions without executing git.",
    executionEnabled: false,
  };
}

export function listSupportedMethods() {
  return [...METHODS];
}

export function validateAdapterRequest(request = {}) {
  const errors = [];
  if (!METHODS.includes(request.method)) errors.push(`Unsupported git preview method: ${request.method}`);
  if (request.execute === true) errors.push("Execution is disabled for git adapter previews");
  return { valid: errors.length === 0, errors };
}

export function previewAdapterAction(request = {}) {
  const validation = validateAdapterRequest(request);
  return {
    adapterId: "git-adapter-preview",
    previewOnly: true,
    executed: false,
    valid: validation.valid,
    method: request.method || null,
    reason: validation.valid ? "Git action preview is metadata-only" : validation.errors.join("; "),
  };
}

export function getAdapterSafetySummary() {
  return {
    executionEnabled: false,
    networkAllowed: false,
    projectMutationAllowed: false,
    shellAllowed: false,
  };
}
