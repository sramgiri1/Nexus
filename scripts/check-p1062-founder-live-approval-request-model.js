import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P106_APPROVAL_REQUEST_MODEL_STATES,
  P106_FOUNDER_LIVE_APPROVAL_REQUEST_MODEL_PHASE,
  buildFounderLiveApprovalRequestModel,
  validateFounderLiveApprovalRequestModel,
} from "../live-ready/founderLiveApprovalRequestModel.js";
import { P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS } from "../live-ready/founderLiveApprovalRequestBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1062-founder-live-approval-request-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p106-founder-live-approval-request-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P106_FOUNDER_LIVE_APPROVAL_REQUEST_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveApprovalRequestModel.js");
const envelope = buildFounderLiveApprovalRequestModel({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalRequestModel(envelope);
const data = envelope.data || {};
const p1062 = subphaseById.get("P106.2") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1062-founder-live-approval-request-model"]));
addCheck("model exports exist", source.includes("buildFounderLiveApprovalRequestModel") && source.includes("validateFounderLiveApprovalRequestModel"));
addCheck("phase constant", P106_FOUNDER_LIVE_APPROVAL_REQUEST_MODEL_PHASE === "P106.2");
addCheck("state constant", Object.values(P106_APPROVAL_REQUEST_MODEL_STATES).includes("founder_live_approval_request_records_ready_execution_blocked"));
addCheck("model validates", validation.valid, validation.errors.join("; "));
addCheck("model shape", data.schemaVersion === "1.0" && Boolean(data.approvalRequestReadiness) && Array.isArray(data.approvalRequestRecords));
addCheck("approval request records useful", data.approvalRequestRecords?.length === 6 && data.approvalRequestReadiness?.approvalRequestRecordCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("approval request submission and persistence remain blocked", data.approvalRequestReadiness?.submittedApprovalRequestCount === 0 && data.approvalRequestReadiness?.capturedApprovalRequestCount === 0 && data.approvalRequestReadiness?.persistedApprovalRequestCount === 0 && data.approvalRequestReadiness?.approvalRequestUnlockCount === 0);
addCheck("execution remains blocked", data.approvalRequestReadiness?.executableApprovalRequestCount === 0 && data.approvalRequestReadiness?.dispatchableApprovalRequestCount === 0 && data.approvalRequestReadiness?.projectMutationApprovalRequestCount === 0 && data.approvalRequestReadiness?.hostedDbMutationApprovalRequestCount === 0 && data.approvalRequestReadiness?.providerSpendApprovalRequestCount === 0);
addCheck("records remain blocked", data.approvalRequestRecords?.every((record) => record.approvalRequestSubmitted === false && record.approvalCaptured === false && record.approvalPersisted === false && record.approvalRequestWriteAllowed === false && record.executionUnlockAllowed === false && record.runtimeAdmissionAllowed === false && record.executionAllowed === false && record.dispatchAllowed === false && record.projectMutationAllowed === false && record.hostedDbMutationAllowed === false && record.spendAllowed === false));
addCheck("records include evidence and validation", data.approvalRequestRecords?.every((record) => record.requiredEvidence?.length >= 18 && record.missingEvidence?.length >= 18 && record.validationCommands?.includes("npm run check:p1062-founder-live-approval-request-model") && record.founderDecisionPrompt && record.operatorDecisionPrompt));
addCheck("all blocked flags false", P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.approvalRequestRecords.every((record) => record[flag] === false)));
addCheck("reuses P105 review packet and P106 boundary", source.includes("buildFounderLiveExecutionApprovalReviewPacket") && source.includes("buildFounderLiveApprovalRequestBoundarySchema"));
addCheck("contract marks P106.2 complete", p1062.status === "complete");
addCheck("P106.3 remains planned", subphaseById.get("P106.3")?.status === "planned");
addCheck("docs record P106.2", /P106\.2 Approval Request Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P106.2", /P106\.2 is\s+complete/.test(platformRoadmap) && /P106\.3 is\s+next/.test(platformRoadmap));
addCheck("README records P106.2", /P106\.2 approval request model/.test(readme) && /P106\.3 is next/.test(readme));
addCheck(
  "phase status advanced",
  ["P106.2", "P106.3", "P106.4", "P106.5", "P106.6", "P106.7"].includes(status.currentPhase)
    && ["P106.1", "P106.2", "P106.3", "P106.4", "P106.5", "P106.6"].includes(status.previousPhase)
    && ["P106.3", "P106.4", "P106.5", "P106.6", "P106.7", "P107"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P106")?.status)
    && statusById.get("P106.2")?.status === "complete"
    && statusById.get("P106.3")?.status === "planned"
    && roadmapById.get("P106.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P106.2 avoids forbidden file scope", !(p1062.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("model stays Command Center hidden", data.commandCenterVisible === false);
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("model avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey)/.test(serializedData));
addCheck("model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedData));
addCheck("model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P106.2 founder live approval request local model.",
        "- Confirms approval request records are assembled from P105 review packets and the P106.1 boundary without approval submission, approval capture, approval persistence, or execution authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1062-founder-live-approval-request-model",
        "- npm run check:p1061-founder-live-approval-request-boundary-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P106.2 is a local model only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P106.2 Founder Live Approval Request Model Report", phase: "P106.2" },
);

printCheckReport("P106.2 Founder Live Approval Request Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
