import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { dbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p726-tests-checkers-docs-report.md";

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
const dbRuntimeSource = readText("dashboard/src/data/dbRuntimeReadiness.js");
const dbUxReport = readText("reports/command-center-db-runtime-ux-report.md");
const p72RuntimeSources = [
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
];

const requiredCheckerFiles = [
  "scripts/check-p72-execution-plan.js",
  "scripts/check-p722.js",
  "scripts/check-p723.js",
  "scripts/check-p724.js",
  "scripts/check-p725-command-center-db-runtime-ux.js",
  "scripts/check-p726-tests-checkers-docs.js",
];

const requiredReports = [
  "reports/p72-execution-plan-report.md",
  "reports/p722-report.md",
  "reports/p723-report.md",
  "reports/p724-report.md",
  "reports/command-center-db-runtime-ux-report.md",
];

const completedSubphases = ["P72.1", "P72.2", "P72.3", "P72.4", "P72.5", "P72.6"];
const statusCommitSubphases = ["P72.1", "P72.2", "P72.3", "P72.4", "P72.5"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const preFinalHandoff = status.currentPhase === "P72" && status.nextPhase === "P72.7" && phaseById.get("P72")?.nextPhase === "P72.7";
const finalHandoff = status.currentPhase === "P73" && status.previousPhase === "P72" && status.nextPhase === "P73" && statusById.get("P72.7")?.status === "complete";
const serializedDbRuntimeView = JSON.stringify(dbRuntimeReadinessViewModel);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", requiredCheckerFiles.every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P72 handoff is valid", preFinalHandoff || finalHandoff, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P72.7 remains planned or complete", ["planned", "complete"].includes(phaseById.get("P72.7")?.status) && ["planned", "complete"].includes(statusById.get("P72.7")?.status));
addCheck("completed status commits stamped", statusCommitSubphases.every((phaseId) => statusById.get(phaseId)?.commit && statusById.get(phaseId)?.commit !== "pending-final-commit"));
addCheck("Command Center tab registered", tabsSource.includes('id: "db-runtime"') && tabsSource.includes('label: "DB Runtime"'));
addCheck("Command Center renderer registered", pageSource.includes("dbRuntimeReadinessViewModel") && pageSource.includes("DB Runtime Readiness"));
addCheck("Command Center test registered", routeTests.includes("DB Runtime route renders readiness without runnable DB actions"));
addCheck("Command Center themes covered", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Command Center hides unsafe identifiers", routeTests.includes("not.toContain(\"DemoApp\")") && routeTests.includes("not.toMatch(/postgres"));
addCheck("DB Runtime UX hides phase labels", !serializedDbRuntimeView.includes("P72"));
addCheck("DB Runtime UX hides DemoApp and private ids", !serializedDbRuntimeView.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedDbRuntimeView));
addCheck("DB writes migrations schema disabled", !p72RuntimeSources.includes("dbWritesAllowed: true") && !p72RuntimeSources.includes("migrationsAllowed: true") && !p72RuntimeSources.includes("schemaMutationAllowed: true"));
addCheck("project mutation disabled", !p72RuntimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !p72RuntimeSources.includes("providerDispatchAllowed: true") && !p72RuntimeSources.includes("toolExecutionAllowed: true") && !p72RuntimeSources.includes("workerExecutionAllowed: true"));
addCheck("network/spend disabled", !p72RuntimeSources.includes("networkCallsAllowed: true") && !p72RuntimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release/export/package disabled", !p72RuntimeSources.includes("deployExecutionAllowed: true") && !p72RuntimeSources.includes("releaseExecutionAllowed: true") && !p72RuntimeSources.includes("exportExecutionAllowed: true") && !p72RuntimeSources.includes("packageCreationAllowed: true"));
addCheck("DB/project paths forbidden", p72RuntimeSources.includes("projects/**") && p72RuntimeSources.includes("db/**") && !p72RuntimeSources.includes("allowedFiles: [\"projects/"));
addCheck("docs state disabled posture", /DB writes[\s\S]+remain disabled/i.test(docs) && /migrations[\s\S]+remain disabled/i.test(docs));
addCheck("reports mention PASS", requiredReports.every((file) => readText(file).includes("PASS")) && dbUxReport.includes("Command Center DB Runtime UX Report"));
addCheck("DB runtime view has required final fields", [
  "DB primary state",
  "Fallback state",
  "Migration readiness",
  "Next action",
  "Disabled reason",
  "Owner capability",
  "Evidence",
  "Activity",
  "Cost impact",
].every((label) => serializedDbRuntimeView.includes(label)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P72 tests, checkers, docs, reports, roadmap, phase status, and Command Center DB runtime coverage.",
        "- Does not write DB state, create migrations, mutate schema, mutate project source, dispatch providers/tools/workers, call network services, deploy, release, export, package, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p726-tests-checkers-docs",
        "- npm run check:p725-command-center-db-runtime-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"DB Runtime route\"",
        "- npm run check:p72-execution-plan",
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
        "- Reused existing P72 checkers, reports, DB readiness gate, route matrix, Command Center tabs, and route tests.",
        "- Did not duplicate report writers, mode guards, redaction helpers, phase-status updaters, result envelopes, route matrices, or Command Center cards/tabs.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P72.6 Tests Checkers Docs Report", phase: "P72.6" },
);

printCheckReport("P72.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
