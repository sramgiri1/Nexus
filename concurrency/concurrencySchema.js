export const CONCURRENCY_PHASE = "P61";

export const CONCURRENCY_POLICY_DEFAULTS = Object.freeze({
  policyVersion: "1.0",
  phase: CONCURRENCY_PHASE,
  concurrencyExecutionEnabled: false,
  previewOnly: true,
  maxConcurrentTasksPerProject: 1,
  maxConcurrentTasksPerRepo: 1,
  maxConcurrentTasksPerAgent: 1,
  pathLocksRequired: true,
  duplicateDetectionRequired: true,
  budgetCheckRequired: true,
  humanApprovalForOverride: true,
  providerCallsAllowed: false,
  toolExecutionAllowed: false,
  projectMutationAllowed: false,
  dbWritesAllowed: false,
});

export const LOCK_SCOPES = Object.freeze(["project", "repo", "path", "agent", "capability"]);
export const LOCK_STATUSES = Object.freeze(["proposed", "active_preview", "released_preview", "blocked_preview"]);
export const DUPLICATE_DECISIONS = Object.freeze(["unique", "possible_duplicate", "duplicate_preview", "insufficient_data"]);
export const DUPLICATE_ACTIONS = Object.freeze(["allow", "warn", "block_preview", "merge_tasks_preview", "inspect"]);
export const PRIORITY_LEVELS = Object.freeze(["low", "normal", "high", "urgent", "blocked"]);
export const RISK_LEVELS = Object.freeze(["low", "medium", "high"]);
export const COST_IMPACTS = Object.freeze(["none", "low", "medium", "high"]);
export const CANCELLATION_STATUSES = Object.freeze(["requested_preview", "accepted_preview", "blocked_preview"]);

export function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function requirePreviewOnly(record, errors, label = "record") {
  if (record.previewOnly !== true) errors.push(`${label} must set previewOnly true`);
  if (record.executionEnabled === true) errors.push(`${label} must not enable execution`);
  if (record.providerCallsAllowed === true) errors.push(`${label} must not allow provider calls`);
  if (record.toolExecutionAllowed === true) errors.push(`${label} must not allow tool execution`);
  if (record.projectMutationAllowed === true) errors.push(`${label} must not allow project mutation`);
  if (record.dbWritesAllowed === true) errors.push(`${label} must not allow DB writes`);
}

export function validateEnum(value, allowed, field, errors) {
  if (!allowed.includes(value)) {
    errors.push(`${field} must be one of ${allowed.join(", ")}`);
  }
}

export function toIsoString(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function stablePreviewId(prefix, values = []) {
  const raw = values.filter(Boolean).join("|") || "default";
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) >>> 0;
  }
  return `${prefix}_${hash.toString(16).padStart(8, "0").slice(0, 8)}`;
}
