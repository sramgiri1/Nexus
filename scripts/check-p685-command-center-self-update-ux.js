import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildSelfUpdateReadinessViewModel, SELF_UPDATE_ROUTE_ID } from "../dashboard/src/data/selfUpdateReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/command-center-self-update-ux-report.md";
const FILES = [
  "dashboard/src/data/selfUpdateReadiness.js",
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

const viewModel = buildSelfUpdateReadinessViewModel();
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const renderer = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const allUxSource = FILES.map(readText).join("\n");
const selfUpdateSource = readText("dashboard/src/data/selfUpdateReadiness.js");
const serializedView = JSON.stringify(viewModel);

addCheck("route id exported", SELF_UPDATE_ROUTE_ID === "selfUpdate");
addCheck("route matrix includes Self-Update", routeMatrix.includes("key: \"selfUpdate\"") && routeMatrix.includes("/command-center/self-update"));
addCheck("route uses OS scope", routeMatrix.includes("key: \"selfUpdate\"") && routeMatrix.includes("scope: \"os\""));
addCheck("tabs exported", tabs.includes("SELF_UPDATE_TABS") && tabs.includes("Disabled Actions"));
addCheck("renderer wires route", renderer.includes("currentPage === \"selfUpdate\"") && renderer.includes("<SelfUpdatePage />"));
addCheck("current state visible", viewModel.currentState.includes("operator review"));
addCheck("what changed visible", viewModel.whatChanged.includes("Command Center now shows"));
addCheck("next action visible", viewModel.nextAction.includes("Review"));
addCheck("disabled reason visible", viewModel.disabledReason.includes("no patch generation") && viewModel.disabledReason.includes("provider spend"));
addCheck("owner and capability visible", Boolean(viewModel.ownerAgent && viewModel.ownerCapability));
addCheck("evidence and activity visible", Boolean(viewModel.evidenceLocation && viewModel.activityLocation));
addCheck("cost impact visible", viewModel.costImpact.includes("No provider calls"));
addCheck("readiness cards complete", viewModel.readinessCards.length >= 4);
addCheck("blockers visible", viewModel.blockers.length >= 3);
addCheck("disabled actions present", viewModel.disabledActions.map((action) => action.label).join(",") === "Apply self-update,Generate patch,Dispatch tools");
addCheck("primary UX data omits raw private ids", !containsRawPrivateId(viewModel));
addCheck("primary UX data omits DemoApp", !serializedView.includes("DemoApp"));
addCheck("primary UX data omits raw JSON markers", !serializedView.includes("snapshotVersion"));
addCheck("primary UX data omits internal phase labels", !serializedView.includes("P68"));
addCheck("route test covers disabled actions", routeTests.includes("Self-Update route renders readiness") && routeTests.includes("Disabled action: Apply self-update"));
addCheck("route test covers themes", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("route test covers no DemoApp", routeTests.includes("not.toContain(\"DemoApp\")"));
addCheck("source does not enable self-update apply", !allUxSource.includes("applyAllowed: true") && !allUxSource.includes("selfUpdateAllowed: true"));
addCheck("source does not enable execution", !allUxSource.includes("providerDispatchAllowed: true") && !allUxSource.includes("toolExecutionAllowed: true") && !allUxSource.includes("workerExecutionAllowed: true"));
addCheck("source does not use DB or deploy runtime", !selfUpdateSource.includes("DATABASE_URL") && !selfUpdateSource.includes("deployAllowed: true"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Command Center Self-Update UX is display-only.",
        "- No self-update apply, patch generation, provider dispatch, tool dispatch, worker execution, project mutation, DB write, deploy, release, network call, or provider spend is enabled.",
      ].join("\n"),
    },
    {
      title: "Route",
      body: [
        "- Path: `/command-center/self-update`",
        "- Shell: Command Center V2 route matrix and sidebar.",
        "- Primary UX hides raw private IDs, raw JSON, DemoApp, and internal phase labels.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Failures", body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n") },
    {
      title: "Reuse",
      body: [
        "- Reused the existing Command Center V2 route matrix, tab shell, page summary, cards, pills, and theme controls.",
        "- Reused shared report writer and check result formatter.",
        "- Did not duplicate DemoApp, report writers, phase-status updater, redaction helper, or result envelopes.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "Command Center Self-Update UX Report", phase: "P68.5" },
);

printCheckReport("Command Center Self-Update UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
