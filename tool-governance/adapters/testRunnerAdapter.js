const METHODS = ["list-suites-preview", "validate-command-preview", "run-plan-preview"];

export function describeAdapter() {
  return {
    adapterId: "test-runner-adapter-preview",
    label: "Test Runner Adapter Preview",
    purpose: "Describe future validation actions without running tests.",
    executionEnabled: false,
  };
}

export function listSupportedMethods() {
  return [...METHODS];
}

export function validateAdapterRequest(request = {}) {
  const errors = [];
  if (!METHODS.includes(request.method)) errors.push(`Unsupported test runner preview method: ${request.method}`);
  if (request.execute === true) errors.push("Execution is disabled for test runner previews");
  return { valid: errors.length === 0, errors };
}

export function previewAdapterAction(request = {}) {
  const validation = validateAdapterRequest(request);
  return {
    adapterId: "test-runner-adapter-preview",
    previewOnly: true,
    executed: false,
    valid: validation.valid,
    method: request.method || null,
    reason: validation.valid ? "Test runner action preview is metadata-only" : validation.errors.join("; "),
  };
}

export function getAdapterSafetySummary() {
  return {
    executionEnabled: false,
    networkAllowed: false,
    projectMutationAllowed: false,
    installAllowed: false,
  };
}
