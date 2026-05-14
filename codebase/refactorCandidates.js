const SAFE_HELPER_IDS = new Set([
  "report-metadata-writing",
  "policy-loading-parsing",
  "mode-guards",
  "checker-formatting",
  "redaction-helpers",
  "dashboard-action-state-labels",
  "route-page-metadata",
  "phase-roadmap-updates",
]);

const MEDIUM_RISK_IDS = new Set([
  "action-result-envelopes",
  "action-store-patterns",
  "runtime-snapshot-helpers",
  "evidence-audit-runtime-append",
  "dashboard-source-badges",
  "safe-response-envelopes",
  "safe-file-read-helpers",
]);

const HIGH_RISK_TITLES = [
  "local-state write boundary",
  "state machine transitions",
  "runtime traffic plane decisions",
  "controlled command runner",
  "orchestrator/runner/loop",
  "security boundary logic",
];

function toCandidate(pattern, timing) {
  return {
    patternId: pattern.patternId,
    title: pattern.title,
    category: pattern.category,
    priority: pattern.priority,
    risk: pattern.risk,
    recommendedSharedModule: pattern.recommendedSharedModule,
    recommendation: pattern.recommendation,
    timing,
    doNow: false,
    reasonDeferred: pattern.reasonDeferred || "Audit-only subphase. No refactor in P41.7.2.",
  };
}

export function prioritizeRefactorCandidates(candidates) {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const riskRank = { low: 0, medium: 1, high: 2 };
  return [...candidates].sort((a, b) => {
    const priorityDelta = (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
    if (priorityDelta !== 0) return priorityDelta;
    return (riskRank[a.risk] ?? 3) - (riskRank[b.risk] ?? 3);
  });
}

export function buildRefactorCandidatePlan(audit) {
  const patterns = audit?.patterns || [];

  const safeNearTerm = patterns
    .filter((pattern) => SAFE_HELPER_IDS.has(pattern.patternId) && pattern.risk !== "high")
    .map((pattern) => toCandidate(pattern, "near_term"));

  const mediumRiskLater = patterns
    .filter((pattern) => MEDIUM_RISK_IDS.has(pattern.patternId) || pattern.risk === "medium")
    .map((pattern) => toCandidate(pattern, "later"));

  const highRiskDeferred = [
    ...patterns.filter((pattern) => pattern.risk === "high").map((pattern) => toCandidate(pattern, "deferred")),
    ...HIGH_RISK_TITLES.map((title) => ({
      patternId: title.replaceAll("/", "-").replaceAll(" ", "-"),
      title,
      category: "runtime-safety",
      priority: "high",
      risk: "high",
      recommendedSharedModule: "dedicated future refactor phase",
      recommendation: `Defer ${title} until a dedicated validation-backed refactor phase.`,
      timing: "deferred",
      doNow: false,
      reasonDeferred: "High-risk runtime or security boundary.",
    })),
  ];

  return {
    planVersion: "1.0",
    phase: "P41.7.2",
    generatedAt: audit?.generatedAt || new Date().toISOString(),
    safeNearTerm: prioritizeRefactorCandidates(safeNearTerm),
    mediumRiskLater: prioritizeRefactorCandidates(mediumRiskLater),
    highRiskDeferred: prioritizeRefactorCandidates(highRiskDeferred),
    nonGoals: [
      "no runtime behavior changed",
      "no action bridge rewrite",
      "no local API behavior change",
      "no DB behavior change",
      "no project source mutation",
    ],
  };
}

export function validateRefactorCandidatePlan(plan) {
  const errors = [];
  if (plan?.planVersion !== "1.0") errors.push("planVersion must be 1.0");
  if (plan?.phase !== "P41.7.2") errors.push("phase must be P41.7.2");
  for (const field of ["safeNearTerm", "mediumRiskLater", "highRiskDeferred"]) {
    if (!Array.isArray(plan?.[field])) errors.push(`${field} must be an array`);
  }
  if ((plan?.highRiskDeferred || []).length === 0) errors.push("highRiskDeferred must not be empty");
  if ((plan?.safeNearTerm || []).some((candidate) => candidate.doNow !== false)) {
    errors.push("P41.7.2 must not mark safe candidates for immediate implementation");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
