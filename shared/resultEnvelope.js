const VALID_STATUSES = new Set(["PASS", "FAIL", "BLOCKED", "SKIPPED", "WARN"]);

export function normalizeWarnings(warnings = []) {
  if (!Array.isArray(warnings)) return warnings ? [String(warnings)] : [];
  return warnings.filter(Boolean).map((warning) => String(warning));
}

export function normalizeErrors(errors = []) {
  if (!Array.isArray(errors)) return errors ? [String(errors)] : [];
  return errors.filter(Boolean).map((error) => String(error));
}

export function createResultEnvelope(options = {}) {
  const status = options.status || (options.ok === false ? "FAIL" : "PASS");
  const ok = typeof options.ok === "boolean" ? options.ok : status === "PASS";
  return {
    ok,
    status,
    phase: options.phase || "P56.8",
    mode: options.mode || "unknown",
    source: options.source || "",
    summary: options.summary || "",
    data: options.data || {},
    warnings: normalizeWarnings(options.warnings),
    errors: normalizeErrors(options.errors),
    evidence: Array.isArray(options.evidence) ? options.evidence : [],
    metadata: {
      generatedAt: options.metadata?.generatedAt || new Date().toISOString(),
      branch: options.metadata?.branch || "",
      head: options.metadata?.head || "",
      ...(options.metadata || {}),
    },
  };
}

export function createPassResult(options = {}) {
  return createResultEnvelope({ ...options, ok: true, status: "PASS" });
}

export function createFailResult(options = {}) {
  return createResultEnvelope({ ...options, ok: false, status: "FAIL" });
}

export function createBlockedResult(options = {}) {
  return createResultEnvelope({ ...options, ok: false, status: "BLOCKED" });
}

export function createSkippedResult(options = {}) {
  return createResultEnvelope({ ...options, ok: true, status: "SKIPPED" });
}

export function validateResultEnvelope(result = {}) {
  const errors = [];
  if (typeof result.ok !== "boolean") errors.push("ok must be boolean");
  if (!VALID_STATUSES.has(result.status)) errors.push("status must be PASS, FAIL, BLOCKED, SKIPPED, or WARN");
  if (!result.phase) errors.push("phase is required");
  if (!result.mode) errors.push("mode is required");
  if (!Array.isArray(result.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(result.errors)) errors.push("errors must be an array");
  if (!Array.isArray(result.evidence)) errors.push("evidence must be an array");
  if (!result.metadata || typeof result.metadata !== "object") errors.push("metadata object is required");
  return { valid: errors.length === 0, errors };
}
