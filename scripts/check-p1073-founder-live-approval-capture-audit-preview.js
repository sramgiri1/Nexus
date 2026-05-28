import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES,
  P107_FOUNDER_LIVE_APPROVAL_CAPTURE_AUDIT_PREVIEW_PHASE,
  buildFounderLiveApprovalCaptureAuditPreview,
  validateFounderLiveApprovalCaptureAuditPreview,
} from "../live-ready/founderLiveApprovalCaptureAuditPreview.js";
import { P107_APPROVAL_CAPTURE_BLOCKED_FLAGS } from "../live-ready/founderLiveApprovalCaptureBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1073-founder-live-approval-capture-audit-preview-report.md";

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
const source = readText("live-ready/founderLiveApprovalCaptureAuditPreview.js");
const envelope = buildFounderLiveApprovalCaptureAuditPreview({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveApprovalCaptureAuditPreview(envelope);
const data = envelope.data || {};
const p1073 = subphaseById.get("P107.3") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1073-founder-live-approval-capture-audit-preview"]));
addCheck("audit preview exports exist", source.includes("buildFounderLiveApprovalCaptureAuditPreview") && source.includes("validateFounderLiveApprovalCaptureAuditPreview"));
addCheck("phase constant", P107_FOUNDER_LIVE_APPROVAL_CAPTURE_AUDIT_PREVIEW_PHASE === "P107.3");
addCheck("state constant", Object.values(P107_APPROVAL_CAPTURE_AUDIT_PREVIEW_STATES).includes("founder_live_approval_capture_audit_preview_ready_execution_blocked"));
addCheck("audit preview validates", validation.valid, validation.errors.join("; "));
addCheck("audit preview shape", data.schemaVersion === "1.0" && Boolean(data.approvalCaptureAuditSummary) && Array.isArray(data.auditRows) && Array.isArray(data.auditSections));
addCheck("audit rows useful", data.auditRows?.length === 6 && data.approvalCaptureAuditSummary?.auditPreviewCount === 6 && data.auditSections?.[0]?.auditPreviewCount === 6);
addCheck("founder context carried forward", data.founderContextSummary?.founderIdea?.includes("iOS Snake game"));
addCheck("capture audit counts blocked", data.approvalCaptureAuditSummary?.capturableDecisionCount === 0 && data.approvalCaptureAuditSummary?.persistedDecisionCount === 0 && data.approvalCaptureAuditSummary?.writableDecisionCount === 0);
addCheck("execution remains blocked", data.approvalCaptureAuditSummary?.executableDecisionCount === 0 && data.approvalCaptureAuditSummary?.dispatchableDecisionCount === 0 && data.approvalCaptureAuditSummary?.projectMutationDecisionCount === 0 && data.approvalCaptureAuditSummary?.hostedDbMutationDecisionCount === 0 && data.approvalCaptureAuditSummary?.providerSpendDecisionCount === 0);
addCheck("audit rows remain blocked", data.auditRows?.every((row) => row.approvalCaptured === false && row.approvalPersisted === false && row.approvalCaptureWriteAllowed === false && row.executionUnlockAllowed === false && row.runtimeAdmissionAllowed === false && row.executionAllowed === false && row.dispatchAllowed === false && row.projectMutationAllowed === false && row.hostedDbMutationAllowed === false && row.spendAllowed === false));
addCheck("audit rows include evidence and blockers", data.auditRows?.every((row) => row.requiredEvidence?.length >= 24 && row.missingEvidence?.length >= 24 && row.auditQuestions?.length >= 3 && row.blockers?.length >= 10));
addCheck("all blocked flags false", P107_APPROVAL_CAPTURE_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.auditRows.every((row) => row[flag] === false)));
addCheck("reuses P107 capture model", source.includes("buildFounderLiveApprovalCaptureModel"));
addCheck("contract marks P107.3 complete", p1073.status === "complete");
addCheck("P107.4 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P107.4")?.status));
addCheck("docs record P107.3", /P107\.3 Capture Audit Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P107.3", /P107\.3 is\s+complete/.test(platformRoadmap) && (/P107\.4 is\s+next/.test(platformRoadmap) || /P107\.4 is\s+complete/.test(platformRoadmap)));
addCheck("README records P107.3", /P107\.3 capture audit preview/.test(readme) && (/P107\.4 is next/.test(readme) || /P107\.4 Command Center/.test(readme)));
addCheck(
  "phase status advanced",
  ["P107.3", "P107.4", "P107.5", "P107.6", "P107.7"].includes(status.currentPhase)
    && ["P107.2", "P107.3", "P107.4", "P107.5", "P107.6"].includes(status.previousPhase)
    && ["P107.4", "P107.5", "P107.6", "P107.7", "P108"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P107")?.status)
    && statusById.get("P107.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P107.4")?.status)
    && roadmapById.get("P107.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P107.3 avoids forbidden file scope", !(p1073.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("audit preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("audit preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedData));
addCheck("audit preview avoids raw packet IDs", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestId|approvalCaptureId)/.test(serializedData));
addCheck("audit preview avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedData));
addCheck("audit preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P107.3 founder live approval capture audit preview.",
        "- Confirms audit rows are assembled from P107.2 capture records without approval capture, persistence, writes, or execution authority.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1073-founder-live-approval-capture-audit-preview",
        "- npm run check:p1072-founder-live-approval-capture-model",
        "- npm run check:p1071-founder-live-approval-capture-boundary-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P107.3 is a local audit preview only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P107.3 Founder Live Approval Capture Audit Preview Report", phase: "P107.3" },
);

printCheckReport("P107.3 Founder Live Approval Capture Audit Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
