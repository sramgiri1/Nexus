import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_PHASE,
  EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_VERSION,
  buildEvidenceAuditObservabilityCostLedgerUxProjection,
} from "../shared/evidenceAuditObservabilityCostLedgerUxProjection.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1394-evidence-audit-observability-cost-ledger-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p139-evidence-audit-observability-cost-ledger-contracts.json";
const PLAN_PATH = "docs/architecture/P139_EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_PLAN.md";
const REQUIRED_SCRIPT = "check:p1394-evidence-audit-observability-cost-ledger";
const EXPECTED_BASE_COMMIT = "1bf5a3f6";
const EXPECTED_EXPORTS = [
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_PHASE",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_VERSION",
  "buildEvidenceAuditObservabilityCostLedgerUxProjection",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PHASE",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_VERSION",
  "buildEvidenceAuditObservabilityCostLedgerUxViewModel",
  "evidenceAuditObservabilityCostLedgerUxViewModel",
];
const VALIDATION_COMMANDS = [
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|model|policy|safety|preview|dry-run|dry run|read-only|checker|checkers|report|docs?|roadmap|status|boundary|non-runnable|preserve|evidence|audit|observability|cost|redacted|validation-only|closure|zero-spend|ux)\b/i.test(context);
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
const p1394 = subphaseById.get("P139.4") || {};
const p1395 = subphaseById.get("P139.5") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const checkerSource = readText("scripts/check-p1394-evidence-audit-observability-cost-ledger.js");
const projectionSource = readText("shared/evidenceAuditObservabilityCostLedgerUxProjection.js");
const dashboardData = readText("dashboard/src/data/evidenceAuditObservabilityCostLedgerUx.js");
const dashboardPage = readText("dashboard/src/pages/CommandCenterV2.jsx");
const dashboardTabs = readText("dashboard/src/data/commandCenterTabs.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const litePageSlice = dashboardPage.slice(
  dashboardPage.indexOf("function CommandCenterLitePage"),
  dashboardPage.indexOf("function AgentFlowPage"),
);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P139.4";
const allowedFiles = new Set(p1394.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
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
const projection = buildEvidenceAuditObservabilityCostLedgerUxProjection();
const serializedProjection = JSON.stringify(projection);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
const uiBundle = `${dashboardData}\n${dashboardPage}\n${dashboardTabs}`;
const p1394CurrentState =
  status.currentPhase === "P139.4"
  && status.previousPhase === "P139.3"
  && status.nextPhase === "P139.5"
  && roadmap.currentPhase === "P139.4"
  && roadmap.previousPhase === "P139.3"
  && roadmap.nextPhase === "P139.5"
  && status.current?.phaseId === "P139.4"
  && status.previous?.phaseId === "P139.3"
  && status.next?.phaseId === "P139.5"
  && roadmap.current?.phaseId === "P139.4"
  && roadmap.previous?.phaseId === "P139.3"
  && roadmap.next?.phaseId === "P139.5"
  && statusById.get("P139")?.status === "in_progress"
  && roadmapById.get("P139")?.status === "in_progress"
  && ["P139.1", "P139.2", "P139.3", "P139.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P139.5")?.status === "planned"
  && roadmapById.get("P139.5")?.status === "planned";

addCheck("package script registered", packageJson.scripts?.[REQUIRED_SCRIPT] === "node scripts/check-p1394-evidence-audit-observability-cost-ledger.js");
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("projection exports expected API", [
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_PHASE",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_VERSION",
  "buildEvidenceAuditObservabilityCostLedgerUxProjection",
].every((entry) => projectionSource.includes(`export const ${entry}`) || projectionSource.includes(`export function ${entry}`)));
addCheck("dashboard view model exports expected API", [
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PHASE",
  "EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_VERSION",
  "buildEvidenceAuditObservabilityCostLedgerUxViewModel",
  "evidenceAuditObservabilityCostLedgerUxViewModel",
].every((entry) => dashboardData.includes(`export const ${entry}`) || dashboardData.includes(`export function ${entry}`)));
addCheck("projection is browser safe", !/\bnode:|fs|child_process|execFileSync|writeFileSync|appendFileSync|fetch|XMLHttpRequest|sqlite|postgres|mongodb\b/.test(projectionSource));
addCheck("dashboard uses browser-safe projection", dashboardData.includes("evidenceAuditObservabilityCostLedgerUxProjection.js") && !dashboardData.includes("evidenceAuditObservabilityCostLedgerPreview.js"));
addCheck("projection constants are correct", EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_PHASE === "P139.4" && EVIDENCE_AUDIT_OBSERVABILITY_COST_LEDGER_UX_PROJECTION_VERSION === "1.0");
addCheck("projection rows are useful", projection.previewRows?.length >= 3 && projection.previewRows.every((row) => row.label && row.nextAction && row.disabledReason && row.costImpact));
addCheck("projection sections are useful", projection.previewSections?.length === 3 && projection.previewSections.every((section) => section.title && section.summary && section.nextAction));
addCheck("projection remains read-only", projection.previewOnly === true && projection.readOnly === true && projection.localOnly === true && projection.commandCenterVisible === true);
addCheck("projection keeps all authority blocked", [
  "writesLedger",
  "writesDb",
  "writesRuntime",
  "mutatesProjects",
  "dispatchesAgents",
  "callsProviders",
  "callsModels",
  "executesTools",
  "usesNetwork",
  "deploysReleasesExportsPackages",
  "spendsBudget",
  "exposesRawPayloads",
].every((flag) => projection.previewSafety?.[flag] === false));
addCheck("projection remains zero-spend", /Zero-spend/i.test(projection.costImpact || "") && projection.sourcePreview?.previewSummary?.zeroSpend === true);
addCheck("observability has ledger tab", /OBSERVABILITY_TABS[\s\S]*id:\s+"ledger"[\s\S]*Evidence, audit, activity, observability, and cost preview/.test(dashboardTabs));
addCheck("Command Center card is scoped", [
  "EvidenceAuditObservabilityCostLedgerCard",
  "Observability Ledger Preview",
  "Evidence Traceability Ledger",
  "Cost Ledger Traceability",
  "Business Build Traceability Ledger",
  "Agent Flow Traceability Ledger",
].every((text) => dashboardPage.includes(text)));
addCheck("Command Center does not add ledger card to Lite chat", litePageSlice.includes("function CommandCenterLitePage") && !litePageSlice.includes("EvidenceAuditObservabilityCostLedgerCard"));
addCheck("Command Center card avoids raw phase/report identifiers", !/reports\/p139|ledger-p139|corr[_-]p139|record-p139|cost-p139/i.test(uiBundle));
addCheck("Command Center card avoids fake runnable actions", !/write ledger now|run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(uiBundle));
addCheck("Playwright coverage added", routeTests.includes("P139.4 evidence audit observability cost ledger UX is read-only and scoped") && routeTests.includes("Evidence audit observability cost ledger preview") && routeTests.includes("not.toMatch(/P139"));
addCheck("route-wide safety coverage retained", ["Command Center route-wide UX", "DemoApp", "raw JSON", "private-project", "dispatch agent now", "Use system theme", "Use dark theme", "Use light theme"].every((text) => routeTests.includes(text)));
addCheck("contract advances P139.4 safely", contract.phaseId === "P139" && contract.status === "in_progress" && contract.currentSubphase === "P139.4" && contract.previousSubphase === "P139.3" && contract.nextSubphase === "P139.5");
addCheck("contract records expected base commit", contract.expectedBaseCommit === "afe98694" && p1394.expectedBaseCommit === EXPECTED_BASE_COMMIT);
addCheck("P139.4 complete and P139.5 planned", p1394.status === "complete" && p1395.status === "planned" && p1394.nextPhase === "P139.5");
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((entry) => p1394.expectedExports?.includes(entry)));
addCheck("contract records validation commands", VALIDATION_COMMANDS.every((command) => p1394.validationCommands?.includes(command)));
addCheck("contract scope stays UX-only", /Command Center/i.test(p1394.dataShape || "") && p1394.forbiddenFiles?.includes("db/**") && p1394.forbiddenFiles?.includes("projects/**"));
addCheck("P139.3 report passes", reportPassed("reports/p1393-evidence-audit-observability-cost-ledger-report.md"));
addCheck("enterprise checker accepts P139.4", enterpriseChecker.includes("p1394CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P139 plan records P139.4", /## P139\.4 Observability Command Center UX[\s\S]*Status:\s+complete/.test(plan) && /P139\.5 remains planned-only/i.test(plan));
addCheck("README records P139.4", /P139\.4 Observability Command Center UX/i.test(readme) && /P139\.5 is planned-only\s+next/i.test(readme));
addCheck("platform roadmap records P139.4", /P139\.4 Observability Command Center UX is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P139.4", /P139\.4 is now complete/i.test(enterpriseRoadmap) && /P139\.5 is the next executable subphase/i.test(enterpriseRoadmap));
addCheck("phase status starts P139.4", p1394CurrentState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P139.4 entries have required fields", [statusById.get("P139"), statusById.get("P139.4"), roadmapById.get("P139"), roadmapById.get("P139.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P139.5 remains planned-only", statusById.get("P139.5")?.status === "planned" && roadmapById.get("P139.5")?.status === "planned" && !(statusById.get("P139.5")?.checksRun || []).length);
addCheck("changed files stay in P139.4 allowed scope", !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)), enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`);
addCheck("forbidden paths unchanged", !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))), enforceCurrentDiffScope ? changed.join(", ") : `P139.4 forbidden path check relaxed for ${status.currentPhase}`);
addCheck("projection/docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool|agent|memory|policy|ledger)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(`${serializedProjection}\n${docsBundle}`));
addCheck("projection avoids fake runnable actions", !/write ledger now|persist ledger now|write audit now|write evidence now|write cost now|call provider now|dispatch agent now|mutate project now|apply patch now|run build now|run tests now|deploy now|release now|export now|package now|spend now/i.test(serializedProjection));
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
        "- Routes the display-safe ledger preview into Command Center observability, evidence, cost, Business Build, and Agent Flow surfaces.",
        "- Uses a browser-safe shared projection so dashboard build does not import Node-only evidence hashing modules.",
        "- Does not write ledger records, DB/runtime state, call providers/models, execute tools, start MCP servers, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "UX Summary",
      body: [
        `- Preview rows: ${projection.previewRows.length}`,
        `- Preview sections: ${projection.previewSections.length}`,
        `- Surface placements: ${["Observability", "Evidence", "Cost Center", "Business Build", "Agent Flow"].join(", ")}`,
        "- Chat with NEXUS and Lite remain clean.",
      ].join("\n"),
    },
    { title: "Expected Exports", body: EXPECTED_EXPORTS.map((entry) => `- ${entry}`).join("\n") },
    {
      title: "Phase Status",
      body: [
        `- Current subphase: ${status.currentPhase}`,
        `- Previous subphase: ${status.previousPhase}`,
        `- Next subphase: ${status.nextPhase}`,
        "- P139.5 remains planned-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P139.4 is UX-only. It does not enable live ledger persistence, DB/runtime writes, provider/model calls, tool execution, MCP startup, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. P139.5 remains planned-only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P139.4 Evidence Audit Observability Cost Ledger Report", phase: "P139.4" },
);

printCheckReport("P139.4 Evidence Audit Observability Cost Ledger Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
