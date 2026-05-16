export function classifyCoverageGap(gap = {}) {
  if (gap.coverageStatus === "covered") return "informational";
  if (gap.domain?.toLowerCase().includes("ios")) return "high";
  if (gap.domain?.toLowerCase().includes("release")) return "high";
  if (gap.domain?.toLowerCase().includes("privacy")) return "medium";
  return "low";
}

export function detectCoverageGaps(prdTestMap = {}, testRegistry = []) {
  return (prdTestMap.records || [])
    .filter((record) => record.coverageStatus !== "covered" || record.linkedSuites.length === 0)
    .map((record) => {
      const gap = {
        gapId: `gap-${record.requirementId}`,
        scope: record.scope,
        domain: record.requirementLabel,
        severity: "low",
        reason: record.linkedSuites.length === 0 ? "No registered preview suite maps to this requirement." : "Coverage is partial.",
        linkedRequirement: record.requirementId,
        expectedSuiteType: record.scope === "project" ? "project validation suite" : "OS validation suite",
        existingSuites: testRegistry.filter((suite) => suite.scope === record.scope).map((suite) => suite.suiteId),
        recommendedAction: "Add a governed test proposal or map an existing suite before enabling execution.",
        ownerAgent: record.scope === "project" ? "CORE" : "AUDITOR",
        status: "preview_gap",
      };
      return { ...gap, severity: classifyCoverageGap(gap) };
    });
}

export function summarizeCoverageGaps(gaps = []) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
  for (const gap of gaps) counts[gap.severity] = (counts[gap.severity] || 0) + 1;
  return {
    totalGaps: gaps.length,
    severityCounts: counts,
    executionEnabled: false,
    testGenerationEnabled: false,
  };
}

export function buildGapRecommendations(gaps = []) {
  return gaps.map((gap) => ({
    gapId: gap.gapId,
    ownerAgent: gap.ownerAgent,
    recommendedAction: gap.recommendedAction,
    disabledReason: "Preview-only. Test generation and execution are not enabled.",
    executionEnabled: false,
  }));
}
