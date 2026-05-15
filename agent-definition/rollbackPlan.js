export function createAgentDefinitionRollbackPlan(input = {}) {
  return {
    rollbackPlanVersion: "1.0",
    phase: "P49.5",
    proposalId: input.proposalId,
    agentId: input.agentId,
    previousVersionPointer: input.previousVersionPointer || "agent-registry-current",
    impactedBoundaries: input.impactedBoundaries || ["capabilities", "path-boundaries", "data-classifications"],
    verificationChecklist: input.verificationChecklist || [
      "Confirm proposal status is approved before any future application.",
      "Restore previous version pointer if validation fails.",
      "Run agent registry and boundary checks.",
      "Confirm no provider/tool/worker/DB permissions were granted unexpectedly.",
    ],
    rollbackExecutionEnabled: false,
    mutationAllowed: false,
  };
}

export function validateRollbackPlan(plan = {}) {
  const errors = [];
  if (!plan.proposalId) errors.push("Rollback plan missing proposalId.");
  if (!plan.agentId) errors.push("Rollback plan missing agentId.");
  if (!Array.isArray(plan.impactedBoundaries) || plan.impactedBoundaries.length === 0) errors.push("Rollback plan missing impacted boundaries.");
  if (!Array.isArray(plan.verificationChecklist) || plan.verificationChecklist.length === 0) errors.push("Rollback plan missing verification checklist.");
  if (plan.rollbackExecutionEnabled === true) errors.push("Rollback execution cannot be enabled in P49.");
  if (plan.mutationAllowed === true) errors.push("Rollback plan cannot mutate agent definitions.");
  return { ok: errors.length === 0, errors };
}
