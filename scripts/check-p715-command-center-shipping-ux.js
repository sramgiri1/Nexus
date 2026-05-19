import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildProjectShippingReadinessViewModel, PROJECT_SHIPPING_ROUTE_ID } from "../dashboard/src/data/projectShippingReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/command-center-shipping-ux-report.md";
const FILES = [
  "dashboard/src/data/projectShippingReadiness.js",
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

const viewModel = buildProjectShippingReadinessViewModel();
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const renderer = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const allUxSource = FILES.map(readText).join("\n");
const shippingSource = readText("dashboard/src/data/projectShippingReadiness.js");
const serializedView = JSON.stringify(viewModel);

addCheck("route id exported", PROJECT_SHIPPING_ROUTE_ID === "projectShipping");
addCheck("route matrix includes shipping", routeMatrix.includes("key: \"projectShipping\"") && routeMatrix.includes("/command-center/shipping"));
addCheck("route blocks phase labels", routeMatrix.includes("key: \"projectShipping\"") && routeMatrix.includes("allowPhaseLabels: false"));
addCheck("tabs exported", tabs.includes("PROJECT_SHIPPING_TABS") && tabs.includes("Shipping Gate") && tabs.includes("Disabled Actions"));
addCheck("renderer wires route", renderer.includes("currentPage === \"projectShipping\"") && renderer.includes("<ProjectShippingPage"));
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
addCheck("disabled actions present", viewModel.disabledActions.map((action) => action.label).join(",") === "Create package,Run export,Ship handoff");
addCheck("primary UX data omits raw private ids", !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedView));
addCheck("primary UX data omits DemoApp", !serializedView.includes("DemoApp"));
addCheck("primary UX data omits raw JSON markers", !serializedView.includes("snapshotVersion"));
addCheck("primary UX data omits internal phase labels", !serializedView.includes("P71"));
addCheck("route test covers disabled actions", routeTests.includes("Project Shipping route renders readiness") && routeTests.includes("Disabled action: Run export"));
addCheck("route test covers themes", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("route test covers no DemoApp", routeTests.includes("not.toContain(\"DemoApp\")"));
addCheck("source does not enable export/package", !allUxSource.includes("exportAllowed: true") && !allUxSource.includes("packageCreationAllowed: true") && !allUxSource.includes("artifactCreated: true"));
addCheck("source does not enable project mutation", !allUxSource.includes("projectMutationAllowed: true"));
addCheck("source does not enable provider/tool/worker", !allUxSource.includes("providerDispatchAllowed: true") && !allUxSource.includes("toolExecutionAllowed: true") && !allUxSource.includes("workerExecutionAllowed: true"));
addCheck("source does not use DB or export runtime", !shippingSource.includes("DATABASE_URL") && !shippingSource.includes("exportAllowed: true"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Command Center Project Shipping UX is display-only.",
        "- No package creation, export execution, artifact creation, project mutation, provider dispatch, tool dispatch, worker execution, DB write, network call, deploy/release execution, or provider spend is enabled.",
      ].join("\n"),
    },
    {
      title: "Route",
      body: [
        "- Path: `/command-center/shipping`",
        "- Shell: Command Center V2 route matrix and sidebar.",
        "- Primary UX hides raw private IDs, raw JSON, raw evidence, DemoApp, and internal phase labels.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Failures", body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n") },
    {
      title: "Reuse",
      body: [
        "- Reused the existing Command Center V2 route matrix, tab shell, page summary, cards, pills, disabled buttons, and theme controls.",
        "- Reused the P71.4 shipping readiness gate model instead of duplicating gate helpers.",
        "- Reused shared report writer and check result formatter.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "Command Center Shipping UX Report", phase: "P71.5" },
);

printCheckReport("Command Center Shipping UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
