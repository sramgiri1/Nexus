import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1054-command-center-approval-review-ux-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const packet = viewModel.founderLiveExecutionApprovalReviewPacket || {};
const p1054 = subphaseById.get("P105.4") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedPacket = JSON.stringify(packet);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1054-command-center-approval-review-ux"]));
addCheck("dashboard data exposes approval review packet", dataSource.includes("buildFounderLiveExecutionApprovalReviewPacketDisplayModel") && dataSource.includes("founderLiveExecutionApprovalReviewPacket"));
addCheck("Command Center card exists", pageSource.includes("FounderLiveExecutionApprovalReviewPacketCard") && pageSource.includes("Founder Live Approval Review Packet"));
addCheck("card rendered on non-chat routes", pageSource.includes("Business Build Approval Review") && pageSource.includes("Agent Flow Approval Review") && pageSource.includes("Live Readiness Approval Review"));
addCheck("card not rendered on chat routes", !pageSource.includes("Chat Approval Review") && !pageSource.includes("Lite Approval Review"));
addCheck("display model useful", packet.reviewPacketRows?.length === 6 && packet.reviewPacketRowCount === 6 && packet.blockedReviewPacketCount === 6);
addCheck("approval and execution remain blocked", packet.submittedApprovalCount === 0 && packet.capturedApprovalCount === 0 && packet.approvalUnlockCount === 0 && packet.runtimeAdmissionCount === 0 && packet.executableReviewPacketCount === 0 && packet.dispatchableReviewPacketCount === 0);
addCheck("review packet rows display-safe", packet.reviewPacketRows?.every((row) => row.approvalSubmitted === "Blocked" && row.executionUnlockAllowed === "Blocked" && !("reviewPacketId" in row) && !("sourceApprovalPlanKey" in row)));
addCheck("evidence and validation visible", packet.evidenceLocation === "reports/p1053-founder-live-execution-approval-review-packet-report.md" && packet.reviewPacketRows?.every((row) => row.validationCommand === "npm run check:p1053-founder-live-execution-approval-review-packet"));
addCheck("focused Playwright coverage added", routeTests.includes("Founder live approval review packet appears on non-chat founder routes") && routeTests.includes("Business Build Approval Review") && routeTests.includes("Command Center Lite route stays chat-only"));
addCheck("route-wide safety assertions retained", routeTests.includes("full Command Center routes do not show DemoApp") && routeTests.includes("theme switcher exists globally"));
addCheck("contract marks P105.4 complete", p1054.status === "complete");
addCheck("P105.5 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P105.5")?.status));
addCheck("docs record P105.4", /P105\.4 Command Center Approval Planning UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P105.4", /P105\.4 is\s+complete/.test(platformRoadmap) && /P105\.5 is\s+next/.test(platformRoadmap));
addCheck("README records P105.4", /P105\.4 approval review UX/.test(readme) && (/P105\.5 is next/.test(readme) || /P105\.6 is next/.test(readme) || /P105\.7 is next/.test(readme)));
addCheck(
  "phase status advanced",
  ["P105.4", "P105.5", "P105.6"].includes(status.currentPhase)
    && ["P105.3", "P105.4", "P105.5"].includes(status.previousPhase)
    && ["P105.5", "P105.6", "P105.7"].includes(status.nextPhase)
    && statusById.get("P105")?.status === "in_progress"
    && statusById.get("P105.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P105.5")?.status)
    && roadmapById.get("P105.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P105.4 avoids forbidden file scope", !(p1054.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("primary UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPacket));
addCheck("primary UX avoids raw packet IDs", !/(reviewPacketId|approvalPlanId|reviewPacketKey|sourceApprovalPlanKey)/.test(serializedPacket));
addCheck("primary UX avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + serializedPacket));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPacket));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P105.4 Command Center approval review packet UX.",
        "- Confirms approval review packet appears on Business Build, Agent Flow, and Live Readiness while Chat and Lite remain chat-only.",
        "- Does not enable approval submission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1054-command-center-approval-review-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live approval review packet appears on non-chat founder routes|Command Center Lite route stays chat-only\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P105.4 is display-only UX. It does not submit approvals, capture approvals, write approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P105.4 Command Center Approval Review UX Report", phase: "P105.4" },
);

printCheckReport("P105.4 Command Center Approval Review UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
