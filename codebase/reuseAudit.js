import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

export const AUDIT_SCAN_AREAS = [
  "mission-actions",
  "task-actions",
  "workbench",
  "implementation-actions",
  "workspace",
  "careloop-readiness",
  "command-execution",
  "local-api",
  "db",
  "local-state",
  "scripts",
  "dashboard/src/data",
  "dashboard/src/hooks",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/src/pages/command-center-v2",
  "docs/codebase",
];

const FORBIDDEN_SEGMENTS = new Set([
  "node_modules",
  ".git",
  "projects/careloop",
  "projects/careloop-ios",
]);

const AUDIT_PATTERNS = [
  {
    patternId: "policy-loading-parsing",
    category: "policy",
    title: "Repeated policy JSON loading and parsing",
    keywords: ["policy/", "JSON.parse", "readFileSync"],
    risk: "low",
    priority: "high",
    recommendedSharedModule: "shared/policyLoader.js",
    recommendation: "Create a shared policy JSON loader with parse errors, path labeling, and schema hooks.",
  },
  {
    patternId: "mode-guards",
    category: "safety",
    title: "Repeated local-private and mode guard checks",
    keywords: ["NEXUS_MODE", "local-private", "validateApiMode"],
    risk: "medium",
    priority: "high",
    recommendedSharedModule: "shared/modeGuards.js",
    recommendation: "Create a shared mode guard for local-private, demo, and test-only checks.",
  },
  {
    patternId: "report-metadata-writing",
    category: "reporting",
    title: "Repeated report metadata and Validation HEAD wording",
    keywords: ["Validation branch", "Validation HEAD", "writeFileSync"],
    risk: "low",
    priority: "high",
    recommendedSharedModule: "shared/reportWriter.js",
    recommendation: "Create a shared report writer for metadata, failures, warnings, and result blocks.",
  },
  {
    patternId: "checker-formatting",
    category: "checking",
    title: "Repeated checker PASS/FAIL formatting",
    keywords: ["PASS", "FAIL", "Result:"],
    risk: "low",
    priority: "high",
    recommendedSharedModule: "shared/checkResultFormatter.js",
    recommendation: "Create a shared checker result formatter for sections, failures, and exit codes.",
  },
  {
    patternId: "redaction-helpers",
    category: "safety",
    title: "Repeated redaction and safe payload shaping",
    keywords: ["redact", "safeResponse", "public-safe"],
    risk: "medium",
    priority: "high",
    recommendedSharedModule: "shared/redaction.js",
    recommendation: "Centralize common redaction and safe payload shaping rules.",
  },
  {
    patternId: "safe-response-envelopes",
    category: "api",
    title: "Repeated safe response envelope handling",
    keywords: ["sendJson", "sendError", "ok: false"],
    risk: "low",
    priority: "medium",
    recommendedSharedModule: "local-api/safeResponse.js",
    recommendation: "Reuse and extend the existing safe response helper instead of adding route-local envelopes.",
  },
  {
    patternId: "safe-file-read-helpers",
    category: "state",
    title: "Repeated safe local file read helpers",
    keywords: ["existsSync", "readFileSync", "safeFileReader"],
    risk: "medium",
    priority: "medium",
    recommendedSharedModule: "local-state/safeFileReader.js",
    recommendation: "Route local file reads through the existing safe file reader or a shared wrapper.",
  },
  {
    patternId: "runtime-snapshot-helpers",
    category: "state",
    title: "Repeated runtime snapshot normalization",
    keywords: ["normalizeRuntime", "snapshot", "generatedAt"],
    risk: "medium",
    priority: "medium",
    recommendedSharedModule: "local-state/runtimeSnapshot.js",
    recommendation: "Create a shared runtime snapshot read/normalize helper in a later refactor subphase.",
  },
  {
    patternId: "action-result-envelopes",
    category: "actions",
    title: "Repeated action request and result envelopes",
    keywords: ["actionId", "errors", "warnings", "result"],
    risk: "medium",
    priority: "medium",
    recommendedSharedModule: "shared/actionResult.js",
    recommendation: "Create a common action request/result envelope for bridge-style modules.",
  },
  {
    patternId: "action-store-patterns",
    category: "actions",
    title: "Repeated append-only action store patterns",
    keywords: ["append", "jsonl", "store"],
    risk: "medium",
    priority: "medium",
    recommendedSharedModule: "local-state/actionStore.js",
    recommendation: "Inventory action store patterns before extracting a common append-only store abstraction.",
  },
  {
    patternId: "evidence-audit-runtime-append",
    category: "evidence",
    title: "Repeated evidence, audit, and runtime append flows",
    keywords: ["appendEvidence", "appendAudit", "runtime event"],
    risk: "medium",
    priority: "medium",
    recommendedSharedModule: "local-state/appendRuntimeRecord.js",
    recommendation: "Create a shared append wrapper only after preserving current write-guard semantics.",
  },
  {
    patternId: "dashboard-source-badges",
    category: "dashboard",
    title: "Repeated dashboard source badge rendering and labels",
    keywords: ["source badge", "Snapshot fallback", "Live local API"],
    risk: "low",
    priority: "low",
    recommendedSharedModule: "dashboard/src/data/sourceLabels.js",
    recommendation: "Move repeated source badge labels to shared dashboard metadata.",
  },
  {
    patternId: "dashboard-action-state-labels",
    category: "dashboard",
    title: "Repeated dashboard action state labels",
    keywords: ["disabledReason", "Available", "Requires"],
    risk: "low",
    priority: "medium",
    recommendedSharedModule: "dashboard/src/data/actionStateLabels.js",
    recommendation: "Create shared dashboard labels for action readiness and disabled reasons.",
  },
  {
    patternId: "route-page-metadata",
    category: "dashboard",
    title: "Repeated route matrices and page metadata",
    keywords: ["expectedHeading", "COMMAND_CENTER_ROUTES", "helpDoc"],
    risk: "low",
    priority: "medium",
    recommendedSharedModule: "dashboard/src/data/commandCenterRoutes.js",
    recommendation: "Keep route metadata centralized and avoid route-local duplicates.",
  },
  {
    patternId: "public-private-demo-boundary",
    category: "safety",
    title: "Repeated public/private/demo boundary checks",
    keywords: ["DemoApp", "private project", "local-private"],
    risk: "high",
    priority: "high",
    recommendedSharedModule: "shared/boundaryGuards.js",
    recommendation: "Audit boundary checks carefully before extracting a shared boundary helper.",
  },
  {
    patternId: "phase-roadmap-updates",
    category: "roadmap",
    title: "Repeated phase status and roadmap update patterns",
    keywords: ["phaseId", "nextPhase", "commandCenterVisible"],
    risk: "low",
    priority: "medium",
    recommendedSharedModule: "os-roadmap/phaseStatusWriter.js",
    recommendation: "Create a future phase-status writer or validator to reduce manual registry drift.",
  },
];

