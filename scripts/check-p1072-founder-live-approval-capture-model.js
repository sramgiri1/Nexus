import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P107_APPROVAL_CAPTURE_MODEL_STATES,
  P107_FOUNDER_LIVE_APPROVAL_CAPTURE_MODEL_PHASE,
  buildFounderLiveApprovalCaptureModel,
  validateFounderLiveApprovalCaptureModel,
} from "../live-ready/founderLiveApprovalCaptureModel.js";
import { P107_APPROVAL_CAPTURE_BLOCKED_FLAGS } from "../live-ready/founderLiveApprovalCaptureBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1072-founder-live-approval-capture-model-report.md";

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
const contract = readJson("contracts/os-roadmap/p107-founder-live-approval-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P107_FOUNDER_LIVE_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const source = readText("live-ready/founderLiveApprovalCaptureModel.js");
const envelope = buildFounderLiveApprovalCaptureModel({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalCaptureModel(envelope);
const data = envelope.data || {};
const p1072 = subphaseById.get("P107.2") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1072-founder-live-approval-capture-model"]));
addCheck("model exports exist", source.includes("buildFounderLiveApprovalCaptureModel") && source.includes("validateFounderLiveApprovalCaptureModel"));
addCheck("phase constant", P107_FOUNDER_LIVE_APPROVAL_CAPTURE_MODEL_PHASE === "P107.2");
addCheck("state constant", Object.values(P107_APPROVAL_CAPTURE_MODEL_STATES).includes("founder_live_approval_capture_records_ready_execution_blocked"));
addCheck("model validates", validation.valid, validation.errors.join("; "));
addCheck("model shape", data.schemaVersion === "1.0" && Boolean(data.approvalCaptureReadiness) && Array.isArray(data.approvalCaptureRecords));
addCheck("approval capture records useful", data.approvalCaptureRecords?.length === 6 && data.approvalCaptureReadiness?.captureRecordCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("approval capture and persistence remain blocked", data.approvalCaptureReadiness?.capturedDecisionCount === 0 && data.approvalCaptureReadiness?.persistedDecisionCount === 0 && data.approvalCaptureReadiness?.writableDecisionCount === 0 && data.approvalCaptureReadiness?.approvalCaptureUnlockCount === 0);
addCheck("execution remains blocked", data.approvalCaptureReadiness?.executableCaptureRecordCount === 0 && data.approvalCaptureReadiness?.dispatchableCaptureRecordCount === 0 && data.approvalCaptureReadiness?.projectMutationCaptureRecordCount === 0 && data.approvalCaptureReadiness?.hostedDbMutationCaptureRecordCount === 0 && data.approvalCaptureReadiness?.providerSpendCaptureRecordCount === 0);
addCheck("records remain blocked", data.approvalCaptureRecords?.every((record) => record.approvalCaptured === false && record.approvalPersisted === false && record.approvalCaptureWriteAllowed === false && record.executionUnlockAllowed === false && record.runtimeAdmissionAllowed === false && record.executionAllowed === false && record.dispatchAllowed === false && record.projectMutationAllowed === false && record.hostedDbMutationAllowed === false && record.spendAllowed === false));
addCheck("records include evidence and validation", data.approvalCaptureRecords?.every((record) => record.requiredEvidence?.length >= 24 && record.missingEvidence?.length >= 24 && record.validationCommands?.includes("npm run check:p1072-founder-live-approval-capture-model") && record.approvalDecisionPrompt && record.operatorDecisionPrompt));
addCheck("all blocked flags false", P107_APPROVAL_CAPTURE_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.approvalCaptureRecords.every((record) => record[flag] === false)));
addCheck("reuses P107 boundary and P106 queue preview", source.includes("buildFounderLiveApprovalCaptureBoundarySchema") && source.includes("buildFounderLiveApprovalRequestQueuePreview"));
addCheck("contract marks P107.2 complete", p1072.status === "complete");
addCheck("P107.3 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P107.3")?.status));
addCheck("docs record P107.2", /P107\.2 Approval Capture Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P107.2", /P107\.2 is\s+complete/.test(platformRoadmap) && (/P107\.3 is\s+next/.test(platformRoadmap) || /P107\.3 is\s+complete/.test(platformRoadmap)));
addCheck("README records P107.2", /P107\.2 approval capture model/.test(readme) && (/P107\.3 is next/.test(readme) || /P107\.3 capture audit preview/.test(readme)));
addCheck(
  "phase status advanced",
  ["P107.2", "P107.3", "P107.4", "P107.5", "P107.6", "P107.7"].includes(status.currentPhase)
    && ["P107.1", "P107.2", "P107.3", "P107.4", "P107.5", "P107.6"].includes(status.previousPhase)
    && ["P107.3", "P107.4", "P107.5", "P107.6", "P107.7", "P108"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P107")?.status)
    && statusById.get("P107.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P107.3")?.status)
    && roadmapById.get("P107.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P107.2 avoids forbidden file scope", !(p1072.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("model stays Command Center hidden", data.commandCenterVisible === false);
addCheck("model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("model avoids raw packet IDs", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestId|approvalCaptureId)/.test(serializedData));
addCheck("model avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedData));
addCheck("model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P107.2 founder live approval capture local model.",
        "- Confirms approval capture records are assembled from P107.1 boundary and P106 queue rows without approval capture, persistence, writes, or execution authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1072-founder-live-approval-capture-model",
        "- npm run check:p1071-founder-live-approval-capture-boundary-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P107.2 is a local model only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P107.2 Founder Live Approval Capture Model Report", phase: "P107.2" },
);

printCheckReport("P107.2 Founder Live Approval Capture Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
