import { NEXUS_AGENT_REGISTRY } from "../agent-registry/agentRegistrySchema.js";

const RISKY_DATA_CLASSIFICATIONS = new Set(["secret", "restricted"]);
const RISKY_TOOLS = new Set(["provider-dispatch", "mcp-tool-dispatch", "production-db-write", "worker-execution"]);

function asSet(values = []) {
  return new Set(values.filter(Boolean));
}

function diffList(before = [], after = []) {
  const beforeSet = asSet(before);
  const afterSet = asSet(after);
  return {
    added: [...afterSet].filter((item) => !beforeSet.has(item)),
    removed: [...beforeSet].filter((item) => !afterSet.has(item)),
    unchanged: [...afterSet].filter((item) => beforeSet.has(item)),
  };
}

function findAgent(agentId, registry = NEXUS_AGENT_REGISTRY) {
  return registry.find((agent) => agent.agentId === agentId) || null;
}

export function classifyBoundaryDelta(delta = {}) {
  const expansion =
    (delta.added || []).length > 0 ||
    delta.providerDispatchAllowed === true ||
    delta.dbWritesAllowed === true ||
    delta.workerRuntimeAllowed === true;
  const reduction = (delta.removed || []).length > 0 && !expansion;

  if ((delta.added || []).some((item) => RISKY_TOOLS.has(item) || RISKY_DATA_CLASSIFICATIONS.has(item))) {
    return { classification: "risky_expansion", riskLevel: "critical", reviewRequired: true };
  }
  if (expansion) return { classification: "permission_expansion", riskLevel: "high", reviewRequired: true };
  if (reduction) return { classification: "permission_reduction", riskLevel: "low", reviewRequired: false };
  return { classification: "no_effect", riskLevel: "low", reviewRequired: false };
}

export function buildAgentBoundaryDiff(proposal = {}, options = {}) {
  const agent = findAgent(proposal.agentId, options.registry || NEXUS_AGENT_REGISTRY);
  const delta = proposal.permissionDelta || {};
  const proposed = {
    allowedCapabilities: [
      ...(agent?.allowedCapabilities || []),
      ...(delta.addedCapabilities || []),
    ].filter((capability) => !(delta.removedCapabilities || []).includes(capability)),
    allowedTools: [
      ...(agent?.allowedTools || []),
      ...(delta.addedTools || []),
    ].filter((tool) => !(delta.removedTools || []).includes(tool)),
    allowedPathPatterns: [
      ...(agent?.allowedPathPatterns || []),
      ...(delta.addedPathPatterns || []),
    ].filter((path) => !(delta.removedPathPatterns || []).includes(path)),
    allowedDataClassifications: [
      ...(agent?.allowedDataClassifications || []),
      ...(delta.addedDataClassifications || []),
    ].filter((classification) => !(delta.removedDataClassifications || []).includes(classification)),
  };

  const capabilityDelta = diffList(agent?.allowedCapabilities, proposed.allowedCapabilities);
  const toolDelta = diffList(agent?.allowedTools, proposed.allowedTools);
  const pathBoundaryDelta = diffList(agent?.allowedPathPatterns, proposed.allowedPathPatterns);
  const dataClassificationDelta = diffList(agent?.allowedDataClassifications, proposed.allowedDataClassifications);

  const classifications = {
    capability: classifyBoundaryDelta(capabilityDelta),
    toolPermission: classifyBoundaryDelta({
      ...toolDelta,
      providerDispatchAllowed: delta.providerDispatchAllowed,
      dbWritesAllowed: delta.dbWritesAllowed,
      workerRuntimeAllowed: delta.workerRuntimeAllowed,
    }),
    pathBoundary: classifyBoundaryDelta(pathBoundaryDelta),
    dataClassification: classifyBoundaryDelta(dataClassificationDelta),
    costBudget: classifyBoundaryDelta({
      added: delta.costBudgetIncrease ? ["cost-budget-increase"] : [],
      removed: delta.costBudgetReduction ? ["cost-budget-reduction"] : [],
    }),
    approvalAuthority: classifyBoundaryDelta({
      added: delta.approvalAuthorityAdded ? ["approval-authority"] : [],
      removed: delta.approvalAuthorityRemoved ? ["approval-authority"] : [],
    }),
  };

  return {
    diffVersion: "1.0",
    phase: "P49.2",
    proposalId: proposal.proposalId,
    agentId: proposal.agentId,
    mutationAllowed: false,
    deltas: {
      capability: capabilityDelta,
      toolPermission: toolDelta,
      pathBoundary: pathBoundaryDelta,
      dataClassification: dataClassificationDelta,
      costBudget: {
        added: delta.costBudgetIncrease ? ["cost-budget-increase"] : [],
        removed: delta.costBudgetReduction ? ["cost-budget-reduction"] : [],
      },
      approvalAuthority: {
        added: delta.approvalAuthorityAdded ? ["approval-authority"] : [],
        removed: delta.approvalAuthorityRemoved ? ["approval-authority"] : [],
      },
    },
    classifications,
    riskyExpansion: Object.values(classifications).some((item) => ["high", "critical"].includes(item.riskLevel)),
    harmlessReduction: Object.values(classifications).some((item) => item.classification === "permission_reduction"),
  };
}

export function summarizeBoundaryDiff(diff = {}) {
  const deltas = diff.deltas || {};
  const added = Object.values(deltas).reduce((count, delta) => count + ((delta.added || []).length), 0);
  const removed = Object.values(deltas).reduce((count, delta) => count + ((delta.removed || []).length), 0);
  return {
    proposalId: diff.proposalId,
    agentId: diff.agentId,
    added,
    removed,
    riskyExpansion: diff.riskyExpansion === true,
    harmlessReduction: diff.harmlessReduction === true,
    reviewRequired: Object.values(diff.classifications || {}).some((item) => item.reviewRequired),
  };
}

export function validateBoundaryDiff(diff = {}) {
  const errors = [];
  if (!diff.proposalId) errors.push("Boundary diff missing proposalId.");
  if (!diff.agentId) errors.push("Boundary diff missing agentId.");
  if (diff.mutationAllowed === true) errors.push("Boundary diff cannot allow mutation.");
  for (const key of ["capability", "toolPermission", "pathBoundary", "dataClassification", "costBudget", "approvalAuthority"]) {
    if (!diff.deltas?.[key]) errors.push(`Boundary diff missing ${key} delta.`);
    if (!diff.classifications?.[key]) errors.push(`Boundary diff missing ${key} classification.`);
  }
  return { ok: errors.length === 0, errors };
}
