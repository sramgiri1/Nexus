import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildProjectShippingReadinessViewModel } from "../dashboard/src/data/projectShippingReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p717-final-validation-report.md";

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
const docs = readText("docs/architecture/P71_PROJECT_SHIPPING_EXPORT_PLAN.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const routeMatrix = readText("dashboard/src/data/commandCenterRoutes.js");
const statusChecker = readText("scripts/check-os-phase-status.js");
const readiness = buildProjectShippingReadinessViewModel();
const runtimeSources = [
  "project-shipping/p71-2-placeholder.js",
  "project-shipping/p71-3-placeholder.js",
  "project-shipping/p71-4-placeholder.js",
  "dashboard/src/data/projectShippingReadiness.js",
].map(readText).join("\n");

const requiredScripts = [
  "check:p71-execution-plan",
  "check:p712",
  "check:p713",
  "check:p714",
  "check:p715-command-center-shipping-ux",
  "check:p716-tests-checkers-docs",
  "check:p717-final-validation",
];

const requiredReports = [
  "reports/p71-execution-plan-report.md",
  "reports/p712-report.md",
  "reports/p713-report.md",
  "reports/p714-report.md",
  "reports/command-center-shipping-ux-report.md",
  "reports/p716-tests-checkers-docs-report.md",
];

const completedPhaseIds = ["P71", "P71.1", "P71.2", "P71.3", "P71.4", "P71.5", "P71.6", "P71.7"];
const phaseById = new Map(phases.map((phase) => [phase.phaseId, phase]));
const statusById = new Map(entries.map((entry) => [entry.phaseId, entry]));
const serializedReadiness = JSON.stringify(readiness);

addCheck("package scripts registered", requiredScripts.every((script) => packageJson.scripts?.[script]), requiredScripts.join(", "));
addCheck("reports exist", requiredReports.every(fileExists), requiredReports.join(", "));
addCheck("P71 phases complete in roadmap", completedPhaseIds.every((phaseId) => phaseById.get(phaseId)?.status === "complete"));
addCheck("P71 phases complete in phase status", completedPhaseIds.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("completed P71 entries have commits", completedPhaseIds.every((phaseId) => Boolean(statusById.get(phaseId)?.commit)));
addCheck("handoff to P72", status.currentPhase === "P72" && status.previousPhase === "P71" && status.nextPhase === "P72", `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("P72 remains planned", phaseById.get("P72")?.status !== "complete" && statusById.get("P72")?.status === "planned");
addCheck("status checker accepts P72 handoff", statusChecker.includes("\"P72\"") && statusChecker.includes("\"P78\""));
addCheck("docs close P71", docs.includes("Status: complete") && /P71\s+is complete/.test(docs));
addCheck("Command Center route preserved", routeMatrix.includes("/command-center/shipping") && routeMatrix.includes("allowPhaseLabels: false"));
addCheck("Command Center test preserved", routeTests.includes("Project Shipping route renders readiness without enabling export"));
addCheck("Command Center theme coverage preserved", routeTests.includes("pickTheme(page, \"dark\")") && routeTests.includes("pickTheme(page, \"light\")") && routeTests.includes("pickTheme(page, \"system\")"));
addCheck("Shipping UX omits DemoApp/private ids", !serializedReadiness.includes("DemoApp") && !/(?:project|private)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serializedReadiness));
addCheck("Shipping UX omits phase labels", !serializedReadiness.includes("P71"));
addCheck("export/package disabled", !runtimeSources.includes("exportAllowed: true") && !runtimeSources.includes("packageCreationAllowed: true") && !runtimeSources.includes("artifactCreated: true"));
addCheck("project mutation disabled", !runtimeSources.includes("projectMutationAllowed: true"));
addCheck("provider/tool/worker disabled", !runtimeSources.includes("providerDispatchAllowed: true") && !runtimeSources.includes("toolExecutionAllowed: true") && !runtimeSources.includes("workerExecutionAllowed: true"));
addCheck("DB/network/spend disabled", !runtimeSources.includes("dbWritesAllowed: true") && !runtimeSources.includes("networkCallsAllowed: true") && !runtimeSources.includes("providerSpendAllowed: true"));
addCheck("deploy/release disabled", !runtimeSources.includes("deployExecutionAllowed: true") && !runtimeSources.includes("releaseExecutionAllowed: true"));
addCheck("project paths remain forbidden", runtimeSources.includes("projects/**") && !runtimeSources.includes("allowedFiles: [\"projects/"));
addCheck("final report path is distinct", REPORT_PATH.endsWith("p717-final-validation-report.md"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Closes P71 Project Shipping Boundary + Export Pipeline for NEXUS OS.",
        "- Validates completed subphases, Command Center Project Shipping UX, dashboard validation, reports, docs, roadmap, phase status, and P72 handoff.",
        "- Does not create packages, export files, create artifacts, mutate project source, dispatch providers/tools/workers, write DB state, call network services, deploy, release, or spend provider budget.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p717-final-validation",
        "- npm run check:p716-tests-checkers-docs",
        "- npm run check:p715-command-center-shipping-ux",
        "- cd dashboard && npm run test:unit",
        "- cd dashboard && npm run build",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Project Shipping route\"",
        "- npm run check:p71-execution-plan",
        "- npm run check:phase-validation-coverage",
        "- npm run check:os-phase-status",
        "- npm run check:format-readability",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: [
        "- P71 closes project shipping and export readiness only.",
        "- Package creation, export execution, artifact creation, project mutation, provider/tool execution, worker execution, DB writes, network calls, deploy/release execution, and provider spend remain disabled.",
        "- P72 is the DB-backed runtime handoff and does not start DB mutation by itself.",
      ].join("\n"),
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P71.7 Final Validation Report", phase: "P71.7" },
);

printCheckReport("P71.7 Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
