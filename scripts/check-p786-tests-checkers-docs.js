import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { enterprisePreviewReadinessViewModel } from "../dashboard/src/data/enterprisePreviewReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p786-tests-checkers-docs-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const phases = readJson("os-roadmap/nexus-phases.json").phases || [];
const status = readJson("os-roadmap/phase-status.json");
const entries = status.phases || [];
const docs = readText("docs/architecture/P78_SELF_HEALING_ENTERPRISE_PREVIEW_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const uxReport = readText("reports/command-center-enterprise-preview-ux-report.md");
const runtimeSources = [
  "enterprise-preview/p78-2-placeholder.js",
  "enterprise-preview/p78-3-placeholder.js",
  "enterprise-preview/p78-4-placeholder.js",
  "dashboard/src/data/enterprisePreviewReadiness.js",
].map(readText).join("\n");
const serializedUx = JSON.stringify(enterprisePreviewReadinessViewModel);

const requiredScripts = [
  "check:p78-execution-plan",
  "check:p782",
  "check:p783",
  "check:p784",
  "check:p785-command-center-enterprise-preview-ux",
  "check:p786-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p78-execution-plan.js",
  "scripts/check-p782.js",
  "scripts/check-p783.js",
  "scripts/check-p784.js",
  "scripts/check-p785-command-center-enterprise-preview-ux.js",
  "scripts/check-p786-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p78-execution-plan-report.md",
  "reports/p782-report.md",
  "reports/p783-report.md",
  "reports/p784-report.md",
  "reports/command-center-enterprise-preview-ux-report.md",
];

const completedSubphases = ["P78.1", "P78.2", "P78.3", "P78.4", "P78.5", "P78.6"];
const statusCommitSubphases = ["P78.1", "P78.2", "P78.3", "P78.4", "P78.5"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P78" && status.nextPhase === "P78.7" && phaseById.get("P78")?.nextPhase === "P78.7";

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P78 handoff is valid", preFinalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P78.7 remains planned", phaseById.get("P78.7")?.status === "planned" && statusById.get("P78.7")?.status === "planned");
addCheck("completed status commits stamped", statusCommitSubphases.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("Command Center route registered", routeSource.includes('key: "enterprisePreview"') && routeSource.includes("/command-center/enterprise-preview"));
addCheck("Command Center tabs registered", tabsSource.includes("ENTERPRISE_PREVIEW_TABS") && tabsSource.includes("PRD Preview") && tabsSource.includes("Disabled Actions"));
addCheck("Command Center renderer registered", pageSource.includes("EnterprisePreviewPage") && pageSource.includes("buildEnterprisePreviewReadinessViewModel"));
addCheck("Command Center test registered", routeTests.includes("Enterprise Preview route renders readiness without runnable founder actions"));
addCheck("Command Center themes covered", routeTests.includes('["dark", "light", "system"]') && routeTests.includes("pickTheme(page, theme)"));
addCheck("Enterprise UX hides phase labels", !serializedUx.includes("P78"));
addCheck("Enterprise UX hides DemoApp/private ids/tokens", !serializedUx.includes("DemoApp") && !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedUx) && !/Bearer\s+|jwt|id_token|access_token/i.test(serializedUx));
addCheck("founder PRD agent healing disabled", !runtimeSources.includes("autonomousQnaAllowed: true") && !runtimeSources.includes("prdGenerationAllowed: true") && !runtimeSources.includes("agentDispatchAllowed: true") && !runtimeSources.includes("selfHealingApplyAllowed: true"));
addCheck("DB/provider/tool/worker disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("project auth export package disabled", !runtimeSources.includes("projectMutationAllowed: true") && !runtimeSources.includes("authMutationAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true"));
addCheck("forbidden paths remain visible", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && runtimeSources.includes("providers/**") && runtimeSources.includes("tools/**") && runtimeSources.includes("worker-runtime/**"));
addCheck("docs state disabled posture", /autonomous\s+Q&A[\s\S]+disabled/i.test(docs) && /PRD\s+generation[\s\S]+disabled/i.test(docs) && /agent\s+dispatch[\s\S]+disabled/i.test(docs) && /self-healing[\s\S]+disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && uxReport.includes("Command Center Enterprise Preview UX Report"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body:
        "- Validates P78 tests, checkers, docs, reports, roadmap, phase status, and Command Center Enterprise Preview coverage.\n" +
        "- Does not enable founder intake execution, autonomous Q&A, PRD generation, agent dispatch, self-healing apply, DB writes, project mutation, provider/tool/worker execution, network calls, deploy, release, export, package, auth/session/user/workspace mutation, certification, attestation, or provider spend.",
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P78.6 Tests Checkers Docs Report", phase: "P78.6" },
);

printCheckReport("P78.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
