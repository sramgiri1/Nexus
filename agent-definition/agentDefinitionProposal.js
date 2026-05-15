import { NEXUS_AGENT_REGISTRY } from "../agent-registry/agentRegistrySchema.js";

export const AGENT_DEFINITION_PROPOSAL_VERSION = "1.0";

export const AGENT_DEFINITION_CHANGE_TYPES = [
  "capability_update",
  "boundary_update",
  "tool_permission_update",
  "data_access_update",
  "cost_policy_update",
  "approval_authority_update",
  "documentation_update",
];

export const AGENT_DEFINITION_PROPOSAL_STATUSES = [
  "proposed",
  "under_review",
  "requires_human_approval",
  "approved",
  "rejected",
  "changes_requested",
  "expired",
];

const RISK_ORDER = ["low", "medium", "high", "critical"];

function findAgent(agentId, registry = NEXUS_AGENT_REGISTRY) {
  return registry.find((agent) => agent.agentId === agentId) || null;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function classifyProposalRisk(input = {}) {
  const delta = input.permissionDelta || {};
  let risk = input.riskLevel || "low";

  if ((delta.addedCapabilities || []).length > 0) risk = "medium";
  if ((delta.addedTools || []).length > 0) risk = "high";
  if ((delta.addedPathPatterns || []).some((pattern) => String(pattern).includes("projects/"))) risk = "high";
  if ((delta.addedDataClassifications || []).includes("secret")) risk = "critical";
  if (delta.providerDispatchAllowed || delta.dbWritesAllowed || delta.workerRuntimeAllowed) risk = "critical";

  return RISK_ORDER.includes(risk) ? risk : "medium";
}

export function requiredReviewersForProposal(input = {}) {
  const risk = classifyProposalRisk(input);
  const delta = input.permissionDelta || {};
  const reviewers = ["AUDITOR"];

  if (["medium", "high", "critical"].includes(risk)) reviewers.push("WARDEN");
  if ((delta.addedCapabilities || []).some((capability) => String(capability).startsWith("implementation."))) reviewers.push("SENTINEL");

  return unique([...(input.requiredReviewers || []), ...reviewers]);
}

export function createAgentDefinitionProposal(input = {}, options = {}) {
  const registry = options.registry || NEXUS_AGENT_REGISTRY;
  const agent = findAgent(input.agentId, registry);
  const now = options.generatedAt || new Date().toISOString();
  const riskLevel = classifyProposalRisk(input);
  const proposal = {
    proposalVersion: AGENT_DEFINITION_PROPOSAL_VERSION,
    proposalId: input.proposalId || `agent-def-proposal-${String(input.agentId || "unknown").toLowerCase()}-${Date.now()}`,
    agentId: input.agentId,
    agentDisplayName: agent?.displayName || input.agentId || "Unknown Agent",
    changeType: input.changeType || "documentation_update",
    requestedBy: input.requestedBy || "NEXUS operator",
    reason: input.reason || "No reason supplied.",
    affectedCapabilities: input.affectedCapabilities || [],
    permissionDelta: input.permissionDelta || {
      addedCapabilities: [],
      removedCapabilities: [],
      addedTools: [],
      removedTools: [],
      addedPathPatterns: [],
      removedPathPatterns: [],
      addedDataClassifications: [],
      removedDataClassifications: [],
      providerDispatchAllowed: false,
      dbWritesAllowed: false,
      workerRuntimeAllowed: false,
    },
    riskLevel,
    requiredReviewers: requiredReviewersForProposal({ ...input, riskLevel }),
    rollbackPlan: input.rollbackPlan || "Restore the previous agent definition version and re-run agent registry checks.",
    evidenceRequirements: input.evidenceRequirements || [
      "proposal-record",
      "boundary-diff",
      "AUDITOR-review",
      "WARDEN-review",
      "human-approval-if-required",
      "rollback-plan",
    ],
    status: input.status || "proposed",
    createdAt: now,
    updatedAt: now,
    mutationAllowed: false,
    appliesToAgentFile: false,
  };

  return proposal;
}

export function validateAgentDefinitionProposal(proposal = {}, registry = NEXUS_AGENT_REGISTRY) {
  const errors = [];
  const warnings = [];
  const agent = findAgent(proposal.agentId, registry);

  for (const field of [
    "proposalId",
    "agentId",
    "changeType",
    "requestedBy",
    "reason",
    "affectedCapabilities",
    "permissionDelta",
    "riskLevel",
    "requiredReviewers",
    "rollbackPlan",
    "evidenceRequirements",
    "status",
  ]) {
    if (proposal[field] === undefined || proposal[field] === null || proposal[field] === "") {
      errors.push(`Missing required proposal field: ${field}`);
    }
  }

  if (!agent) errors.push(`Unknown agentId: ${proposal.agentId}`);
  if (!AGENT_DEFINITION_CHANGE_TYPES.includes(proposal.changeType)) errors.push(`Invalid changeType: ${proposal.changeType}`);
  if (!AGENT_DEFINITION_PROPOSAL_STATUSES.includes(proposal.status)) errors.push(`Invalid status: ${proposal.status}`);
  if (!RISK_ORDER.includes(proposal.riskLevel)) errors.push(`Invalid riskLevel: ${proposal.riskLevel}`);
  if (!Array.isArray(proposal.requiredReviewers) || proposal.requiredReviewers.length === 0) errors.push("At least one reviewer is required.");
  if (proposal.mutationAllowed === true) errors.push("Proposal cannot allow direct mutation.");

  const delta = proposal.permissionDelta || {};
  if (delta.providerDispatchAllowed || delta.dbWritesAllowed || delta.workerRuntimeAllowed) {
    warnings.push("Proposal requests a runtime expansion and must require WARDEN and human approval.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function summarizeAgentDefinitionProposal(proposal = {}) {
  return {
    proposalId: proposal.proposalId,
    agentId: proposal.agentId,
    changeType: proposal.changeType,
    riskLevel: proposal.riskLevel,
    status: proposal.status,
    requiredReviewers: proposal.requiredReviewers || [],
    affectedCapabilityCount: (proposal.affectedCapabilities || []).length,
    mutationAllowed: proposal.mutationAllowed === true,
  };
}

export function buildSampleAgentDefinitionProposal() {
  return createAgentDefinitionProposal({
    proposalId: "agent-def-proposal-core-docs-boundary",
    agentId: "CORE",
    changeType: "capability_update",
    requestedBy: "NEXUS operator",
    reason: "Allow CORE to propose agent definition update records while keeping runtime execution disabled.",
    affectedCapabilities: ["agent_definition.propose_update", "implementation.propose_change"],
    permissionDelta: {
      addedCapabilities: ["agent_definition.propose_update"],
      removedCapabilities: [],
      addedTools: [],
      removedTools: [],
      addedPathPatterns: ["agent-definition/**"],
      removedPathPatterns: [],
      addedDataClassifications: [],
      removedDataClassifications: [],
      providerDispatchAllowed: false,
      dbWritesAllowed: false,
      workerRuntimeAllowed: false,
    },
    rollbackPlan: "Remove the proposed agent_definition.propose_update capability from the dry-run proposal and keep the current CORE definition unchanged.",
  });
}
