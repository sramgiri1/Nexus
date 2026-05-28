import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1074-command-center-approval-capture-boundary-ux-report.md";

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
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const capture = build.founderLiveApprovalCaptureBoundary || {};
const p1074 = subphaseById.get("P107.4") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedCapture = JSON.stringify(capture);
const captureUxText = [
  serializedCapture,
  "Founder Live Approval Capture Boundary",
  "Business Build Approval Capture Boundary",
  "Agent Flow Approval Capture Boundary",
  "Live Readiness Approval Capture Boundary",
  "Capture read-only",
].join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1074-command-center-approval-capture-boundary-ux"]));
addCheck("dashboard data exposes capture boundary", dataSource.includes("buildFounderLiveApprovalCaptureBoundaryDisplayModel") && dataSource.includes("founderLiveApprovalCaptureBoundary"));
addCheck("page renders capture boundary only on non-chat founder routes", pageSource.includes("FounderLiveApprovalCaptureBoundaryCard") && pageSource.includes("Business Build Approval Capture Boundary") && pageSource.includes("Agent Flow Approval Capture Boundary") && pageSource.includes("Live Readiness Approval Capture Boundary") && !pageSource.includes("Chat Approval Capture Boundary") && !pageSource.includes("Lite Approval Capture Boundary"));
addCheck("route test covers capture boundary", routeTests.includes("Founder live approval capture boundary appears on non-chat founder routes") && routeTests.includes("Founder live approval capture boundary preview") && routeTests.includes("Capture read-only"));
addCheck("capture display model useful", capture.currentState?.includes("Capture Boundary") && capture.auditPreviewCount === 6 && capture.blockedAuditPreviewCount === 6 && capture.auditRows?.length === 6);
addCheck("capture zeroes unsafe counts", capture.capturableDecisionCount === 0 && capture.persistedDecisionCount === 0 && capture.writableDecisionCount === 0 && capture.executableDecisionCount === 0 && capture.dispatchableDecisionCount === 0 && capture.projectMutationDecisionCount === 0 && capture.hostedDbMutationDecisionCount === 0);
addCheck("capture rows display safe and blocked", capture.auditRows?.every((row) => row.approvalCaptured === "Blocked" && row.approvalPersisted === "Blocked" && row.approvalWriteAllowed === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked" && !("approvalCaptureRecordKey" in row) && !("auditPreviewKey" in row) && !("sourceApprovalRequestKey" in row)));
addCheck("capture rows include operator value", capture.auditRows?.every((row) => row.proposedAgentLane && row.proposedOutcome && row.auditQuestions?.length >= 3 && row.validationCommand === "npm run check:p1073-founder-live-approval-capture-audit-preview"));
addCheck("safety rows retained", capture.safetyRows?.some((row) => row.label === "Approval writes" && row.value === "Blocked") && capture.safetyRows?.some((row) => row.label === "Provider spend" && row.value === "Blocked"));
addCheck("contract marks P107.4 complete", p1074.status === "complete");
addCheck("P107.5 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P107.5")?.status));
addCheck("docs record P107.4", /P107\.4 Command Center Capture Boundary UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P107.4", /P107\.4 is\s+complete/.test(platformRoadmap) && (/P107\.5 is\s+next/.test(platformRoadmap) || /P107\.5 is\s+complete/.test(platformRoadmap)));
addCheck("README records P107.4", /P107\.4 Command Center capture boundary UX/.test(readme) && (/P107\.5 is next/.test(readme) || /P107\.5 aggregate validation/.test(readme)));
addCheck(
  "phase status advanced",
  ["P107.4", "P107.5", "P107.6", "P107.7"].includes(status.currentPhase)
    && ["P107.3", "P107.4", "P107.5", "P107.6"].includes(status.previousPhase)
    && ["P107.5", "P107.6", "P107.7", "P108"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P107")?.status)
    && statusById.get("P107.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P107.5")?.status)
    && roadmapById.get("P107.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P107.4 avoids forbidden file scope", !(p1074.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(captureUxText));
addCheck("primary UX avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedCapture));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(captureUxText));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(captureUxText));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P107.4 Command Center approval capture boundary UX.",
        "- Confirms Business Build, Agent Flow, and Live Readiness render display-safe approval capture boundary state while Chat with NEXUS and Lite stay clean.",
        "- Does not enable approval capture, approval persistence, approval writes, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1074-command-center-approval-capture-boundary-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live approval capture boundary appears on non-chat founder routes\"",
        "- cd dashboard && npm run build",
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
      body: "- P107.4 is display-only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P107.4 Command Center Approval Capture Boundary UX Report", phase: "P107.4" },
);

printCheckReport("P107.4 Command Center Approval Capture Boundary UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
