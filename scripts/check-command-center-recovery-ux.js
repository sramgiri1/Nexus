import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildRecoveryPreviewViewModel, RECOVERY_ROUTE_ID } from "../dashboard/src/utils/recoveryPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/command-center-recovery-ux-report.md";

const FILES = [
  "dashboard/src/pages/Recovery.jsx",
  "dashboard/src/components/recovery/RecoverySnapshotList.jsx",
  "dashboard/src/components/recovery/RecoverySnapshotDetail.jsx",
  "dashboard/src/utils/recoveryPreview.js",
  "dashboard/src/data/commandCenterRoutes.js",
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

const viewModel = buildRecoveryPreviewViewModel();
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const renderer = readText("dashboard/src/pages/CommandCenterV2.jsx");
const recoveryPage = readText("dashboard/src/pages/Recovery.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const allUxSource = FILES.map(readText).join("\n");

addCheck("route id exported", RECOVERY_ROUTE_ID === "recovery");
addCheck("route matrix includes Recovery", routeMatrix.includes("key: \"recovery\"") && routeMatrix.includes("/command-center/recovery"));
addCheck("route uses OS scope", routeMatrix.includes("key: \"recovery\"") && routeMatrix.includes("scope: \"os\""));
addCheck("renderer wires Recovery page", renderer.includes("currentPage === \"recovery\"") && renderer.includes("<Recovery />"));
addCheck("page renders current state", recoveryPage.includes("Current state") && recoveryPage.includes("Next action"));
addCheck("view model has snapshots", viewModel.snapshots.length >= 3);
addCheck("view model has disabled actions", viewModel.disabledActions.map((item) => item.label).join(",") === "Restore,Replay,Resume");
addCheck("disabled actions include reasons", viewModel.disabledActions.every((item) => item.reason && item.reason.includes("disabled")));
addCheck("primary UX data omits raw private ids", !containsRawPrivateId(viewModel));
addCheck("primary UX data omits DemoApp", !JSON.stringify(viewModel).includes("DemoApp"));
addCheck("primary UX data omits raw JSON markers", !JSON.stringify(viewModel).includes("snapshotVersion"));
addCheck("cost impact is visible", viewModel.costImpact.includes("No provider calls"));
addCheck("owner and evidence fields present", Boolean(viewModel.ownerAgent && viewModel.ownerCapability && viewModel.evidenceLocation));
addCheck("route test covers disabled restore", routeTests.includes("Recovery route is inspection-only") && routeTests.includes("Restore"));
addCheck("route test covers themes", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("route test covers no DemoApp", routeTests.includes("not.toContain(\"DemoApp\")"));
addCheck("source does not import DemoApp", !allUxSource.includes("DemoApp release"));
addCheck("source does not enable execution actions", !allUxSource.includes("restoreEnabled: true") && !allUxSource.includes("resumeEnabled: true") && !allUxSource.includes("replayEnabled: true"));
addCheck(
  "source does not use DB or provider runtime",
  !allUxSource.includes("from \"@prisma")
    && !allUxSource.includes("from \"../../../providers")
    && !allUxSource.includes("providerDispatchAllowed: true"),
);

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Phase: P63.5",
        "- Command Center Recovery UX is inspection-only.",
        "- No provider dispatch, tool dispatch, project mutation, DB write, schema migration, deploy, restore, replay, or resume behavior is enabled.",
      ].join("\n"),
    },
    {
      title: "Route",
      body: [
        "- Path: `/command-center/recovery`",
        "- Shell: Command Center V2 route matrix and sidebar.",
        "- Primary UX hides raw project/private IDs and raw JSON.",
      ].join("\n"),
    },
    {
      title: "Checks",
      body: buildCheckTable(checks),
    },
    {
      title: "Failures",
      body: failed.length === 0 ? "- None" : failed.map((check) => `- ${check.name}: ${check.details}`).join("\n"),
    },
    {
      title: "Reuse",
      body: [
        "- Reused the existing Command Center V2 route matrix, shell, sidebar, page summary, card, pill, and theme controls.",
        "- Reused shared report writer and check result formatter.",
        "- Did not duplicate DemoApp, route shell, report writer, redaction, phase-status, or result-envelope helpers.",
      ].join("\n"),
    },
    {
      title: "Result",
      body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)`,
    },
  ],
  {
    title: "Command Center Recovery UX Report",
    phase: "P63.5",
  },
);

printCheckReport("Command Center Recovery UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");

if (failed.length > 0) process.exit(1);
