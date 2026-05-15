export const SKILL_REGISTRY_VERSION = "1.0";

export const SKILL_CATEGORIES = [
  "planning",
  "review",
  "qa",
  "implementation",
  "release",
  "docs",
  "security",
  "product",
  "platform",
];

export const SKILL_STATUSES = ["draft", "available", "deprecated", "blocked"];

export const SKILL_RISK_LEVELS = ["low", "medium", "high"];

export function validateSkillDefinition(skill) {
  const errors = [];
  const requiredStringFields = [
    "skillId",
    "name",
    "description",
    "category",
    "ownerAgent",
    "riskLevel",
    "dataClassification",
    "version",
    "status",
    "createdAt",
    "updatedAt",
  ];

  for (const field of requiredStringFields) {
    if (!skill?.[field] || typeof skill[field] !== "string") {
      errors.push(`Missing string field: ${field}`);
    }
  }

  if (!SKILL_CATEGORIES.includes(skill?.category)) {
    errors.push(`Invalid category: ${skill?.category}`);
  }

  if (!SKILL_STATUSES.includes(skill?.status)) {
    errors.push(`Invalid status: ${skill?.status}`);
  }

  if (!SKILL_RISK_LEVELS.includes(skill?.riskLevel)) {
    errors.push(`Invalid riskLevel: ${skill?.riskLevel}`);
  }

  for (const field of [
    "allowedAgents",
    "requiredCapabilities",
    "compatibleProjectTypes",
    "compatibleStacks",
    "requiredEvidence",
    "testRequirements",
    "requiresApprovalFor",
  ]) {
    if (!Array.isArray(skill?.[field])) {
      errors.push(`Missing array field: ${field}`);
    }
  }

  for (const field of ["inputsSchema", "outputsSchema", "costPolicy"]) {
    if (!skill?.[field] || typeof skill[field] !== "object" || Array.isArray(skill[field])) {
      errors.push(`Missing object field: ${field}`);
    }
  }

  for (const field of [
    "executionEnabled",
    "providerCallsAllowed",
    "toolCallsAllowed",
    "projectMutationAllowed",
  ]) {
    if (skill?.[field] !== false) {
      errors.push(`${field} must be false in P50`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSkillRegistry(skills) {
  const errors = [];
  const seen = new Set();

  if (!Array.isArray(skills)) {
    return { valid: false, errors: ["Registry must be an array"] };
  }

  for (const skill of skills) {
    const validation = validateSkillDefinition(skill);
    if (!validation.valid) {
      errors.push(...validation.errors.map((error) => `${skill?.skillId || "unknown"}: ${error}`));
    }
    if (seen.has(skill.skillId)) {
      errors.push(`Duplicate skillId: ${skill.skillId}`);
    }
    seen.add(skill.skillId);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function summarizeSkillRegistry(skills) {
  const categoryCounts = {};
  const statusCounts = {};
  const riskCounts = {};

  for (const skill of skills || []) {
    categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
    statusCounts[skill.status] = (statusCounts[skill.status] || 0) + 1;
    riskCounts[skill.riskLevel] = (riskCounts[skill.riskLevel] || 0) + 1;
  }

  return {
    registryVersion: SKILL_REGISTRY_VERSION,
    skillCount: Array.isArray(skills) ? skills.length : 0,
    categoryCounts,
    statusCounts,
    riskCounts,
    executionEnabledCount: (skills || []).filter((skill) => skill.executionEnabled === true).length,
    providerCallsAllowedCount: (skills || []).filter((skill) => skill.providerCallsAllowed === true).length,
    toolCallsAllowedCount: (skills || []).filter((skill) => skill.toolCallsAllowed === true).length,
    projectMutationAllowedCount: (skills || []).filter((skill) => skill.projectMutationAllowed === true).length,
  };
}
