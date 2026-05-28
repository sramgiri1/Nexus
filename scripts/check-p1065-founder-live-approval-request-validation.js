import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1065-founder-live-approval-request-validation-report.md";

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
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const queue = build.founderLiveApprovalRequestQueuePreview || {};
const p1065 = subphaseById.get("P106.5") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p106Scripts = [
  "check:p1061-founder-live-approval-request-boundary-contract",
  "check:p1062-founder-live-approval-request-model",
  "check:p1063-founder-live-approval-request-queue-preview",
  "check:p1064-command-center-approval-request-ux",
  "check:p1065-founder-live-approval-request-validation",
];
const p106Reports = [
  "reports/p1061-founder-live-approval-request-boundary-contract-report.md",
  "reports/p1062-founder-live-approval-request-model-report.md",
  "reports/p1063-founder-live-approval-request-queue-preview-report.md",
  "reports/p1064-command-center-approval-request-ux-report.md",
];
const serializedQueue = JSON.stringify(queue);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1065-founder-live-approval-request-validation"]));
addCheck("all P106 scripts registered", p106Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P106 reports exist", p106Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks P106.1-P106.5 complete", ["P106.1", "P106.2", "P106.3", "P106.4", "P106.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P106.6 planned", subphaseById.get("P106.6")?.status === "planned");
addCheck("contract records aggregate validation commands", ["npm run check:p1065-founder-live-approval-request-validation", "cd dashboard && npm run build", "npm run check:phase-validation-coverage"].every((command) => p1065.validationCommands?.includes(command)));
addCheck("P106.5 avoids forbidden file scope", !(p1065.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("dashboard data and page still expose queue UX", dataSource.includes("founderLiveApprovalRequestQueuePreview") && pageSource.includes("FounderLiveApprovalRequestQueuePreviewCard"));
addCheck("route safety coverage retained", routeTests.includes("Founder live approval request queue appears on non-chat founder routes") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck("queue UX remains useful", queue.queuedRequestCount === 6 && queue.blockedQueuedRequestCount === 6 && queue.queueRows?.length === 6 && queue.queueRows?.some((row) => row.proposedAgentLane === "Product Strategist"));
addCheck("queue unsafe counts remain zero", queue.submittableQueuedRequestCount === 0 && queue.capturableQueuedRequestCount === 0 && queue.persistedQueuedRequestCount === 0 && queue.writableQueuedRequestCount === 0 && queue.executableQueuedRequestCount === 0 && queue.dispatchableQueuedRequestCount === 0);
addCheck("queue rows remain blocked", queue.queueRows?.every((row) => row.approvalRequestSubmitted === "Blocked" && row.approvalCaptured === "Blocked" && row.approvalPersisted === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked"));
addCheck("chat and lite stay clean in source", !pageSource.includes("Chat Approval Request Queue") && !pageSource.includes("Lite Approval Request Queue"));
addCheck("docs record P106.5", /P106\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P106.5", /P106\.5 is\s+complete/.test(platformRoadmap) && /P106\.6 is\s+next/.test(platformRoadmap));
addCheck("README records P106.5", /P106\.5 aggregate validation/.test(readme) && /P106\.6 is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  ["P106.5", "P106.6", "P106.7"].includes(status.currentPhase)
    && ["P106.4", "P106.5", "P106.6"].includes(status.previousPhase)
    && ["P106.6", "P106.7", "P107"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P106")?.status)
    && statusById.get("P106.5")?.status === "complete"
    && statusById.get("P106.6")?.status === "planned"
    && roadmapById.get("P106.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("aggregate UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedQueue));
addCheck("aggregate UX avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey)/.test(serializedQueue));
addCheck("aggregate UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedQueue));
addCheck("aggregate UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedQueue));
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P106 founder live approval request coverage across contract, schema, model, queue preview, Command Center UX, route tests, docs, reports, and phase status.",
        "- Confirms approval request queue UX remains display-safe, useful, and non-runnable.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval request submission/capture/persistence/writes, runtime admission, execution unlock, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1065-founder-live-approval-request-validation",
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
      body: "- P106.5 is validation only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P106.5 Founder Live Approval Request Validation Report", phase: "P106.5" },
);

printCheckReport("P106.5 Founder Live Approval Request Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
