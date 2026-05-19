import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildReleaseReadinessViewModel } from "../dashboard/src/data/releaseReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p697-final-validation-report.md";

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
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const statusChecker = readText("scripts/check-os-phase-status.js");
const readiness = buildReleaseReadinessViewModel();
const runtimeSources = [
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
  "check:p697-final-validation",
];

const requiredReports = [
  "reports/p69-execution-plan-report.md",
  "reports/p692-report.md",
  "reports/p693-report.md",
  "reports/p694-report.md",
  "reports/command-center-release-ux-report.md",
  "reports/p696-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P69", "P69.1", "P69.2", "P69.3", "P69.4", "P69.5", "P69.6", "P69.7"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(readiness);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P69 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P69 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("completed P69 entries have commits", completedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P70", status.currentPhase === "P70" && status.previousPhase === "P69" && status.nextPhase === "P70", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P70 remains planned", phaseById.get("P70")?.status !== "complete" && statusById.get("P70")?.status === "planned");
addCheck("status checker accepts P70 handoff", statusChecker.includes("\"P70\"") && statusChecker.includes("\"P78\""));
addCheck("docs close P69", docs.includes("Status: complete") && /P69\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeMatrix.includes("/command-center/release") && routeMatrix.includes("allowPhaseLabels: false"));
addCheck("Command Center test preserved", routeTests.includes("Release Control route renders readiness without enabling deploy"));
addCheck("Command Center theme coverage preserved", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Release UX omits DemoApp/private ids", !serializedReadiness.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]{6,}/.test(serializedReadiness));
addCheck("Release UX omits phase labels", !serializedReadiness.includes("P69"));
addCheck("package creation disabled", !runtimeSources.includes("packageCreated: true"));
addCheck("release execution disabled", !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("releaseAllowed: true"));
addCheck("deploy execution disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("deployAllowed: true"));
addCheck("project mutation disabled", !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/network/spend disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("project paths remain forbidden", runtimeSources.includes("projects/**") && !runtimeSources.includes("allowedFiles: [\"projects/"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p697-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P69 Release / Deploy Loop for NEXUS OS.",
        "- Validates completed subphases, Command Center Release Control UX, dashboard validation, reports, docs, roadmap, phase status, and P70 handoff.",
        "- Does not package, release, deploy, mutate project source, dispatch providers/tools/workers, write DB state, call network services, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p697-final-validation",
        "- npm run check:p696-tests-checkers-docs",
        "- npm run check:p695-command-center-release-ux",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Release Control route\"",
        "- npm run check:p69-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P69 closes release/deploy readiness and visibility only.",
        "- Package creation, release execution, deploy execution, project mutation, provider/tool execution, worker execution, DB writes, network calls, and provider spend remain disabled.",
        "- P70 is the monitoring handoff and does not start deploy execution by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P69.7 Final Validation Report", phase: "P69.7" },
);

printCheckReport("P69.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
