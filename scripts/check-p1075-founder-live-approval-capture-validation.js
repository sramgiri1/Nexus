import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1075-founder-live-approval-capture-validation-report.md";

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
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1071Checker = readText("scripts/check-p1071-founder-live-approval-capture-boundary-contract.js");
const p1074Checker = readText("scripts/check-p1074-command-center-approval-capture-boundary-ux.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const capture = build.founderLiveApprovalCaptureBoundary || {};
const p1075 = subphaseById.get("P107.5") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p107Scripts = [
  "check:p1071-founder-live-approval-capture-boundary-contract",
  "check:p1072-founder-live-approval-capture-model",
  "check:p1073-founder-live-approval-capture-audit-preview",
  "check:p1074-command-center-approval-capture-boundary-ux",
  "check:p1075-founder-live-approval-capture-validation",
];
const p107Reports = [
  "reports/p1071-founder-live-approval-capture-boundary-contract-report.md",
  "reports/p1072-founder-live-approval-capture-model-report.md",
  "reports/p1073-founder-live-approval-capture-audit-preview-report.md",
  "reports/p1074-command-center-approval-capture-boundary-ux-report.md",
];
const serializedCapture = JSON.stringify(capture);
const captureUxText = [
  serializedCapture,
  "Founder Live Approval Capture Boundary",
  "Business Build Approval Capture Boundary",
  "Agent Flow Approval Capture Boundary",
  "Live Readiness Approval Capture Boundary",
  "Capture read-only",
].join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1075-founder-live-approval-capture-validation"]));
addCheck("all P107 scripts registered", p107Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P107 reports exist", p107Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks P107.1-P107.5 complete", ["P107.1", "P107.2", "P107.3", "P107.4", "P107.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P107.6 planned or complete", ["planned", "complete"].includes(subphaseById.get("P107.6")?.status));
addCheck("contract records aggregate validation commands", ["npm run check:p1075-founder-live-approval-capture-validation", "npm run check:p1074-command-center-approval-capture-boundary-ux", "cd dashboard && npm run build", "npm run check:phase-validation-coverage"].every((command) => p1075.validationCommands?.includes(command)));
addCheck("P107.5 avoids forbidden file scope", !(p1075.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("dashboard data and page still expose capture UX", dataSource.includes("founderLiveApprovalCaptureBoundary") && dataSource.includes("buildFounderLiveApprovalCaptureBoundaryDisplayModel") && pageSource.includes("FounderLiveApprovalCaptureBoundaryCard"));
addCheck("route safety coverage retained", routeTests.includes("Founder live approval capture boundary appears on non-chat founder routes") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Capture read-only"));
addCheck("capture UX remains useful", capture.auditPreviewCount === 6 && capture.blockedAuditPreviewCount === 6 && capture.auditRows?.length === 6 && capture.auditRows?.some((row) => row.proposedAgentLane === "Product Strategist"));
addCheck("capture unsafe counts remain zero", capture.capturableDecisionCount === 0 && capture.persistedDecisionCount === 0 && capture.writableDecisionCount === 0 && capture.executableDecisionCount === 0 && capture.dispatchableDecisionCount === 0 && capture.projectMutationDecisionCount === 0 && capture.hostedDbMutationDecisionCount === 0);
addCheck("capture rows remain blocked", capture.auditRows?.every((row) => row.approvalCaptured === "Blocked" && row.approvalPersisted === "Blocked" && row.approvalWriteAllowed === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked" && row.dispatchAllowed === "Blocked"));
addCheck("chat and lite stay clean in source", !pageSource.includes("Chat Approval Capture Boundary") && !pageSource.includes("Lite Approval Capture Boundary"));
addCheck("handoff compatibility retained", p1071Checker.includes("P107.5") && p1074Checker.includes("P107.5"));
addCheck("docs record P107.5", /P107\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P107.5", /P107\.5 is\s+complete/.test(platformRoadmap) && (/P107\.6 is\s+next/.test(platformRoadmap) || /P107\.6 is\s+complete/.test(platformRoadmap)));
addCheck("README records P107.5", /P107\.5 aggregate validation/.test(readme) && (/P107\.6 is next/.test(readme) || /P107\.6 docs closure/.test(readme)));
addCheck(
  "phase status advanced",
  ["P107.5", "P107.6", "P107.7"].includes(status.currentPhase)
    && ["P107.4", "P107.5", "P107.6"].includes(status.previousPhase)
    && ["P107.6", "P107.7", "P108"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P107")?.status)
    && statusById.get("P107.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P107.6")?.status)
    && roadmapById.get("P107.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("aggregate UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(captureUxText));
addCheck("aggregate UX avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedCapture));
addCheck("aggregate UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(captureUxText));
addCheck("aggregate UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(captureUxText));
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P107 founder live approval capture coverage across contract, schema, model, audit preview, Command Center UX, route tests, docs, reports, and phase status.",
        "- Confirms approval capture boundary UX remains display-safe, useful, and non-runnable.",
        "- Does not enable approval capture, approval persistence, approval writes, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1075-founder-live-approval-capture-validation",
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
      body: "- P107.5 is validation only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P107.5 Founder Live Approval Capture Validation Report", phase: "P107.5" },
);

printCheckReport("P107.5 Founder Live Approval Capture Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
