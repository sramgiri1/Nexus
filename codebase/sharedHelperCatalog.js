const SHARED_HELPERS = [
  {
    helperId: "policy-loader",
    name: "Policy Loader",
    category: "policy",
    purpose: "Load, parse, and validate JSON policy files consistently.",
    proposedModule: "shared/policyLoader.js",
    currentPatterns: ["policy/*.json", "scripts/check-*.js", "action modules", "local API checks"],
    reuseRule: "Use before adding phase-local policy read/parse logic.",
    riskLevel: "medium",
    refactorPriority: "soon",
    status: "planned",
    safetyNotes: ["Policy parsing errors must identify the policy path without exposing secrets."],
    testRequirements: ["checker fixtures for valid, missing, and invalid policy JSON"],
    ownerArea: "codebase",
  },
  {
    helperId: "mode-guard",
    name: "Mode Guard",
    category: "safety",
    purpose: "Validate NEXUS_MODE, local-private, test, and demo boundaries.",
    proposedModule: "shared/modeGuard.js",
    currentPatterns: ["NEXUS_MODE checks", "local-private checks", "demo/public boundary checks"],
    reuseRule: "Do not duplicate mode checks without documenting why the boundary is phase-local.",
    riskLevel: "medium",
    refactorPriority: "later",
    status: "planned",
    safetyNotes: ["Mode checks are security-sensitive and need broad validation before extraction."],
    testRequirements: ["local-private, demo, test, and missing-mode cases"],
    ownerArea: "runtime",
  },
  {
    helperId: "report-writer",
    name: "Report Writer",
    category: "reports",
    purpose: "Standardize markdown and JSON report generation and metadata.",
    proposedModule: "shared/reportWriter.js",
    currentPatterns: ["scripts/check-*.js", "reports/*.md", "Validation HEAD wording"],
    reuseRule: "Use this before writing new phase reports.",
    riskLevel: "low",
    refactorPriority: "first",
    status: "planned",
    safetyNotes: ["Report writer must not hide failures or rewrite checker semantics."],
    testRequirements: ["metadata block snapshot", "warnings/failures/result rendering"],
    ownerArea: "codebase",
  },
  {
    helperId: "check-result-formatter",
    name: "Check Result Formatter",
    category: "checks",
    purpose: "Standardize PASS/FAIL console sections and markdown summaries.",
    proposedModule: "shared/checkResultFormatter.js",
    currentPatterns: ["scripts/check-*.js", "Result: PASS", "Result: FAIL"],
    reuseRule: "Use this for new checker section output and exit-code summaries.",
    riskLevel: "low",
    refactorPriority: "first",
    status: "planned",
    safetyNotes: ["Formatter must preserve existing non-zero exit behavior."],
    testRequirements: ["passing checker", "failing checker", "mixed warnings"],
    ownerArea: "codebase",
  },
  {
    helperId: "redaction-helper",
    name: "Redaction Helper",
    category: "safety",
    purpose: "Redact secrets and private content consistently.",
    proposedModule: "shared/redaction.js",
    currentPatterns: ["safeResponse redaction", "public-safety checks", "private-safe report shaping"],
    reuseRule: "Do not replace existing redaction paths until regression coverage is explicit.",
    riskLevel: "high",
    refactorPriority: "later",
    status: "do_not_refactor_yet",
    safetyNotes: ["Redaction is safety-critical and must be tested before extraction."],
    testRequirements: ["secret patterns", "private project labels", "safe public outputs"],
    ownerArea: "runtime",
  },
  {
    helperId: "runtime-snapshot-guard",
    name: "Runtime Snapshot Guard",
    category: "runtime",
    purpose: "Snapshot and restore runtime files during checkers.",
    proposedModule: "shared/runtimeSnapshotGuard.js",
    currentPatterns: ["generated snapshots", "runtime status normalization", "checker temp state"],
    reuseRule: "Use for future checkers that need temporary local runtime artifacts.",
    riskLevel: "high",
    refactorPriority: "later",
    status: "planned",
    safetyNotes: ["Must never overwrite unrelated local runtime state."],
    testRequirements: ["restore after pass", "restore after failure", "missing file behavior"],
    ownerArea: "runtime",
  },
  {
    helperId: "safe-file-boundary",
    name: "Safe File Boundary",
    category: "state",
    purpose: "Consolidate safe local file path checks and read boundaries.",
    proposedModule: "local-state/safeFileReader.js",
    currentPatterns: ["local-state/safeFileReader.js", "safe local read helpers"],
    reuseRule: "Reuse existing safeFileReader instead of creating duplicate readers.",
    riskLevel: "high",
    refactorPriority: "later",
    status: "existing",
    safetyNotes: ["File boundary changes can expose private or unsafe paths."],
    testRequirements: ["allowed path", "forbidden path", "missing file", "redacted error"],
    ownerArea: "runtime",
  },
  {
    helperId: "jsonl-store-helper",
    name: "JSONL Store Helper",
    category: "state",
    purpose: "Standardize common JSONL append/list patterns.",
    proposedModule: "local-state/jsonlStore.js",
    currentPatterns: ["evidence/audit/events/actions/reviews/implementation records"],
    reuseRule: "Use only after preserving current append-only and guard semantics.",
    riskLevel: "medium",
    refactorPriority: "soon",
    status: "planned",
    safetyNotes: ["Append order and redaction state must remain stable."],
    testRequirements: ["append", "list", "malformed line", "redacted payload"],
    ownerArea: "runtime",
  },
  {
    helperId: "action-response-envelope",
    name: "Action Response Envelope",
    category: "actions",
    purpose: "Standardize governed action bridge response shape.",
    proposedModule: "shared/actionResponseEnvelope.js",
    currentPatterns: ["mission actions", "task actions", "workbench", "implementation actions"],
    reuseRule: "Use for future governed action bridges after existing bridge contracts are mapped.",
    riskLevel: "medium",
    refactorPriority: "soon",
    status: "planned",
    safetyNotes: ["Must not change existing bridge response behavior silently."],
    testRequirements: ["success", "disabled", "validation failure", "policy block"],
    ownerArea: "runtime",
  },
  {
    helperId: "local-api-response-envelope",
    name: "Local API Response Envelope",
    category: "local-api",
    purpose: "Standardize safe local API response envelopes.",
    proposedModule: "local-api/safeResponse.js",
    currentPatterns: ["local-api/safeResponse.js", "local-api/routes/*"],
    reuseRule: "Reuse existing safeResponse for local API work.",
    riskLevel: "medium",
    refactorPriority: "soon",
    status: "existing",
    safetyNotes: ["Must preserve local-only, safe error, and no-stack response posture."],
    testRequirements: ["200 envelope", "404 envelope", "redacted error"],
    ownerArea: "local-api",
  },
  {
    helperId: "command-center-route-matrix",
    name: "Command Center Route Matrix",
    category: "dashboard",
    purpose: "Provide one route registry for sidebar, tests, and visual audit.",
    proposedModule: "dashboard/src/data/commandCenterRoutes.js",
    currentPatterns: ["COMMAND_CENTER_ROUTES", "expectedHeading", "helpDoc"],
    reuseRule: "Add route metadata here before duplicating route lists in tests or audit scripts.",
    riskLevel: "low",
    refactorPriority: "first",
    status: "existing",
    safetyNotes: ["Route metadata changes should preserve stale-label and demo-boundary checks."],
    testRequirements: ["route matrix import", "heading coverage", "planned route behavior"],
    ownerArea: "dashboard",
  },
  {
    helperId: "capability-readiness-model",
    name: "Capability Readiness Model",
    category: "dashboard",
    purpose: "Centralize user-facing capability states.",
    proposedModule: "dashboard/src/data/capabilityReadiness.js",
    currentPatterns: ["CAPABILITY_READINESS", "disabled reasons", "operator action readiness"],
    reuseRule: "Use this before adding page-local capability or disabled-reason copy.",
    riskLevel: "low",
    refactorPriority: "first",
    status: "existing",
    safetyNotes: ["Must keep unavailable capabilities honest and non-executing."],
    testRequirements: ["required capability keys", "stale-label absence", "disabled reason copy"],
    ownerArea: "dashboard",
  },
  {
    helperId: "os-phase-status-helper",
    name: "OS Phase Status Helper",
    category: "roadmap",
    purpose: "Read and update phase status for the Command Center OS Roadmap.",
    proposedModule: "os-roadmap/phaseStatus.js",
    currentPatterns: ["os-roadmap/phase-status.json", "scripts/check-os-phase-status.js"],
    reuseRule: "Use for future phase status updates instead of hand-editing repeated fields.",
    riskLevel: "medium",
    refactorPriority: "soon",
    status: "planned",
    safetyNotes: ["Must keep OS roadmap separate from project progress."],
    testRequirements: ["completed phase", "next phase", "planned phase", "project-progress exclusion"],
    ownerArea: "codebase",
  },
  {
    helperId: "activity-logger",
    name: "Activity Logger",
    category: "observability",
    purpose: "Centralize activity event logging.",
    proposedModule: "activity/activityLogger.js",
    currentPatterns: ["runtime events", "audit events", "operator activity surfaces"],
    reuseRule: "Defer until P41.8 activity log architecture is active.",
    riskLevel: "high",
    refactorPriority: "future",
    status: "future",
    safetyNotes: ["Activity logging crosses evidence, audit, runtime, and privacy boundaries."],
    testRequirements: ["append", "redaction", "ordering", "source attribution"],
    ownerArea: "future",
  },
  {
    helperId: "cost-event-helper",
    name: "Cost Event Helper",
    category: "cost",
    purpose: "Record cost estimates and actuals for future Cost Center work.",
    proposedModule: "cost/costEventHelper.js",
    currentPatterns: ["future Cost Center", "budget/cost policy placeholders"],
    reuseRule: "Defer until Cost Center and provider-governance phases define the event contract.",
    riskLevel: "medium",
    refactorPriority: "future",
    status: "future",
    safetyNotes: ["Must not infer provider costs without governed provider data."],
    testRequirements: ["estimated cost", "actual cost", "budget policy block"],
    ownerArea: "future",
  },
];

