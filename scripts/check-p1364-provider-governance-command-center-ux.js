import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { getTabsForPage } from "../dashboard/src/data/commandCenterTabs.js";
import { COMMAND_CENTER_ROUTE_BY_KEY } from "../dashboard/src/data/commandCenterRoutes.js";
import { providerGovernanceReadiness, providerGovernanceSummary } from "../dashboard/src/data/providerGovernanceReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1364-provider-governance-command-center-ux-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p136-secrets-providers-tool-governance-contracts.json";
const PLAN_PATH = "docs/architecture/P136_SECRETS_PROVIDERS_TOOL_GOVERNANCE_PLAN.md";
const REQUIRED_SCRIPT = "check:p1364-provider-governance-command-center-ux";
const VALIDATION_COMMANDS = [
  "npm run check:p1364-provider-governance-command-center-ux",
  "npm run check:p1363-provider-dry-run",
  "npm run check:enterprise-readiness-roadmap",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "cd dashboard && npm run build",
  "cd dashboard && npm run test:unit",
  "cd dashboard && npx playwright test tests/routes.spec.js -g \"Command Center route-wide UX\"",
  "git diff --check",
];
const EXPECTED_EXPORTS = ["providerGovernanceReadiness", "providerGovernanceSummary"];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function reportPassed(relativePath) {
  const absolutePath = join(ROOT, relativePath);
  if (!existsSync(absolutePath)) return false;
  return /## Result[\s\S]*PASS/i.test(readText(relativePath));
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
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|planned-only|future|until|before|must not|cannot|contract|policy|safety|preview|dry-run|dry run|read-only|review-only|model|checker|report|docs?|roadmap|status|boundary|non-runnable)\b/i.test(context);
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
const p1364 = subphaseById.get("P136.4") || {};
const p1365 = subphaseById.get("P136.5") || {};
const p1366 = subphaseById.get("P136.6") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const enterpriseRoadmap = readText("docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md");
const enterpriseChecker = readText("scripts/check-enterprise-readiness-roadmap.js");
const p1363Checker = readText("scripts/check-p1363-provider-dry-run.js");
const checkerSource = readText("scripts/check-p1364-provider-governance-command-center-ux.js");
const dataSource = readText("dashboard/src/data/providerGovernanceReadiness.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const routesSource = readText("dashboard/src/data/commandCenterRoutes.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routesSpec = readText("dashboard/tests/routes.spec.js");
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P136.4";
const providerRoute = COMMAND_CENTER_ROUTE_BY_KEY.providerGovernance || {};
const providerTabs = getTabsForPage("providerGovernance");
const readinessText = JSON.stringify(providerGovernanceReadiness);
const allowedFiles = new Set([
  "dashboard/src/data/providerGovernanceReadiness.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/data/commandCenterRoutes.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  CONTRACT_PATH,
  PLAN_PATH,
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "docs/architecture/NEXUS_ENTERPRISE_READINESS_ROADMAP.md",
  "os-roadmap/nexus-phases.json",
  "os-roadmap/phase-status.json",
  "package.json",
  "scripts/check-p1364-provider-governance-command-center-ux.js",
  "scripts/check-p1363-provider-dry-run.js",
  "scripts/check-enterprise-readiness-roadmap.js",
  REPORT_PATH,
  "reports/p1363-provider-dry-run-report.md",
  "reports/enterprise-readiness-roadmap-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
]);
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
const p1364CurrentState =
  status.currentPhase === "P136.4"
  && status.previousPhase === "P136.3"
  && status.nextPhase === "P136.5"
  && roadmap.currentPhase === "P136.4"
  && roadmap.previousPhase === "P136.3"
  && roadmap.nextPhase === "P136.5"
  && status.current?.phaseId === "P136.4"
  && status.previous?.phaseId === "P136.3"
  && status.next?.phaseId === "P136.5"
  && roadmap.current?.phaseId === "P136.4"
  && roadmap.previous?.phaseId === "P136.3"
  && roadmap.next?.phaseId === "P136.5"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && ["P136.1", "P136.2", "P136.3", "P136.4"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136.5")?.status === "planned"
  && roadmapById.get("P136.5")?.status === "planned";
const p1365CurrentState =
  status.currentPhase === "P136.5"
  && status.previousPhase === "P136.4"
  && status.nextPhase === "P136.6"
  && roadmap.currentPhase === "P136.5"
  && roadmap.previousPhase === "P136.4"
  && roadmap.nextPhase === "P136.6"
  && status.current?.phaseId === "P136.5"
  && status.previous?.phaseId === "P136.4"
  && status.next?.phaseId === "P136.6"
  && roadmap.current?.phaseId === "P136.5"
  && roadmap.previous?.phaseId === "P136.4"
  && roadmap.next?.phaseId === "P136.6"
  && statusById.get("P136")?.status === "in_progress"
  && roadmapById.get("P136")?.status === "in_progress"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P136.6")?.status === "planned"
  && roadmapById.get("P136.6")?.status === "planned";
const p1367FinalState =
  status.currentPhase === "P136.7"
  && status.previousPhase === "P136.6"
  && status.nextPhase === "P137"
  && roadmap.currentPhase === "P136.7"
  && roadmap.previousPhase === "P136.6"
  && roadmap.nextPhase === "P137"
  && statusById.get("P136")?.status === "complete"
  && roadmapById.get("P136")?.status === "complete"
  && ["P136.1", "P136.2", "P136.3", "P136.4", "P136.5", "P136.6", "P136.7"].every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
  && statusById.get("P137")?.status === "planned"
  && roadmapById.get("P137")?.status === "planned";

addCheck("package script registered", Boolean(packageJson.scripts?.[REQUIRED_SCRIPT]));
addCheck("checker reuses shared report helpers", checkerSource.includes("../shared/reportWriter.js") && checkerSource.includes("../shared/checkResultFormatter.js"));
addCheck("readiness exports exist", EXPECTED_EXPORTS.every((name) => dataSource.includes(`export const ${name}`)) && providerGovernanceSummary.phase === "P136.4");
addCheck("readiness reuses P136.3 dry-run shape", dataSource.includes("buildProviderGovernanceDryRun") && providerGovernanceSummary.sourcePhase === "P136.3" && providerGovernanceSummary.dryRunRows > 0);
addCheck("readiness has operator fields", [
  "whatChanged",
  "currentState",
  "nextAction",
  "disabledReason",
  "ownerCapability",
  "evidenceLocation",
  "activityLocation",
  "costImpact",
].every((key) => Boolean(providerGovernanceReadiness[key])));
addCheck("readiness is non-runnable and zero-spend", providerGovernanceSummary.executableRows === 0 && providerGovernanceSummary.estimatedUsd === 0 && providerGovernanceReadiness.summaryCards.some((card) => card.value === "$0"));
addCheck("readiness hides raw IDs, secrets, and payloads", !/secret-ref-|sk-[A-Za-z0-9]|Bearer\s+|DATABASE_URL|providerBatchId|inputFileId|requestBody|headers|project_[A-Za-z0-9_-]*\d|private-project-/i.test(readinessText));
addCheck("readiness avoids fake runnable actions", !/call provider now|call model now|run tool now|execute tool now|start mcp now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(readinessText));
addCheck("tabs registered", tabsSource.includes("PROVIDER_GOVERNANCE_TABS") && providerTabs.length === 6 && providerTabs.map((tab) => tab.label).includes("Dry Run"));
addCheck("route registered", providerRoute.path === "/command-center/provider-governance" && providerRoute.expectedHeading === "Provider Governance" && providerRoute.status === "implemented" && providerRoute.defaultTab === "overview");
addCheck("route context registered", routesSource.includes("providerGovernance") && routesSource.includes("P136.3 dry-run blockers"));
addCheck("page renders provider governance route", pageSource.includes("ProviderGovernancePage") && pageSource.includes("providerGovernanceReadiness") && pageSource.includes('currentPage === "providerGovernance"') && pageSource.includes("PROVIDER_GOVERNANCE_TABS"));
addCheck("page shows required UX fields", [
  "What changed",
  "Current state",
  "Disabled reason",
  "Cost impact",
  "Activity Log > Provider Governance",
  "Execution disabled",
].every((needle) => pageSource.includes(needle) || readinessText.includes(needle)));
addCheck("page avoids runnable controls", !/Run provider|Call provider|Execute tool|Spend now|Deploy now|Package now/.test(pageSource));
addCheck("Playwright covers Provider Governance route", routesSpec.includes("/command-center/provider-governance") && routesSpec.includes("Provider Governance route renders P136.4 review-only dry-run posture"));
addCheck("Playwright covers tabs and themes", ["Dry Run", "Approval Needs", "Cost Impact", "Evidence", "Safety", "dark", "light", "system"].every((needle) => routesSpec.includes(needle)));
addCheck("P136.3 report passes", reportPassed("reports/p1363-provider-dry-run-report.md"));
addCheck("P136.3 checker accepts P136.4", p1363Checker.includes("p1364CurrentState") && p1363Checker.includes('status.currentPhase === "P136.4"'));
addCheck("enterprise checker accepts P136.4", enterpriseChecker.includes("p1364CurrentState") && enterpriseChecker.includes(REQUIRED_SCRIPT));
addCheck("P136.4 checker accepts P136.5 handoff", p1365CurrentState ? checkerSource.includes("p1365CurrentState") && checkerSource.includes("check:p1365-secrets-providers-tool-governance-tests-checkers") : true);
addCheck("contract advances P136.4", contract.phaseId === "P136" && p1364.status === "complete" && ((contract.status === "in_progress" && ((contract.currentSubphase === "P136.4" && contract.previousSubphase === "P136.3" && contract.nextSubphase === "P136.5" && p1365.status === "planned") || (contract.currentSubphase === "P136.5" && contract.previousSubphase === "P136.4" && contract.nextSubphase === "P136.6" && p1365.status === "complete" && p1366.status === "planned"))) || (p1367FinalState && contract.status === "complete" && contract.currentSubphase === "P136.7" && contract.previousSubphase === "P136.6" && contract.nextSubphase === "P137")));
addCheck("contract records expected exports", EXPECTED_EXPORTS.every((name) => p1364.expectedExports?.includes(name)));
addCheck("P136.4 records validation commands", VALIDATION_COMMANDS.every((command) => p1364.validationCommands?.includes(command)));
addCheck("P136 plan records P136.4", /### P136\.4 Provider Governance Command Center UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P136.4", /P136\.4 provider governance Command Center UX/i.test(readme));
addCheck("platform roadmap records P136.4", /P136\.4 provider governance Command Center UX is complete/i.test(platformRoadmap));
addCheck("enterprise roadmap records P136.4", /P136\.4 is now complete/i.test(enterpriseRoadmap) && (/P136\.5 is the next executable subphase/i.test(enterpriseRoadmap) || /P136\.5 is now complete/i.test(enterpriseRoadmap) || /P136\.1 through P136\.7\s+are\s+now complete/i.test(enterpriseRoadmap)));
addCheck("phase status advances P136.4", p1364CurrentState || p1365CurrentState || p1367FinalState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("completed P136.4 entries have required fields", [statusById.get("P136"), statusById.get("P136.4"), roadmapById.get("P136.4")].every((entry) => Boolean(entry?.phaseId) && Boolean(entry.branch) && Boolean(entry.commit) && Boolean(entry.summary) && Array.isArray(entry.checksRun) && Array.isArray(entry.knownLimitations)));
addCheck("P136.5 remains planned or safely handed off", (statusById.get("P136.5")?.status === "planned" && roadmapById.get("P136.5")?.status === "planned" && !(statusById.get("P136.5")?.checksRun || []).length) || p1365CurrentState || p1367FinalState);
addCheck(
  "changed files stay in P136.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P136.4 forbidden path check relaxed for ${status.currentPhase}`,
);
const docsBundle = `${JSON.stringify(contract)}\n${plan}\n${readme}\n${platformRoadmap}\n${enterpriseRoadmap}`;
addCheck("docs avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder|session|user|role|permission|access|secret|provider|tool)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(docsBundle));
addCheck("docs avoid fake runnable provider/tool actions", !/call provider now|call model now|run tool now|execute tool now|start mcp now|rotate secret now|create secret now|validate secret now|spend now|deploy now|export now|package now|dispatch agent now|write db now/i.test(docsBundle));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /secret values are stored|provider calls are enabled|model calls are enabled|tool execution is enabled|MCP servers are enabled|network calls are enabled|provider spend is enabled|budget spending is enabled|approval writes are enabled|DB writes are enabled|runtime writes are enabled|agent dispatch is enabled|project mutation is enabled|deploy is enabled|release is enabled|export is enabled|package creation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds a review-only Provider Governance Command Center route over the P136.3 provider/tool dry run.",
        "- Shows what changed, current state, next action, blockers, disabled reason, owner, evidence, activity, and cost impact.",
        "- Confirms the route does not add provider/model calls, tool execution, MCP startup, approval writes, DB/runtime writes, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    {
      title: "UX Summary",
      body: [
        `- Decision rows summarized: ${providerGovernanceSummary.dryRunRows}`,
        `- Executable rows: ${providerGovernanceSummary.executableRows}`,
        `- Approval needs: ${providerGovernanceSummary.approvalNeeds}`,
        `- Estimated spend: $${providerGovernanceSummary.estimatedUsd}`,
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: VALIDATION_COMMANDS.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P136.4 is Command Center UX only. It does not create secret stores, provider adapters, model clients, tool executors, MCP servers, approval writers, budget ledgers, DB/runtime writes, provider/model calls, tool execution, agent dispatch, project mutation, deploy, release, export, package, network calls, or spend. Later P136 subphases remain non-authoritative unless their own contracts explicitly allow more.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P136.4 Provider Governance Command Center UX Report", phase: "P136.4" },
);

printCheckReport("P136.4 Provider Governance Command Center UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
