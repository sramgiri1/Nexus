import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1057-founder-live-execution-approval-final-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const viewModel = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const packet = viewModel.founderLiveExecutionApprovalReviewPacket || {};
const p105 = statusById.get("P105") || {};
const p1057 = subphaseById.get("P105.7") || {};
const acceptedPhaseClosures = [
  { currentPhase: "P105.7", previousPhase: "P105.6", nextPhase: "P106" },
  { currentPhase: "P106.1", previousPhase: "P105.7", nextPhase: "P106.2" },
];
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p105Scripts = [
  "check:p1051-founder-live-execution-approval-planning-contract",
  "check:p1052-founder-live-execution-approval-plan-model",
  "check:p1053-founder-live-execution-approval-review-packet",
  "check:p1054-command-center-approval-review-ux",
  "check:p1055-founder-live-execution-approval-aggregate",
  "check:p1056-founder-live-execution-approval-docs",
  "check:p1057-founder-live-execution-approval-final",
];
const p105Reports = [
  "reports/p1051-founder-live-execution-approval-planning-contract-report.md",
  "reports/p1052-founder-live-execution-approval-plan-model-report.md",
  "reports/p1053-founder-live-execution-approval-review-packet-report.md",
  "reports/p1054-command-center-approval-review-ux-report.md",
  "reports/p1055-founder-live-execution-approval-aggregate-report.md",
  "reports/p1056-founder-live-execution-approval-docs-report.md",
];
const serializedPacket = JSON.stringify(packet);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1057-founder-live-execution-approval-final"]));
addCheck("all P105 scripts registered", p105Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P105 reports exist", p105Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P105 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract records final validation commands", (p1057.validationCommands || []).includes("npm run check:p1057-founder-live-execution-approval-final") && (p1057.validationCommands || []).includes("npm run check:phase-validation-coverage"));
addCheck("contract avoids forbidden file scope", !(p1057.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("plan records final validation complete", /P105\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P105 complete", /P105\.7 is\s+complete/.test(platformRoadmap) && /P105 is\s+complete/.test(platformRoadmap) && /P106 is\s+next/.test(platformRoadmap));
addCheck("README records P105 complete", /P105\.7 final validation/.test(readme) && /P105 is complete/.test(readme) && /P106 is next/.test(readme));
addCheck("Command Center UX remains scoped", pageSource.includes("Business Build Approval Review") && pageSource.includes("Agent Flow Approval Review") && pageSource.includes("Live Readiness Approval Review") && !pageSource.includes("Chat Approval Review") && !pageSource.includes("Lite Approval Review"));
addCheck("route safety coverage retained", routeTests.includes("Founder live approval review packet appears on non-chat founder routes") && routeTests.includes("Command Center Lite route stays chat-only"));
addCheck("approval review packet remains useful and blocked", packet.reviewPacketRows?.length === 6 && packet.blockedReviewPacketCount === 6 && packet.executableReviewPacketCount === 0 && packet.dispatchableReviewPacketCount === 0);
addCheck("approval review rows remain display safe", packet.reviewPacketRows?.every((row) => row.approvalSubmitted === "Blocked" && row.executionUnlockAllowed === "Blocked" && !("reviewPacketId" in row) && !("sourceApprovalPlanKey" in row)));
addCheck(
  "phase status closed or handed off",
  acceptedPhaseClosures.some((closure) =>
    status.currentPhase === closure.currentPhase
      && status.previousPhase === closure.previousPhase
      && status.nextPhase === closure.nextPhase
  )
    && p105.status === "complete"
    && statusById.get("P105.7")?.status === "complete"
    && roadmapById.get("P105")?.status === "complete"
    && roadmapById.get("P105.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${p105.status}`,
);
addCheck("phase commits recorded", [statusById.get("P105")?.commit, statusById.get("P105.7")?.commit, roadmapById.get("P105")?.commit, roadmapById.get("P105.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P105")?.commandCenterVisible === true && statusById.get("P105.7")?.commandCenterVisible === true);
addCheck("final UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPacket));
addCheck("final UX avoids raw packet IDs", !/(reviewPacketId|approvalPlanId|reviewPacketKey|sourceApprovalPlanKey)/.test(serializedPacket));
addCheck("final UX avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(pageSource + serializedPacket));
addCheck("final UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPacket));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P105 founder live execution approval-planning closure.",
        "- Confirms parent P105 and all subphases are complete, reports and scripts exist, Command Center route safety is retained, and P106 is the next handoff.",
        "- Does not enable approval submission, approval capture, approval persistence, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1057-founder-live-execution-approval-final",
        "- npm run check:p1056-founder-live-execution-approval-docs",
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
      body: "- P105.7 closes P105 validation only. It does not submit approvals, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P105.7 Founder Live Execution Approval Final Report", phase: "P105.7" },
);

printCheckReport("P105.7 Founder Live Execution Approval Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
