import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SCOPE_RISK_LEVELS,
  SCOPE_STATUS,
  SCOPE_TYPES,
  isValidScopeType,
} from "./scopeTypes.js";

const DEFAULT_POLICY_PATH = "policy/scope-classification-policy.json";

export function loadScopePolicy(options = {}) {
  const root = options.root || process.cwd();
  const policyPath = options.policyPath || DEFAULT_POLICY_PATH;
  const fullPath = join(root, policyPath);
  if (!existsSync(fullPath)) {
    return {
      ok: false,
      policy: null,
      errors: [`Scope policy not found: ${policyPath}`],
    };
  }

  try {
    return {
      ok: true,
      policy: JSON.parse(readFileSync(fullPath, "utf8")),
      errors: [],
    };
  } catch (error) {
    return {
      ok: false,
      policy: null,
      errors: [`Scope policy did not parse: ${error.message}`],
    };
  }
}

export function validateScopePolicy(policy = {}) {
  const errors = [];
  if (policy.version !== "1.0") errors.push("version must be 1.0");
  if (policy.phase !== "P43.1") errors.push("phase must be P43.1");
  if (policy.purpose !== "scope_classification_model") errors.push("purpose mismatch");
  if (policy.classificationOnly !== true) errors.push("classificationOnly must be true");
  if (policy.enforcementEnabled !== false) errors.push("enforcementEnabled must be false");
  if (policy.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (policy.exportPipelineEnabled !== false) errors.push("exportPipelineEnabled must be false");
  if (policy.providerCallsAllowed !== false) errors.push("providerCallsAllowed must be false");
  if (policy.toolDispatchAllowed !== false) errors.push("toolDispatchAllowed must be false");
  if (policy.workerRuntimeAllowed !== false) errors.push("workerRuntimeAllowed must be false");
  if (policy.dbWritesAllowed !== false) errors.push("dbWritesAllowed must be false");
  if (!policy.allowedRootsByScope || typeof policy.allowedRootsByScope !== "object") {
    errors.push("allowedRootsByScope is required");
  }
  if (!policy.forbiddenRootsByScope || typeof policy.forbiddenRootsByScope !== "object") {
    errors.push("forbiddenRootsByScope is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getAllowedRootsForScope(scopeType, context = {}) {
  const policy = context.policy || loadScopePolicy(context).policy || {};
  if (!isValidScopeType(scopeType)) return [];
  return policy.allowedRootsByScope?.[scopeType] || [];
}

export function getForbiddenRootsForScope(scopeType, context = {}) {
  const policy = context.policy || loadScopePolicy(context).policy || {};
  if (!isValidScopeType(scopeType)) return [];
  return policy.forbiddenRootsByScope?.[scopeType] || [];
}

export function evaluateScopePolicy(classification = {}, policy = {}) {
  const warnings = [...(classification.warnings || [])];
  const errors = [...(classification.errors || [])];
  let status = classification.status || SCOPE_STATUS.CLASSIFIED;
  let requiresReview = Boolean(classification.requiresReview);

  if (classification.scopeType === SCOPE_TYPES.CROSS_CUTTING && policy.crossCuttingRequiresReview) {
    requiresReview = true;
    status = SCOPE_STATUS.REQUIRES_REVIEW;
    warnings.push("Cross-cutting changes require explicit scope review.");
  }

  if (classification.scopeType === SCOPE_TYPES.UNKNOWN && policy.unknownRequiresReview) {
    requiresReview = true;
    status = SCOPE_STATUS.REQUIRES_REVIEW;
    warnings.push("Unknown changes require explicit scope review.");
  }

  if (classification.scopeType === SCOPE_TYPES.PROJECT && policy.projectMutationAllowed === false) {
    warnings.push("Project mutation remains disabled; classification is informational only.");
  }

  if (policy.packagingSafetyChecksEnabled === false) {
    warnings.push("Packaging safety checks are planned for a later P43 subphase.");
  }

  if (
    policy.providerCallsAllowed
    || policy.toolDispatchAllowed
    || policy.workerRuntimeAllowed
    || policy.dbWritesAllowed
  ) {
    errors.push("Scope policy cannot enable provider, tool, worker, or DB-write behavior in P43.1.");
    status = SCOPE_STATUS.BLOCKED;
  }

  return {
    ...classification,
    status,
    requiresReview,
    packagingRisk: classification.packagingRisk || SCOPE_RISK_LEVELS.HIGH,
    policyEvaluation: {
      classificationOnly: policy.classificationOnly === true,
      enforcementEnabled: policy.enforcementEnabled === true,
      projectMutationAllowed: policy.projectMutationAllowed === true,
      packagingSafetyChecksEnabled: policy.packagingSafetyChecksEnabled === true,
      exportPipelineEnabled: policy.exportPipelineEnabled === true,
    },
    warnings: [...new Set(warnings)],
    errors: [...new Set(errors)],
  };
}
