import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBusinessBuildViewModel,
  buildFounderExecutionAdmissionDryRun,
} from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p994-founder-execution-admission-dry-run-report.md";

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
const source = readText("dashboard/src/data/businessBuild.js");
const dryRun = buildFounderExecutionAdmissionDryRun("Build a simple iOS Snake game for the App Store");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p994 = subphaseById.get("P99.4");
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p994-founder-execution-admission-dry-run"]));
addCheck("contract marks P99.4 complete", p994?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P99.5")?.status));
addCheck("P99.4 allowed files scoped", p994?.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p994.allowedFiles.includes("reports/p994-founder-execution-admission-dry-run-report.md"));
addCheck("P99.4 allowed files avoid forbidden roots", !p994?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("source exports admission dry run", source.includes("export function buildFounderExecutionAdmissionDryRun"));
addCheck("view model exposes admission dry run", viewModel.executionAdmissionDryRun?.commandCenterVisible === true && viewModel.executionAdmissionDryRun?.dryRunId === "local-business-build-execution-admission-dry-run");
addCheck("dry run remains non-executable", dryRun.dryRunOnly === true && dryRun.executableCount === 0 && dryRun.approvalReadyCount === 0);
addCheck("dry run lanes are blocked", dryRun.lanes?.length >= 4 && dryRun.lanes.every((lane) => lane.wouldApproveExecution === false && lane.wouldDispatchAgent === false && lane.wouldRunWorker === false && lane.wouldMutateProject === false && lane.wouldSpend === false));
addCheck("docs record P99.4", p99Plan.includes("P99.4 is complete") && p99Plan.includes("npm run check:p994-founder-execution-admission-dry-run") && platformRoadmap.includes("P99.4 is complete"));
addCheck(
  "phase status advanced",
  statusById.get("P99.4")?.status === "complete"
    && ["P99.4", "P99.5", "P99.6", "P99.7"].includes(status.currentPhase)
    && ["P99.3", "P99.4", "P99.5", "P99.6"].includes(status.previousPhase)
    && ["P99.5", "P99.6", "P99.7", "P100"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P99.4", roadmapById.get("P99.4")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P99.5")?.status));
addCheck("no raw private IDs or credentials", !/private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token/i.test(JSON.stringify(dryRun)));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|generate app now/i.test(JSON.stringify(dryRun)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds deterministic P99.4 execution admission dry-run records from the P99.3 approval envelope.",
        "- Exposes executionAdmissionDryRun on the Business Build view model for later Command Center UX.",
        "- Confirms approval-ready and executable counts remain zero while unsafe runtime operations stay blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p994-founder-execution-admission-dry-run",
        "- npm run check:p993-founder-execution-admission-approval-envelope",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P99.4 is dry-run data only. It does not change Command Center UI, approve execution, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P99.4 Founder Execution Admission Dry Run Report", phase: "P99.4" },
);

printCheckReport("P99.4 Founder Execution Admission Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
