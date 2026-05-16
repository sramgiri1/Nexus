export function createTestProposal(input = {}) {
  return {
    proposalId: input.proposalId || `test-proposal-${input.gapId || Date.now()}`,
    title: input.title || "Governed test proposal",
    scope: input.scope || "project",
    projectId: input.projectId,
    linkedRequirement: input.linkedRequirement || "unknown-requirement",
    gapId: input.gapId || "unknown-gap",
    recommendedSuiteType: input.recommendedSuiteType || "project validation suite",
    ownerAgent: input.ownerAgent || "AUDITOR",
    riskLevel: input.riskLevel || "medium",
    estimatedEffort: input.estimatedEffort || "small",
    executionEnabled: false,
    mutationAllowed: false,
    approvalRequired: true,
    evidenceRequired: true,
    status: input.status || "preview_only",
  };
}

export function validateTestProposal(proposal = createTestProposal()) {
  const errors = [];
  for (const field of ["proposalId", "title", "scope", "linkedRequirement", "gapId", "recommendedSuiteType", "ownerAgent", "riskLevel", "status"]) {
    if (!proposal[field]) errors.push(`Missing proposal field: ${field}`);
  }
  if (proposal.executionEnabled !== false) errors.push("Test proposal must not enable execution");
  if (proposal.mutationAllowed !== false) errors.push("Test proposal must not allow mutation");
  if (proposal.approvalRequired !== true) errors.push("Test proposal must require approval");
  if (proposal.evidenceRequired !== true) errors.push("Test proposal must require evidence");
  return { valid: errors.length === 0, errors };
}

export function summarizeTestProposal(proposal = createTestProposal()) {
  return {
    proposalId: proposal.proposalId,
    scope: proposal.scope,
    riskLevel: proposal.riskLevel,
    status: proposal.status,
    executionEnabled: proposal.executionEnabled,
    mutationAllowed: proposal.mutationAllowed,
    approvalRequired: proposal.approvalRequired,
  };
}

export function listTestProposalPreview(context = {}) {
  const gaps = context.gaps || [
    {
      gapId: "gap-prd-ios-validation",
      domain: "iOS validation",
      scope: "project",
      linkedRequirement: "prd-ios-validation",
      expectedSuiteType: "iOS validation suite",
      ownerAgent: "SWIFT",
      severity: "high",
    },
  ];
  return gaps.map((gap) =>
    createTestProposal({
      title: `Add coverage for ${gap.domain}`,
      scope: gap.scope,
      projectId: context.projectId,
      linkedRequirement: gap.linkedRequirement,
      gapId: gap.gapId,
      recommendedSuiteType: gap.expectedSuiteType,
      ownerAgent: gap.ownerAgent,
      riskLevel: gap.severity,
    }),
  );
}
