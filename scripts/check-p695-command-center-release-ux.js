import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildReleaseReadinessViewModel, RELEASE_ROUTE_ID } from "../dashboard/src/data/releaseReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/command-center-release-ux-report.md";
const FILES = [
  "dashboard/src/data/releaseReadiness.js",
  "dashboard/src/data/commandCenterRoutes.js",
  "dashboard/src/data/commandCenterTabs.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function containsRawPrivateId(value) {
  return /(?:project|private)_[A-Za-z0-9_-]{6,}/.test(JSON.stringify(value));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const viewModel = buildReleaseReadinessViewModel();
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const renderer = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const allUxSource = FILES.map(readText).join("\n");
const releaseSource = readText("dashboard/src/data/releaseReadiness.js");
const serializedView = JSON.stringify(viewModel);

addCheck("route id exported", RELEASE_ROUTE_ID === "release");
addCheck("route matrix includes Release Control", routeMatrix.includes("key: \"release\"") && routeMatrix.includes("/command-center/release"));
addCheck("route blocks phase labels", routeMatrix.includes("key: \"release\"") && routeMatrix.includes("allowPhaseLabels: false"));
addCheck("tabs exported", tabs.includes("RELEASE_CONTROL_TABS") && tabs.includes("Deploy Gate") && tabs.includes("Disabled Actions"));
addCheck("renderer wires route", renderer.includes("currentPage === \"release\"") && renderer.includes("<ReleaseControlPage"));
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
addCheck("disabled actions present", viewModel.disabledActions.map((action) => action.label).join(",") === "Create release package,Start deploy,Override gate");
addCheck("primary UX data omits raw private ids", !containsRawPrivateId(viewModel));
addCheck("primary UX data omits DemoApp", !serializedView.includes("DemoApp"));
addCheck("primary UX data omits raw JSON markers", !serializedView.includes("snapshotVersion"));
addCheck("primary UX data omits internal phase labels", !serializedView.includes("P69"));
addCheck("route test covers disabled actions", routeTests.includes("Release Control route renders readiness") && routeTests.includes("Disabled action: Start deploy"));
addCheck("route test covers themes", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("route test covers no DemoApp", routeTests.includes("not.toContain(\"DemoApp\")"));
addCheck("source does not enable release/deploy execution", !allUxSource.includes("releaseExecutionAllowed: true") && !allUxSource.includes("deployExecutionAllowed: true"));
addCheck("source does not enable package or project mutation", !allUxSource.includes("packageCreated: true") && !allUxSource.includes("projectMutationAllowed: true"));
addCheck("source does not enable provider/tool/worker", !allUxSource.includes("providerDispatchAllowed: true") && !allUxSource.includes("toolExecutionAllowed: true") && !allUxSource.includes("workerExecutionAllowed: true"));
addCheck("source does not use DB or deploy runtime", !releaseSource.includes("DATABASE_URL") && !releaseSource.includes("deployAllowed: true"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Command Center Release Control UX is display-only.",
        "- No package creation, release execution, deploy execution, provider dispatch, tool dispatch, worker execution, project mutation, DB write, network call, or provider spend is enabled.",
      ].join("\n"),
    },
    {
      title: "Route",
      body: [
        "- Path: `/command-center/release`",
        "- Shell: Command Center V2 route matrix and sidebar.",
        "- Primary UX hides raw private IDs, raw JSON, DemoApp, and internal phase labels.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Failures", body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n") },
    {
      title: "Reuse",
      body: [
        "- Reused the existing Command Center V2 release route, route matrix, tab shell, page summary, cards, pills, and theme controls.",
        "- Reused the P69.4 deploy readiness gate model instead of duplicating gate helpers.",
        "- Reused shared report writer and check result formatter.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "Command Center Release UX Report", phase: "P69.5" },
);

printCheckReport("Command Center Release UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
