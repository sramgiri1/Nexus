import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildProjectShippingReadinessViewModel } from "../dashboard/src/data/projectShippingReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p716-tests-checkers-docs-report.md";

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
const docs = readText("docs/architecture/P71_PROJECT_SHIPPING_EXPORT_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const shippingViewModelSource = readText("dashboard/src/data/projectShippingReadiness.js");
const shippingRouteSource = readText("dashboard/src/data/commandCenterRoutes.js");
const shippingTabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const shippingRendererSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const shippingUxReport = readText("reports/command-center-shipping-ux-report.md");
const shippingViewModel = buildProjectShippingReadinessViewModel();
const p71RuntimeSources = [
  "project-shipping/p71-2-placeholder.js",
  "project-shipping/p71-3-placeholder.js",
  "project-shipping/p71-4-placeholder.js",
  "dashboard/src/data/projectShippingReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p71-execution-plan",
  "check:p712",
  "check:p713",
  "check:p714",
  "check:p715-command-center-shipping-ux",
  "check:p716-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p71-execution-plan.js",
  "scripts/check-p712.js",
  "scripts/check-p713.js",
  "scripts/check-p714.js",
  "scripts/check-p715-command-center-shipping-ux.js",
  "scripts/check-p716-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p71-execution-plan-report.md",
  "reports/p712-report.md",
  "reports/p713-report.md",
  "reports/p714-report.md",
  "reports/command-center-shipping-ux-report.md",
];

const completedSubphases = ["P71.1", "P71.2", "P71.3", "P71.4", "P71.5", "P71.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P71" && status.nextPhase === "P71.7" && phaseById.get("P71")?.nextPhase === "P71.7";
const finalHandoff = status.currentPhase === "P72" && status.previousPhase === "P71" && status.nextPhase === "P72" && statusById.get("P71.7")?.status === "complete";
const serializedShippingView = JSON.stringify(shippingViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P71 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P71.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P71.7")?.status) && ["planned", "complete"].includes(statusById.get("P71.7")?.status));
addCheck("Command Center route registered", shippingRouteSource.includes("key: \"projectShipping\"") && shippingRouteSource.includes("/command-center/shipping"));
addCheck("Command Center tabs registered", shippingTabsSource.includes("PROJECT_SHIPPING_TABS") && shippingTabsSource.includes("Shipping Gate"));
addCheck("Command Center renderer registered", shippingRendererSource.includes("buildProjectShippingReadinessViewModel") && shippingRendererSource.includes("ProjectShippingPage"));
addCheck("Command Center test registered", routeTests.includes("Project Shipping route renders readiness without enabling export"));
addCheck("Command Center themes covered", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Command Center hides unsafe identifiers", routeTests.includes("not.toContain(\"DemoApp\")") && routeTests.includes("not.toContain(\"project_\")") && routeTests.includes("not.toContain(\"private_\")"));
addCheck("Shipping UX hides phase labels", !serializedShippingView.includes("P71"));
addCheck("Shipping UX hides DemoApp and private ids", !serializedShippingView.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedShippingView));
addCheck("export/package disabled", !p71RuntimeSources.includes("exportAllowed: true") && !p71RuntimeSources.includes("packageCreationAllowed: true") && !p71RuntimeSources.includes("artifactCreated: true"));
addCheck("project mutation disabled", !p71RuntimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !p71RuntimeSources.includes("providerDispatchAllowed: true") && !p71RuntimeSources.includes("toolExecutionAllowed: true") && !p71RuntimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/network/spend disabled", !p71RuntimeSources.includes("dbWritesAllowed: true") && !p71RuntimeSources.includes("networkCallsAllowed: true") && !p71RuntimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release disabled", !p71RuntimeSources.includes("deployExecutionAllowed: true") && !p71RuntimeSources.includes("releaseExecutionAllowed: true"));
addCheck("project paths forbidden", p71RuntimeSources.includes("projects/**") && !p71RuntimeSources.includes("allowedFiles: [\"projects/"));
addCheck("docs state disabled posture", /package creation[\s\S]+remain disabled/i.test(docs) && /export execution[\s\S]+remain disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && shippingUxReport.includes("Command Center Shipping UX Report"));
addCheck("shipping view model has final response fields", [
  shippingViewModel.whatChanged,
  shippingViewModel.currentState,
  shippingViewModel.nextAction,
  shippingViewModel.disabledReason,
  shippingViewModel.ownerCapability,
  shippingViewModel.evidenceLocation,
  shippingViewModel.activityLocation,
  shippingViewModel.costImpact,
].every(Boolean));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P71 tests, checkers, docs, reports, roadmap, phase status, and Command Center shipping coverage.",
        "- Does not create packages, export files, create artifacts, mutate project source, dispatch providers/tools/workers, write DB state, call network services, deploy, release, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p716-tests-checkers-docs",
        "- npm run check:p715-command-center-shipping-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Project Shipping route\"",
        "- npm run check:p71-execution-plan",
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
        "- Reused existing P71 checkers, reports, route matrix, Command Center route tests, and P71.4 shipping readiness gate.",
        "- Did not duplicate report writers, mode guards, redaction helpers, phase-status updaters, result envelopes, route matrices, or Command Center cards/tabs.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P71.6 Tests Checkers Docs Report", phase: "P71.6" },
);

printCheckReport("P71.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
