import {
  AGENT_STATUSES,
  AGENT_TYPES,
  CHANGE_SCOPES,
  DATA_CLASSIFICATIONS,
} from "./agentTypes.js";

export const AGENT_REGISTRY_SCHEMA_VERSION = "1.0";

export const REQUIRED_AGENT_FIELDS = [
  "agentId",
  "displayName",
  "role",
  "version",
  "owner",
  "status",
  "agentType",
  "allowedCapabilities",
  "forbiddenCapabilities",
  "allowedProjectScopes",
  "allowedChangeScopes",
  "allowedTools",
  "forbiddenTools",
  "allowedPathPatterns",
  "forbiddenPathPatterns",
  "allowedDataClassifications",
  "approvalRequirements",
  "evidenceRequirements",
  "costPolicy",
  "memoryPolicy",
  "handoffPolicy",
  "reviewSeparationPolicy",
  "notes",
];

const COMMON_FORBIDDEN_TOOLS = [
  "provider-dispatch",
  "mcp-tool-dispatch",
  "production-db-write",
  "release-deploy",
  "worker-execution",
];

function agent({
  agentId,
  displayName,
  role,
  owner = "NEXUS OS",
  status = "active",
  agentType,
  allowedCapabilities,
  forbiddenCapabilities = [],
  allowedProjectScopes = ["project", "os"],
  allowedChangeScopes = ["NEXUS_OS_CHANGE", "PROJECT_CHANGE", "DOCS_CHANGE"],
  allowedTools = [],
  forbiddenTools = COMMON_FORBIDDEN_TOOLS,
  allowedPathPatterns = [],
  forbiddenPathPatterns = [
    ".env*",
    "secrets/**",
    "projects/careloop/**",
    "projects/careloop-ios/**",
  ],
  allowedDataClassifications = ["public", "internal", "confidential"],
  approvalRequirements = [],
  evidenceRequirements = ["summary", "checks-run", "safety-boundary"],
  costPolicy = { providerSpendAllowed: false, budgetRequired: true },
  memoryPolicy = { persistentMemoryWriteAllowed: false, scope: "phase-local" },
  handoffPolicy = { requiresEvidence: true, requiresOwner: true },
  reviewSeparationPolicy = { canApproveOwnImplementation: false },
  notes = [],
}) {
  return {
    agentId,
    displayName,
    role,
    version: "1.0.0",
    owner,
    status,
    agentType,
    allowedCapabilities,
    forbiddenCapabilities,
    allowedProjectScopes,
    allowedChangeScopes,
    allowedTools,
    forbiddenTools,
    allowedPathPatterns,
    forbiddenPathPatterns,
    allowedDataClassifications,
    approvalRequirements,
    evidenceRequirements,
    costPolicy,
    memoryPolicy,
    handoffPolicy,
    reviewSeparationPolicy,
    notes,
  };
}

