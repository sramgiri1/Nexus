import { CAPABILITY_CATEGORIES } from "./agentTypes.js";

export const CAPABILITY_RULE_VERSION = "1.0";

export const CAPABILITIES = [
  { capabilityId: "orchestration.route_work", category: "orchestration", risk: "medium" },
  { capabilityId: "orchestration.handoff", category: "orchestration", risk: "medium" },
  { capabilityId: "planning.mission_plan", category: "planning", risk: "low" },
  { capabilityId: "planning.task_decomposition", category: "planning", risk: "low" },
  { capabilityId: "planning.workflow_design", category: "planning", risk: "low" },
  { capabilityId: "implementation.propose_change", category: "implementation", risk: "medium" },
  { capabilityId: "implementation.scoped_patch", category: "implementation", risk: "high" },
  { capabilityId: "implementation.ios_plan", category: "implementation", risk: "medium" },
  { capabilityId: "verification.qa_gate", category: "verification", risk: "medium" },
  { capabilityId: "verification.test_plan", category: "verification", risk: "medium" },
  { capabilityId: "verification.evidence_review", category: "verification", risk: "medium" },
  { capabilityId: "verification.review_output", category: "verification", risk: "medium" },
  { capabilityId: "security.privacy_review", category: "security", risk: "high" },
  { capabilityId: "governance.block_risk", category: "governance", risk: "high" },
  { capabilityId: "governance.policy_review", category: "governance", risk: "high" },
  { capabilityId: "governance.boundary_preview", category: "governance", risk: "medium" },
  { capabilityId: "governance.evidence_audit", category: "governance", risk: "medium" },
  { capabilityId: "product.prd_review", category: "product", risk: "low" },
  { capabilityId: "product.ux_flow", category: "product", risk: "low" },
  { capabilityId: "release.readiness_review", category: "release", risk: "high" },
  { capabilityId: "docs.update", category: "docs", risk: "low" },
  { capabilityId: "docs.audit_report", category: "docs", risk: "low" },
  { capabilityId: "platform.status_summary", category: "platform", risk: "low" },
  { capabilityId: "platform.runtime_plan", category: "platform", risk: "medium" },
  { capabilityId: "platform.db_plan", category: "platform", risk: "medium" },
  { capabilityId: "platform.worker_plan", category: "platform", risk: "medium" },
];

export const FORBIDDEN_RUNTIME_CAPABILITIES = [
  "provider.dispatch",
  "tool.execute",
  "worker.execute",
  "production_db.write",
  "release.deploy",
  "agent.self_update",
  "verification.approve_own_work",
  "security.override_policy",
  "implementation.mutate_unscoped_source",
];

export function validateCapabilityId(capabilityId) {
  return /^[a-z]+[a-z0-9]*(\.[a-z]+[a-z0-9_]*)+$/.test(capabilityId);
}

export function getCapabilityById(capabilityId) {
  return CAPABILITIES.find((entry) => entry.capabilityId === capabilityId) || null;
}

export function validateCapabilityCatalog() {
  const errors = [];
  const seen = new Set();
  for (const capability of CAPABILITIES) {
    if (seen.has(capability.capabilityId)) errors.push(`Duplicate capability ${capability.capabilityId}`);
    seen.add(capability.capabilityId);
    if (!validateCapabilityId(capability.capabilityId)) errors.push(`Unstable capability ID ${capability.capabilityId}`);
    if (!CAPABILITY_CATEGORIES.includes(capability.category)) errors.push(`Unknown category ${capability.category}`);
  }
  return { ok: errors.length === 0, errors };
}
