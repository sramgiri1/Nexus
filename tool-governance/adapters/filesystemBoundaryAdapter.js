const METHODS = ["validate-path-preview", "read-boundary-preview", "forbidden-path-preview"];

export function describeAdapter() {
  return {
    adapterId: "filesystem-boundary-adapter-preview",
    label: "Filesystem Boundary Adapter Preview",
    purpose: "Describe future file boundary checks without reading or writing project files.",
    executionEnabled: false,
  };
}

export function listSupportedMethods() {
  return [...METHODS];
}

export function validateAdapterRequest(request = {}) {
  const errors = [];
  if (!METHODS.includes(request.method)) errors.push(`Unsupported filesystem preview method: ${request.method}`);
  if (request.write === true) errors.push("Writes are disabled for filesystem boundary previews");
  if (request.execute === true) errors.push("Execution is disabled for filesystem boundary previews");
  return { valid: errors.length === 0, errors };
}

export function previewAdapterAction(request = {}) {
  const validation = validateAdapterRequest(request);
  return {
    adapterId: "filesystem-boundary-adapter-preview",
    previewOnly: true,
    executed: false,
    valid: validation.valid,
    method: request.method || null,
    reason: validation.valid ? "Filesystem boundary preview is metadata-only" : validation.errors.join("; "),
  };
}

export function getAdapterSafetySummary() {
  return {
    executionEnabled: false,
    readAllowed: false,
    writeAllowed: false,
    deleteAllowed: false,
  };
}
