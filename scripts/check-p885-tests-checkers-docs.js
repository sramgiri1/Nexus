import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p885-tests-checkers-docs-report.md";

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
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const contract = readText("contracts/os-roadmap/p88-execution-contracts.json");
const docs = readText("docs/architecture/P88_SCOPED_EXECUTION_CAPABLE_ACTIVATION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const liveData = readText("dashboard/src/data/liveReadiness.js");
const tests = readText("dashboard/tests/routes.spec.js");

const requiredScripts = [
  "check:p881-scoped-execution-activation-profile",
  "check:p882-local-activation-request-model",
  "check:p883-local-executor-admission",
  "check:p884-command-center-scoped-activation-ux",
  "check:p885-tests-checkers-docs",
];
const requiredReports = [
  "reports/p881-scoped-execution-activation-profile-report.md",
  "reports/p882-local-activation-request-model-report.md",
  "reports/p883-local-executor-admission-report.md",
  "reports/p884-command-center-scoped-activation-ux-report.md",
];
const requiredPhases = ["P88.1", "P88.2", "P88.3", "P88.4"];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("reports exist", requiredReports.every(fileExists));
addCheck("subphase statuses complete", requiredPhases.every((phaseId) => statusById.get(phaseId)?.status === "complete"));
addCheck("subphase commits stamped", requiredPhases.every((phaseId) => Boolean(statusById.get(phaseId)?.commit) && !String(statusById.get(phaseId)?.commit).includes("pending")));
addCheck("roadmap tracks P88 subphases", requiredPhases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("contract tracks P88.1-P88.5", ["P88.1", "P88.2", "P88.3", "P88.4", "P88.5"].every((phaseId) => contract.includes(phaseId)));
addCheck("docs list P88.1-P88.5", ["P88.1", "P88.2", "P88.3", "P88.4", "P88.5"].every((phaseId) => docs.includes(phaseId)));
addCheck(
  "platform roadmap records P88.5",
  platformRoadmap.includes("P88.5 is complete")
    && (platformRoadmap.includes("P88.6 is next") || platformRoadmap.includes("P88.6 is complete")),
);
addCheck("Command Center scoped activation covered", liveData.includes("SCOPED_ACTIVATION_ROWS") && tests.includes("Scoped Activation") && tests.includes("Executor admission blocked"));
addCheck(
  "phase status advanced",
  ["in_progress", "complete"].includes(statusById.get("P88")?.status)
    && statusById.get("P88.5")?.status === "complete"
    && ["P88.5", "P88.6", "P88.7"].includes(status.currentPhase)
    && ["P88.4", "P88.5", "P88.6"].includes(status.previousPhase)
    && ["P88.6", "P88.7", "P89"].includes(status.nextPhase),
);
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-01|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d/.test(liveData));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now/i.test(liveData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Aggregates P88.1-P88.4 validation evidence.",
        "- Confirms scripts, reports, docs, roadmap, status, and Command Center coverage remain coherent.",
        "- Confirms scoped activation UX remains display-only.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p885-tests-checkers-docs",
        "- npm run check:p884-command-center-scoped-activation-ux",
        "- npm run check:p883-local-executor-admission",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P88.5 is validation aggregation only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P88.5 Tests Checkers Docs Report", phase: "P88.5" },
);

printCheckReport("P88.5 Tests Checkers Docs Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
