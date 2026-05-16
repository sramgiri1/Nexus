/**
 * test-suite/changedFileTestMapper.js
 * Maps changed file paths to relevant test suite IDs based on glob patterns.
 * This is metadata-only — no test execution occurs from this module.
 */

/**
 * Pattern-to-suite mapping table.
 * Each entry: { pattern, suiteId, riskLevel, ownerAgent, costClass }
 * pattern is a prefix/glob string matched against file paths.
 */
const FILE_PATTERN_MAP = [
  {
    pattern: "dashboard/",
    suiteId: "os-command-center-route-tests",
    reason: "Dashboard file changed — Command Center route tests may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "low",
  },
  {
    pattern: "local-api/",
    suiteId: "os-api-batch-adapter-checks",
    reason: "Local API file changed — API/batch adapter checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "db/",
    suiteId: "os-db-foundation-checks",
    reason: "DB file changed — DB foundation checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "project-registry/",
    suiteId: "os-project-registry-checks",
    reason: "Project registry file changed — project registry checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "agent-registry/",
    suiteId: "os-agent-boundary-checks",
    reason: "Agent registry file changed — agent boundary checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "memory/",
    suiteId: "os-memory-trusted-context-checks",
    reason: "Memory file changed — scoped memory checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "trusted-context/",
    suiteId: "os-memory-trusted-context-checks",
    reason: "Trusted context file changed — trusted context checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "agent-mesh/",
    suiteId: "os-mesh-checks",
    reason: "Agent mesh file changed — mesh checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "skills-registry/",
    suiteId: "os-skill-registry-checks",
    reason: "Skill registry file changed — skill registry checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "hook-registry/",
    suiteId: "os-hook-registry-checks",
    reason: "Hook registry file changed — hook registry checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "hooks/",
    suiteId: "os-hook-registry-checks",
    reason: "Hooks file changed — hook registry checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "tool-governance/",
    suiteId: "os-tool-mcp-governance-checks",
    reason: "Tool governance file changed — tool/MCP governance checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "mcp-registry/",
    suiteId: "os-tool-mcp-governance-checks",
    reason: "MCP registry file changed — tool/MCP governance checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "trigger-gateway/",
    suiteId: "os-trigger-gateway-checks",
    reason: "Trigger gateway file changed — trigger checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "integrations/",
    suiteId: "os-trigger-gateway-checks",
    reason: "Integrations file changed — trigger checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "api-batch/",
    suiteId: "os-api-batch-adapter-checks",
    reason: "API batch file changed — API/batch adapter checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "scope-boundary/",
    suiteId: "os-scope-boundary-checks",
    reason: "Scope boundary file changed — scope boundary checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "observability/",
    suiteId: "os-activity-observability-checks",
    reason: "Observability file changed — activity observability checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "docs/",
    suiteId: "os-docs-diagram-readability-checks",
    reason: "Docs file changed — docs/diagram/readability checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "policy/",
    suiteId: "os-public-private-demo-boundary-checks",
    reason: "Policy file changed — public/private/demo boundary checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  {
    pattern: "private-mode/",
    suiteId: "os-public-private-demo-boundary-checks",
    reason: "Private mode file changed — boundary checks may be affected.",
    riskLevel: "low",
    ownerAgent: "AUDITOR",
    costClass: "free",
  },
  // Project-level patterns — execution always disabled
  {
    pattern: "projects/careloop/",
    suiteId: "careloop-backend-validation",
    reason: "CareLoop project file changed — backend validation suite may be relevant (execution disabled).",
    riskLevel: "medium",
    ownerAgent: "CORE",
    costClass: "low",
  },
  {
    pattern: "projects/careloop-ios/",
    suiteId: "careloop-ios-readiness",
    reason: "CareLoop iOS file changed — iOS readiness suite may be relevant (execution disabled).",
    riskLevel: "high",
    ownerAgent: "SWIFT",
    costClass: "medium",
  },
];

/**
 * Map changed file paths to relevant test suites.
 * Returns an array of match objects, deduplicated by suiteId.
 */
export function mapChangedFilesToTestSuites(changedFiles, context = {}) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    return [];
  }

  const seen = new Set();
  const matches = [];

  for (const filePath of changedFiles) {
    const normalizedPath = filePath.replace(/^\/+/, "");
    for (const entry of FILE_PATTERN_MAP) {
      if (normalizedPath.startsWith(entry.pattern)) {
        if (!seen.has(entry.suiteId)) {
          seen.add(entry.suiteId);
          matches.push({
            suiteId: entry.suiteId,
            reason: entry.reason,
            riskLevel: entry.riskLevel,
            ownerAgent: entry.ownerAgent,
            costClass: entry.costClass,
            executionEnabled: false,
            triggeredBy: normalizedPath,
          });
        }
      }
    }
  }

  return matches;
}
