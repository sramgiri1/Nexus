import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildDeployMonitoringReadinessViewModel, DEPLOY_MONITORING_ROUTE_ID } from "../dashboard/src/data/deployMonitoringReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/command-center-monitoring-ux-report.md";
const FILES = [
  "dashboard/src/data/deployMonitoringReadiness.js",
  "dashboard/src/data/commandCenterRoutes.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const viewModel = buildDeployMonitoringReadinessViewModel();
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const renderer = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const allUxSource = FILES.map(readText).join("\n");
const monitoringSource = readText("dashboard/src/data/deployMonitoringReadiness.js");
const serializedView = JSON.stringify(viewModel);

addCheck("route id exported", DEPLOY_MONITORING_ROUTE_ID === "deployMonitoring");
addCheck("route matrix includes monitoring", routeMatrix.includes("key: \"deployMonitoring\"") && routeMatrix.includes("/command-center/monitoring"));
addCheck("route blocks phase labels", routeMatrix.includes("key: \"deployMonitoring\"") && routeMatrix.includes("allowPhaseLabels: false"));
addCheck("tabs exported", tabs.includes("DEPLOY_MONITORING_TABS") && tabs.includes("Mitigation Gate") && tabs.includes("Disabled Actions"));
addCheck("renderer wires route", renderer.includes("currentPage === \"deployMonitoring\"") && renderer.includes("<DeployMonitoringPage"));
addCheck("current state visible", viewModel.currentState.includes("operator review"));
addCheck("what changed visible", viewModel.whatChanged.includes("Command Center now shows"));
addCheck("next action visible", viewModel.nextAction.includes("future approved phase"));
addCheck("disabled reason visible", viewModel.disabledReason.includes("display-only") && viewModel.disabledReason.includes("provider spend"));
addCheck("owner and capability visible", Boolean(viewModel.ownerAgent && viewModel.ownerCapability));
addCheck("evidence and activity visible", Boolean(viewModel.evidenceLocation && viewModel.activityLocation));
addCheck("cost impact visible", viewModel.costImpact.includes("No provider calls"));
addCheck("readiness cards complete", viewModel.readinessCards.length >= 4);
addCheck("gate rows complete", viewModel.gateRows.length >= 8);
addCheck("blockers visible", viewModel.blockers.length >= 3);
addCheck("disabled actions present", viewModel.disabledActions.map((action) => action.label).join(",") === "Dispatch alert,Run rollback,Start mitigation");
addCheck("primary UX data omits raw private ids", !/(?:project|private)_[A-Za-z0-9_-]{6,}/.test(serializedView));
addCheck("primary UX data omits DemoApp", !serializedView.includes("DemoApp"));
addCheck("primary UX data omits raw JSON markers", !serializedView.includes("snapshotVersion"));
addCheck("primary UX data omits internal phase labels", !serializedView.includes("P70"));
addCheck("route test covers disabled actions", routeTests.includes("Deploy Monitoring route renders readiness") && routeTests.includes("Disabled action: Start mitigation"));
addCheck("route test covers themes", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("route test covers no DemoApp", routeTests.includes("not.toContain(\"DemoApp\")"));
addCheck("source does not enable mitigation/rollback/alert", !allUxSource.includes("mitigationAllowed: true") && !allUxSource.includes("rollbackExecutionAllowed: true") && !allUxSource.includes("alertDispatchAllowed: true"));
addCheck("source does not enable deploy/incident", !allUxSource.includes("deployExecutionAllowed: true") && !allUxSource.includes("incidentExecutionAllowed: true"));
addCheck("source does not enable provider/tool/worker", !allUxSource.includes("providerDispatchAllowed: true") && !allUxSource.includes("toolExecutionAllowed: true") && !allUxSource.includes("workerExecutionAllowed: true"));
addCheck("source does not use DB or deploy runtime", !monitoringSource.includes("DATABASE_URL") && !monitoringSource.includes("deployAllowed: true"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Command Center Deploy Monitoring UX is display-only.",
        "- No monitor execution, alert dispatch, rollback, deploy, incident, mitigation, provider dispatch, tool dispatch, worker execution, project mutation, DB write, network call, or provider spend is enabled.",
      ].join("\n"),
    },
    {
      title: "Route",
      body: [
        "- Path: `/command-center/monitoring`",
        "- Shell: Command Center V2 route matrix and sidebar.",
        "- Primary UX hides raw private IDs, raw JSON, DemoApp, and internal phase labels.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Failures", body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n") },
    {
      title: "Reuse",
      body: [
        "- Reused the existing Command Center V2 route matrix, tab shell, page summary, cards, pills, disabled buttons, and theme controls.",
        "- Reused the P70.4 mitigation readiness gate model instead of duplicating gate helpers.",
        "- Reused shared report writer and check result formatter.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "Command Center Monitoring UX Report", phase: "P70.5" },
);

printCheckReport("Command Center Monitoring UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
