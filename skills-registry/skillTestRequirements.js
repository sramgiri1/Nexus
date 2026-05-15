import { getSkillTemplates } from "./skillTemplates.js";

export const SKILL_TEST_REQUIREMENTS_VERSION = "1.0";

const DEFAULT_STATIC_CHECKS = [
  "npm run check:skill-registry",
  "npm run check:format-readability",
];

const DEFAULT_CONTRACT_CHECKS = [
  "skill contract validates allowed and forbidden use",
  "skill contract blocks provider, tool, worker, DB, and project mutation execution",
];

const DEFAULT_UI_CHECKS = [
  "Command Center Skill Registry shows the skill as not executable",
  "Command Center Skill Registry shows required evidence and disabled reason",
];

const DEFAULT_FUTURE_RUNTIME_CHECKS = [
  "governed action bridge readiness check",
  "provider dispatch boundary check",
  "worker runtime boundary check",
];

function buildRequirement(template) {
  return {
    skillId: template.skillId,
    label: template.label,
    requiredStaticChecks: [...DEFAULT_STATIC_CHECKS],
    requiredContractChecks: [
      ...DEFAULT_CONTRACT_CHECKS,
      `template approval requirement present for ${template.skillId}`,
    ],
    requiredUiChecks: [...DEFAULT_UI_CHECKS],
    requiredEvidenceChecks: template.requiredEvidence.map((evidence) => `evidence required: ${evidence}`),
    futureRuntimeChecks: [...DEFAULT_FUTURE_RUNTIME_CHECKS],
    futureRuntimeEnabled: false,
    executionEnabled: false,
  };
}

export function getSkillTestRequirements(templates = getSkillTemplates()) {
  return templates.map((template) => buildRequirement(template));
}

export function getSkillTestRequirementById(skillId) {
  return getSkillTestRequirements().find((requirement) => requirement.skillId === skillId) || null;
}

export function validateSkillTestRequirements(requirements = getSkillTestRequirements(), templates = getSkillTemplates()) {
  const errors = [];
  const templateIds = new Set(templates.map((template) => template.skillId));
  const seen = new Set();

  for (const requirement of requirements) {
    if (!templateIds.has(requirement.skillId)) {
      errors.push(`Requirement references unknown skill: ${requirement.skillId}`);
    }
    for (const field of [
      "requiredStaticChecks",
      "requiredContractChecks",
      "requiredUiChecks",
      "requiredEvidenceChecks",
      "futureRuntimeChecks",
    ]) {
      if (!Array.isArray(requirement[field]) || requirement[field].length === 0) {
        errors.push(`${requirement.skillId || "unknown"} missing ${field}`);
      }
    }
    if (requirement.executionEnabled !== false) {
      errors.push(`${requirement.skillId} executionEnabled must be false`);
    }
    if (requirement.futureRuntimeEnabled !== false) {
      errors.push(`${requirement.skillId} futureRuntimeEnabled must be false`);
    }
    if (seen.has(requirement.skillId)) {
      errors.push(`Duplicate test requirement: ${requirement.skillId}`);
    }
    seen.add(requirement.skillId);
  }

  for (const templateId of templateIds) {
    if (!seen.has(templateId)) errors.push(`Missing test requirements for ${templateId}`);
  }

  return { valid: errors.length === 0, errors };
}

export function summarizeSkillTestRequirements(requirements = getSkillTestRequirements()) {
  return {
    requirementsVersion: SKILL_TEST_REQUIREMENTS_VERSION,
    requirementCount: requirements.length,
    executionEnabledCount: requirements.filter((requirement) => requirement.executionEnabled === true).length,
    futureRuntimeEnabledCount: requirements.filter((requirement) => requirement.futureRuntimeEnabled === true).length,
    staticCheckCount: requirements.reduce((count, requirement) => count + requirement.requiredStaticChecks.length, 0),
    evidenceCheckCount: requirements.reduce((count, requirement) => count + requirement.requiredEvidenceChecks.length, 0),
  };
}