function isForbiddenPath(relativePath) {
  return [...FORBIDDEN_SEGMENTS].some((segment) => relativePath === segment || relativePath.startsWith(`${segment}/`));
}

function collectFiles(targetPath, files = []) {
  const fullPath = join(ROOT, targetPath);
  if (!existsSync(fullPath)) return files;

  const relativePath = relative(ROOT, fullPath);
  if (isForbiddenPath(relativePath)) return files;

  const stats = statSync(fullPath);
  if (stats.isFile()) {
    files.push(relativePath);
    return files;
  }

  for (const entry of readdirSync(fullPath)) {
    const childPath = join(relativePath, entry);
    if (isForbiddenPath(childPath) || entry === "node_modules" || entry === ".git" || entry.startsWith(".env")) {
      continue;
    }
    collectFiles(childPath, files);
  }

  return files;
}

function readSafe(relativePath) {
  if (isForbiddenPath(relativePath) || relativePath.includes(".env")) return "";
  try {
    return readFileSync(join(ROOT, relativePath), "utf8");
  } catch {
    return "";
  }
}

function buildOccurrence(pattern, relativePath, content) {
  const matchedKeywords = pattern.keywords.filter((keyword) => content.includes(keyword));
  if (matchedKeywords.length === 0) return null;
  return {
    path: relativePath,
    matchedKeywords,
  };
}

