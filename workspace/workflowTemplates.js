/**
 * workflowTemplates.js
 * NEXUS Agentic Workspace
 *
 * Workflow template metadata for the Command Center.
 * Templates declare capability-based readiness — not phase-gating labels.
 * Execution bridges (task activation, workbench, implementation) are all live
 * as of the current local OS. Phase numbers belong in OS Roadmap only.
 */

const WORKFLOW_TEMPLATES = [
  {
    id: "build-product",
    label: "Build Product",
    description: "Turn a product idea into governed tasks across planning, design, backend, iOS, privacy, and verification.",
    category: "build",
    primaryAgents: ["SHEPHERD", "PRISM", "CORE", "SWIFT", "SENTINEL", "WARDEN", "AUDITOR"],
    capabilities: ["orchestration.plan_flow", "design.ux_flow", "implementation.backend_code", "verification.qa_gate", "security.privacy_review"],
    evidenceCreated: ["mission_contract", "task_plan", "implementation_evidence", "validation_result"],
    approvalRequired: "conditional",
    riskLevel: "high",
    enabledNow: true,
    requiredCapability: "taskActivation",
    userFacingRequirement: "Planning, task activation, workbench, and scoped implementation are available. Broad autonomous execution requires worker runtime and provider dispatch.",
    internalPhase: "P37",
    recommendedForCurrentMission: true,
  },
  {
    id: "fix-failing-test",
    label: "Fix Failing Test",
    description: "Analyze a failing validation result, classify root cause, apply narrow fix if safe, and re-run controlled validation.",
    category: "fix",
    primaryAgents: ["AUDITOR", "CORE", "SENTINEL"],
    capabilities: ["verification.code_quality_gate", "implementation.backend_code", "verification.qa_gate"],
    evidenceCreated: ["failure_analysis", "remediation_plan", "patch_summary", "validation_result"],
    approvalRequired: "conditional",
    riskLevel: "medium",
    enabledNow: true,
    requiredCapability: "controlledImplementation",
    userFacingRequirement: "Available for scoped remediation. Requires failing validation evidence.",
    internalPhase: "P37",
    recommendedForCurrentMission: false,
  },
  {
    id: "validate-backend",
    label: "Validate Backend",
    description: "Run allowlisted backend validation through preflight, controlled execution, redaction, and evidence capture.",
    category: "validate",
    primaryAgents: ["AUDITOR", "SENTINEL"],
    capabilities: ["verification.code_quality_gate", "verification.qa_gate"],
    evidenceCreated: ["command_allowlist_decision", "preflight_result", "controlled_command_result"],
    approvalRequired: false,
    riskLevel: "low",
    enabledNow: true,
    requiredCapability: "taskActivation",
    userFacingRequirement: "Available. Uses controlled runner and evidence capture.",
    internalPhase: "P37",
    recommendedForCurrentMission: true,
  },
  {
    id: "review-release",
    label: "Review Release",
    description: "Collect gates, blockers, evidence, approvals, and release readiness into a NO-GO/GO decision.",
    category: "release",
    primaryAgents: ["NEXUS", "AUDITOR", "SENTINEL", "WARDEN"],
    capabilities: ["decide.release", "verification.code_quality_gate", "verification.qa_gate", "security.privacy_review"],
    evidenceCreated: ["release_gate_summary", "release_decision"],
    approvalRequired: true,
    riskLevel: "high",
    enabledNow: false,
    requiredCapability: "releaseActionBridge",
    userFacingRequirement: "Requires release action bridge. All verification gates must be complete.",
    internalPhase: "P39",
    recommendedForCurrentMission: false,
  },
  {
    id: "plan-sprint",
    label: "Plan Sprint",
    description: "Convert PRD/product gaps into a sprint plan with tasks, owners, gates, and validation requirements.",
    category: "plan",
    primaryAgents: ["SHEPHERD", "PRISM", "AUDITOR"],
    capabilities: ["orchestration.plan_flow", "design.ux_flow", "verification.code_quality_gate"],
    evidenceCreated: ["sprint_plan", "task_plan", "risk_review"],
    approvalRequired: false,
    riskLevel: "low",
    enabledNow: true,
    requiredCapability: "taskActivation",
    userFacingRequirement: "Available for planning. Task activation bridge is ready.",
    internalPhase: "P37",
    recommendedForCurrentMission: true,
  },
  {
    id: "privacy-review",
    label: "Run Privacy Review",
    description: "Review private project data, PRD compliance constraints, public/demo boundary, and incident response readiness.",
    category: "govern",
    primaryAgents: ["WARDEN", "AUDITOR"],
    capabilities: ["security.privacy_review", "verification.code_quality_gate"],
    evidenceCreated: ["privacy_review", "data_classification", "safety_decision"],
    approvalRequired: "conditional",
    riskLevel: "medium",
    enabledNow: true,
    requiredCapability: "agentWorkbench",
    userFacingRequirement: "Available for review planning and workbench inspection. Full automated execution requires WARDEN review bridge.",
    internalPhase: "P38",
    recommendedForCurrentMission: true,
  },
  {
    id: "ios-validation",
    label: "Prepare iOS Validation",
    description: "Prepare iOS/Xcode validation path, simulator/device requirements, SENTINEL gates, and app readiness evidence.",
    category: "validate",
    primaryAgents: ["SWIFT", "SENTINEL"],
    capabilities: ["verification.qa_gate"],
    evidenceCreated: ["ios_readiness_plan", "xcode_validation_plan"],
    approvalRequired: false,
    riskLevel: "medium",
    enabledNow: false,
    requiredCapability: "iosRunner",
    userFacingRequirement: "Requires iOS/Xcode runner.",
    internalPhase: "P38",
    recommendedForCurrentMission: true,
  },
  {
    id: "govern-agent-work",
    label: "Govern Agent Work",
    description: "Inspect active tasks, agent assignments, capabilities, approvals, evidence, and policy blocks.",
    category: "govern",
    primaryAgents: ["NEXUS", "SHEPHERD", "AUDITOR", "WARDEN"],
    capabilities: ["decide.priority", "read.system_state"],
    evidenceCreated: ["governance_summary", "audit_review"],
    approvalRequired: false,
    riskLevel: "low",
    enabledNow: true,
    requiredCapability: "agentWorkbench",
    userFacingRequirement: "",
    internalPhase: "P36",
    recommendedForCurrentMission: true,
  },
];

export function getWorkflowTemplates() {
  return WORKFLOW_TEMPLATES;
}

export function getWorkflowTemplateById(id) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) || null;
}

export function validateWorkflowTemplates(templates = []) {
  const errors = [];
  const warnings = [];
  const requiredFields = ["id", "label", "description", "category", "primaryAgents", "evidenceCreated", "riskLevel", "enabledNow"];
  const seenIds = new Set();

  for (const t of templates) {
    for (const field of requiredFields) {
      if (t[field] === undefined || t[field] === null) {
        errors.push(`Template "${t.id || "unknown"}" missing field: ${field}`);
      }
    }
    if (t.id && seenIds.has(t.id)) {
      errors.push(`Duplicate template id: ${t.id}`);
    }
    if (t.id) seenIds.add(t.id);
    if (!t.enabledNow && !t.userFacingRequirement && !t.requiredCapability) {
      warnings.push(`Template "${t.id}" is disabled but has no userFacingRequirement`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
