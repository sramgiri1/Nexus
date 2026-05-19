import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildReleaseReadinessViewModel } from "../dashboard/src/data/releaseReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p696-tests-checkers-docs-report.md";

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
const docs = readText("docs/architecture/P69_RELEASE_DEPLOY_LOOP_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const releaseViewModelSource = readText("dashboard/src/data/releaseReadiness.js");
const releaseRouteSource = readText("dashboard/src/data/commandCenterRoutes.js");
const releaseTabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const releaseRendererSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const releaseUxReport = readText("reports/command-center-release-ux-report.md");
const releaseViewModel = buildReleaseReadinessViewModel();
const p69RuntimeSources = [
  "release-governance/p69-2-placeholder.js",
  "release-governance/p69-3-placeholder.js",
  "release-governance/p69-4-placeholder.js",
  "dashboard/src/data/releaseReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p69-execution-plan",
  "check:p692",
  "check:p693",
  "check:p694",
  "check:p695-command-center-release-ux",
  "check:p696-tests-checkers-docs",
];

const requiredCheckerFiles = [
  "scripts/check-p69-execution-plan.js",
  "scripts/check-p692.js",
  "scripts/check-p693.js",
  "scripts/check-p694.js",
  "scripts/check-p695-command-center-release-ux.js",
  "scripts/check-p696-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p69-execution-plan-report.md",
  "reports/p692-report.md",
  "reports/p693-report.md",
  "reports/p694-report.md",
  "reports/command-center-release-ux-report.md",
];

const completedSubphases = ["P69.1", "P69.2", "P69.3", "P69.4", "P69.5", "P69.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P69" && status.nextPhase === "P69.7" && phaseById.get("P69")?.nextPhase === "P69.7";
const finalHandoff = status.currentPhase === "P70" && status.previousPhase === "P69" && status.nextPhase === "P70.1" && statusById.get("P69.7")?.status === "complete";
const serializedReleaseView = JSON.stringify(releaseViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P69 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P69.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P69.7")?.status) && ["planned", "complete"].includes(statusById.get("P69.7")?.status));
addCheck("Command Center route registered", releaseRouteSource.includes("key: \"release\"") && releaseRouteSource.includes("/command-center/release"));
addCheck("Command Center tabs registered", releaseTabsSource.includes("RELEASE_CONTROL_TABS") && releaseTabsSource.includes("Deploy Gate"));
addCheck("Command Center renderer registered", releaseRendererSource.includes("buildReleaseReadinessViewModel") && releaseRendererSource.includes("ReleaseControlPage"));
addCheck("Command Center test registered", routeTests.includes("Release Control route renders readiness without enabling deploy"));
addCheck("Command Center themes covered", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Command Center hides unsafe identifiers", routeTests.includes("not.toContain(\"DemoApp\")") && routeTests.includes("not.toContain(\"project_\")") && routeTests.includes("not.toContain(\"private_\")"));
addCheck("Release UX hides phase labels", !serializedReleaseView.includes("P69"));
addCheck("Release UX hides DemoApp and private ids", !serializedReleaseView.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]{6,}/.test(serializedReleaseView));
addCheck("release execution disabled", !p69RuntimeSources.includes("releaseExecutionAllowed: true"));
addCheck("deploy execution disabled", !p69RuntimeSources.includes("deployExecutionAllowed: true") && !p69RuntimeSources.includes("deployAllowed: true"));
addCheck("package creation disabled", !p69RuntimeSources.includes("packageCreated: true"));
addCheck("project mutation disabled", !p69RuntimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !p69RuntimeSources.includes("providerDispatchAllowed: true") && !p69RuntimeSources.includes("toolExecutionAllowed: true") && !p69RuntimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/network/spend disabled", !p69RuntimeSources.includes("dbWritesAllowed: true") && !p69RuntimeSources.includes("networkCallsAllowed: true") && !p69RuntimeSources.includes("providerSpendAllowed: true"));
addCheck("project paths forbidden", p69RuntimeSources.includes("projects/**") && !p69RuntimeSources.includes("allowedFiles: [\"projects/"));
addCheck("docs state disabled posture", /release execution and deploy execution remain disabled/i.test(docs) && docs.includes("provider spend remain disabled"));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && releaseUxReport.includes("Command Center Release UX Report"));
addCheck("release view model has final response fields", [
  releaseViewModel.whatChanged,
  releaseViewModel.currentState,
  releaseViewModel.nextAction,
  releaseViewModel.disabledReason,
  releaseViewModel.ownerCapability,
  releaseViewModel.evidenceLocation,
  releaseViewModel.activityLocation,
  releaseViewModel.costImpact,
].every(Boolean));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P69 tests, checkers, docs, reports, roadmap, phase status, and Command Center release coverage.",
        "- Does not package, release, deploy, mutate project source, dispatch providers/tools/workers, write DB state, call network services, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p696-tests-checkers-docs",
        "- npm run check:p695-command-center-release-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Release Control route\"",
        "- npm run check:p69-execution-plan",
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
        "- Reused existing P69 checkers, reports, route matrix, Command Center route tests, and P69.4 deploy readiness gate.",
        "- Did not duplicate report writers, mode guards, redaction helpers, phase-status updaters, result envelopes, route matrices, or Command Center cards/tabs.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P69.6 Tests Checkers Docs Report", phase: "P69.6" },
);

printCheckReport("P69.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
