export const SKILL_CONTRACT_VERSION = "1.0";

export function createSkillContract({
  skillId,
  purpose,
  inputContract,
  outputContract,
  allowedUseCases = [],
  forbiddenUseCases = [],
  requiredAgentBoundary = {},
  requiredProjectProfile = {},
  requiredEvidence = [],
  testPlan = [],
  rollbackPlanRequired = false,
  costPolicy = { providerSpendAllowed: false, estimatedUsd: 0 },
  safetyNotes = [],
} = {}) {
  return {
    contractVersion: SKILL_CONTRACT_VERSION,
    skillId,
    purpose,
    inputContract,
    outputContract,
    allowedUseCases,
    forbiddenUseCases,
    requiredAgentBoundary,
    requiredProjectProfile,
    requiredEvidence,
    testPlan,
    rollbackPlanRequired,
    costPolicy,
    safetyNotes,
    executionEnabled: false,
    providerCallsAllowed: false,
    toolCallsAllowed: false,
    projectMutationAllowed: false,
  };
}

export function validateSkillContract(contract) {
  const errors = [];

  for (const field of ["contractVersion", "skillId", "purpose"]) {
    if (!contract?.[field] || typeof contract[field] !== "string") {
      errors.push(`Missing string field: ${field}`);
    }
  }

  for (const field of ["inputContract", "outputContract", "requiredAgentBoundary", "requiredProjectProfile", "costPolicy"]) {
    if (!contract?.[field] || typeof contract[field] !== "object" || Array.isArray(contract[field])) {
      errors.push(`Missing object field: ${field}`);
    }
  }

  for (const field of ["allowedUseCases", "forbiddenUseCases", "requiredEvidence", "testPlan", "safetyNotes"]) {
    if (!Array.isArray(contract?.[field])) {
      errors.push(`Missing array field: ${field}`);
    }
  }

  if (contract?.executionEnabled !== false) errors.push("executionEnabled must be false");
  if (contract?.providerCallsAllowed !== false) errors.push("providerCallsAllowed must be false");
  if (contract?.toolCallsAllowed !== false) errors.push("toolCallsAllowed must be false");
  if (contract?.projectMutationAllowed !== false) errors.push("projectMutationAllowed must be false");
  if (contract?.costPolicy?.providerSpendAllowed !== false) errors.push("costPolicy.providerSpendAllowed must be false");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildSkillContracts(skills = []) {
  return skills.map((skill) => createSkillContract({
    skillId: skill.skillId,
    purpose: skill.description,
    inputContract: skill.inputsSchema,
    outputContract: skill.outputsSchema,
    allowedUseCases: [
      `Use ${skill.name} for governed ${skill.category} planning and review.`,
    ],
    forbiddenUseCases: [
      "Do not execute providers, tools, workers, DB writes, or project mutations.",
      "Do not bypass approval, evidence, cost, or boundary requirements.",
    ],
    requiredAgentBoundary: {
      ownerAgent: skill.ownerAgent,
      allowedAgents: skill.allowedAgents,
      requiredCapabilities: skill.requiredCapabilities,
    },
    requiredProjectProfile: {
      compatibleProjectTypes: skill.compatibleProjectTypes,
      compatibleStacks: skill.compatibleStacks,
    },
    requiredEvidence: skill.requiredEvidence,
    testPlan: skill.testRequirements,
    rollbackPlanRequired: skill.riskLevel === "high",
    costPolicy: skill.costPolicy,
    safetyNotes: [
      "Registry and contract are documentation/governance artifacts only in P50.",
      "Skill execution remains disabled.",
    ],
  }));
}

export function summarizeSkillContracts(contracts = []) {
  return {
    contractVersion: SKILL_CONTRACT_VERSION,
    contractCount: contracts.length,
    rollbackRequiredCount: contracts.filter((contract) => contract.rollbackPlanRequired).length,
    executionEnabledCount: contracts.filter((contract) => contract.executionEnabled === true).length,
    providerCallsAllowedCount: contracts.filter((contract) => contract.providerCallsAllowed === true).length,
    projectMutationAllowedCount: contracts.filter((contract) => contract.projectMutationAllowed === true).length,
  };
}
