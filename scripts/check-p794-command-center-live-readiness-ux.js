import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildLiveReadinessViewModel } from "../dashboard/src/data/liveReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p794-command-center-live-readiness-ux-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function fileExists(relativePath) {
  return existsSync(join(ROOT, relativePath));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const vm = buildLiveReadinessViewModel();
const serialized = JSON.stringify(vm);
const packageJson = JSON.parse(readText("package.json"));
const routes = readText("dashboard/src/data/commandCenterRoutes.js");
const tabs = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const tests = readText("dashboard/tests/routes.spec.js");
const contract = readText("contracts/os-roadmap/p79-execution-contracts.json");
const docs = readText("docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md");
const status = JSON.parse(readText("os-roadmap/phase-status.json"));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));

addCheck("route registered", routes.includes('key: "liveReadiness"') && routes.includes("/command-center/live-readiness"));
addCheck("tabs registered", tabs.includes("LIVE_READINESS_TABS") && tabs.includes("Capability Gates") && tabs.includes("Bridge Admission"));
addCheck("page imports view model", pageSource.includes("buildLiveReadinessViewModel") && pageSource.includes("LiveReadinessPage"));
addCheck("page renders route", pageSource.includes('currentPage === "liveReadiness"') && pageSource.includes("Live mode gates"));
addCheck("view model has required UX fields", ["whatChanged", "currentState", "nextAction", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact"].every((field) => serialized.includes(field)));
addCheck("capability gates displayed", ["Provider Calls", "Project Mutation", "Provider Spend"].every((label) => serialized.includes(label)));
addCheck("bridge rows displayed", ["mission.compose", "implementation.apply", "Blocked before bridge execution"].every((label) => serialized.includes(label)));
addCheck("dangerous runtime flags false", ["providerCallsAllowed", "toolExecutionAllowed", "workerExecutionAllowed", "projectMutationAllowed", "dbWritesAllowed", "deployExecutionAllowed", "providerSpendAllowed"].every((flag) => serialized.includes(`"${flag}":false`)));
addCheck("no fake runnable live actions", !/run now|execute now|deploy now|apply now|call provider now/i.test(serialized));
addCheck("no DemoApp or private IDs", !serialized.includes("DemoApp") && !serialized.includes("private-project-01") && !serialized.includes("private-project-governed-build-mission"));
addCheck("no phase labels in primary UX", !serialized.includes("P79"));
addCheck("playwright coverage added", tests.includes("Live Readiness route renders gated live posture without runnable actions") && tests.includes('["dark", "light", "system"]'));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p794-command-center-live-readiness-ux"]));
addCheck("contract references UX files", contract.includes("dashboard/src/data/liveReadiness.js") && contract.includes("check:p794-command-center-live-readiness-ux"));
addCheck("docs mention P79.4 validation", docs.includes("P79.4 Command Center Live Readiness UX") && docs.includes("npm run check:p794-command-center-live-readiness-ux"));
addCheck("phase status advanced", statusById.get("P79.4")?.status === "complete" && status.currentPhase === "P79.4" && status.nextPhase === "P79.5");
addCheck("report path is distinct", REPORT_PATH.endsWith("p794-command-center-live-readiness-ux-report.md"));
addCheck("reports prerequisite exists", fileExists("reports/os-phase-status-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P79.4 Command Center Live Readiness UX.",
        "- Confirms live readiness is display-only and does not expose runnable live actions.",
        "- Does not enable providers, tools, workers, project mutation, DB writes, network calls, deploy, export, package creation, auth mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p794-command-center-live-readiness-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Readiness route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:p793-action-bridge-admission",
        "- npm run check:p792-live-command-intent",
        "- npm run check:p791-live-mode-gate",
        "- npm run check:p79-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P79.4 adds display-only live readiness UX.",
        "- Live runtime execution, provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain disabled.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P79.4 Command Center Live Readiness UX Report", phase: "P79.4" },
);

printCheckReport("P79.4 Command Center Live Readiness UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
