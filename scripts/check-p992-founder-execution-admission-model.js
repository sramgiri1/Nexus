import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBusinessBuildViewModel,
  buildFounderExecutionAdmissionModel,
} from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p992-founder-execution-admission-model-report.md";

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
const model = buildFounderExecutionAdmissionModel("Build a simple iOS Snake game for the App Store");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p992 = subphaseById.get("P99.2");
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p992-founder-execution-admission-model"]));
addCheck("contract marks P99.2 complete", p992?.status === "complete" && subphaseById.get("P99.3")?.status === "planned");
addCheck("P99.2 allowed files scoped", p992?.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p992.allowedFiles.includes("reports/p992-founder-execution-admission-model-report.md"));
addCheck("P99.2 allowed files avoid forbidden roots", !p992?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("source exports admission model", source.includes("export function buildFounderExecutionAdmissionModel") && source.includes("export function validateFounderExecutionAdmissionModel"));
addCheck("view model exposes admission model", viewModel.executionAdmission?.commandCenterVisible === true && viewModel.executionAdmission?.admissionId === "local-business-build-execution-admission");
addCheck("admission model validates", model.validation?.valid === true && model.validation?.readyForExecution === false);
addCheck("admission lanes are display-safe", model.lanes?.length >= 4 && model.lanes.every((lane) => lane.readyForExecution === false && lane.canDispatchAgent === false && lane.canRunWorker === false && lane.canMutateProject === false));
addCheck("executable count stays zero", model.executableCount === 0 && model.runtimeFlags?.agentDispatchAllowed === false && model.runtimeFlags?.providerSpendAllowed === false);
addCheck("required approvals and evidence exist", model.requiredApprovals?.length >= 4 && model.requiredEvidence?.length >= 6);
addCheck("docs record P99.2", p99Plan.includes("P99.2 is complete") && p99Plan.includes("npm run check:p992-founder-execution-admission-model") && platformRoadmap.includes("P99.2 is complete"));
addCheck(
  "phase status advanced",
  statusById.get("P99.2")?.status === "complete"
    && status.currentPhase === "P99.2"
    && status.previousPhase === "P99.1"
    && status.nextPhase === "P99.3",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P99.2", roadmapById.get("P99.2")?.status === "complete" && roadmapById.get("P99.3")?.status === "planned");
addCheck("no raw private IDs or credentials", !/private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token/i.test(JSON.stringify(model)));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|generate app now/i.test(JSON.stringify(model)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds a display-safe P99.2 execution admission model over P98 handoff packets and dry-run lanes.",
        "- Exposes executionAdmission on the Business Build view model for later Command Center UX.",
        "- Confirms execution, dispatch, worker/tool, project mutation, hosted DB, deploy, package, network, and spend paths remain blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p992-founder-execution-admission-model",
        "- npm run check:p991-founder-execution-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P99.2 is model-only. It does not change Command Center UI, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P99.2 Founder Execution Admission Model Report", phase: "P99.2" },
);

printCheckReport("P99.2 Founder Execution Admission Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
