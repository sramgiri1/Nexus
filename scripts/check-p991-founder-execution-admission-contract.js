import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p991-founder-execution-admission-contract-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
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
const osStatusChecker = readText("scripts/check-os-phase-status.js");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p991 = subphaseById.get("P99.1");
const p99Ids = ["P99.1", "P99.2", "P99.3", "P99.4", "P99.5", "P99.6", "P99.7"];
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p991-founder-execution-admission-contract"]));
addCheck("contract identifies P99", contract.phase === "P99" && contract.title.includes("Governed Execution Admission"));
addCheck("contract has seven subphases", p99Ids.every((phaseId) => subphaseById.has(phaseId)));
addCheck("contract marks P99.1 complete only", p991?.status === "complete" && p99Ids.slice(1).every((phaseId) => subphaseById.get(phaseId)?.status === "planned"));
addCheck("P99.1 allowed files scoped", p991?.allowedFiles?.includes("contracts/os-roadmap/p99-execution-contracts.json") && p991.allowedFiles.includes("reports/p991-founder-execution-admission-contract-report.md"));
addCheck("P99.1 allowed files avoid forbidden roots", !p991?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("P99.1 validation commands listed", [
  "npm run check:p991-founder-execution-admission-contract",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p991?.validationCommands?.includes(command)));
addCheck("OS checker recognizes P99 subphases", p99Ids.every((phaseId) => osStatusChecker.includes(`\"${phaseId}\"`)));
addCheck("P99 plan records P99.1", p99Plan.includes("P99.1 is complete") && p99Plan.includes("npm run check:p991-founder-execution-admission-contract"));
addCheck("platform roadmap records P99.1", platformRoadmap.includes("## P99 - Founder Business Build Governed Execution Admission Handoff") && platformRoadmap.includes("P99.1 is complete") && platformRoadmap.includes("P99.2 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P99")?.status === "in_progress"
    && statusById.get("P99.1")?.status === "complete"
    && status.currentPhase === "P99.1"
    && status.previousPhase === "P98.7"
    && status.nextPhase === "P99.2",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P99.1", roadmapById.get("P99")?.status === "in_progress" && roadmapById.get("P99.1")?.status === "complete" && roadmapById.get("P99.2")?.status === "planned");
addCheck("contract preserves blocked execution boundary", ["No provider/model calls", "No agent dispatch", "No worker/tool execution", "No project creation or mutation", "No hosted DB mutation", "No deploy"].every((term) => JSON.stringify(contract).includes(term)));
addCheck("no raw private IDs or credentials", !/private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token/i.test(JSON.stringify([contract, statusById.get("P99"), statusById.get("P99.1")])));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|generate app now/i.test(JSON.stringify(contract)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Defines the P99 governed execution admission contract and seven-subphase split.",
        "- Records P99.1 status and P99.2 handoff.",
        "- Confirms execution, dispatch, worker/tool, project mutation, hosted DB, deploy, release, export, package, network, and spend paths remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p991-founder-execution-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P99.1 is contract-only. It does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or provider spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P99.1 Founder Execution Admission Contract Report", phase: "P99.1" },
);

printCheckReport("P99.1 Founder Execution Admission Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
