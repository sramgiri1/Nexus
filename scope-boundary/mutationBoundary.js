import { CHANGE_TYPES } from "./scopeTypes.js";
import { classifyChangedPaths } from "./pathBoundary.js";

export function createMutationBoundaryDecision(input = {}) {
  const paths = Array.isArray(input.paths) ? input.paths : [];
  const classification = input.classification || classifyChangedPaths(paths);
  const requiresReview = classification.requiresReview
    || classification.changeScope === CHANGE_TYPES.CROSS_CUTTING_CHANGE
    || classification.changeScope === CHANGE_TYPES.UNKNOWN_CHANGE;

  return {
    decisionVersion: "1.0",
    changeScope: classification.changeScope || CHANGE_TYPES.UNKNOWN_CHANGE,
    paths,
    pathScopes: classification.pathScopes || [],
    mutationAllowed: false,
    requiresReview,
    requiresApproval: requiresReview,
    reason: reasonForChangeScope(classification.changeScope),
    warnings: [
      ...(classification.warnings || []),
      "P43.2 is dry-run only; mutation is not enabled.",
    ],
    errors: classification.errors || [],
  };
}

function reasonForChangeScope(changeScope) {
  if (changeScope === CHANGE_TYPES.PROJECT_CHANGE) return "Project mutation is classified but disabled in P43.2.";
  if (changeScope === CHANGE_TYPES.NEXUS_OS_CHANGE) return "NEXUS OS mutation is classified but disabled in P43.2.";
  if (changeScope === CHANGE_TYPES.CROSS_CUTTING_CHANGE) return "Cross-cutting changes require explicit review.";
  if (changeScope === CHANGE_TYPES.DEMO_CHANGE) return "Demo changes are classified but still mutation-disabled in P43.2.";
  return "Unknown changes require review.";
}

export function validateMutationBoundaryDecision(decision = {}) {
  const errors = [];
  if (decision.decisionVersion !== "1.0") errors.push("decisionVersion must be 1.0");
  if (!Object.values(CHANGE_TYPES).includes(decision.changeScope)) errors.push("changeScope is invalid");
  if (!Array.isArray(decision.paths)) errors.push("paths must be an array");
  if (!Array.isArray(decision.pathScopes)) errors.push("pathScopes must be an array");
  if (decision.mutationAllowed !== false) errors.push("mutationAllowed must remain false in P43.2");
  if (!Array.isArray(decision.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(decision.errors)) errors.push("errors must be an array");
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function isProjectMutationAllowed(input = {}) {
  return createMutationBoundaryDecision(input).mutationAllowed === true;
}

export function isOsMutationAllowed(input = {}) {
  return createMutationBoundaryDecision(input).mutationAllowed === true;
}

export function requiresCrossCuttingReview(input = {}) {
  return createMutationBoundaryDecision(input).changeScope === CHANGE_TYPES.CROSS_CUTTING_CHANGE;
}
