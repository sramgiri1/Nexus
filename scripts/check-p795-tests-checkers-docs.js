import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildLiveReadinessViewModel } from "../dashboard/src/data/liveReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p795-tests-checkers-docs-report.md";

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
const docs = readText("docs/architecture/P79_LIVE_EXECUTION_MODE_PLAN.md");
const contract = readText("contracts/os-roadmap/p79-execution-contracts.json");
const tests = readText("dashboard/tests/routes.spec.js");
const status = readJson("os-roadmap/phase-status.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const liveReadiness = JSON.stringify(buildLiveReadinessViewModel());

const requiredScripts = [
  "check:p79-execution-plan",
  "check:p791-live-mode-gate",
  "check:p792-live-command-intent",
  "check:p793-action-bridge-admission",
  "check:p794-command-center-live-readiness-ux",
  "check:p795-tests-checkers-docs",
];
const requiredReports = [
  "reports/p79-execution-plan-report.md",
  "reports/p791-live-mode-gate-report.md",
  "reports/p792-live-command-intent-report.md",
  "reports/p793-action-bridge-admission-report.md",
  "reports/p794-command-center-live-readiness-ux-report.md",
];
const completedSubphases = ["P79.1", "P79.2", "P79.3", "P79.4", "P79.5"];

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("completed subphase status present", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("completed subphase commits present", ["P79.1", "P79.2", "P79.3", "P79.4"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("P79.5 status advanced", statusById.get("P79.5")?.status === "complete" && status.currentPhase === "P79.5" && status.nextPhase === "P79.6");
addCheck("contract lists all P79 subphases", ["P79.1", "P79.2", "P79.3", "P79.4", "P79.5", "P79.6", "P79.7"].every((phaseId) => contract.includes(`\"phaseId\": \"${phaseId}\"`)));
addCheck("docs list validation commands", ["check:p794-command-center-live-readiness-ux", "check:p793-action-bridge-admission", "check:p792-live-command-intent", "check:p791-live-mode-gate"].every((script) => docs.includes(script)));
addCheck("Playwright live route coverage present", tests.includes("Live Readiness route renders gated live posture without runnable actions"));
addCheck("dashboard build command recorded", statusById.get("P79.5")?.checksRun?.includes("cd dashboard && npm run build"));
addCheck("dashboard unit command recorded", statusById.get("P79.5")?.checksRun?.includes("cd dashboard && npm run test:unit"));
addCheck("live readiness remains display-only", liveReadiness.includes('"executionEnabled":false') && liveReadiness.includes('"projectMutationAllowed":false') && liveReadiness.includes('"providerSpendAllowed":false'));
addCheck("no DemoApp or private ids in live readiness", !liveReadiness.includes("DemoApp") && !liveReadiness.includes("private-project-01") && !liveReadiness.includes("private-project-governed-build-mission"));
addCheck("report path is distinct", REPORT_PATH.endsWith("p795-tests-checkers-docs-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P79 tests, checkers, docs, reports, roadmap, phase status, Playwright coverage, dashboard unit, and dashboard build evidence.",
        "- Does not enable providers, tools, workers, project mutation, DB writes, network calls, deploy, export, package creation, auth mutation, or provider spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p795-tests-checkers-docs",
        "- npm run check:p794-command-center-live-readiness-ux",
        "- npm run check:p793-action-bridge-admission",
        "- npm run check:p792-live-command-intent",
        "- npm run check:p791-live-mode-gate",
        "- npm run check:p79-execution-plan",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Readiness route\"",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P79.5 aggregates validation evidence only.",
        "- Runtime execution, provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy/release/export/package behavior, auth/session/user/workspace mutation, and provider spend remain disabled.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P79.5 Tests Checkers Docs Report", phase: "P79.5" },
);

printCheckReport("P79.5 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