export function classifyDuplicatePattern(pattern) {
  if (pattern.risk === "high") {
    return {
      ...pattern,
      doNow: false,
      reasonDeferred: "High-risk boundary. Requires a dedicated refactor phase and validation plan.",
    };
  }

  return {
    ...pattern,
    doNow: false,
    reasonDeferred: "Audit-only subphase. No refactor in P41.7.2.",
  };
}

export function scanDuplicatePatterns(options = {}) {
  const scanAreas = options.scanAreas || AUDIT_SCAN_AREAS;
  const files = [...new Set(scanAreas.flatMap((area) => collectFiles(area)))];
  const textFiles = files.filter((file) => /\.(js|json|md|jsx|ts|tsx|css)$/u.test(file));

  return AUDIT_PATTERNS.map((pattern) => {
    const occurrences = textFiles
      .map((file) => buildOccurrence(pattern, file, readSafe(file)))
      .filter(Boolean)
      .slice(0, 20);

    return classifyDuplicatePattern({
      ...pattern,
      occurrences,
    });
  }).filter((pattern) => pattern.occurrences.length > 0);
}

export function summarizeReuseAudit(audit) {
  const patterns = audit.patterns || [];
  const countBy = (field, value) => patterns.filter((pattern) => pattern[field] === value).length;
  return {
    areasScanned: audit.areasScanned || 0,
    patternsFound: patterns.length,
    highPriorityCandidates: countBy("priority", "high"),
    mediumPriorityCandidates: countBy("priority", "medium"),
    lowPriorityCandidates: countBy("priority", "low"),
    safeRefactorsRecommended: patterns.filter((pattern) => pattern.risk === "low").length,
    riskyRefactorsDeferred: patterns.filter((pattern) => pattern.risk === "high").length,
  };
}

export function validateReuseAudit(audit) {
  const errors = [];
  if (audit?.auditVersion !== "1.0") errors.push("auditVersion must be 1.0");
  if (audit?.phase !== "P41.7.2") errors.push("phase must be P41.7.2");
  if (!Array.isArray(audit?.patterns)) errors.push("patterns must be an array");
  if (!audit?.summary || typeof audit.summary.patternsFound !== "number") errors.push("summary must include patternsFound");
  for (const pattern of audit?.patterns || []) {
    for (const field of ["patternId", "category", "title", "risk", "priority", "recommendedSharedModule", "recommendation"]) {
      if (!pattern[field]) errors.push(`pattern ${pattern.patternId || "unknown"} missing ${field}`);
    }
    if (pattern.doNow !== false) errors.push(`pattern ${pattern.patternId} must not be marked doNow in P41.7.2`);
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildReuseAudit(options = {}) {
  const scanAreas = options.scanAreas || AUDIT_SCAN_AREAS;
  const patterns = scanDuplicatePatterns({ scanAreas });
  const audit = {
    auditVersion: "1.0",
    phase: "P41.7.2",
    generatedAt: options.generatedAt || new Date().toISOString(),
    areasScanned: scanAreas.filter((area) => existsSync(join(ROOT, area))).length,
    patterns,
    warnings: [
      "Audit is pattern-based and conservative; it identifies likely duplication candidates for later review.",
    ],
    errors: [],
  };
  audit.summary = summarizeReuseAudit(audit);
  return audit;
}
