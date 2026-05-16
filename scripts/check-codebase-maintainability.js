import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildCheckTable,
  buildLimitationsSection,
  buildWarningsSection,
  containsForbiddenSecretKey,
  containsSecretLikeValue,
  countPassFail,
  createBlockedResult,
  createFailResult,
  createPassResult,
  createSkippedResult,
  formatCheckLine,
  formatCheckSummary,
  formatReportMetadataMarkdown,
  normalizeCheckStatus,
  redactObject,
  requireMode,
  summarizeRedaction,
  validateResultEnvelope,
  writeMarkdownReport,
} from "../shared/index.js";
import {
  buildPhaseStatusReport,
  loadPhaseStatus,
  validatePhaseStatus,
} from "../os-roadmap/updatePhaseStatus.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/codebase-maintainability-report.md");
const INVENTORY_PATH = join(ROOT, "reports/shared-helper-inventory.json");
const REFACTOR_PATH = join(ROOT, "reports/refactor-candidates.json");
const REUSE_REPORT_PATH = join(ROOT, "reports/reuse-audit-report.md");

const checks = [
  { key: "sharedUtilities", name: "Shared utilities", status: "PASS", details: "" },
  { key: "resultEnvelope", name: "Result envelope", status: "PASS", details: "" },
  { key: "reportWriter", name: "Report writer", status: "PASS", details: "" },
  { key: "modeGuard", name: "Mode guard", status: "PASS", details: "" },
  { key: "redaction", name: "Redaction", status: "PASS", details: "" },
  { key: "checkFormatter", name: "Check formatter", status: "PASS", details: "" },
  { key: "phaseStatusUpdater", name: "Phase status updater", status: "PASS", details: "" },
  { key: "codebaseDocs", name: "Codebase docs", status: "PASS", details: "" },
  { key: "reuseInventory", name: "Reuse inventory", status: "PASS", details: "" },
  { key: "refactorCandidates", name: "Refactor candidates", status: "PASS", details: "" },
  { key: "noForbiddenChanges", name: "No forbidden changes", status: "PASS", details: "" },
  { key: "formattingReadability", name: "Formatting/readability", status: "PASS", details: "" },
];

const failures = [];

function setFail(key, details) {
  const check = checks.find((entry) => entry.key === key);
  if (check) {
    check.status = "FAIL";
    check.details = details;
  }
  failures.push(details);
}

function check(condition, key, details) {
  if (!condition) setFail(key, details);
}

