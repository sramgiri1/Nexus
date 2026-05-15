const METHODS = ["route-list-preview", "screenshot-plan-preview", "browser-action-preview"];

export function describeAdapter() {
  return {
    adapterId: "playwright-adapter-preview",
    label: "Playwright Adapter Preview",
    purpose: "Describe future browser QA actions without launching a browser.",
    executionEnabled: false,
  };
}

export function listSupportedMethods() {
  return [...METHODS];
}

export function validateAdapterRequest(request = {}) {
  const errors = [];
  if (!METHODS.includes(request.method)) errors.push(`Unsupported browser preview method: ${request.method}`);
  if (request.launch === true) errors.push("Browser launch is disabled for Playwright previews");
  if (request.execute === true) errors.push("Execution is disabled for Playwright previews");
  return { valid: errors.length === 0, errors };
}

export function previewAdapterAction(request = {}) {
  const validation = validateAdapterRequest(request);
  return {
    adapterId: "playwright-adapter-preview",
    previewOnly: true,
    executed: false,
    valid: validation.valid,
    method: request.method || null,
    reason: validation.valid ? "Playwright action preview is metadata-only" : validation.errors.join("; "),
  };
}

export function getAdapterSafetySummary() {
  return {
    executionEnabled: false,
    browserLaunchAllowed: false,
    networkAllowed: false,
    projectMutationAllowed: false,
  };
}
