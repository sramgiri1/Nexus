export const AGENT_DEFINITION_APPROVAL_STATES = [
  "proposed",
  "under_review",
  "requires_human_approval",
  "approved",
  "rejected",
  "changes_requested",
  "expired",
];

const ALLOWED_TRANSITIONS = {
  proposed: ["under_review", "rejected", "expired"],
  under_review: ["requires_human_approval", "approved", "rejected", "changes_requested", "expired"],
  requires_human_approval: ["approved", "rejected", "changes_requested", "expired"],
  approved: [],
  rejected: [],
  changes_requested: ["proposed", "expired"],
  expired: [],
};

export function canTransitionAgentDefinitionProposal(fromStatus, toStatus, context = {}) {
  if (!AGENT_DEFINITION_APPROVAL_STATES.includes(fromStatus) || !AGENT_DEFINITION_APPROVAL_STATES.includes(toStatus)) {
    return { ok: false, reason: "Unknown approval state." };
  }
  if (!(ALLOWED_TRANSITIONS[fromStatus] || []).includes(toStatus)) {
    return { ok: false, reason: `Transition ${fromStatus} -> ${toStatus} is not allowed.` };
  }
  if (toStatus === "approved" && context.requiresHumanApproval && context.humanApproved !== true) {
    return { ok: false, reason: "Human approval is required before approval." };
  }
  if (toStatus === "approved" && context.requiredReviewsComplete !== true) {
    return { ok: false, reason: "Required AUDITOR/WARDEN reviews must be complete before approval." };
  }
  return { ok: true, reason: "Transition allowed." };
}

export function buildApprovalGateRecord(input = {}) {
  const transition = canTransitionAgentDefinitionProposal(input.fromStatus || "under_review", input.toStatus || "requires_human_approval", input);
  return {
    gateVersion: "1.0",
    phase: "P49.4",
    proposalId: input.proposalId,
    fromStatus: input.fromStatus || "under_review",
    toStatus: input.toStatus || "requires_human_approval",
    transitionAllowed: transition.ok,
    reason: transition.reason,
    requiredReviewsComplete: input.requiredReviewsComplete === true,
    requiresHumanApproval: input.requiresHumanApproval !== false,
    humanApproved: input.humanApproved === true,
    mutationAllowed: false,
    recordedAt: input.recordedAt || new Date().toISOString(),
  };
}

export function validateApprovalGateRecord(record = {}) {
  const errors = [];
  if (!record.proposalId) errors.push("Approval gate missing proposalId.");
  if (!AGENT_DEFINITION_APPROVAL_STATES.includes(record.fromStatus)) errors.push("Approval gate has invalid fromStatus.");
  if (!AGENT_DEFINITION_APPROVAL_STATES.includes(record.toStatus)) errors.push("Approval gate has invalid toStatus.");
  if (record.mutationAllowed === true) errors.push("Approval gate cannot mutate agent definitions.");
  if (record.toStatus === "approved" && record.requiresHumanApproval && record.humanApproved !== true) {
    errors.push("Approval gate cannot approve without required human approval.");
  }
  return { ok: errors.length === 0, errors };
}
