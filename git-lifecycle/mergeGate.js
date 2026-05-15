import { buildPrDraft } from "./prDraftModel.js";
import { buildRollbackBranchPlan, validateRollbackBranchPlan } from "./rollbackBranchPlan.js";

const MERGE_GATE_STATUSES = [
  "not-ready",
  "ready-for-review",
  "blocked",
  "approved-for-merge-metadata-only",
];

export function evaluateMergeGate(input = {}) {
  const prDraft = input.prDraft || buildPrDraft({ prDraftId: "pr-draft-p44-6" });
  const rollbackPlan = input.rollbackPlan || buildRollbackBranchPlan({ changeId: prDraft.prDraftId });
  const checks = {
    scopeClassificationPresent: Boolean(prDraft.scope),
    projectOsBoundaryClean: input.projectOsBoundaryClean !== false,
    evidenceLinked: Array.isArray(prDraft.evidenceIds) && prDraft.evidenceIds.length > 0,
    testsRequired: true,
    testsRun: input.testsRun === true,
    reviewComplete: input.reviewComplete === true,
    approvalsPresent: input.approvalsPresent === true,
    rollbackPlanPresent: Boolean(rollbackPlan),
    packageSafetyClear: input.packageSafetyClear !== false,
    costRiskClear: input.costRiskClear !== false,
  };
  const blockers = Object.entries(checks)
    .filter(([, passed]) => passed !== true)
    .map(([name]) => name);
  const status = blockers.length
    ? (checks.scopeClassificationPresent && checks.rollbackPlanPresent ? "ready-for-review" : "not-ready")
    : "approved-for-merge-metadata-only";

  return {
    gateVersion: "1.0",
    phase: "P44.6",
    status,
    allowedStatuses: MERGE_GATE_STATUSES,
    prDraftId: prDraft.prDraftId,
    repoIds: prDraft.repoIds,
    checks,
    blockers,
    rollbackPlan,
    mergeAllowed: false,
    pushAllowed: false,
    releaseAllowed: false,
    packageCreationAllowed: false,
  };
}

export function validateMergeGate(gate) {
  const errors = [];
  if (gate?.gateVersion !== "1.0") errors.push("gateVersion must be 1.0");
  if (gate?.phase !== "P44.6") errors.push("phase must be P44.6");
  if (!MERGE_GATE_STATUSES.includes(gate?.status)) errors.push(`invalid status: ${gate?.status}`);
  if (!gate?.prDraftId) errors.push("prDraftId is required");
  if (!Array.isArray(gate?.repoIds) || !gate.repoIds.length) errors.push("repoIds are required");
  if (!gate?.checks || typeof gate.checks !== "object") errors.push("checks object is required");
  if (!Array.isArray(gate?.blockers)) errors.push("blockers must be an array");
  for (const field of ["mergeAllowed", "pushAllowed", "releaseAllowed", "packageCreationAllowed"]) {
    if (gate?.[field] !== false) errors.push(`${field} must be false`);
  }
  errors.push(...validateRollbackBranchPlan(gate?.rollbackPlan).errors);
  return { valid: errors.length === 0, errors };
}

export function summarizeMergeGate(gate) {
  return {
    prDraftId: gate.prDraftId,
    status: gate.status,
    blockerCount: gate.blockers.length,
    mergeAllowed: gate.mergeAllowed,
    pushAllowed: gate.pushAllowed,
    releaseAllowed: gate.releaseAllowed,
    packageCreationAllowed: gate.packageCreationAllowed,
  };
}
