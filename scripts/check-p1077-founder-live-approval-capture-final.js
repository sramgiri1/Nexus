import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1077-founder-live-approval-capture-final-report.md";

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
const routeTests = readText("dashboard/tests/routes.spec.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const capture = build.founderLiveApprovalCaptureBoundary || {};
const p1077 = subphaseById.get("P107.7") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p107Scripts = [
  "check:p1071-founder-live-approval-capture-boundary-contract",
  "check:p1072-founder-live-approval-capture-model",
  "check:p1073-founder-live-approval-capture-audit-preview",
  "check:p1074-command-center-approval-capture-boundary-ux",
  "check:p1075-founder-live-approval-capture-validation",
  "check:p1076-founder-live-approval-capture-docs",
  "check:p1077-founder-live-approval-capture-final",
];
const p107Reports = [
  "reports/p1071-founder-live-approval-capture-boundary-contract-report.md",
  "reports/p1072-founder-live-approval-capture-model-report.md",
  "reports/p1073-founder-live-approval-capture-audit-preview-report.md",
  "reports/p1074-command-center-approval-capture-boundary-ux-report.md",
  "reports/p1075-founder-live-approval-capture-validation-report.md",
  "reports/p1076-founder-live-approval-capture-docs-report.md",
];
const serializedCapture = JSON.stringify(capture);
const docsBundle = [contract, plan, platformRoadmap, readme].map((entry) => JSON.stringify(entry)).join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1077-founder-live-approval-capture-final"]));
addCheck("all P107 scripts registered", p107Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P107 reports exist", p107Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P107 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract records final validation commands", ["npm run check:p1077-founder-live-approval-capture-final", "cd dashboard && npm run build", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1077.validationCommands?.includes(command)));
addCheck("P107.7 avoids forbidden file scope", !(p1077.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P108 handoff exists", ["planned", "in_progress", "complete"].includes(statusById.get("P108")?.status) && ["planned", "in_progress", "complete"].includes(roadmapById.get("P108")?.status) && osStatusChecker.includes('"P108"') && osStatusChecker.includes('"P108.1"'));
addCheck("docs record P107.7", /P107\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P107 complete", /P107\.7 is\s+complete/.test(platformRoadmap) && /P107 is\s+complete/.test(platformRoadmap) && /P108 is\s+next/.test(platformRoadmap));
addCheck("README records P107 complete", /P107\.7 final validation/.test(readme) && /P107 is complete/.test(readme) && /P108 is next/.test(readme));
addCheck("Command Center capture UX retained", capture.auditPreviewCount === 6 && capture.blockedAuditPreviewCount === 6 && capture.auditRows?.length === 6 && pageSource.includes("FounderLiveApprovalCaptureBoundaryCard"));
addCheck("route safety coverage retained", routeTests.includes("Founder live approval capture boundary appears on non-chat founder routes") && routeTests.includes("/command-center/lite"));
addCheck(
  "phase status closed",
  ((status.currentPhase === "P107.7"
    && status.previousPhase === "P107.6"
    && status.nextPhase === "P108")
    || (status.currentPhase === "P108.1"
      && status.previousPhase === "P107.7"
      && status.nextPhase === "P108.2"))
    && statusById.get("P107")?.status === "complete"
    && statusById.get("P107.7")?.status === "complete"
    && roadmapById.get("P107")?.status === "complete"
    && roadmapById.get("P107.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P107")?.status}`,
);
addCheck("phase commits recorded", [statusById.get("P107")?.commit, statusById.get("P107.7")?.commit, roadmapById.get("P107")?.commit, roadmapById.get("P107.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P107")?.commandCenterVisible === true && statusById.get("P107.7")?.commandCenterVisible === true);
addCheck("approval capture authority remains blocked", capture.capturableDecisionCount === 0 && capture.persistedDecisionCount === 0 && capture.writableDecisionCount === 0 && capture.executableDecisionCount === 0);
addCheck("final UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedCapture));
addCheck("final UX avoids raw packet keys", !/(reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedCapture));
addCheck("final UX avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now/i.test(serializedCapture + pageSource + docsBundle));
addCheck("final UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedCapture));
addCheck("docs do not claim execution live", !/execution is live|approval capture is live|runtime admission is enabled|provider spend is enabled/i.test(docsBundle));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P107 founder live approval capture boundary closure.",
        "- Confirms parent P107 and all subphases are complete, reports and scripts exist, Command Center route safety is retained, and P108 is the next planned handoff.",
        "- Does not enable approval capture, approval persistence, approval writes, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1077-founder-live-approval-capture-final",
        "- npm run check:p1076-founder-live-approval-capture-docs",
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
      body: "- P107.7 closes P107 validation only. It does not capture approvals, persist approval state, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P107.7 Founder Live Approval Capture Final Report", phase: "P107.7" },
);

printCheckReport("P107.7 Founder Live Approval Capture Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
