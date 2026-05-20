import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p886-docs-roadmap-report.md";

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

const p88Subphases = ["P88.1", "P88.2", "P88.3", "P88.4", "P88.5", "P88.6"];
const requiredScripts = [
  "check:p881-scoped-execution-activation-profile",
  "check:p882-local-activation-request-model",
  "check:p883-local-executor-admission",
  "check:p884-command-center-scoped-activation-ux",
  "check:p885-tests-checkers-docs",
  "check:p886-docs-roadmap",
];
const requiredReports = [
  "reports/p881-scoped-execution-activation-profile-report.md",
  "reports/p882-local-activation-request-model-report.md",
  "reports/p883-local-executor-admission-report.md",
  "reports/p884-command-center-scoped-activation-ux-report.md",
  "reports/p885-tests-checkers-docs-report.md",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("prior P88 reports exist", requiredReports.every(fileExists));
addCheck("contract tracks P88.1-P88.6", p88Subphases.every((phaseId) => contract.includes(phaseId)));
addCheck("contract keeps P88.6 docs-only", contract.includes("nexus-os-p88-6-docs-roadmap") && contract.includes("does not enable runtime execution"));
addCheck("P88 plan documents P88.6 complete", docs.includes("## P88.6 Docs / Roadmap") && docs.includes("P88.6 is complete"));
addCheck("P88 plan keeps P88.7 final validation next", docs.includes("P88.7 Final Validation") && docs.includes("P88.7 is next"));
addCheck("platform roadmap records P88.6", platformRoadmap.includes("P88.6 is complete") && platformRoadmap.includes("P88.7 is next"));
addCheck("roadmap statuses complete through P88.6", p88Subphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("status records complete through P88.6", p88Subphases.every((phaseId) => statusById.get(phaseId)?.track === "NEXUS_OS" && statusById.get(phaseId)?.status === "complete"));
addCheck("P88.7 planned", statusById.get("P88.7")?.status === "planned" && roadmapById.get("P88.7")?.status === "planned");
addCheck(
  "phase status advanced",
  statusById.get("P88")?.status === "in_progress"
    && statusById.get("P88.6")?.status === "complete"
    && status.currentPhase === "P88.6"
    && status.previousPhase === "P88.5"
    && status.nextPhase === "P88.7",
);
addCheck(
  "Command Center UX preserved",
  liveData.includes("SCOPED_ACTIVATION_ROWS")
    && liveData.includes("Local founder task orchestration")
    && liveData.includes("Generated workspace boundary")
    && liveData.includes("Live unlock review"),
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
        "- Closes P88 docs, roadmap, contract, and status evidence before final validation.",
        "- Confirms P88.1-P88.6 are tracked as NEXUS OS subphases.",
        "- Confirms P88.7 remains the final validation handoff.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p886-docs-roadmap",
        "- npm run check:p885-tests-checkers-docs",
        "- npm run check:p884-command-center-scoped-activation-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Live Ready route renders evidence-backed activation labels without runnable actions\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P88.6 is docs and roadmap closure only. It does not run an executor, dispatch agents, execute tools/workers, mutate projects, call providers/models, write DB state, use network calls, deploy, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P88.6 Docs Roadmap Report", phase: "P88.6" },
);

printCheckReport("P88.6 Docs Roadmap Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
