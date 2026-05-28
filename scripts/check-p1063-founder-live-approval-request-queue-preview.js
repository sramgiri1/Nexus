import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P106_APPROVAL_REQUEST_QUEUE_PREVIEW_STATES,
  P106_FOUNDER_LIVE_APPROVAL_REQUEST_QUEUE_PREVIEW_PHASE,
  buildFounderLiveApprovalRequestQueuePreview,
  validateFounderLiveApprovalRequestQueuePreview,
} from "../live-ready/founderLiveApprovalRequestQueuePreview.js";
import { P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS } from "../live-ready/founderLiveApprovalRequestBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1063-founder-live-approval-request-queue-preview-report.md";

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
const source = readText("live-ready/founderLiveApprovalRequestQueuePreview.js");
const envelope = buildFounderLiveApprovalRequestQueuePreview({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalRequestQueuePreview(envelope);
const data = envelope.data || {};
const p1063 = subphaseById.get("P106.3") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1063-founder-live-approval-request-queue-preview"]));
addCheck("queue preview exports exist", source.includes("buildFounderLiveApprovalRequestQueuePreview") && source.includes("validateFounderLiveApprovalRequestQueuePreview"));
addCheck("phase constant", P106_FOUNDER_LIVE_APPROVAL_REQUEST_QUEUE_PREVIEW_PHASE === "P106.3");
addCheck("state constant", Object.values(P106_APPROVAL_REQUEST_QUEUE_PREVIEW_STATES).includes("founder_live_approval_request_queue_ready_execution_blocked"));
addCheck("queue preview validates", validation.valid, validation.errors.join("; "));
addCheck("queue preview shape", data.schemaVersion === "1.0" && Boolean(data.approvalRequestQueueSummary) && Array.isArray(data.queueRows) && Array.isArray(data.queueSections));
addCheck("queue rows useful", data.queueRows?.length === 6 && data.approvalRequestQueueSummary?.queuedRequestCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("queue write and submission counts blocked", data.approvalRequestQueueSummary?.submittableQueuedRequestCount === 0 && data.approvalRequestQueueSummary?.capturableQueuedRequestCount === 0 && data.approvalRequestQueueSummary?.persistedQueuedRequestCount === 0 && data.approvalRequestQueueSummary?.writableQueuedRequestCount === 0);
addCheck("execution remains blocked", data.approvalRequestQueueSummary?.executableQueuedRequestCount === 0 && data.approvalRequestQueueSummary?.dispatchableQueuedRequestCount === 0 && data.approvalRequestQueueSummary?.projectMutationQueuedRequestCount === 0 && data.approvalRequestQueueSummary?.hostedDbMutationQueuedRequestCount === 0 && data.approvalRequestQueueSummary?.providerSpendQueuedRequestCount === 0);
addCheck("queue rows remain blocked", data.queueRows?.every((row) => row.approvalRequestSubmitted === false && row.approvalCaptured === false && row.approvalPersisted === false && row.approvalRequestWriteAllowed === false && row.executionUnlockAllowed === false && row.runtimeAdmissionAllowed === false && row.executionAllowed === false && row.dispatchAllowed === false && row.projectMutationAllowed === false && row.hostedDbMutationAllowed === false && row.spendAllowed === false));
addCheck("queue rows include evidence and blockers", data.queueRows?.every((row) => row.requiredEvidence?.length >= 18 && row.missingEvidence?.length >= 18 && row.evidenceStatus?.requiredEvidenceCount >= 18 && row.blockers?.length >= 10));
addCheck("all blocked flags false", P106_APPROVAL_REQUEST_BOUNDARY_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.queueRows.every((row) => row[flag] === false)));
addCheck("reuses P106 approval request model", source.includes("buildFounderLiveApprovalRequestModel"));
addCheck("contract marks P106.3 complete", p1063.status === "complete");
addCheck("P106.4 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P106.4")?.status));
addCheck("docs record P106.3", /P106\.3 Request Queue Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P106.3", /P106\.3 is\s+complete/.test(platformRoadmap) && (/P106\.4 is\s+next/.test(platformRoadmap) || /P106\.4 is\s+complete/.test(platformRoadmap)));
addCheck("README records P106.3", /P106\.3 request queue preview/.test(readme) && (/P106\.4 is next/.test(readme) || /P106\.4 Command Center approval request UX/.test(readme)));
addCheck(
  "phase status advanced",
  ["P106.3", "P106.4", "P106.5", "P106.6", "P106.7"].includes(status.currentPhase)
    && ["P106.2", "P106.3", "P106.4", "P106.5", "P106.6"].includes(status.previousPhase)
    && ["P106.4", "P106.5", "P106.6", "P106.7", "P107"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P106")?.status)
    && statusById.get("P106.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P106.4")?.status)
    && roadmapById.get("P106.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P106.3 avoids forbidden file scope", !(p1063.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("queue preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("queue preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("queue preview avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey)/.test(serializedData));
addCheck("queue preview avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedData));
addCheck("queue preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P106.3 founder live approval request queue preview.",
        "- Confirms queue rows are assembled from P106.2 request records without approval request submission, approval capture, approval persistence, approval writes, or execution authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1063-founder-live-approval-request-queue-preview",
        "- npm run check:p1062-founder-live-approval-request-model",
        "- npm run check:p1061-founder-live-approval-request-boundary-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P106.3 is a local queue preview only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P106.3 Founder Live Approval Request Queue Preview Report", phase: "P106.3" },
);

printCheckReport("P106.3 Founder Live Approval Request Queue Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