function readFile(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function parseJson(relativePath, key) {
  try {
    return JSON.parse(readFile(relativePath));
  } catch (error) {
    setFail(key, `${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function hasExport(relativePath, exportName) {
  return readFile(relativePath).includes(`export function ${exportName}`)
    || readFile(relativePath).includes(`export const ${exportName}`)
    || readFile(relativePath).includes(`export { ${exportName}`);
}

const requiredModules = {
  "shared/resultEnvelope.js": [
    "createResultEnvelope",
    "createPassResult",
    "createFailResult",
    "createBlockedResult",
    "createSkippedResult",
    "validateResultEnvelope",
    "normalizeWarnings",
    "normalizeErrors",
  ],
  "shared/reportMetadata.js": [
    "getGitBranch",
    "getGitHead",
    "getGeneratedAt",
    "createReportMetadata",
    "formatReportMetadataMarkdown",
  ],
  "shared/reportWriter.js": [
    "writeMarkdownReport",
    "buildCheckTable",
    "buildWarningsSection",
    "buildLimitationsSection",
    "ensureReportDir",
  ],
  "shared/modeGuard.js": [
    "getNexusMode",
    "requireMode",
    "isLocalPrivateMode",
    "isTestMode",
    "isDemoMode",
    "isPublicSafeMode",
    "buildModeGuardResult",
  ],
  "shared/redaction.js": [
    "redactValue",
    "redactObject",
    "containsSecretLikeValue",
    "containsForbiddenSecretKey",
    "summarizeRedaction",
  ],
  "shared/checkResultFormatter.js": [
    "formatCheckLine",
    "formatCheckSummary",
    "countPassFail",
    "printCheckReport",
    "normalizeCheckStatus",
  ],
  "os-roadmap/updatePhaseStatus.js": [
    "loadPhaseStatus",
    "updatePhaseStatus",
    "markPhaseComplete",
    "markPhaseCurrent",
    "markNextPhase",
    "writePhaseStatus",
    "validatePhaseStatus",
    "buildPhaseStatusReport",
  ],
};

for (const [filePath, exports] of Object.entries(requiredModules)) {
  check(existsSync(join(ROOT, filePath)), "sharedUtilities", `Missing module: ${filePath}`);
  for (const exportName of exports) {
    check(hasExport(filePath, exportName), "sharedUtilities", `${filePath} missing export: ${exportName}`);
  }
}

for (const result of [
  createPassResult({ phase: "P56.8", mode: "test", source: "checker" }),
  createFailResult({ phase: "P56.8", mode: "test", source: "checker", errors: ["sample"] }),
  createBlockedResult({ phase: "P56.8", mode: "test", source: "checker" }),
  createSkippedResult({ phase: "P56.8", mode: "test", source: "checker" }),
]) {
  const validation = validateResultEnvelope(result);
  check(validation.valid, "resultEnvelope", `Invalid sample result envelope: ${validation.errors.join(", ")}`);
}

const metadataBlock = formatReportMetadataMarkdown();
check(metadataBlock.includes("Validation HEAD"), "reportWriter", "Report metadata missing Validation HEAD wording");
check(buildCheckTable([{ name: "Sample", status: "PASS", details: "ok" }]).includes("| Sample | PASS | ok |"), "reportWriter", "Check table did not render sample row");
check(buildWarningsSection(["sample warning"]).includes("sample warning"), "reportWriter", "Warnings section did not render");
check(buildLimitationsSection(["sample limitation"]).includes("sample limitation"), "reportWriter", "Limitations section did not render");

for (const mode of ["local-private", "test", "demo", "public-safe"]) {
  check(requireMode(mode, [mode]).ok === true, "modeGuard", `Mode guard did not allow ${mode}`);
}
check(requireMode("demo", ["local-private"]).ok === false, "modeGuard", "Mode guard should block disallowed mode");

const secretPayload = {
  apiKey: "sk-test-secret-value-123456789",
  nested: { password: "not-for-report" },
  publicLabel: "Quality Intelligence",
};
const redaction = summarizeRedaction(secretPayload);
check(containsForbiddenSecretKey("DATABASE_URL"), "redaction", "Secret key detector missed DATABASE_URL");
check(containsSecretLikeValue("sk-test-secret-value-123456789"), "redaction", "Secret value detector missed API key");
check(redaction.changed && redaction.redactionCount >= 2, "redaction", "Redaction summary did not redact secret fields");
check(redactObject(secretPayload).publicLabel === "Quality Intelligence", "redaction", "Redaction over-redacted public label");

check(formatCheckLine("Sample", "pass").includes("PASS"), "checkFormatter", "Check line did not normalize PASS");
check(normalizeCheckStatus("failed") === "FAIL", "checkFormatter", "Status normalization failed");
check(countPassFail([{ status: "PASS" }, { status: "FAIL" }]).fail === 1, "checkFormatter", "Pass/fail counting failed");
check(formatCheckSummary([{ status: "PASS" }]).includes("PASS 1/1"), "checkFormatter", "Check summary failed");

const phaseStatus = loadPhaseStatus();
const phaseValidation = validatePhaseStatus(phaseStatus);
check(phaseValidation.valid, "phaseStatusUpdater", `Phase status invalid: ${phaseValidation.errors.join(", ")}`);
check(buildPhaseStatusReport(phaseStatus).includes("Current phase"), "phaseStatusUpdater", "Phase status report missing summary");
check(phaseStatus.phases?.some((phase) => phase.phaseId === "P56.8"), "phaseStatusUpdater", "P56.8 missing from phase status");

for (const docPath of [
  "docs/codebase/MODULE_OWNERSHIP.md",
  "docs/codebase/DEPENDENCY_RULES.md",
  "docs/codebase/DESIGN_SYSTEM.md",
  "docs/codebase/TESTING_STRATEGY.md",
  "docs/codebase/SHARED_UTILITIES.md",
]) {
  check(readFile(docPath).length > 0, "codebaseDocs", `Missing codebase doc: ${docPath}`);
}

const inventory = parseJson("reports/shared-helper-inventory.json", "reuseInventory");
if (inventory) {
  inventory.generatedAt = new Date().toISOString();
  check(Array.isArray(inventory.sharedUtilities) && inventory.sharedUtilities.length >= 7, "reuseInventory", "Shared helper inventory must include new utilities");
  writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2) + "\n");
}

const candidates = parseJson("reports/refactor-candidates.json", "refactorCandidates");
if (candidates) {
  candidates.generatedAt = new Date().toISOString();
  check(Array.isArray(candidates.candidates) && candidates.candidates.length >= 5, "refactorCandidates", "Refactor candidates must include duplicate patterns");
  check(candidates.candidates.every((candidate) => candidate.doNow === false), "refactorCandidates", "P56.8 candidates must be deferred");
  writeFileSync(REFACTOR_PATH, JSON.stringify(candidates, null, 2) + "\n");
}

try {
  const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
  check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");
  const forbiddenDiff = gitOutput([
    "diff",
    "--name-only",
    "--",
    "agents",
    "orchestrator",
    "providers",
    "tools",
    "state-machine",
    "command-execution",
    "local-api",
    "db",
  ]);
  check(forbiddenDiff.length === 0, "noForbiddenChanges", `Forbidden runtime files changed: ${forbiddenDiff}`);
} catch (error) {
  setFail("noForbiddenChanges", `Could not inspect forbidden diffs: ${error.message}`);
}

for (const filePath of [
  ...Object.keys(requiredModules),
  "scripts/check-codebase-maintainability.js",
  "docs/codebase/SHARED_UTILITIES.md",
  "docs/codebase/MODULE_OWNERSHIP.md",
]) {
  const longLines = readFile(filePath)
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter((entry) => entry.line.length > 1000);
  check(longLines.length === 0, "formattingReadability", `${filePath} has lines over 1000 chars`);
}

const result = checks.every((checkItem) => normalizeCheckStatus(checkItem.status) === "PASS") ? "PASS" : "FAIL";
const warningList = [
  "P56.8 does not broadly migrate old checkers to shared utilities.",
  "Redaction and mode guard migrations are deferred for scoped validation.",
];
const limitations = [
  "Shared utilities are additive foundations.",
  "Historical helper duplication remains until future maintenance phases.",
  "No runtime behavior changes were made.",
];
const validationScriptNotes = [
  "`check:quality-intelligence` maps to existing `check:quality-intelligence-final`.",
  "`check:api-batch-execution-adapter` maps to existing `check:api-batch-final`.",
  "`check:trigger-integration-gateway` maps to existing `check:trigger-integration-final`.",
  "`check:tool-mcp-registry` maps to existing tool registry/governance checks.",
  "`check:agent-definition-update` maps to existing `check:agent-definition-update-final`.",
  "`check:agentic-mesh` maps to existing `check-governed-agentic-mesh`.",
  "`check:trusted-context` maps to existing `check:trusted-context-final-validation`.",
  "`check:scoped-memory` maps to existing `check:scoped-memory-final-validation`.",
  "`check:agent-registry` maps to existing `check:agent-registry-final-validation`.",
];

writeMarkdownReport(
  REPORT_PATH,
  [
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Summary", body: formatCheckSummary(checks) },
    buildWarningsSection(warningList),
    buildLimitationsSection(limitations),
    {
      title: "Validation Script Name Differences",
      body: validationScriptNotes.map((note) => `- ${note}`).join("\n"),
    },
    {
      title: "Failures",
      body: failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None",
    },
    {
      title: "Result",
      body: result,
    },
  ],
  {
    title: "Codebase Maintainability Report",
    metadata: { phase: "P56.8 - Codebase Maintainability Guardrails + Shared Utility Foundation" },
  },
);

writeMarkdownReport(
  REUSE_REPORT_PATH,
  [
    {
      title: "Inventory Summary",
      body: "P56.8 adds shared utility foundations for result envelopes, report metadata, report writing, mode guards, redaction, checker formatting, and OS phase status updates.",
    },
    {
      title: "Duplicate Patterns Found",
      body: [
        "- Manual report metadata blocks in checkers.",
        "- Manual PASS/FAIL console formatting.",
        "- Phase-local mode guard checks.",
        "- Phase-local redaction helpers.",
        "- Manual phase-status JSON update scripts.",
      ].join("\n"),
    },
    {
      title: "Refactors Deferred",
      body: "Historical checkers and runtime modules are not broadly migrated in P56.8.",
    },
  ],
  {
    title: "Reuse Audit Report",
    metadata: { phase: "P56.8 - Codebase Maintainability Guardrails + Shared Utility Foundation" },
  },
);

console.log("NEXUS Codebase Maintainability Check");
console.log("====================================");
for (const checkItem of checks) {
  console.log(formatCheckLine(checkItem.name, checkItem.status, checkItem.details));
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
