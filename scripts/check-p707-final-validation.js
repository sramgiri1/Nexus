import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildDeployMonitoringReadinessViewModel } from "../dashboard/src/data/deployMonitoringReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p707-final-validation-report.md";

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
const docs = readText("docs/architecture/P70_DEPLOY_MONITORING_INCIDENT_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const statusChecker = readText("scripts/check-os-phase-status.js");
const readiness = buildDeployMonitoringReadinessViewModel();
const runtimeSources = [
  "deploy-monitoring/p70-2-placeholder.js",
  "deploy-monitoring/p70-3-placeholder.js",
  "deploy-monitoring/p70-4-placeholder.js",
  "dashboard/src/data/deployMonitoringReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p70-execution-plan",
  "check:p702",
  "check:p703",
  "check:p704",
  "check:p705-command-center-monitoring-ux",
  "check:p706-tests-checkers-docs",
  "check:p707-final-validation",
];

const requiredReports = [
  "reports/p70-execution-plan-report.md",
  "reports/p702-report.md",
  "reports/p703-report.md",
  "reports/p704-report.md",
  "reports/command-center-monitoring-ux-report.md",
  "reports/p706-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P70", "P70.1", "P70.2", "P70.3", "P70.4", "P70.5", "P70.6", "P70.7"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(readiness);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P70 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P70 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("completed P70 entries have commits", completedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P71", status.currentPhase === "P71" && status.previousPhase === "P70" && status.nextPhase === "P71", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P71 remains planned", phaseById.get("P71")?.status !== "complete" && statusById.get("P71")?.status === "planned");
addCheck("status checker accepts P71 handoff", statusChecker.includes("\"P71\"") && statusChecker.includes("\"P78\""));
addCheck("docs close P70", docs.includes("Status: complete") && /P70\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeMatrix.includes("/command-center/monitoring") && routeMatrix.includes("allowPhaseLabels: false"));
addCheck("Command Center test preserved", routeTests.includes("Deploy Monitoring route renders readiness without enabling mitigation"));
addCheck("Command Center theme coverage preserved", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Monitoring UX omits DemoApp/private ids", !serializedReadiness.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]{6,}/.test(serializedReadiness));
addCheck("Monitoring UX omits phase labels", !serializedReadiness.includes("P70"));
addCheck("monitoring execution disabled", !runtimeSources.includes("monitorExecutionAllowed: true"));
addCheck("deploy and incident execution disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("incidentExecutionAllowed: true"));
addCheck("mitigation rollback alert disabled", !runtimeSources.includes("mitigationAllowed: true") && !runtimeSources.includes("rollbackExecutionAllowed: true") && !runtimeSources.includes("alertDispatchAllowed: true"));
addCheck("project mutation disabled", !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/network/spend disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("project paths remain forbidden", runtimeSources.includes("projects/**") && !runtimeSources.includes("allowedFiles: [\"projects/"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p707-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P70 Deploy Monitoring + Incident Mitigation for NEXUS OS.",
        "- Validates completed subphases, Command Center Deploy Monitoring UX, dashboard validation, reports, docs, roadmap, phase status, and P71 handoff.",
        "- Does not monitor deployments, dispatch alerts, roll back, mitigate, deploy, mutate project source, dispatch providers/tools/workers, write DB state, call network services, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p707-final-validation",
        "- npm run check:p706-tests-checkers-docs",
        "- npm run check:p705-command-center-monitoring-ux",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Deploy Monitoring route\"",
        "- npm run check:p70-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P70 closes deploy monitoring and incident mitigation readiness only.",
        "- Deploy execution, monitor execution, incident execution, mitigation execution, rollback execution, alert dispatch, project mutation, provider/tool execution, worker execution, DB writes, network calls, and provider spend remain disabled.",
        "- P71 is the project shipping boundary handoff and does not start export execution by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P70.7 Final Validation Report", phase: "P70.7" },
);

printCheckReport("P70.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
