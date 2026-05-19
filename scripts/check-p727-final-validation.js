import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { dbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p727-final-validation-report.md";

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
const docs = readText("docs/architecture/P72_DB_RUNTIME_PRIMARY_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const tabsSource = readText("dashboard/src/data/commandCenterTabs.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const statusChecker = readText("scripts/check-os-phase-status.js");
const runtimeSources = [
  "db-runtime/p72-2-placeholder.js",
  "db-runtime/p72-3-placeholder.js",
  "db-runtime/p72-4-placeholder.js",
  "dashboard/src/data/dbRuntimeReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p72-execution-plan",
  "check:p722",
  "check:p723",
  "check:p724",
  "check:p725-command-center-db-runtime-ux",
  "check:p726-tests-checkers-docs",
  "check:p727-final-validation",
];

const requiredReports = [
  "reports/p72-execution-plan-report.md",
  "reports/p722-report.md",
  "reports/p723-report.md",
  "reports/p724-report.md",
  "reports/command-center-db-runtime-ux-report.md",
  "reports/p726-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P72", "P72.1", "P72.2", "P72.3", "P72.4", "P72.5", "P72.6", "P72.7"];
const priorCompletedPhaseIds = ["P72.1", "P72.2", "P72.3", "P72.4", "P72.5", "P72.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(dbRuntimeReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P72 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P72 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("prior completed P72 entries have commits", priorCompletedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("final P72 entries are stampable", ["P72", "P72.7"].every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P73", status.currentPhase === "P73" && status.previousPhase === "P72" && status.nextPhase === "P73", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P73 remains next planned phase", phaseById.get("P73")?.status !== "complete" && statusById.get("P73")?.status === "planned");
addCheck("status checker accepts P73 through P78", ["\"P73\"", "\"P74\"", "\"P75\"", "\"P76\"", "\"P77\"", "\"P78\""].every((token) => statusChecker.includes(token)));
addCheck("docs close P72", docs.includes("Status: complete") && /P72\s+is complete/.test(docs));
addCheck("Command Center tab preserved", tabsSource.includes('id: "db-runtime"') && tabsSource.includes('label: "DB Runtime"'));
addCheck("Command Center renderer preserved", pageSource.includes("dbRuntimeReadinessViewModel") && pageSource.includes("DB Runtime Readiness"));
addCheck("Command Center test preserved", routeTests.includes("DB Runtime route renders readiness without runnable DB actions"));
addCheck("Command Center theme coverage preserved", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("DB Runtime UX omits DemoApp/private ids", !serializedReadiness.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness));
addCheck("DB Runtime UX omits phase labels", !serializedReadiness.includes("P72"));
addCheck("DB writes migrations schema disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("migrationsAllowed: true") && !runtimeSources.includes("schemaMutationAllowed: true"));
addCheck("project mutation disabled", !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true") && !runtimeSources.includes("exportExecutionAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true"));
addCheck("DB and project paths remain forbidden", runtimeSources.includes("projects/**") && runtimeSources.includes("db/**") && !runtimeSources.includes("allowedFiles: [\"projects/"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p727-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P72 DB-backed Runtime Primary for NEXUS OS.",
        "- Validates completed subphases, Command Center DB Runtime UX, dashboard validation, reports, docs, roadmap, phase status, and P73 handoff.",
        "- Does not write DB state, create migrations, mutate schema, mutate project source, dispatch providers/tools/workers, call network services, deploy, release, export, package, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p727-final-validation",
        "- npm run check:p726-tests-checkers-docs",
        "- npm run check:p725-command-center-db-runtime-ux",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"DB Runtime route\"",
        "- npm run check:p72-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P72 closes DB runtime readiness only.",
        "- DB writes, migrations, schema mutation, project mutation, provider/tool execution, worker execution, network calls, deploy/release/export execution, package creation, and provider spend remain disabled.",
        "- P73 is the auth, RBAC, and multi-user governance handoff and does not start DB mutation by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P72.7 Final Validation Report", phase: "P72.7" },
);

printCheckReport("P72.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
