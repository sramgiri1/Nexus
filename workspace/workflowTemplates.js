/**
 * workflowTemplates.js
 * NEXUS Agentic Workspace — P36-LOCAL
 *
 * Defines the 8 governed workflow templates available from the Command Center.
 * Templates are metadata only in P36. No workflow execution occurs here.
 * Execution bridges arrive in P37+.
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
    enabledNow: false,
    disabledReason: "Requires task activation and implementation bridge",
    nextPhase: "P37",
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
    enabledNow: false,
    disabledReason: "Requires task activation bridge",
    nextPhase: "P37",
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
    enabledNow: false,
    disabledReason: "Requires backend validation action bridge",
    nextPhase: "P37",
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
    disabledReason: "Requires release action bridge",
    nextPhase: "P39",
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
    enabledNow: false,
    disabledReason: "Requires task activation bridge",
    nextPhase: "P37",
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
    enabledNow: false,
    disabledReason: "Requires WARDEN review bridge",
    nextPhase: "P38",
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
    disabledReason: "Requires iOS/Xcode runner bridge",
    nextPhase: "P38",
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
    disabledReason: "",
    nextPhase: "P36",
    recommendedForCurrentMission: true,
  },
];

/**
 * Return all workflow templates.
 * @returns {object[]}
 */
export function getWorkflowTemplates() {
  return WORKFLOW_TEMPLATES;
}

/**
 * Find a template by id.
 * @param {string} id
 * @returns {object|null}
 */
export function getWorkflowTemplateById(id) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) || null;
}

/**
 * Validate that the template list is internally consistent.
 * @param {object[]} templates
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
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
    if (t.enabledNow && !t.disabledReason) {
      // Fine — enabled with no reason is valid
    }
    if (!t.enabledNow && !t.disabledReason) {
      warnings.push(`Template "${t.id}" is disabled but has no disabledReason`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
