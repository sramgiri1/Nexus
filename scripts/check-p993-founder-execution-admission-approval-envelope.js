import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildBusinessBuildViewModel,
  buildFounderExecutionAdmissionApprovalEnvelope,
} from "../dashboard/src/data/businessBuild.js";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p993-founder-execution-admission-approval-envelope-report.md";

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
const envelope = buildFounderExecutionAdmissionApprovalEnvelope("Build a simple iOS Snake game for the App Store");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");

const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const p993 = subphaseById.get("P99.3");
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p993-founder-execution-admission-approval-envelope"]));
addCheck("contract marks P99.3 complete", p993?.status === "complete" && subphaseById.get("P99.4")?.status === "planned");
addCheck("P99.3 allowed files scoped", p993?.allowedFiles?.includes("dashboard/src/data/businessBuild.js") && p993.allowedFiles.includes("reports/p993-founder-execution-admission-approval-envelope-report.md"));
addCheck("P99.3 allowed files avoid forbidden roots", !p993?.allowedFiles?.some((file) => forbiddenAllowedPatterns.some((pattern) => pattern.test(file))));
addCheck("source exports approval envelope", source.includes("export function buildFounderExecutionAdmissionApprovalEnvelope") && source.includes("export function validateFounderExecutionAdmissionApprovalEnvelope"));
addCheck("view model exposes approval envelope", viewModel.executionAdmissionApprovalEnvelope?.commandCenterVisible === true && viewModel.executionAdmissionApprovalEnvelope?.envelopeId === "local-business-build-execution-admission-approval-envelope");
addCheck("approval envelope validates", envelope.validation?.valid === true && envelope.validation?.readyForExecution === false);
addCheck("approval gates are missing", envelope.approvalReady === false && envelope.approvalsAcceptedCount === 0 && envelope.approvals?.every((approval) => approval.accepted === false));
addCheck("approval lanes remain non-executable", envelope.executableCount === 0 && envelope.lanes?.every((lane) => lane.canApproveForExecution === false && lane.readyForExecution === false && lane.canDispatchAgent === false && lane.canRunWorker === false && lane.canMutateProject === false));
addCheck("docs record P99.3", p99Plan.includes("P99.3 is complete") && p99Plan.includes("npm run check:p993-founder-execution-admission-approval-envelope") && platformRoadmap.includes("P99.3 is complete"));
addCheck(
  "phase status advanced",
  statusById.get("P99.3")?.status === "complete"
    && status.currentPhase === "P99.3"
    && status.previousPhase === "P99.2"
    && status.nextPhase === "P99.4",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P99.3", roadmapById.get("P99.3")?.status === "complete" && roadmapById.get("P99.4")?.status === "planned");
addCheck("no raw private IDs or credentials", !/private-project-|project_[A-Za-z0-9_-]*\d|tenant_[A-Za-z0-9_-]*\d|workspace_[A-Za-z0-9_-]*\d|Bearer\s+|jwt|id_token|access_token/i.test(JSON.stringify(envelope)));
addCheck("no fake runnable actions", !/run now|execute now|deploy now|apply now|call provider now|dispatch agent now|create project now|generate app now/i.test(JSON.stringify(envelope)));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Adds a display-safe P99.3 approval envelope over the P99.2 admission model.",
        "- Exposes executionAdmissionApprovalEnvelope on the Business Build view model for later Command Center UX.",
        "- Confirms approval and executable counts remain zero while unsafe runtime operations stay blocked.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p993-founder-execution-admission-approval-envelope",
        "- npm run check:p992-founder-execution-admission-model",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P99.3 is approval-envelope data only. It does not change Command Center UI, approve execution, dispatch agents, execute workers/tools, mutate project source, use hosted DBs, deploy, release, export, package, call providers/models, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P99.3 Founder Execution Admission Approval Envelope Report", phase: "P99.3" },
);

printCheckReport("P99.3 Founder Execution Admission Approval Envelope Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
