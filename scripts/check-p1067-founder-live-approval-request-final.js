import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1067-founder-live-approval-request-final-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const queue = build.founderLiveApprovalRequestQueuePreview || {};
const p1067 = subphaseById.get("P106.7") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p106Scripts = [
  "check:p1061-founder-live-approval-request-boundary-contract",
  "check:p1062-founder-live-approval-request-model",
  "check:p1063-founder-live-approval-request-queue-preview",
  "check:p1064-command-center-approval-request-ux",
  "check:p1065-founder-live-approval-request-validation",
  "check:p1066-founder-live-approval-request-docs",
  "check:p1067-founder-live-approval-request-final",
];
const p106Reports = [
  "reports/p1061-founder-live-approval-request-boundary-contract-report.md",
  "reports/p1062-founder-live-approval-request-model-report.md",
  "reports/p1063-founder-live-approval-request-queue-preview-report.md",
  "reports/p1064-command-center-approval-request-ux-report.md",
  "reports/p1065-founder-live-approval-request-validation-report.md",
  "reports/p1066-founder-live-approval-request-docs-report.md",
];
const serializedQueue = JSON.stringify(queue);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1067-founder-live-approval-request-final"]));
addCheck("all P106 scripts registered", p106Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P106 reports exist", p106Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P106 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract records final validation commands", ["npm run check:p1067-founder-live-approval-request-final", "cd dashboard && npm run build", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1067.validationCommands?.includes(command)));
addCheck("P106.7 avoids forbidden file scope", !(p1067.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P107 handoff exists and is planned", statusById.get("P107")?.status === "planned" && roadmapById.get("P107")?.status === "planned" && osStatusChecker.includes('"P107"'));
addCheck("docs record P106.7", /P106\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P106 complete", /P106\.7 is\s+complete/.test(platformRoadmap) && /P106 is\s+complete/.test(platformRoadmap) && /P107 is\s+next/.test(platformRoadmap));
addCheck("README records P106 complete", /P106\.7 final validation/.test(readme) && /P106 is complete/.test(readme) && /P107 is next/.test(readme));
addCheck("Command Center queue UX retained", queue.queuedRequestCount === 6 && queue.blockedQueuedRequestCount === 6 && queue.queueRows?.length === 6 && pageSource.includes("FounderLiveApprovalRequestQueuePreviewCard"));
addCheck("route safety coverage retained", routeTests.includes("Founder live approval request queue appears on non-chat founder routes") && routeTests.includes("/command-center/lite"));
addCheck(
  "phase status closed",
  status.currentPhase === "P106.7"
    && status.previousPhase === "P106.6"
    && status.nextPhase === "P107"
    && statusById.get("P106")?.status === "complete"
    && statusById.get("P106.7")?.status === "complete"
    && roadmapById.get("P106")?.status === "complete"
    && roadmapById.get("P106.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P106")?.status}`,
);
addCheck("phase commits recorded", [statusById.get("P106")?.commit, statusById.get("P106.7")?.commit, roadmapById.get("P106")?.commit, roadmapById.get("P106.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P106")?.commandCenterVisible === true && statusById.get("P106.7")?.commandCenterVisible === true);
addCheck("final UX avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedQueue));
addCheck("final UX avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey)/.test(serializedQueue));
addCheck("final UX avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedQueue + pageSource));
addCheck("final UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedQueue));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P106 founder live approval request closure.",
        "- Confirms parent P106 and all subphases are complete, reports and scripts exist, Command Center route safety is retained, and P107 is the next handoff.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, approval request submission/capture/persistence/writes, runtime admission, execution unlock, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1067-founder-live-approval-request-final",
        "- npm run check:p1066-founder-live-approval-request-docs",
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
      body: "- P106.7 closes P106 validation only. It does not submit approval requests, capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P106.7 Founder Live Approval Request Final Report", phase: "P106.7" },
);

printCheckReport("P106.7 Founder Live Approval Request Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