export const NEXUS_AGENT_REGISTRY = [
  agent({
    agentId: "NEXUS",
    displayName: "NEXUS",
    role: "Agentic OS coordinator and operator surface steward.",
    agentType: "coordinator",
    allowedCapabilities: ["orchestration.route_work", "governance.boundary_preview", "platform.status_summary"],
    forbiddenCapabilities: ["implementation.mutate_source", "release.deploy", "provider.dispatch"],
    allowedPathPatterns: ["docs/**", "reports/**", "os-roadmap/**", "dashboard/src/**"],
    approvalRequirements: ["human approval for cross-cutting changes"],
  }),
  agent({
    agentId: "SHEPHERD",
    displayName: "SHEPHERD",
    role: "Mission planning, decomposition, and operator guidance.",
    agentType: "planner",
    allowedCapabilities: ["planning.mission_plan", "planning.task_decomposition", "orchestration.handoff"],
    forbiddenCapabilities: ["implementation.mutate_source", "verification.final_approval", "release.deploy"],
    allowedPathPatterns: ["contracts/missions/**", "docs/**", "reports/**"],
  }),
  agent({
    agentId: "CORE",
    displayName: "CORE",
    role: "Scoped implementation proposal and controlled change owner.",
    agentType: "implementer",
    allowedCapabilities: ["implementation.propose_change", "implementation.scoped_patch", "docs.update"],
    forbiddenCapabilities: ["verification.approve_own_work", "security.override_policy", "release.deploy"],
    allowedPathPatterns: ["dashboard/src/**", "scripts/**", "docs/**", "reports/**", "agent-registry/**"],
    approvalRequirements: ["SENTINEL validation for code changes", "WARDEN review for policy-sensitive changes"],
  }),
  agent({
    agentId: "SWIFT",
    displayName: "SWIFT",
    role: "iOS planning and validation specialist when the iOS runner is explicitly enabled.",
    agentType: "implementer",
    status: "planned",
    allowedCapabilities: ["implementation.ios_plan", "verification.ios_readiness"],
    forbiddenCapabilities: ["xcodebuild.execute", "ios.source_mutation_without_runner", "release.deploy"],
    allowedPathPatterns: ["docs/**", "reports/**"],
    approvalRequirements: ["iOS runner availability", "human approval before source mutation"],
  }),
  agent({
    agentId: "SENTINEL",
    displayName: "SENTINEL",
    role: "Validation, QA gate, and test evidence verifier.",
    agentType: "verifier",
    allowedCapabilities: ["verification.qa_gate", "verification.test_plan", "verification.evidence_review"],
    forbiddenCapabilities: ["implementation.mutate_source", "verification.silent_pass", "release.deploy"],
    allowedPathPatterns: ["reports/**", "docs/**", "scripts/check-*.js"],
  }),
  agent({
    agentId: "AUDITOR",
    displayName: "AUDITOR",
    role: "Evidence, review, and traceability auditor.",
    agentType: "verifier",
    allowedCapabilities: ["verification.review_output", "governance.evidence_audit", "docs.audit_report"],
    forbiddenCapabilities: ["implementation.mutate_source", "verification.approve_own_work", "security.override_policy"],
    allowedPathPatterns: ["reports/**", "docs/**", "activity-log/**"],
  }),
  agent({
    agentId: "WARDEN",
    displayName: "WARDEN",
    role: "Policy, privacy, and boundary enforcement reviewer.",
    agentType: "security",
    allowedCapabilities: ["security.privacy_review", "governance.block_risk", "governance.policy_review"],
    forbiddenCapabilities: ["implementation.product_feature_code", "release.deploy", "provider.dispatch"],
    allowedPathPatterns: ["policy/**", "docs/architecture/**", "reports/**"],
    allowedDataClassifications: ["public", "internal", "confidential", "restricted"],
  }),
  agent({
    agentId: "PRISM",
    displayName: "PRISM",
    role: "Product, UX, and workflow shaping agent.",
    agentType: "product",
    allowedCapabilities: ["product.prd_review", "product.ux_flow", "planning.workflow_design"],
    forbiddenCapabilities: ["implementation.mutate_source", "security.override_policy", "release.deploy"],
    allowedPathPatterns: ["docs/**", "dashboard/src/**", "reports/**"],
  }),
  agent({
    agentId: "FORGE",
    displayName: "FORGE",
    role: "Platform and infrastructure planning agent.",
    agentType: "platform",
    status: "planned",
    allowedCapabilities: ["platform.runtime_plan", "platform.db_plan", "platform.worker_plan"],
    forbiddenCapabilities: ["production-db-write", "worker-execution", "release.deploy"],
    allowedPathPatterns: ["docs/**", "reports/**", "policy/**"],
    approvalRequirements: ["human approval before runtime or DB behavior changes"],
  }),
];

export function getAgentRegistry() {
  return {
    registryVersion: AGENT_REGISTRY_SCHEMA_VERSION,
    generatedBy: "P45.1 Agent Registry Schema",
    runtimePermissionsGranted: false,
    agents: NEXUS_AGENT_REGISTRY,
  };
}

export function getAgentById(agentId) {
  return NEXUS_AGENT_REGISTRY.find((entry) => entry.agentId === agentId) || null;
}

export function validateAgentEntry(entry) {
  const errors = [];
  for (const field of REQUIRED_AGENT_FIELDS) {
    if (!(field in entry)) errors.push(`Missing field ${field}`);
  }
  if (!AGENT_STATUSES.includes(entry.status)) errors.push(`Invalid status ${entry.status}`);
  if (!AGENT_TYPES.includes(entry.agentType)) errors.push(`Invalid agentType ${entry.agentType}`);
  for (const scope of entry.allowedChangeScopes || []) {
    if (!CHANGE_SCOPES.includes(scope)) errors.push(`Invalid change scope ${scope}`);
  }
  for (const classification of entry.allowedDataClassifications || []) {
    if (!DATA_CLASSIFICATIONS.includes(classification)) {
      errors.push(`Invalid data classification ${classification}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateAgentRegistry(registry = getAgentRegistry()) {
  const errors = [];
  const seen = new Set();
  for (const entry of registry.agents || []) {
    if (seen.has(entry.agentId)) errors.push(`Duplicate agentId ${entry.agentId}`);
    seen.add(entry.agentId);
    const result = validateAgentEntry(entry);
    errors.push(...result.errors.map((error) => `${entry.agentId}: ${error}`));
  }
  return {
    ok: errors.length === 0,
    agentCount: registry.agents?.length || 0,
    errors,
  };
}