export function getSharedHelperCatalog() {
  return {
    catalogVersion: "1.0",
    phase: "P41.7.3",
    generatedAt: new Date().toISOString(),
    broadRefactorsAllowed: false,
    runtimeBehaviorChangesAllowed: false,
    helpers: SHARED_HELPERS,
  };
}

export function getSharedHelperById(helperId) {
  return SHARED_HELPERS.find((helper) => helper.helperId === helperId) || null;
}

export function listSharedHelperCategories() {
  return [...new Set(SHARED_HELPERS.map((helper) => helper.category))].sort();
}

export function summarizeSharedHelperCatalog(catalog = getSharedHelperCatalog()) {
  const helpers = catalog.helpers || [];
  const countBy = (field, value) => helpers.filter((helper) => helper[field] === value).length;
  return {
    totalHelpers: helpers.length,
    existingHelpers: countBy("status", "existing"),
    plannedHelpers: countBy("status", "planned"),
    futureHelpers: countBy("status", "future"),
    blockedHelpers: countBy("status", "do_not_refactor_yet"),
    lowRisk: countBy("riskLevel", "low"),
    mediumRisk: countBy("riskLevel", "medium"),
    highRisk: countBy("riskLevel", "high"),
    firstPriority: countBy("refactorPriority", "first"),
    soonPriority: countBy("refactorPriority", "soon"),
    laterPriority: countBy("refactorPriority", "later"),
    futurePriority: countBy("refactorPriority", "future"),
  };
}

export function validateSharedHelperCatalog(catalog) {
  const errors = [];
  if (catalog?.catalogVersion !== "1.0") errors.push("catalogVersion must be 1.0");
  if (catalog?.phase !== "P41.7.3") errors.push("phase must be P41.7.3");
  if (catalog?.broadRefactorsAllowed !== false) errors.push("broadRefactorsAllowed must be false");
  if (catalog?.runtimeBehaviorChangesAllowed !== false) errors.push("runtimeBehaviorChangesAllowed must be false");
  if (!Array.isArray(catalog?.helpers)) errors.push("helpers must be an array");

  const helperIds = new Set();
  for (const helper of catalog?.helpers || []) {
    for (const field of [
      "helperId",
      "name",
      "category",
      "purpose",
      "proposedModule",
      "reuseRule",
      "riskLevel",
      "refactorPriority",
      "status",
      "ownerArea",
    ]) {
      if (!helper[field]) errors.push(`helper ${helper.helperId || "unknown"} missing ${field}`);
    }
    if (helperIds.has(helper.helperId)) errors.push(`duplicate helperId: ${helper.helperId}`);
    helperIds.add(helper.helperId);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
