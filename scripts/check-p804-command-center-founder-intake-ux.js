import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildFounderIntakeViewModel } from "../dashboard/src/data/founderIntake.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p804-command-center-founder-intake-ux-report.md";

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
const routes = readText("dashboard/src/data/commandCenterRoutes.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const page = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");
const contract = readText("contracts/os-roadmap/p80-execution-contracts.json");
const docs = readText("docs/architecture/P80_FOUNDER_INTAKE_RUNTIME_PLAN.md");
const status = readJson("os-roadmap/phase-status.json");
const phaseById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const vm = buildFounderIntakeViewModel();
const vmText = JSON.stringify(vm);

addCheck("route registered", routes.includes("key: \"founderIntake\"") && routes.includes("/command-center/founder-intake"));
addCheck("tabs registered", tabs.includes("FOUNDER_INTAKE_TABS") && tabs.includes("Questions") && tabs.includes("Readiness"));
addCheck("page imports view model", page.includes("buildFounderIntakeViewModel") && page.includes("FOUNDER_INTAKE_TABS"));
addCheck("page renders route", page.includes("currentPage === \"founderIntake\"") && page.includes("FounderIntakePage"));
addCheck("view model has required UX fields", ["currentState", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact", "questionState"].every((field) => vmText.includes(field)));
addCheck("question state displayed", vm.questionState.prompt.includes("pricing") || vm.questionState.prompt.includes("charge"));
addCheck("readiness displayed", vm.readiness.missingCount > 0 && vm.readiness.blockers.length > 0);
addCheck("dangerous runtime flags false", vm.safety.executionEnabled === false && vm.safety.providerCallsAllowed === false && vm.safety.projectMutationAllowed === false && vm.safety.providerSpendAllowed === false);
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|create project now/i.test(vmText));
addCheck("no DemoApp or private IDs", !vmText.includes("DemoApp") && !vmText.includes("private-project-01") && !vmText.includes("private-project-governed-build-mission"));
addCheck("no phase labels in primary UX", !vmText.includes("P80."));
addCheck("playwright coverage added", tests.includes("Founder Intake route renders local intake posture without runnable actions"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p804-command-center-founder-intake-ux"]));
addCheck("contract references UX files", contract.includes("dashboard/src/data/founderIntake.js") && contract.includes("check:p804-command-center-founder-intake-ux"));
addCheck("docs mention P80.4 validation", docs.includes("P80.4 Command Center Founder Intake UX") && docs.includes("npm run check:p804-command-center-founder-intake-ux"));
addCheck("phase status advanced", phaseById.get("P80.4")?.status === "complete" && ["P80.4", "P80.5", "P80.6", "P80.7"].includes(status.currentPhase));
addCheck("P80 remains in progress", phaseById.get("P80")?.status === "in_progress" && ["P80.5", "P80.6", "P80.7"].includes(phaseById.get("P80")?.nextPhase));
addCheck("report path is distinct", REPORT_PATH.endsWith("p804-command-center-founder-intake-ux-report.md"));
addCheck("reports prerequisite exists", fileExists("reports/p803-founder-intake-qna-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates Command Center Founder Intake route, tabs, view model, route safety, and Playwright coverage.",
        "- Does not enable provider calls, tool execution, worker execution, project mutation, DB writes, deploy, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p804-command-center-founder-intake-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder Intake\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p80-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P80.4 adds Command Center UX only. Validation aggregation starts in P80.5.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P80.4 Command Center Founder Intake UX Report", phase: "P80.4" },
);

printCheckReport("P80.4 Command Center Founder Intake UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
