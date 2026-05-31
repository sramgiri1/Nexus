import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES,
  buildEvidenceAuditObservabilityCostLedgerModel,
  validateEvidenceAuditObservabilityCostLedgerModel,
} from "../shared/evidenceAuditObservabilityCostLedgerModel.js";
import {
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES,
  buildEvidenceAuditObservabilityCostLedgerPreview,
  validateEvidenceAuditObservabilityCostLedgerPreview,
} from "../shared/evidenceAuditObservabilityCostLedgerPreview.js";
import { buildEvidenceAuditObservabilityCostLedgerUxProjection } from "../shared/evidenceAuditObservabilityCostLedgerUxProjection.js";
import { buildEvidenceAuditObservabilityCostLedgerUxViewModel } from "../dashboard/src/data/evidenceAuditObservabilityCostLedgerUx.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1395-evidence-audit-observability-cost-ledger-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p139-evidence-audit-observability-cost-ledger-contracts.json";
const PLAN_PATH = "docs/architecture/P139_EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PLAN.md";
const REQUIRED_SCRIPT = "check:p1395-evidence-audit-observability-cost-ledger";
const EXPECTED_BASE_COMMIT = "30f9d0f7";
const REQUIRED_P139_SCRIPTS = [
  "check:p1391-evidence-audit-observability-cost-ledger",
  "check:p1392-evidence-audit-observability-cost-ledger",
  "check:p1393-evidence-audit-observability-cost-ledger",
  "check:p1394-evidence-audit-observability-cost-ledger",
  REQUIRED_SCRIPT,
];
const PRIOR_REPORTS = [
  "reports/p1391-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1392-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1393-evidence-audit-observability-cost-ledger-report.md",
  "reports/p1394-evidence-audit-observability-cost-ledger-report.md",
];
const VALIDATION_COMMANDS = [
  "npm run check:p1395-evidence-audit-observability-cost-ledger",
  "npm run check:p1394-evidence-audit-observability-cost-ledger",
  "npm run check:p1393-evidence-audit-observability-cost-ledger",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"P139.4\"",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS|Result:\s+PASS/i.test(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    if (/^\s*-\s+`[^`]+`\s*$/.test(line)) return false;
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|audit|observability|cost|redacted|validation-only|closure|zero-spend|ux|coverage)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1395 = subphaseById.get("P139.5") || {};
const p1396 = subphaseById.get("P139.6") || {};
const checkerSource = readText("scripts/check-p1395-evidence-audit-observability-cost-ledger.js");
const p1394Checker = readText("scripts/check-p1394-evidence-audit-observability-cost-ledger.js");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const dashboardPage = readText("dashboard/src/pages/CommandCenterV2.jsx");
const dashboardData = readText("dashboard/src/data/evidenceAuditObservabilityCostLedgerUx.js");
const dashboardTabs = readText("dashboard/src/data/commandCenterTabs.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P139.5";
const allowedFiles = new Set(p1395.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
  "db/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];

const founderIdea = "Build a simple iOS Snake game for the App Store";
const ledgerModel = buildEvidenceAuditObservabilityCostLedgerModel({
  founderIdeaSummary: founderIdea,
  createdAt: "2026-05-30T00:00:00.000Z",
});
const modelValidation = validateEvidenceAuditObservabilityCostLedgerModel(ledgerModel);
const preview = buildEvidenceAuditObservabilityCostLedgerPreview({
  founderIdeaSummary: founderIdea,
  createdAt: "2026-05-30T00:00:00.000Z",
  model: ledgerModel,
});
const previewValidation = validateEvidenceAuditObservabilityCostLedgerPreview(preview);
const uxProjection = buildEvidenceAuditObservabilityCostLedgerUxProjection();
const uxViewModel = buildEvidenceAuditObservabilityCostLedgerUxViewModel({ previewEnvelope: uxProjection });
const aggregateDisplay = JSON.stringify([ledgerModel, preview.data, uxProjection, uxViewModel]);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;

const p1395CurrentState =
  status.currentPhase === "P139.5"
  && status.previousPhase === "P139.4"
  && status.nextPhase === "P139.6"
  && roadmap.currentPhase === "P139.5"
  && roadmap.previousPhase === "P139.4"
  && roadmap.nextPhase === "P139.6"
  && status.current?.phaseId === "P139.5"
  && status.previous?.phaseId === "P139.4"
  && status.next?.phaseId === "P139.6"
  && roadmap.current?.phaseId === "P139.5"
  && roadmap.previous?.phaseId === "P139.4"
  && roadmap.next?.phaseId === "P139.6"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.6")?.status === "planned"
  && roadmapById.get("P139.6")?.status === "planned";
const p1396CurrentState =
  status.currentPhase === "P139.6"
  && status.previousPhase === "P139.5"
  && status.nextPhase === "P139.7"
  && roadmap.currentPhase === "P139.6"
  && roadmap.previousPhase === "P139.5"
  && roadmap.nextPhase === "P139.7"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4", "P139.5", "P139.6"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.7")?.status === "planned"
  && roadmapById.get("P139.7")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1395-evidence-audit-observability-cost-ledger.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("checker reuses model preview and UX helpers", [
  "../shared/evidenceAuditObservabilityCostLedgerModel.js",
  "../shared/evidenceAuditObservabilityCostLedgerPreview.js",
  "../shared/evidenceAuditObservabilityCostLedgerUxProjection.js",
  "../dashboard/src/data/evidenceAuditObservabilityCostLedgerUx.js",
].every((target) => checkerSource.includes(target)));
addCheck("P139.1-P139.5 package scripts registered", REQUIRED_P139_SCRIPTS.every((scriptName) => Boolean(packageJson.scripts?.[scriptName])));
addCheck("P139.1-P139.4 reports pass", PRIOR_REPORTS.every(reportPassed));
addCheck("ledger model validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("ledger model has useful linked references", ledgerModel.ledgerSummary?.recordCount >= 3 && ledgerModel.ledgerSummary?.evidenceRefCount > 0 && ledgerModel.ledgerSummary?.auditRefCount > 0 && ledgerModel.ledgerSummary?.activityRefCount > 0 && ledgerModel.ledgerSummary?.observabilityRefCount > 0);
addCheck("ledger model keeps all authority blocked", EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_SAFETY_FLAG_NAMES.every((flag) => ledgerModel[flag] === false && ledgerModel.safetyFlags?.[flag] === false));
addCheck("ledger model remains zero-spend", ledgerModel.costSummary?.estimatedUsd === 0 && ledgerModel.costSummary?.actualUsd === 0 && ledgerModel.providerSpendAllowed === false);
addCheck("preview validates", previewValidation.valid, previewValidation.errors.join("; "));
addCheck("preview remains useful and read-only", preview.data?.previewSummary?.rowCount >= 3 && preview.data?.previewSummary?.sectionCount === 3 && preview.data?.previewSummary?.zeroSpend === true && preview.data?.previewOnly === true && preview.data?.readOnly === true);
addCheck("preview keeps all authority blocked", EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PREVIEW_SAFETY_FLAG_NAMES.every((flag) => preview.data?.[flag] === false && preview.data?.safetyFlags?.[flag] === false));
addCheck("UX projection remains display-safe", uxProjection.previewRows?.length >= 3 && uxProjection.previewSections?.length === 3 && uxProjection.previewOnly === true && uxProjection.readOnly === true && uxProjection.previewSafety?.writesLedger === false && uxProjection.previewSafety?.spendsBudget === false);
addCheck("UX view model remains useful", uxViewModel.previewCards?.length >= 4 && uxViewModel.traceRows?.length >= 3 && uxViewModel.safetyRows?.some((row) => row.label === "Provider/model calls" && row.value === "Blocked") && uxViewModel.surfacePlacements?.length >= 5);
addCheck("Command Center ledger card remains scoped", [
  "EvidenceAuditObservabilityCostLedgerCard",
  "Observability Ledger Preview",
  "Evidence Traceability Ledger",
  "Cost Ledger Traceability",
  "Business Build Traceability Ledger",
  "Agent Flow Traceability Ledger",
].every((text) => dashboardPage.includes(text)));
addCheck("Command Center display data stays browser-safe", dashboardData.includes("evidenceAuditObservabilityCostLedgerUxProjection.js") && !dashboardData.includes("evidenceAuditObservabilityCostLedgerPreview.js"));
addCheck("Observability ledger tab remains wired", /OBSERVABILITY_TABS[\s\S]*id:\s+"ledger"/.test(dashboardTabs));
addCheck("P139.4 Playwright coverage retained", routeTests.includes("P139.4 evidence audit observability cost ledger UX is read-only and scoped") && routeTests.includes("Evidence audit observability cost ledger preview") && routeTests.includes("Writes, execution, provider calls, project mutation, network calls, and spend remain blocked"));
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("P139.4 checker accepts P139.5 handoff", p1394Checker.includes("p1395CurrentState") && p1394Checker.includes('status.currentPhase === "P139.5"') && p1394Checker.includes(REQUIRED_SCRIPT));
addCheck("enterprise checker accepts P139.5", enterpriseChecker.includes("p1395CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("contract marks P139.5 complete", contract.phaseId === "P139" && contract.status === "in_progress" && p1395.status === "complete" && ((contract.currentSubphase === "P139.5" && contract.previousSubphase === "P139.4" && contract.nextSubphase === "P139.6" && p1396.status === "planned") || (p1396CurrentState && contract.currentSubphase === "P139.6" && p1396.status === "complete")));
addCheck("contract records expected base commit", p1395.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1395.validationCommands?.includes(command)));
addCheck("contract scope stays validation-only", /validation/i.test(p1395.dataShape || "") && p1395.expectedExports?.length === 0 && p1395.forbiddenFiles?.includes("dashboard/src/**") && p1395.forbiddenFiles?.includes("dashboard/tests/**") && p1395.forbiddenFiles?.includes("projects/**"));
addCheck("docs record P139.5", /## P139\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan) && /P139\.5 tests\/checkers/i.test(readme) && /P139\.5 tests\/checkers is complete/i.test(platformRoadmap) && /P139\.5 is now complete/i.test(enterpriseRoadmap));
addCheck("phase status starts or safely hands off P139.5", p1395CurrentState || p1396CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P139.5 entries have required fields", [statusById.get("P139"), statusById.get("P139.5"), roadmapById.get("P139"), roadmapById.get("P139.5")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P139.6 remains planned or safely complete", (p1395CurrentState && statusById.get("P139.6")?.status === "planned" && roadmapById.get("P139.6")?.status === "planned" && !(statusById.get("P139.6")?.checksRun || []).length) || p1396CurrentState);
addCheck("changed files stay in P139.5 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P139.5 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("aggregate display avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(aggregateDisplay));
addCheck("aggregate display avoids raw dumps", !/Bearer\s+|sk-[A-Za-z0-9]|DATABASE_URL|postgres(?:ql)?:\/\/|raw JSON|raw logs|raw policy dump|raw ledger dump|providerPayload|toolPayload/i.test(aggregateDisplay));
addCheck("aggregate display avoids fake runnable actions", !/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(aggregateDisplay));
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable actions", !/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /\b(ledger writes are enabled|audit writes are enabled|evidence writes are enabled|observability writes are enabled|cost writes are enabled|DB writes are enabled|runtime writes are enabled|CRUD is live|provider calls are enabled|model calls are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled|network calls are enabled|spend is enabled)\b/i));
addCheck("docs avoid raw dumps", !hasUnsafePositiveClaim(docsBundle, /\b(raw JSON|raw logs?|raw policy dumps?|raw ledger payloads?|raw registry dumps?)\b/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P139.1-P139.4 validation across contracts, reports, model, preview, Command Center UX projection, route coverage, docs, roadmap, and OS phase status.",
        "- Confirms the ledger model, preview, and Command Center projection remain display-safe, zero-spend, and non-runnable.",
        "- Does not write ledger records, DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "Aggregate Coverage Summary",
      body: [
        `- Ledger records: ${ledgerModel.ledgerSummary.recordCount}`,
        `- Preview rows: ${preview.data.previewSummary.rowCount}`,
        `- Preview sections: ${preview.data.previewSummary.sectionCount}`,
        `- UX cards: ${uxViewModel.previewCards.length}`,
        `- UX trace rows: ${uxViewModel.traceRows.length}`,
        `- Prior reports passing: ${PRIOR_REPORTS.length}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: p1396CurrentState
        ? "- P139.5 is tests/checkers hardening only. It does not enable ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P139.6 has advanced through a separate docs/status closure subphase."
        : "- P139.5 is tests/checkers hardening only. It does not enable ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P139.6 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P139.5 Evidence Audit Observability Cost Ledger Tests Checkers Report", phase: "P139.5" },
);

printCheckReport("P139.5 Evidence Audit Observability Cost Ledger Tests Checkers Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
