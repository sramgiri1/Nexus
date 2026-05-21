import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p997-execution-admission-final-validation-report.md";

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
const contract = readJson("contracts/os-roadmap/p99-execution-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const p99Plan = readText("docs/architecture/P99_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const commandCenterSource = readText("dashboard/src/pages/CommandCenterV2.jsx");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p997 = subphaseById.get("P99.7");
const p99Subphases = ["P99.1", "P99.2", "P99.3", "P99.4", "P99.5", "P99.6", "P99.7"];
const requiredScripts = [
  "check:p991-founder-execution-admission-contract",
  "check:p992-founder-execution-admission-model",
  "check:p993-founder-execution-admission-approval-envelope",
  "check:p994-founder-execution-admission-dry-run",
  "check:p995-command-center-execution-admission-ux",
  "check:p996-execution-admission-validation-docs",
  "check:p997-execution-admission-final-validation",
];
const requiredReports = [
  "reports/p991-founder-execution-admission-contract-report.md",
  "reports/p992-founder-execution-admission-model-report.md",
  "reports/p993-founder-execution-admission-approval-envelope-report.md",
  "reports/p994-founder-execution-admission-dry-run-report.md",
  "reports/p995-command-center-execution-admission-ux-report.md",
  "reports/p996-execution-admission-validation-docs-report.md",
];
const forbiddenAllowedPatterns = [
  /^projects\//,
  /^careloop\//,
  /^providers\//,
  /^tools\//,
  /^worker-runtime\//,
  /^deploy\//,
  /^release\//,
  /^exports\//,
  /^packages\//,
  /^\.env/,
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P99 evidence reports exist", requiredReports.every(fileExists));
addCheck("P99 prior evidence reports passed", requiredReports.every((path) => /Result[\s\S]*PASS|Result: PASS/.test(readText(path))));
addCheck("contract tracks P99.1-P99.7 complete", p99Subphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P99.7 allowed files scoped", p997?.allowedFiles?.includes("scripts/check-p997-execution-admission-final-validation.js") && p997.allowedFiles.includes("reports/p997-execution-admission-final-validation-report.md"));
addCheck("P99.7 allowed files avoid forbidden roots", !p997?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("docs mark P99.7 complete", p99Plan.includes("## P99.7 Final Validation") && p99Plan.includes("P99.7 is complete"));
addCheck("docs close P99", p99Plan.includes("P99 is complete") && p99Plan.includes("P100 is next"));
addCheck("platform roadmap closes P99", platformRoadmap.includes("P99.7 is complete") && platformRoadmap.includes("P99 is complete") && platformRoadmap.includes("P100 is next"));
addCheck("roadmap statuses complete through P99.7", p99Subphases.every((phaseId) => roadmapById.get(phaseId)?.track === "NEXUS_OS" && roadmapById.get(phaseId)?.status === "complete"));
addCheck("status records complete through P99.7", p99Subphases.every((phaseId) => statusById.get(phaseId)?.track === "NEXUS_OS" && statusById.get(phaseId)?.status === "complete"));
addCheck("parent phase closed", statusById.get("P99")?.status === "complete" && roadmapById.get("P99")?.status === "complete" && statusById.get("P99")?.nextPhase === "P100");
addCheck("P100 planned handoff exists", statusById.get("P100")?.status === "planned" && roadmapById.get("P100")?.status === "planned");
addCheck(
  "phase status advanced",
  status.currentPhase === "P99.7"
    && status.previousPhase === "P99.6"
    && status.nextPhase === "P100"
    && status.currentPhaseStatus === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("Command Center admission UX retained", commandCenterSource.includes("ExecutionAdmissionCard") && commandCenterSource.includes("DB Runtime Execution Admission"));
addCheck("Playwright admission coverage retained", routeTests.includes("Execution admission readiness appears without runnable actions"));

const serialized = JSON.stringify([contract, statusById.get("P99"), statusById.get("P99.7"), roadmapById.get("P99"), roadmapById.get("P99.7")]);
const statusSerialized = JSON.stringify([statusById.get("P99"), statusById.get("P99.7"), roadmapById.get("P99"), roadmapById.get("P99.7")]);
addCheck("unsafe operations remain blocked", ["provider/model calls", "agent dispatch", "worker/tool execution", "project mutation", "hosted DB mutation", "provider spend"].every((term) => serialized.includes(term)));
addCheck("no DemoApp/private IDs", !/DemoApp|private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+/i.test(statusSerialized));
addCheck("no fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|generate app now|approve now/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Finalizes P99 founder Business Build governed execution admission validation.",
        "- Closes P99 and P99.7 status records with P100 as the next planned scoped handoff.",
        "- Confirms the Command Center admission UX remains display-safe while unsafe runtime operations stay blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p997-execution-admission-final-validation",
        "- npm run check:p996-execution-admission-validation-docs",
        "- npm run check:p995-command-center-execution-admission-ux",
        "- npm run check:p994-founder-execution-admission-dry-run",
        "- npm run check:p993-founder-execution-admission-approval-envelope",
        "- npm run check:p992-founder-execution-admission-model",
        "- npm run check:p991-founder-execution-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P99.7 is final validation only. It does not change Command Center UX, approve execution, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P99.7 Execution Admission Final Validation Report", phase: "P99.7" },
);

printCheckReport("P99.7 Execution Admission Final Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
