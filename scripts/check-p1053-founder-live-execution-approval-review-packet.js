import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P105_EXECUTION_APPROVAL_REVIEW_PACKET_STATES,
  P105_FOUNDER_LIVE_EXECUTION_APPROVAL_REVIEW_PACKET_PHASE,
  buildFounderLiveExecutionApprovalReviewPacket,
  validateFounderLiveExecutionApprovalReviewPacket,
} from "../live-ready/founderLiveExecutionApprovalReviewPacket.js";
import { P105_EXECUTION_APPROVAL_BLOCKED_FLAGS } from "../live-ready/founderLiveExecutionApprovalPlanning.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1053-founder-live-execution-approval-review-packet-report.md";

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
const source = readText("live-ready/founderLiveExecutionApprovalReviewPacket.js");
const envelope = buildFounderLiveExecutionApprovalReviewPacket({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveExecutionApprovalReviewPacket(envelope);
const data = envelope.data || {};
const p1053 = subphaseById.get("P105.3") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1053-founder-live-execution-approval-review-packet"]));
addCheck("review packet exports exist", source.includes("buildFounderLiveExecutionApprovalReviewPacket") && source.includes("validateFounderLiveExecutionApprovalReviewPacket"));
addCheck("phase constant", P105_FOUNDER_LIVE_EXECUTION_APPROVAL_REVIEW_PACKET_PHASE === "P105.3");
addCheck("state constant", Object.values(P105_EXECUTION_APPROVAL_REVIEW_PACKET_STATES).includes("founder_live_execution_approval_review_packet_ready_execution_blocked"));
addCheck("review packet validates", validation.valid, validation.errors.join("; "));
addCheck("review packet shape", data.schemaVersion === "1.0" && Boolean(data.reviewPacketReadiness) && Array.isArray(data.reviewPacketRows));
addCheck("review packet rows useful", data.reviewPacketRows?.length === 6 && data.reviewPacketReadiness?.reviewPacketRowCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("approval submission remains blocked", data.reviewPacketReadiness?.submittedApprovalCount === 0 && data.reviewPacketReadiness?.capturedApprovalCount === 0 && data.reviewPacketReadiness?.approvalUnlockCount === 0 && data.reviewPacketReadiness?.runtimeAdmissionCount === 0);
addCheck("execution remains blocked", data.reviewPacketReadiness?.executableReviewPacketCount === 0 && data.reviewPacketReadiness?.dispatchableReviewPacketCount === 0 && data.reviewPacketReadiness?.projectMutationReviewPacketCount === 0 && data.reviewPacketReadiness?.hostedDbMutationReviewPacketCount === 0);
addCheck("rows remain blocked", data.reviewPacketRows?.every((row) => row.approvalSubmitted === false && row.approvalCaptured === false && row.approvalWriteAllowed === false && row.executionUnlockAllowed === false && row.runtimeAdmissionAllowed === false && row.executionAllowed === false && row.dispatchAllowed === false && row.projectMutationAllowed === false && row.hostedDbMutationAllowed === false && row.spendAllowed === false));
addCheck("rows include summaries and validation", data.reviewPacketRows?.every((row) => row.gateSummary?.requiredGateCount >= 12 && row.validationCommands?.includes("npm run check:p1053-founder-live-execution-approval-review-packet") && row.reviewQuestions?.length >= 4));
addCheck("all blocked flags false", P105_EXECUTION_APPROVAL_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.reviewPacketRows.every((row) => row[flag] === false)));
addCheck("reuses P105 approval plan model", source.includes("buildFounderLiveExecutionApprovalPlanModel"));
addCheck("contract marks P105.3 complete", p1053.status === "complete");
addCheck("P105.4 remains planned", subphaseById.get("P105.4")?.status === "planned");
addCheck("docs record P105.3", /P105\.3 Dry-Run Review Packet[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P105.3", /P105\.3 is\s+complete/.test(platformRoadmap) && /P105\.4 is\s+next/.test(platformRoadmap));
addCheck("README records P105.3", /P105\.3 dry-run review packet/.test(readme) && /P105\.4 is next/.test(readme));
addCheck(
  "phase status advanced",
  status.currentPhase === "P105.3"
    && status.previousPhase === "P105.2"
    && status.nextPhase === "P105.4"
    && statusById.get("P105")?.status === "in_progress"
    && statusById.get("P105.3")?.status === "complete"
    && statusById.get("P105.4")?.status === "planned"
    && roadmapById.get("P105.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P105.3 avoids forbidden file scope", !(p1053.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("review packet stays Command Center hidden", data.commandCenterVisible === false);
addCheck("review packet avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("review packet avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedData));
addCheck("review packet avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P105.3 founder live execution approval dry-run review packet.",
        "- Confirms review packet rows are assembled from P105.2 approval-plan rows without approval submission, approval capture, or execution authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1053-founder-live-execution-approval-review-packet",
        "- npm run check:p1052-founder-live-execution-approval-plan-model",
        "- npm run check:p1051-founder-live-execution-approval-planning-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P105.3 is a local dry-run review packet only. It does not submit approvals, capture approvals, write approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P105.3 Founder Live Execution Approval Review Packet Report", phase: "P105.3" },
);

printCheckReport("P105.3 Founder Live Execution Approval Review Packet Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
