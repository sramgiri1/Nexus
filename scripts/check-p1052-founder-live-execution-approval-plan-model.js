import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P105_EXECUTION_APPROVAL_MODEL_STATES,
  P105_FOUNDER_LIVE_EXECUTION_APPROVAL_MODEL_PHASE,
  buildFounderLiveExecutionApprovalPlanModel,
  validateFounderLiveExecutionApprovalPlanModel,
} from "../live-ready/founderLiveExecutionApprovalPlanModel.js";
import { P105_EXECUTION_APPROVAL_BLOCKED_FLAGS } from "../live-ready/founderLiveExecutionApprovalPlanning.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1052-founder-live-execution-approval-plan-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p105-founder-live-execution-approval-planning-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PLANNING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveExecutionApprovalPlanModel.js");
const envelope = buildFounderLiveExecutionApprovalPlanModel({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveExecutionApprovalPlanModel(envelope);
const data = envelope.data || {};
const p1052 = subphaseById.get("P105.2") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1052-founder-live-execution-approval-plan-model"]));
addCheck("model exports exist", source.includes("buildFounderLiveExecutionApprovalPlanModel") && source.includes("validateFounderLiveExecutionApprovalPlanModel"));
addCheck("phase constant", P105_FOUNDER_LIVE_EXECUTION_APPROVAL_MODEL_PHASE === "P105.2");
addCheck("state constant", Object.values(P105_EXECUTION_APPROVAL_MODEL_STATES).includes("founder_live_execution_approval_plan_ready_execution_blocked"));
addCheck("model validates", validation.valid, validation.errors.join("; "));
addCheck("model shape", data.schemaVersion === "1.0" && Boolean(data.approvalPlanReadiness) && Array.isArray(data.approvalPlanRows));
addCheck("approval plan rows useful", data.approvalPlanRows?.length === 6 && data.approvalPlanReadiness?.approvalPlanRowCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("approval capture remains blocked", data.approvalPlanReadiness?.capturedApprovalCount === 0 && data.approvalPlanReadiness?.approvalUnlockCount === 0 && data.approvalPlanReadiness?.runtimeAdmissionCount === 0);
addCheck("execution remains blocked", data.approvalPlanReadiness?.executableApprovalPlanCount === 0 && data.approvalPlanReadiness?.dispatchableApprovalPlanCount === 0 && data.approvalPlanReadiness?.projectMutationApprovalPlanCount === 0 && data.approvalPlanReadiness?.hostedDbMutationApprovalPlanCount === 0);
addCheck("rows remain blocked", data.approvalPlanRows?.every((row) => row.approvalCaptured === false && row.approvalWriteAllowed === false && row.executionUnlockAllowed === false && row.runtimeAdmissionAllowed === false && row.executionAllowed === false && row.dispatchAllowed === false && row.projectMutationAllowed === false && row.hostedDbMutationAllowed === false && row.spendAllowed === false));
addCheck("rows include gates and validation", data.approvalPlanRows?.every((row) => row.requiredGates?.length >= 12 && row.validationCommands?.includes("npm run check:p1052-founder-live-execution-approval-plan-model") && row.reviewQuestions?.length >= 4));
addCheck("all blocked flags false", P105_EXECUTION_APPROVAL_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.approvalPlanRows.every((row) => row[flag] === false)));
addCheck("reuses P104 boundary model and P105 schema", source.includes("buildFounderLiveExecutionBoundaryModel") && source.includes("buildFounderLiveExecutionApprovalPlanningSchema"));
addCheck("contract marks P105.2 complete", p1052.status === "complete");
addCheck("P105.3 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P105.3")?.status));
addCheck("docs record P105.2", /P105\.2 Approval Plan Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P105.2", /P105\.2 is\s+complete/.test(platformRoadmap) && /P105\.3 is\s+next/.test(platformRoadmap));
addCheck("README records P105.2", /P105\.2 approval-plan model/.test(readme) && /P105\.3 is next/.test(readme));
addCheck(
  "phase status advanced",
  ["P105.2", "P105.3", "P105.4", "P105.5"].includes(status.currentPhase)
    && ["P105.1", "P105.2", "P105.3", "P105.4"].includes(status.previousPhase)
    && ["P105.3", "P105.4", "P105.5", "P105.6"].includes(status.nextPhase)
    && statusById.get("P105")?.status === "in_progress"
    && statusById.get("P105.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P105.3")?.status)
    && roadmapById.get("P105.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P105.2 avoids forbidden file scope", !(p1052.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("model stays Command Center hidden", data.commandCenterVisible === false);
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedData));
addCheck("model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P105.2 founder live execution approval-plan local model.",
        "- Confirms approval-plan rows are assembled from P104 boundary rows and P105.1 schema without approval capture or execution authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1052-founder-live-execution-approval-plan-model",
        "- npm run check:p1051-founder-live-execution-approval-planning-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P105.2 is a local model only. It does not capture approvals, write approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P105.2 Founder Live Execution Approval Plan Model Report", phase: "P105.2" },
);

printCheckReport("P105.2 Founder Live Execution Approval Plan Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
