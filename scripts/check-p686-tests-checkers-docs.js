import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p686-tests-checkers-docs-report.md";

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
const selfUpdateData = readText("dashboard/src/data/selfUpdateReadiness.js");
const selfUpdateRoute = readText("dashboard/src/data/commandCenterRoutes.js");
const p68RuntimeSources = [
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
];

const requiredReports = [
  "reports/p68-execution-plan-report.md",
  "reports/p682-report.md",
  "reports/p683-report.md",
  "reports/p684-report.md",
  "reports/command-center-self-update-ux-report.md",
];

const completedSubphases = ["P68.1", "P68.2", "P68.3", "P68.4", "P68.5", "P68.6"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("checker files exist", [
  "scripts/check-p68-execution-plan.js",
  "scripts/check-p682.js",
  "scripts/check-p683.js",
  "scripts/check-p684.js",
  "scripts/check-p685-command-center-self-update-ux.js",
  "scripts/check-p686-tests-checkers-docs.js",
].every(fileExists));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("docs cover subphases", completedSubphases.every((phaseId) => docs.includes(`### ${phaseId}`) && docs.includes("Status: complete")), completedSubphases.join(", "));
addCheck("roadmap statuses complete", completedSubphases.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("phase status entries complete", completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("P68 handoff is P68.7", status.currentPhase === "P68" && status.nextPhase === "P68.7" && phaseById.get("P68")?.nextPhase === "P68.7", `${status.currentPhase}/${status.nextPhase}`);
addCheck("P68.7 remains planned", phaseById.get("P68.7")?.status === "planned" && statusById.get("P68.7")?.status === "planned");
addCheck("Command Center route registered", selfUpdateRoute.includes("key: \"selfUpdate\"") && selfUpdateRoute.includes("/command-center/self-update"));
addCheck("Command Center test registered", routeTests.includes("Self-Update route renders readiness without enabling apply"));
addCheck("Command Center themes covered", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Command Center hides unsafe identifiers", routeTests.includes("not.toContain(\"DemoApp\")") && routeTests.includes("not.toContain(\"project_\")") && routeTests.includes("not.toContain(\"private_\")"));
addCheck("Self-Update view hides phase labels", !JSON.stringify(selfUpdateData).includes("P68"));
addCheck("self-update apply disabled", !p68RuntimeSources.includes("applyAllowed: true") && !p68RuntimeSources.includes("selfUpdateAllowed: true"));
addCheck("project mutation disabled", !p68RuntimeSources.includes("projectMutationAllowed: true"));
addCheck("execution disabled", !p68RuntimeSources.includes("executionAllowed: true") && !p68RuntimeSources.includes("providerDispatchAllowed: true") && !p68RuntimeSources.includes("toolExecutionAllowed: true") && !p68RuntimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/deploy/spend disabled", !p68RuntimeSources.includes("dbWritesAllowed: true") && !p68RuntimeSources.includes("deployAllowed: true") && !p68RuntimeSources.includes("providerSpendAllowed: true"));
addCheck("project paths forbidden", p68RuntimeSources.includes("projects/**") && !p68RuntimeSources.includes("allowedFiles: [\"projects/"));
addCheck("docs state disabled posture", /self-update apply\s+remains disabled/i.test(docs) && docs.includes("provider-spend action"));
addCheck("reports mention PASS", requiredReports.filter((file) => file !== REPORT_PATH).every((file) => readText(file).includes("PASS")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P68 tests, checkers, docs, reports, roadmap, phase status, and Command Center coverage.",
        "- Does not approve, generate, apply, mutate project source, dispatch providers/tools/workers, write DB state, deploy, release, call network services, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p686-tests-checkers-docs",
        "- npm run check:p685-command-center-self-update-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Self-Update route\"",
        "- npm run check:p68-execution-plan",
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
        "- Reused existing P68 checkers, reports, route matrix, and Command Center route tests.",
        "- Did not duplicate report writers, mode guards, redaction helpers, phase-status updaters, result envelopes, route matrices, or Command Center cards/tabs.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P68.6 Tests Checkers Docs Report", phase: "P68.6" },
);

printCheckReport("P68.6 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
