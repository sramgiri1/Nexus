import { getSharedHelperCatalog, summarizeSharedHelperCatalog } from "./sharedHelperCatalog.js";

const CANDIDATES = [
  {
    candidateId: "extract-report-writer",
    title: "Extract shared report writer",
    pattern: "Repeated report metadata and markdown writing logic",
    recommendedModule: "shared/reportWriter.js",
    currentLocations: ["scripts/check-*.js", "reports/*.md"],
    riskLevel: "low",
    priority: "first",
    why: "Low-risk consistency improvement for check/report scripts.",
    notInThisPhase: true,
    futurePhase: "P41.7.3a",
    requiredTests: ["metadata block", "warning/failure rendering", "result rendering"],
    rollbackPlan: "Revert helper and restore phase-local report writing.",
  },
  {
    candidateId: "extract-check-result-formatter",
    title: "Extract check result formatter",
    pattern: "Repeated PASS/FAIL console and report sections",
    recommendedModule: "shared/checkResultFormatter.js",
    currentLocations: ["scripts/check-*.js"],
    riskLevel: "low",
    priority: "first",
    why: "Improves checker consistency while staying isolated from runtime behavior.",
    notInThisPhase: true,
    futurePhase: "P41.7.3b",
    requiredTests: ["passing sections", "failing sections", "exit code preservation"],
    rollbackPlan: "Inline the formatter output back into affected checkers.",
  },
  {
    candidateId: "reuse-route-matrix-in-tests",
    title: "Reuse Command Center route matrix in tests",
    pattern: "Repeated route/page metadata between route registry, tests, and audits",
    recommendedModule: "dashboard/src/data/commandCenterRoutes.js",
    currentLocations: ["dashboard/tests/routes.spec.js", "scripts/capture-command-center-screenshots.js"],
    riskLevel: "low",
    priority: "first",
    why: "Route metadata already exists and can reduce test drift.",
    notInThisPhase: true,
    futurePhase: "P41.7.x",
    requiredTests: ["route matrix import", "planned route coverage", "stale label checks"],
    rollbackPlan: "Restore local test route arrays.",
  },
  {
    candidateId: "extract-docs-link-checker",
    title: "Extract docs link checker helper",
    pattern: "Repeated local markdown link validation",
    recommendedModule: "shared/docsLinkChecker.js",
    currentLocations: ["scripts/check-docs-coverage.js", "future docs checkers"],
    riskLevel: "low",
    priority: "first",
    why: "Docs link validation is isolated and easy to test.",
    notInThisPhase: true,
    futurePhase: "P41.7.x",
    requiredTests: ["valid link", "broken link", "anchor-only link", "external link"],
    rollbackPlan: "Restore local link parsing in docs checkers.",
  },
  {
    candidateId: "extract-action-response-envelope",
    title: "Extract action response envelope",
    pattern: "Repeated governed action bridge response shapes",
    recommendedModule: "shared/actionResponseEnvelope.js",
    currentLocations: ["mission actions", "task actions", "workbench", "implementation actions"],
    riskLevel: "medium",
    priority: "soon",
    why: "Would reduce drift across governed action surfaces after bridge contracts are mapped.",
    notInThisPhase: true,
    futurePhase: "P41.7.3d",
    requiredTests: ["success", "disabled", "policy block", "validation error"],
    rollbackPlan: "Restore per-bridge response builders.",
  },
  {
    candidateId: "extract-jsonl-store-helper",
    title: "Extract JSONL store helper",
    pattern: "Repeated append/list patterns across runtime record files",
    recommendedModule: "local-state/jsonlStore.js",
    currentLocations: ["local-state runtime records", "approval/evidence/audit appenders"],
    riskLevel: "medium",
    priority: "soon",
    why: "Could reduce duplicate append/list logic if write guards remain intact.",
    notInThisPhase: true,
    futurePhase: "P41.7.x",
    requiredTests: ["append", "list", "malformed line", "write guard preservation"],
    rollbackPlan: "Restore existing file-specific append helpers.",
  },
  {
    candidateId: "extract-runtime-snapshot-guard",
    title: "Extract runtime snapshot guard",
    pattern: "Repeated snapshot/restore handling in checker flows",
    recommendedModule: "shared/runtimeSnapshotGuard.js",
    currentLocations: ["snapshot generators", "private validation checker", "runtime checks"],
    riskLevel: "medium",
    priority: "soon",
    why: "Improves checker hygiene but touches local runtime artifacts.",
    notInThisPhase: true,
    futurePhase: "P41.7.3c",
    requiredTests: ["restore on pass", "restore on failure", "missing file behavior"],
    rollbackPlan: "Restore checker-local snapshot/restore code.",
  },
  {
    candidateId: "do-not-extract-mode-guard-yet",
    title: "Defer mode guard extraction",
    pattern: "Mode checks protect local-private, demo, and test boundaries",
    recommendedModule: "shared/modeGuard.js",
    currentLocations: ["local API", "action bridge", "Command Center", "checkers"],
    riskLevel: "high",
    priority: "later",
    why: "Boundary behavior is security-sensitive and must not be changed opportunistically.",
    notInThisPhase: true,
    futurePhase: "dedicated safety refactor",
    requiredTests: ["local-private", "demo", "test", "missing mode", "public-safe surfaces"],
    rollbackPlan: "Restore all phase-local guard checks.",
    doNotRefactorYet: true,
  },
  {
    candidateId: "do-not-extract-redaction-helper-yet",
    title: "Defer redaction helper extraction",
    pattern: "Redaction spans API responses, reports, public safety, and private-mode surfaces",
    recommendedModule: "shared/redaction.js",
    currentLocations: ["local-api/safeResponse.js", "public-safety checks", "reports"],
    riskLevel: "high",
    priority: "later",
    why: "Redaction mistakes can leak secrets or private project details.",
    notInThisPhase: true,
    futurePhase: "dedicated safety refactor",
    requiredTests: ["secret patterns", "private labels", "safe public output", "nested payloads"],
    rollbackPlan: "Restore existing local redaction paths.",
    doNotRefactorYet: true,
  },
  {
    candidateId: "do-not-extract-safe-file-boundary-yet",
    title: "Defer safe file boundary extraction",
    pattern: "Safe file reads and write guards protect local-state and project boundaries",
    recommendedModule: "local-state/safeFileReader.js",
    currentLocations: ["local-state", "checkers", "local API reads"],
    riskLevel: "high",
    priority: "later",
    why: "File boundary behavior has direct security and data exposure risk.",
    notInThisPhase: true,
    futurePhase: "dedicated safety refactor",
    requiredTests: ["allowed path", "forbidden path", "missing file", "symlink/path traversal"],
    rollbackPlan: "Restore existing local safe-file paths.",
    doNotRefactorYet: true,
  },
  {
    candidateId: "do-not-extract-local-state-write-guard",
    title: "Defer local-state write guard extraction",
    pattern: "Write guards protect runtime state and append-only behavior",
    recommendedModule: "local-state/writeGuards.js",
    currentLocations: ["local-state/writeGuards.js", "runtime append helpers"],
    riskLevel: "high",
    priority: "later",
    why: "Write-boundary changes can corrupt or bypass governed runtime state.",
    notInThisPhase: true,
    futurePhase: "dedicated runtime refactor",
    requiredTests: ["allowed write", "forbidden write", "append-only preservation", "rollback"],
    rollbackPlan: "Restore current write guard modules.",
    doNotRefactorYet: true,
  },
  {
    candidateId: "do-not-wrap-state-machine-yet",
    title: "Defer state machine wrappers",
    pattern: "State transition wrappers would affect task and approval correctness",
    recommendedModule: "dedicated state-machine refactor",
    currentLocations: ["state-machine", "local executor checks"],
    riskLevel: "high",
    priority: "later",
    why: "State transition behavior is correctness-critical.",
    notInThisPhase: true,
    futurePhase: "dedicated runtime refactor",
    requiredTests: ["valid transition", "invalid transition", "approval gate", "rollback"],
    rollbackPlan: "Restore current state machine call paths.",
    doNotRefactorYet: true,
  },
];

