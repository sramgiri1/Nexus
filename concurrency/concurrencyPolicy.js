import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONCURRENCY_POLICY_DEFAULTS,
  requirePreviewOnly,
} from "./concurrencySchema.js";

const DEFAULT_POLICY_PATH = join(process.cwd(), "policy/concurrency-policy.json");

export function loadConcurrencyPolicy(filePath = DEFAULT_POLICY_PATH) {
  if (!existsSync(filePath)) return { ...CONCURRENCY_POLICY_DEFAULTS };
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function validateConcurrencyPolicy(policy = {}) {
  const errors = [];
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    return { valid: false, errors: ["policy must be an object"] };
  }

  for (const [key, expected] of Object.entries(CONCURRENCY_POLICY_DEFAULTS)) {
    if (policy[key] !== expected) {
      errors.push(`${key} must be ${JSON.stringify(expected)}`);
    }
  }

  for (const key of [
    "maxConcurrentTasksPerProject",
    "maxConcurrentTasksPerRepo",
    "maxConcurrentTasksPerAgent",
  ]) {
    if (!Number.isInteger(policy[key]) || policy[key] < 1) {
      errors.push(`${key} must be an integer greater than zero`);
    }
  }

  requirePreviewOnly(policy, errors, "concurrency policy");
  if (policy.concurrencyExecutionEnabled !== false) {
    errors.push("concurrencyExecutionEnabled must remain false");
  }

  return { valid: errors.length === 0, errors };
}

export function getConcurrencyLimits(policy = loadConcurrencyPolicy()) {
  return {
    maxConcurrentTasksPerProject: policy.maxConcurrentTasksPerProject,
    maxConcurrentTasksPerRepo: policy.maxConcurrentTasksPerRepo,
    maxConcurrentTasksPerAgent: policy.maxConcurrentTasksPerAgent,
    pathLocksRequired: policy.pathLocksRequired,
    duplicateDetectionRequired: policy.duplicateDetectionRequired,
    budgetCheckRequired: policy.budgetCheckRequired,
    humanApprovalForOverride: policy.humanApprovalForOverride,
  };
}

export function buildConcurrencyPolicySummary(policy = loadConcurrencyPolicy()) {
  const validation = validateConcurrencyPolicy(policy);
  return {
    phase: policy.phase,
    previewOnly: policy.previewOnly === true,
    concurrencyExecutionEnabled: policy.concurrencyExecutionEnabled === true,
    providerCallsAllowed: policy.providerCallsAllowed === true,
    toolExecutionAllowed: policy.toolExecutionAllowed === true,
    projectMutationAllowed: policy.projectMutationAllowed === true,
    dbWritesAllowed: policy.dbWritesAllowed === true,
    limits: getConcurrencyLimits(policy),
    valid: validation.valid,
    errors: validation.errors,
    nextAction: validation.valid
      ? "Use preview models to inspect concurrency readiness before real execution is enabled."
      : "Fix concurrency policy fields before using preview models.",
  };
}

export function assertConcurrencyPreviewOnly(policy = loadConcurrencyPolicy()) {
  const validation = validateConcurrencyPolicy(policy);
  if (!validation.valid) {
    throw new Error(`Concurrency policy is not preview-only: ${validation.errors.join("; ")}`);
  }
  return true;
}
