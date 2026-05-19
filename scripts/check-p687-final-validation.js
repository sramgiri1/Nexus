import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildSelfUpdateReadinessViewModel } from "../dashboard/src/data/selfUpdateReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p687-final-validation-report.md";

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
const docs = readText("docs/architecture/P68_SELF_UPDATE_WORKFLOW_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const statusChecker = readText("scripts/check-os-phase-status.js");
const readiness = buildSelfUpdateReadinessViewModel();
const runtimeSources = [
  "self-update/p68-2-placeholder.js",
  "self-update/p68-3-placeholder.js",
  "self-update/p68-4-placeholder.js",
  "dashboard/src/data/selfUpdateReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p68-execution-plan",
  "check:p682",
  "check:p683",
  "check:p684",
  "check:p685-command-center-self-update-ux",
  "check:p686-tests-checkers-docs",
  "check:p687-final-validation",
];

const requiredReports = [
  "reports/p68-execution-plan-report.md",
  "reports/p682-report.md",
  "reports/p683-report.md",
  "reports/p684-report.md",
  "reports/command-center-self-update-ux-report.md",
  "reports/p686-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P68", "P68.1", "P68.2", "P68.3", "P68.4", "P68.5", "P68.6", "P68.7"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(readiness);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P68 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P68 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("completed P68 entries have commits", completedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P69", status.currentPhase === "P69" && status.previousPhase === "P68" && status.nextPhase === "P70", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P69 stays non-complete", phaseById.get("P69")?.status === "planned" && statusById.get("P69")?.status === "planned");
addCheck("P70 remains planned", phaseById.get("P70")?.status !== "complete" && statusById.get("P70")?.status === "planned");
addCheck("status checker accepts P69 handoff", statusChecker.includes("\"P69\"") && statusChecker.includes("\"P78\""));
addCheck("docs close P68", docs.includes("Status: complete") && /P68\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeMatrix.includes("/command-center/self-update") && routeMatrix.includes("allowPhaseLabels: false"));
addCheck("Command Center test preserved", routeTests.includes("Self-Update route renders readiness without enabling apply"));
addCheck("Command Center theme coverage preserved", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Self-Update UX omits DemoApp/private ids", !serializedReadiness.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]{6,}/.test(serializedReadiness));
addCheck("Self-Update UX omits phase labels", !serializedReadiness.includes("P68"));
addCheck("self-update apply disabled", !runtimeSources.includes("applyAllowed: true") && !runtimeSources.includes("selfUpdateAllowed: true"));
addCheck("project mutation disabled", !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("execution disabled", !runtimeSources.includes("executionAllowed: true") && !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/deploy/spend disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("deployAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("release/deploy not enabled by P69 handoff", !runtimeSources.includes("releaseAllowed: true") && !runtimeSources.includes("deployAllowed: true"));
addCheck("project paths remain forbidden", runtimeSources.includes("projects/**") && !runtimeSources.includes("allowedFiles: [\"projects/"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p687-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P68 Self-Update Workflow for NEXUS OS.",
        "- Validates completed subphases, Command Center Self-Update UX, dashboard validation, reports, docs, roadmap, phase status, and P69 handoff.",
        "- Does not approve, generate, apply, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p687-final-validation",
        "- npm run check:p686-tests-checkers-docs",
        "- npm run check:p685-command-center-self-update-ux",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Self-Update route\"",
        "- npm run check:p68-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P68 closes readiness and visibility only.",
        "- Self-update apply, patch generation, project mutation, provider/tool execution, worker execution, DB writes, deploy, release, network calls, and provider spend remain disabled.",
        "- P69 is a handoff phase and does not enable release or deploy execution.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P68.7 Final Validation Report", phase: "P68.7" },
);

printCheckReport("P68.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
