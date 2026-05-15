export const SKILL_TEMPLATE_VERSION = "1.0";

const DISABLED_REASON = "Skill execution not enabled yet. Use this template as governed planning metadata.";

export const GOVERNED_SKILL_TEMPLATES = [
  {
    skillId: "plan-mission",
    label: "Plan Mission",
    ownerAgent: "SHEPHERD",
    supportedAgents: ["SHEPHERD", "NEXUS"],
    requiredCapability: "mission.plan",
    requiredEvidence: ["goal summary", "scope boundary"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "Approval required for scope expansion.",
    linkedCommandCenterAction: "Command Palette: Plan Mission",
    executionEnabled: false,
  },
  {
    skillId: "create-project-brief",
    label: "Create Project Brief",
    ownerAgent: "SHEPHERD",
    supportedAgents: ["SHEPHERD", "PRISM"],
    requiredCapability: "project.brief",
    requiredEvidence: ["project profile", "mission goal"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "Human review required before project activation.",
    linkedCommandCenterAction: "Projects: Open Setup Guide",
    executionEnabled: false,
  },
  {
    skillId: "review-plan",
    label: "Review Plan",
    ownerAgent: "AUDITOR",
    supportedAgents: ["AUDITOR", "WARDEN"],
    requiredCapability: "review.plan",
    requiredEvidence: ["mission plan", "task list"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "AUDITOR review required for high-risk plans.",
    linkedCommandCenterAction: "Agent Workbench: Review",
    executionEnabled: false,
  },
  {
    skillId: "run-qa-gate",
    label: "Run QA Gate",
    ownerAgent: "SENTINEL",
    supportedAgents: ["SENTINEL", "AUDITOR"],
    requiredCapability: "qa.gate",
    requiredEvidence: ["test plan", "expected checks"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "Approval required for new runners or external dependencies.",
    linkedCommandCenterAction: "Command Palette: Run QA Gate",
    executionEnabled: false,
  },
  {
    skillId: "fix-failing-test-plan",
    label: "Fix Failing Test Plan",
    ownerAgent: "CORE",
    supportedAgents: ["CORE", "SENTINEL"],
    requiredCapability: "implementation.fix_plan",
    requiredEvidence: ["failing test evidence", "scope boundary"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "Controlled implementation approval required before mutation.",
    linkedCommandCenterAction: "Command Palette: Propose Fix",
    executionEnabled: false,
  },
  {
    skillId: "prepare-release-review",
    label: "Prepare Release Review",
    ownerAgent: "NEXUS",
    supportedAgents: ["NEXUS", "AUDITOR", "WARDEN"],
    requiredCapability: "release.review",
    requiredEvidence: ["validation evidence", "approval summary"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "Release review requires human approval.",
    linkedCommandCenterAction: "Command Palette: Prepare Ship",
    executionEnabled: false,
  },
  {
    skillId: "retro-and-lessons-learned",
    label: "Retro and Lessons Learned",
    ownerAgent: "AUDITOR",
    supportedAgents: ["AUDITOR", "SHEPHERD", "NEXUS"],
    requiredCapability: "learning.retro",
    requiredEvidence: ["activity summary", "completed work summary"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "No approval required for read-only summary.",
    linkedCommandCenterAction: "Command Palette: Run Retro",
    executionEnabled: false,
  },
  {
    skillId: "guard-freeze-scope",
    label: "Guard / Freeze Scope",
    ownerAgent: "WARDEN",
    supportedAgents: ["WARDEN", "NEXUS"],
    requiredCapability: "scope.guard",
    requiredEvidence: ["scope boundary", "risk reason"],
    disabledReason: DISABLED_REASON,
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "WARDEN approval required for lock changes.",
    linkedCommandCenterAction: "Command Palette: Guard Scope",
    executionEnabled: false,
  },
  {
    skillId: "explain-current-state",
    label: "Explain Current State",
    ownerAgent: "NEXUS",
    supportedAgents: ["NEXUS"],
    requiredCapability: "state.explain",
    requiredEvidence: ["status snapshot", "roadmap summary"],
    disabledReason: "Available only as read-only UI summary; no autonomous execution.",
    costPolicy: { providerSpendAllowed: false, estimatedUsd: 0 },
    approvalRequirement: "No approval required for read-only summary.",
    linkedCommandCenterAction: "Command Palette: Explain Current State",
    executionEnabled: false,
  },
];

export function getSkillTemplates() {
  return GOVERNED_SKILL_TEMPLATES.map((template) => ({ ...template }));
}

export function getSkillTemplateById(skillId) {
  return getSkillTemplates().find((template) => template.skillId === skillId) || null;
}

export function validateSkillTemplates(templates = getSkillTemplates()) {
  const errors = [];
  const seen = new Set();
  for (const template of templates) {
    for (const field of [
      "skillId",
      "label",
      "ownerAgent",
      "requiredCapability",
      "disabledReason",
      "approvalRequirement",
      "linkedCommandCenterAction",
    ]) {
      if (!template[field]) errors.push(`${template.skillId || "unknown"} missing ${field}`);
    }
    for (const field of ["supportedAgents", "requiredEvidence"]) {
      if (!Array.isArray(template[field]) || template[field].length === 0) {
        errors.push(`${template.skillId || "unknown"} missing ${field}`);
      }
    }
    if (template.executionEnabled !== false) errors.push(`${template.skillId} executionEnabled must be false`);
    if (template.costPolicy?.providerSpendAllowed !== false) errors.push(`${template.skillId} provider spend must be false`);
    if (seen.has(template.skillId)) errors.push(`Duplicate template: ${template.skillId}`);
    seen.add(template.skillId);
  }
  return { valid: errors.length === 0, errors };
}

export function summarizeSkillTemplates(templates = getSkillTemplates()) {
  return {
    templateVersion: SKILL_TEMPLATE_VERSION,
    templateCount: templates.length,
    executionEnabledCount: templates.filter((template) => template.executionEnabled === true).length,
    ownerAgents: [...new Set(templates.map((template) => template.ownerAgent))].sort(),
  };
}
