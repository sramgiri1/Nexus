import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BUSINESS_BUILD_TABS } from "../dashboard/src/data/commandCenterTabs.js";
import { COMMAND_CENTER_ROUTES } from "../dashboard/src/data/commandCenterRoutes.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p815-command-center-business-build-ux-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const phases = readJson("os-roadmap/nexus-phases.json").phases || [];
const phaseById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map(phases.map((entry) => [entry.phaseId, entry]));
const docs = readText("docs/architecture/P81_BUSINESS_BUILD_ORCHESTRATION_PLAN.md");
const routeSource = readText("dashboard/src/data/commandCenterRoutes.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const testSource = readText("dashboard/tests/routes.spec.js");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const viewModel = buildBusinessBuildViewModel();
const route = COMMAND_CENTER_ROUTES.find((entry) => entry.key === "businessBuild");

const primaryUxText = JSON.stringify({
  pageTitle: viewModel.pageTitle,
  whatChanged: viewModel.whatChanged,
  currentState: viewModel.currentState,
  nextAction: viewModel.nextAction,
  evidenceLocation: viewModel.evidenceLocation,
  activityLocation: viewModel.activityLocation,
  costImpact: viewModel.costImpact,
  disabledReason: viewModel.disabledReason,
  readinessCards: viewModel.readinessCards,
  disabledActions: viewModel.disabledActions,
});

addCheck("data module exists", fileExists("dashboard/src/data/businessBuild.js"));
addCheck("view model exposes primary UX fields", Boolean(viewModel.currentState && viewModel.nextAction && viewModel.disabledReason && viewModel.costImpact));
addCheck("view model has PRD workstreams and milestones", viewModel.prdReadiness.score === 100 && viewModel.workstreamRows.length === 8 && viewModel.milestoneRows.length === 5);
addCheck("safety flags remain false", Object.values(viewModel.safety).every((value) => value === false));
addCheck("disabled actions visible", viewModel.disabledActions.some((entry) => entry.label === "Provider Calls") && viewModel.disabledActions.some((entry) => entry.label === "Project Mutation"));
addCheck("route registered", route?.path === "/command-center/business-build" && route.expectedHeading === "Business Build");
addCheck("route is OS-scoped and implemented", route?.scope === "os" && route.status === "implemented" && route.allowPhaseLabels === false);
addCheck("tabs registered", BUSINESS_BUILD_TABS.length === 5 && BUSINESS_BUILD_TABS.some((tab) => tab.id === "milestones"));
addCheck("page imports view model", pageSource.includes("buildBusinessBuildViewModel") && pageSource.includes("BusinessBuildPage"));
addCheck("page renders route", pageSource.includes('currentPage === "businessBuild"') && pageSource.includes("Business Build sections"));
addCheck("Playwright route coverage added", testSource.includes("Business Build route renders dry-run plan") && testSource.includes("/command-center/business-build"));
addCheck("theme coverage included", testSource.includes('for (const theme of ["dark", "light", "system"])') && testSource.includes("Business Build"));
addCheck("no DemoApp in business build UX", !primaryUxText.includes("DemoApp") && !dataSource.includes("DemoApp"));
addCheck("no raw private project IDs in UX", !primaryUxText.includes("private-project") && !dataSource.includes("private-project"));
addCheck("no raw JSON or logs in UX", !primaryUxText.includes("raw JSON") && !primaryUxText.includes("raw logs"));
addCheck("no internal phase labels in primary UX", !/P81\./.test(primaryUxText));
addCheck("no fake runnable action", !/run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now/i.test(primaryUxText));
addCheck("source has no provider/tool/project imports", !dataSource.includes("../providers") && !dataSource.includes("../tools") && !dataSource.includes("../projects"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p815-command-center-business-build-ux"]));
addCheck("docs mention P81.5 validation", docs.includes("P81.5 Command Center Business Build UX") && docs.includes("npm run check:p815-command-center-business-build-ux"));
addCheck("phase status advanced", phaseById.get("P81.5")?.status === "complete" && ["P81.5", "P81.6", "P81.7"].includes(status.currentPhase));
addCheck("P81 remains in progress", phaseById.get("P81")?.status === "in_progress" && ["P81.6", "P81.7"].includes(phaseById.get("P81")?.nextPhase));
addCheck("roadmap P81.5 complete", roadmapById.get("P81.5")?.status === "complete");
addCheck("route and tab source mention Business Build", routeSource.includes("Business Build") && tabsSource.includes("BUSINESS_BUILD_TABS"));
addCheck("report path is distinct", REPORT_PATH.endsWith("p815-command-center-business-build-ux-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P81.5 Command Center Business Build UX.",
        "- Ensures the route is display-safe and does not expose runnable provider, agent, project, DB, deploy, or spend actions.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p815-command-center-business-build-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Business Build\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p814-business-build-plan",
        "- npm run check:p81-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P81.5 is a Command Center display surface. Business build runtime execution remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P81.5 Command Center Business Build UX Report", phase: "P81.5" },
);

printCheckReport("P81.5 Command Center Business Build UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
