import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1055-founder-live-execution-approval-aggregate-report.md";

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
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P105_FOUNDER_LIVE_EXECUTION_APPROVAL_PLANNING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const packet = viewModel.founderLiveExecutionApprovalReviewPacket || {};
const p1055 = subphaseById.get("P105.5") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p105Reports = [
  "reports/p1051-founder-live-execution-approval-planning-contract-report.md",
  "reports/p1052-founder-live-execution-approval-plan-model-report.md",
  "reports/p1053-founder-live-execution-approval-review-packet-report.md",
  "reports/p1054-command-center-approval-review-ux-report.md",
];
const priorScripts = [
  "check:p1051-founder-live-execution-approval-planning-contract",
  "check:p1052-founder-live-execution-approval-plan-model",
  "check:p1053-founder-live-execution-approval-review-packet",
  "check:p1054-command-center-approval-review-ux",
];
const serializedPacket = JSON.stringify(packet);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1055-founder-live-execution-approval-aggregate"]));
addCheck("all prior P105 check scripts registered", priorScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("prior P105 reports exist", p105Reports.every((report) => readText(report).includes("Result")));
addCheck("retained Playwright coverage exists", routeTests.includes("Founder live approval review packet appears on non-chat founder routes") && routeTests.includes("Command Center Lite route stays chat-only"));
addCheck("Command Center approval review stays off chat routes", pageSource.includes("Business Build Approval Review") && pageSource.includes("Agent Flow Approval Review") && pageSource.includes("Live Readiness Approval Review") && !pageSource.includes("Chat Approval Review") && !pageSource.includes("Lite Approval Review"));
addCheck("dashboard display model remains browser safe", dataSource.includes("buildFounderLiveExecutionApprovalReviewPacketDisplayModel") && dataSource.includes("founderLiveExecutionApprovalReviewPacket") && !dataSource.includes("founderLiveExecutionApprovalReviewPacket.js"));
addCheck("display packet remains useful", packet.reviewPacketRows?.length === 6 && packet.blockedReviewPacketCount === 6 && packet.reviewPacketRows.some((row) => row.proposedAgentLane === "Safety Governor"));
addCheck("approval and execution counts remain zero", packet.submittedApprovalCount === 0 && packet.capturedApprovalCount === 0 && packet.approvalUnlockCount === 0 && packet.runtimeAdmissionCount === 0 && packet.executableReviewPacketCount === 0 && packet.dispatchableReviewPacketCount === 0);
addCheck("review packet rows are display safe", packet.reviewPacketRows?.every((row) => row.approvalSubmitted === "Blocked" && row.executionUnlockAllowed === "Blocked" && !("reviewPacketId" in row) && !("approvalPlanId" in row) && !("sourceApprovalPlanKey" in row)));
addCheck("contract marks P105.5 complete", p1055.status === "complete");
addCheck("P105.6 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P105.6")?.status));
addCheck("docs record P105.5", /P105\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P105.5", /P105\.5 is\s+complete/.test(platformRoadmap) && (/P105\.6 is\s+next/.test(platformRoadmap) || /P105\.7 is\s+next/.test(platformRoadmap)));
addCheck("README records P105.5", /P105\.5 aggregate validation/.test(readme) && (/P105\.6 is next/.test(readme) || /P105\.7 is next/.test(readme)));
addCheck(
  "phase status advanced",
  ["P105.5", "P105.6", "P105.7"].includes(status.currentPhase)
    && ["P105.4", "P105.5", "P105.6"].includes(status.previousPhase)
    && ["P105.6", "P105.7", "P106"].includes(status.nextPhase)
    && ["in_progress", "complete"].includes(statusById.get("P105")?.status)
    && statusById.get("P105.5")?.status === "complete"
    && roadmapById.get("P105.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P105.5 avoids forbidden file scope", !(p1055.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("aggregate UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPacket));
addCheck("aggregate UX avoids raw packet IDs", !/(reviewPacketId|approvalPlanId|reviewPacketKey|sourceApprovalPlanKey)/.test(serializedPacket));
addCheck("aggregate UX avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + serializedPacket));
addCheck("aggregate UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPacket));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P105 founder live execution approval-planning behavior across P105.1-P105.5.",
        "- Confirms non-chat founder routes keep the display-safe approval review packet while Chat and Lite remain chat-only.",
        "- Does not enable approval submission, approval capture, approval persistence, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1055-founder-live-execution-approval-aggregate",
        "- npm run check:p1054-command-center-approval-review-ux",
        "- npm run check:p1053-founder-live-execution-approval-review-packet",
        "- npm run check:p1052-founder-live-execution-approval-plan-model",
        "- npm run check:p1051-founder-live-execution-approval-planning-contract",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live approval review packet appears on non-chat founder routes|Command Center Lite route stays chat-only\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P105.5 is aggregate validation only. It does not submit approvals, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P105.5 Founder Live Execution Approval Aggregate Report", phase: "P105.5" },
);

printCheckReport("P105.5 Founder Live Execution Approval Aggregate Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
