import { buildProjectTestSuites } from "../test-suite/projectTestSuites.js";
import { buildOsTestSuites } from "../test-suite/osTestSuites.js";

const DEFAULT_REQUIREMENTS = [
  { requirementId: "prd-backend-validation", requirementLabel: "Backend validation", scope: "project", source: "P55 test registry", keywords: ["backend", "api"] },
  { requirementId: "prd-ios-validation", requirementLabel: "iOS validation", scope: "project", source: "P55 test registry", keywords: ["ios", "xcodebuild"] },
  { requirementId: "prd-privacy-compliance", requirementLabel: "Privacy and compliance", scope: "cross_cutting", source: "policy docs", keywords: ["privacy", "boundary", "safety", "compliance"] },
  { requirementId: "prd-release-readiness", requirementLabel: "Release readiness", scope: "project", source: "release docs", keywords: ["release"] },
  { requirementId: "prd-project-onboarding", requirementLabel: "Project onboarding", scope: "project", source: "project registry", keywords: ["project", "onboarding", "registry"] },
  { requirementId: "prd-agent-governance", requirementLabel: "Agent governance", scope: "os", source: "agent governance", keywords: ["agent", "boundary", "governance"] },
  { requirementId: "prd-docs-usage", requirementLabel: "Docs and usage", scope: "os", source: "docs coverage", keywords: ["docs", "usage"] },
  { requirementId: "prd-command-center-ui", requirementLabel: "Command Center UI", scope: "os", source: "Command Center", keywords: ["dashboard", "command center", "ui", "playwright"] },
];

export function loadPrdSignals(options = {}) {
  return options.requirements || DEFAULT_REQUIREMENTS;
}

function suiteMatchesRequirement(suite, requirement) {
  const haystack = [
    suite.suiteId,
    suite.layer,
    suite.tool,
    suite.description,
    ...(suite.changedFilePatterns || []),
    ...(suite.evidenceTypes || []),
  ]
    .join(" ")
    .toLowerCase();
  return requirement.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function buildPrdTestMap(context = {}) {
  const suites = [...buildProjectTestSuites(context), ...buildOsTestSuites(context)];
  const requirements = loadPrdSignals(context);
  const records = requirements.map((requirement) => {
    const linkedSuites = suites.filter((suite) => suiteMatchesRequirement(suite, requirement)).map((suite) => suite.suiteId);
    const coverageStatus = linkedSuites.length > 0 ? "covered" : "gap";
    return {
      requirementId: requirement.requirementId,
      requirementLabel: requirement.requirementLabel,
      scope: requirement.scope,
      source: requirement.source,
      linkedSuites,
      coverageStatus,
      confidence: linkedSuites.length > 1 ? "high" : linkedSuites.length === 1 ? "medium" : "low",
      warnings: linkedSuites.length === 0 ? ["No linked preview suite found."] : [],
      errors: [],
    };
  });
  return {
    mapVersion: "1.0",
    phase: "P56.1",
    executionEnabled: false,
    sourceContentScanned: false,
    records,
  };
}

export function validatePrdTestMap(map = buildPrdTestMap()) {
  const errors = [];
  if (map.executionEnabled !== false) errors.push("PRD test map must not enable execution");
  if (map.sourceContentScanned !== false) errors.push("PRD test map must not scan private source content");
  if (!Array.isArray(map.records) || map.records.length < 8) errors.push("PRD test map requires mapped records");
  for (const record of map.records || []) {
    for (const field of ["requirementId", "requirementLabel", "scope", "source", "coverageStatus", "confidence"]) {
      if (!record[field]) errors.push(`Missing ${field} for ${record.requirementId || "unknown"}`);
    }
    if (!Array.isArray(record.linkedSuites)) errors.push(`${record.requirementId} linkedSuites must be an array`);
  }
  return { valid: errors.length === 0, errors };
}

export function summarizePrdTestCoverage(map = buildPrdTestMap()) {
  const records = map.records || [];
  return {
    totalRequirements: records.length,
    coveredRequirements: records.filter((record) => record.coverageStatus === "covered").length,
    gapRequirements: records.filter((record) => record.coverageStatus !== "covered").length,
    executionEnabled: false,
  };
}