function countBy(candidates, field, value) {
  return candidates.filter((candidate) => candidate[field] === value).length;
}

export function summarizeRefactorCandidatePlan(plan) {
  const candidates = plan.candidates || [];
  return {
    totalCandidates: candidates.length,
    lowRisk: countBy(candidates, "riskLevel", "low"),
    mediumRisk: countBy(candidates, "riskLevel", "medium"),
    highRisk: countBy(candidates, "riskLevel", "high"),
    firstCandidates: countBy(candidates, "priority", "first"),
    doNotRefactorYet: candidates.filter((candidate) => candidate.doNotRefactorYet === true).length,
  };
}

export function buildRefactorCandidatePlan() {
  const catalog = getSharedHelperCatalog();
  const plan = {
    planVersion: "1.0",
    phase: "P41.7.3",
    generatedAt: new Date().toISOString(),
    broadRefactorsAllowed: false,
    runtimeBehaviorChangesAllowed: false,
    catalogSummary: summarizeSharedHelperCatalog(catalog),
    candidates: CANDIDATES,
    warnings: [
      "P41.7.3 is planning-only. No candidate is implemented in this phase.",
    ],
    errors: [],
  };
  plan.summary = summarizeRefactorCandidatePlan(plan);
  return plan;
}

export function validateRefactorCandidatePlan(plan) {
  const errors = [];
  if (plan?.planVersion !== "1.0") errors.push("planVersion must be 1.0");
  if (plan?.phase !== "P41.7.3") errors.push("phase must be P41.7.3");
  if (plan?.broadRefactorsAllowed !== false) errors.push("broadRefactorsAllowed must be false");
  if (plan?.runtimeBehaviorChangesAllowed !== false) errors.push("runtimeBehaviorChangesAllowed must be false");
  if (!Array.isArray(plan?.candidates)) errors.push("candidates must be an array");
  if ((plan?.summary?.lowRisk || 0) === 0) errors.push("plan must include low-risk candidates");
  if ((plan?.summary?.mediumRisk || 0) === 0) errors.push("plan must include medium-risk candidates");
  if ((plan?.summary?.highRisk || 0) === 0) errors.push("plan must include high-risk candidates");
  if ((plan?.candidates || []).some((candidate) => candidate.notInThisPhase !== true)) {
    errors.push("all candidates must be marked notInThisPhase");
  }
  for (const candidate of plan?.candidates || []) {
    if (candidate.riskLevel === "high" && candidate.doNotRefactorYet !== true) {
      errors.push(`high-risk candidate must be marked doNotRefactorYet: ${candidate.candidateId}`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getRefactorCandidatesByRisk(riskLevel) {
  return CANDIDATES.filter((candidate) => candidate.riskLevel === riskLevel);
}

export function getFirstSafeRefactorCandidates(plan = buildRefactorCandidatePlan()) {
  return (plan.candidates || []).filter(
    (candidate) => candidate.riskLevel === "low" && candidate.priority === "first",
  );
}

export function writeRefactorCandidatePlanReport(plan, options = {}) {
  const { writeFileSync } = options.fs || {};
  if (typeof writeFileSync !== "function") {
    return {
      written: false,
      reason: "No writeFileSync implementation was provided.",
    };
  }
  writeFileSync(options.path || "reports/refactor-candidate-plan.json", JSON.stringify(plan, null, 2), "utf8");
  return {
    written: true,
    path: options.path || "reports/refactor-candidate-plan.json",
  };
}
