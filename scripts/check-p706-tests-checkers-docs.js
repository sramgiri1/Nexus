import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildDeployMonitoringReadinessViewModel } from "../dashboard/src/data/deployMonitoringReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p706-tests-checkers-docs-report.md";

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
const docs = readText("docs/architecture/P70_DEPLOY_MONITORING_INCIDENT_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const monitoringViewModelSource = readText("dashboard/src/data/deployMonitoringReadiness.js");
const monitoringRouteSource = readText("dashboard/src/data/commandCenterRoutes.js");
const monitoringTabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const monitoringRendererSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const monitoringUxReport = readText("reports/command-center-monitoring-ux-report.md");
const monitoringViewModel = buildDeployMonitoringReadinessViewModel();
const p70RuntimeSources = [
  "deploy-monitoring/p70-2-placeholder.js",
  "deploy-monitoring/p70-3-placeholder.js",
  "deploy-monitoring/p70-4-placeholder.js",
  "dashboard/src/data/deployMonitoringReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p70-execution-plan",
  "check:p702",
  "check:p703",
  "check:p704",
  "check:p705-command-center-monitoring-ux",
  "check:p706-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p70-execution-plan.js",
  "scripts/check-p702.js",
  "scripts/check-p703.js",
  "scripts/check-p704.js",
  "scripts/check-p705-command-center-monitoring-ux.js",
  "scripts/check-p706-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p70-execution-plan-report.md",
  "reports/p702-report.md",
  "reports/p703-report.md",
  "reports/p704-report.md",
  "reports/command-center-monitoring-ux-report.md",
];

const completedSubphases = ["P70.1", "P70.2", "P70.3", "P70.4", "P70.5", "P70.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P70" && status.nextPhase === "P70.7" && phaseById.get("P70")?.nextPhase === "P70.7";
const finalHandoff = status.currentPhase === "P71" && status.previousPhase === "P70" && status.nextPhase === "P71" && statusById.get("P70.7")?.status === "complete";
const serializedMonitoringView = JSON.stringify(monitoringViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P70 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P70.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P70.7")?.status) && ["planned", "complete"].includes(statusById.get("P70.7")?.status));
addCheck("Command Center route registered", monitoringRouteSource.includes("key: \"deployMonitoring\"") && monitoringRouteSource.includes("/command-center/monitoring"));
addCheck("Command Center tabs registered", monitoringTabsSource.includes("DEPLOY_MONITORING_TABS") && monitoringTabsSource.includes("Mitigation Gate"));
addCheck("Command Center renderer registered", monitoringRendererSource.includes("buildDeployMonitoringReadinessViewModel") && monitoringRendererSource.includes("DeployMonitoringPage"));
addCheck("Command Center test registered", routeTests.includes("Deploy Monitoring route renders readiness without enabling mitigation"));
addCheck("Command Center themes covered", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Command Center hides unsafe identifiers", routeTests.includes("not.toContain(\"DemoApp\")") && routeTests.includes("not.toContain(\"project_\")") && routeTests.includes("not.toContain(\"private_\")"));
addCheck("Monitoring UX hides phase labels", !serializedMonitoringView.includes("P70"));
addCheck("Monitoring UX hides DemoApp and private ids", !serializedMonitoringView.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]{6,}/.test(serializedMonitoringView));
addCheck("monitoring execution disabled", !p70RuntimeSources.includes("monitorExecutionAllowed: true"));
addCheck("deploy and incident execution disabled", !p70RuntimeSources.includes("deployExecutionAllowed: true") && !p70RuntimeSources.includes("incidentExecutionAllowed: true"));
addCheck("mitigation rollback alert disabled", !p70RuntimeSources.includes("mitigationAllowed: true") && !p70RuntimeSources.includes("rollbackExecutionAllowed: true") && !p70RuntimeSources.includes("alertDispatchAllowed: true"));
addCheck("project mutation disabled", !p70RuntimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !p70RuntimeSources.includes("providerDispatchAllowed: true") && !p70RuntimeSources.includes("toolExecutionAllowed: true") && !p70RuntimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/network/spend disabled", !p70RuntimeSources.includes("dbWritesAllowed: true") && !p70RuntimeSources.includes("networkCallsAllowed: true") && !p70RuntimeSources.includes("providerSpendAllowed: true"));
addCheck("project paths forbidden", p70RuntimeSources.includes("projects/**") && !p70RuntimeSources.includes("allowedFiles: [\"projects/"));
addCheck("docs state disabled posture", /deploy execution[\s\S]+remain disabled/i.test(docs) && /mitigation execution[\s\S]+remain disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && monitoringUxReport.includes("Command Center Monitoring UX Report"));
addCheck("monitoring view model has final response fields", [
  monitoringViewModel.whatChanged,
  monitoringViewModel.currentState,
  monitoringViewModel.nextAction,
  monitoringViewModel.disabledReason,
  monitoringViewModel.ownerCapability,
  monitoringViewModel.evidenceLocation,
  monitoringViewModel.activityLocation,
  monitoringViewModel.costImpact,
].every(Boolean));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P70 tests, checkers, docs, reports, roadmap, phase status, and Command Center monitoring coverage.",
        "- Does not monitor deployments, dispatch alerts, roll back, mitigate, deploy, mutate project source, dispatch providers/tools/workers, write DB state, call network services, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p706-tests-checkers-docs",
        "- npm run check:p705-command-center-monitoring-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Deploy Monitoring route\"",
        "- npm run check:p70-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Reuse",
      body: [
        "- Reused shared report writer and check result formatter.",
        "- Reused existing P70 checkers, reports, route matrix, Command Center route tests, and P70.4 mitigation readiness gate.",
        "- Did not duplicate report writers, mode guards, redaction helpers, phase-status updaters, result envelopes, route matrices, or Command Center cards/tabs.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P70.6 Tests Checkers Docs Report", phase: "P70.6" },
);

printCheckReport("P70.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
