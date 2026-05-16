import { mapChangedFilesToTestSuites } from "../test-suite/changedFileTestMapper.js";

export function scoreTestRecommendation(recommendation = {}) {
  const riskBase = { critical: 95, high: 80, medium: 55, low: 30, informational: 10 };
  return riskBase[recommendation.riskLevel || "low"] || 25;
}

export function explainRecommendation(recommendation = {}) {
  return `${recommendation.suiteId} is recommended because ${recommendation.reason}. Execution is preview-only.`;
}

export function recommendTestsForChange(changeContext = {}) {
  const changedFiles = changeContext.changedFiles || [];
  const matches = mapChangedFilesToTestSuites(changedFiles, changeContext);
  const gapDomains = new Set((changeContext.coverageGaps || []).map((gap) => gap.domain));
  return matches.map((match, index) => {
    const riskLevel = match.riskLevel || (gapDomains.size ? "medium" : "low");
    const recommendation = {
      recommendationId: `rec-${index + 1}-${match.suiteId}`,
      suiteId: match.suiteId,
      scope: match.scope || "os",
      reason: match.reason || "changed files match this suite",
      riskLevel,
      riskScore: 0,
      confidence: match.triggeredBy ? "high" : "medium",
      ownerAgent: match.ownerAgent || "AUDITOR",
      evidenceType: "selection-preview",
      executionEnabled: false,
      disabledReason: "Preview-only. NEXUS does not run tests in P56.",
    };
    return { ...recommendation, riskScore: scoreTestRecommendation(recommendation) };
  });
}

export function summarizeTestRecommendations(recommendations = []) {
  return {
    recommendationCount: recommendations.length,
    highRiskCount: recommendations.filter((item) => item.riskScore >= 75).length,
    executionEnabled: recommendations.some((item) => item.executionEnabled) === true,
    previewOnlyCount: recommendations.filter((item) => item.executionEnabled === false).length,
  };
}
