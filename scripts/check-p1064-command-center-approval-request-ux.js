import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1064-command-center-approval-request-ux-report.md";

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
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const queue = build.founderLiveApprovalRequestQueuePreview || {};
const p1064 = subphaseById.get("P106.4") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedQueue = JSON.stringify(queue);
const queueUxText = [
  serializedQueue,
  "Founder Live Approval Request Queue",
  "Business Build Approval Request Queue",
  "Agent Flow Approval Request Queue",
  "Live Readiness Approval Request Queue",
  "Queue read-only",
].join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1064-command-center-approval-request-ux"]));
addCheck("dashboard data exposes queue preview", dataSource.includes("buildFounderLiveApprovalRequestQueuePreviewDisplayModel") && dataSource.includes("founderLiveApprovalRequestQueuePreview"));
addCheck("page renders queue card only on non-chat founder routes", pageSource.includes("FounderLiveApprovalRequestQueuePreviewCard") && pageSource.includes("Business Build Approval Request Queue") && pageSource.includes("Agent Flow Approval Request Queue") && pageSource.includes("Live Readiness Approval Request Queue") && !pageSource.includes("Chat Approval Request Queue") && !pageSource.includes("Lite Approval Request Queue"));
addCheck("route test covers queue preview", routeTests.includes("Founder live approval request queue appears on non-chat founder routes") && routeTests.includes("Founder live approval request queue preview") && routeTests.includes("Queue read-only"));
addCheck("queue display model useful", queue.currentState?.includes("Queue Ready") && queue.queuedRequestCount === 6 && queue.blockedQueuedRequestCount === 6 && queue.queueRows?.length === 6);
addCheck("queue zeroes unsafe counts", queue.submittableQueuedRequestCount === 0 && queue.capturableQueuedRequestCount === 0 && queue.persistedQueuedRequestCount === 0 && queue.writableQueuedRequestCount === 0 && queue.executableQueuedRequestCount === 0);
addCheck("queue rows display safe and blocked", queue.queueRows?.every((row) => row.approvalRequestSubmitted === "Blocked" && row.approvalCaptured === "Blocked" && row.approvalPersisted === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked" && !("approvalRequestKey" in row) && !("reviewPacketId" in row) && !("sourceApprovalPlanKey" in row)));
addCheck("queue rows include operator value", queue.queueRows?.every((row) => row.proposedAgentLane && row.founderDecisionPrompt && row.operatorDecisionPrompt && row.validationCommand === "npm run check:p1063-founder-live-approval-request-queue-preview"));
addCheck("safety rows retained", queue.safetyRows?.some((row) => row.label === "Approval writes" && row.value === "Blocked") && queue.safetyRows?.some((row) => row.label === "Provider spend" && row.value === "Blocked"));
addCheck("contract marks P106.4 complete", p1064.status === "complete");
addCheck("P106.5 remains planned", subphaseById.get("P106.5")?.status === "planned");
addCheck("docs record P106.4", /P106\.4 Command Center Approval Request UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P106.4", /P106\.4 is\s+complete/.test(platformRoadmap) && /P106\.5 is\s+next/.test(platformRoadmap));
addCheck("README records P106.4", /P106\.4 Command Center approval request UX/.test(readme) && /P106\.5 is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  ["P106.4", "P106.5", "P106.6", "P106.7"].includes(status.currentPhase)
    && ["P106.3", "P106.4", "P106.5", "P106.6"].includes(status.previousPhase)
    && ["P106.5", "P106.6", "P106.7", "P107"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P106")?.status)
    && statusById.get("P106.4")?.status === "complete"
    && statusById.get("P106.5")?.status === "planned"
    && roadmapById.get("P106.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P106.4 avoids forbidden file scope", !(p1064.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(queueUxText));
addCheck("primary UX avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey)/.test(serializedQueue));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(queueUxText));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(queueUxText));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P106.4 Command Center approval request UX.",
        "- Confirms Business Build, Agent Flow, and Live Readiness render display-safe approval request queue preview state while Chat with NEXUS and Lite stay clean.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval writes, runtime admission, approval request submission/capture/persistence, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1064-command-center-approval-request-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live approval request queue appears on non-chat founder routes\"",
        "- cd dashboard && npm run build",
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
      body: "- P106.4 is display-only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P106.4 Command Center Approval Request UX Report", phase: "P106.4" },
);

printCheckReport("P106.4 Command Center Approval Request UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
