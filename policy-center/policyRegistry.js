import { existsSync } from "node:fs";
import { join } from "node:path";

export const POLICY_REGISTRY_VERSION = "1.0";

const ROOT = process.cwd();

const POLICY_ENTRIES = [
  ["command-center-ux", "Command Center UX Policy", "command-center", "NEXUS", "platform", "local-private", "policy/command-center-private-validation-policy.json", "P41.5", "medium"],
  ["project-registry", "Project Registry Policy", "project-registry", "WARDEN", "project", "local-private", "policy/project-registry-policy.json", "P42", "high"],
  ["scope-boundary", "Scope Boundary Policy", "scope-boundary", "WARDEN", "project", "local-private", "policy/scope-classification-policy.json", "P43", "high"],
  ["agent-registry", "Agent Registry Policy", "agent-registry", "WARDEN", "platform", "local-private", "policy/agent-registry-policy.json", "P45", "high"],
  ["scoped-memory", "Scoped Memory Policy", "memory", "WARDEN", "platform", "local-private", "policy/scoped-memory-policy.json", "P46", "high"],
  ["trusted-context", "Trusted Context Policy", "trusted-context", "WARDEN", "platform", "local-private", "policy/trusted-context-policy.json", "P47", "high"],
  ["agentic-mesh", "Agentic Mesh Policy", "agent-mesh", "WARDEN", "platform", "local-private", "policy/agent-mesh-policy.json", "P48", "high"],
  ["agent-definition-update", "Agent Definition Update Policy", "agent-registry", "AUDITOR", "platform", "local-private", "policy/agent-definition-update-policy.json", "P49", "medium"],
  ["skill-registry", "Skill Registry Policy", "skills", "SENTINEL", "platform", "local-private", "policy/skill-registry-policy.json", "P50", "medium"],
  ["hook-registry", "Hook Registry Policy", "hooks", "WARDEN", "platform", "local-private", "policy/hook-registry-policy.json", "P51", "high"],
  ["tool-mcp-registry", "Tool and MCP Registry Policy", "tool-governance", "WARDEN", "platform", "local-private", "policy/tool-registry-policy.json", "P52", "high"],
  ["trigger-gateway", "Trigger Gateway Policy", "trigger-gateway", "WARDEN", "platform", "local-private", "policy/trigger-gateway-policy.json", "P53", "high"],
  ["api-batch-adapter", "API / Batch Adapter Policy", "api-batch", "SENTINEL", "platform", "local-private", "policy/api-batch-adapter-policy.json", "P54", "high"],
  ["test-suite-manager", "Test Suite Manager Policy", "test-suite", "SENTINEL", "platform", "local-private", "policy/test-suite-manager-policy.json", "P55", "medium"],
  ["quality-intelligence", "Quality Intelligence Policy", "quality-intelligence", "SENTINEL", "platform", "local-private", "policy/quality-intelligence-policy.json", "P56", "medium"],
  ["cost-center", "Cost Center Policy", "cost-center", "SENTINEL", "platform", "local-private", "policy/cost-center-policy.json", "P57", "medium"],
  ["public-private-demo-safety", "Public / Private / Demo Safety Policy", "safety", "WARDEN", "platform", "all", "policy/private-project-mode-policy.json", "P41", "critical"],
];

function buildEntry([policyId, title, ownerArea, ownerAgent, scope, mode, sourcePath, relatedPhase, riskLevel]) {
  const exists = existsSync(join(ROOT, sourcePath));
  return {
    policyId,
    title,
    ownerArea,
    ownerAgent,
    scope,
    mode,
    status: exists ? "active" : "planned",
    sourcePath,
    plannedReason: exists ? "" : "Policy source is planned or represented by adjacent governance metadata.",
    relatedPhase,
    riskLevel,
    enforcementState: "preview_read_only",
    commandCenterVisible: true,
    lastReviewedAt: "",
    version: "1.0.0",
    tags: [ownerArea, scope, riskLevel],
  };
}

export function loadPolicyRegistry() {
  return {
    registryVersion: POLICY_REGISTRY_VERSION,
    phase: "P58.1",
    generatedAt: new Date().toISOString(),
    previewOnly: true,
    runtimeEnforcementChanged: false,
    policies: POLICY_ENTRIES.map(buildEntry),
  };
}

export function listPolicies(options = {}) {
  const registry = options.registry || loadPolicyRegistry(options);
  return registry.policies;
}

export function getPolicyById(policyId, options = {}) {
  return listPolicies(options).find((policy) => policy.policyId === policyId) || null;
}

export function validatePolicyRegistry(registry = loadPolicyRegistry()) {
  const errors = [];
  const seen = new Set();
  for (const policy of registry.policies || []) {
    for (const field of [
      "policyId",
      "title",
      "ownerArea",
      "ownerAgent",
      "scope",
      "mode",
      "status",
      "sourcePath",
      "relatedPhase",
      "riskLevel",
      "enforcementState",
      "version",
    ]) {
      if (!policy[field]) errors.push(`${policy.policyId || "unknown"} missing ${field}`);
    }
    if (seen.has(policy.policyId)) errors.push(`duplicate policyId ${policy.policyId}`);
    seen.add(policy.policyId);
    if (policy.status === "active" && !existsSync(join(ROOT, policy.sourcePath))) {
      errors.push(`${policy.policyId} active sourcePath does not exist`);
    }
    if (policy.status === "planned" && !policy.plannedReason) {
      errors.push(`${policy.policyId} planned sourcePath requires plannedReason`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function summarizePolicyRegistry(registry = loadPolicyRegistry()) {
  const policies = registry.policies || [];
  return {
    policyCount: policies.length,
    activePolicies: policies.filter((policy) => policy.status === "active").length,
    plannedPolicies: policies.filter((policy) => policy.status === "planned").length,
    highRiskPolicies: policies.filter((policy) => ["high", "critical"].includes(policy.riskLevel)).length,
    previewOnly: registry.previewOnly === true,
    runtimeEnforcementChanged: registry.runtimeEnforcementChanged === true,
  };
}
