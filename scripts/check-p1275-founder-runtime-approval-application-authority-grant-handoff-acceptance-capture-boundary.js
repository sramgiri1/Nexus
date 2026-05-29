import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedFiles() {
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[AMDRCU?! ]{1,2}\s+/, ""))
    .map((line) => (line.includes(" -> ") ? line.split(" -> ").pop() : line));
}

function hasUnsafePositiveClaim(text, pattern) {
  const lines = text.split("\n");
  return lines.some((line, index) => {
    const context = `${lines[index - 2] || ""} ${lines[index - 1] || ""} ${line}`;
    return pattern.test(line)
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|preview-only|display-only|read-only|future|local-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p127-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1275 = subphaseById.get("P127.5") || {};
const p1276 = subphaseById.get("P127.6") || {};
const plan = readText("docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const displayModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P127.5";
const allowedFiles = new Set(p1275.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
  "live-ready/",
  "local-state/runtime/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
  ".env",
];
const p1275HandoffAccepted = (status.currentPhase === "P127.5"
  && status.previousPhase === "P127.4"
  && status.nextPhase === "P127.6"
  && roadmap.currentPhase === "P127.5"
  && roadmap.previousPhase === "P127.4"
  && roadmap.nextPhase === "P127.6")
  || (status.currentPhase === "P127.6"
    && status.previousPhase === "P127.5"
    && status.nextPhase === "P127.7"
    && roadmap.currentPhase === "P127.6"
    && roadmap.previousPhase === "P127.5"
    && roadmap.nextPhase === "P127.7")
  || (status.currentPhase === "P127.7"
    && status.previousPhase === "P127.6"
    && roadmap.currentPhase === "P127.7"
    && roadmap.previousPhase === "P127.6");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary"]));
addCheck("business build exposes browser-safe acceptance capture display model", businessBuildSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel") && businessBuildSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && Array.isArray(displayModel.readinessRows) && displayModel.readinessRows.length === 4 && Array.isArray(displayModel.summaryRows));
addCheck("display model rows useful", displayModel.readinessRows.every((row) => row.label && row.decisionState && row.nextAction && row.blocker && row.evidenceLocation));
addCheck("display model sections useful", displayModel.readinessSections.every((section) => section.label && section.blockedCount === 4 && section.nextAction));
addCheck(
  "display model safety counts blocked",
  displayModel.acceptanceCandidateCount === 0
    && displayModel.acceptanceCaptureCandidateCount === 0
    && displayModel.acceptanceRecordCandidateCount === 0
    && displayModel.handoffCandidateCount === 0
    && displayModel.authorityHandoffCandidateCount === 0
    && displayModel.grantCandidateCount === 0
    && displayModel.authorityGrantCandidateCount === 0
    && displayModel.activationCandidateCount === 0
    && displayModel.applicationCandidateCount === 0
    && displayModel.approvalApplicationCandidateCount === 0
    && displayModel.decisionRecordableCandidateCount === 0
    && displayModel.approvalDecisionRecordableCandidateCount === 0
    && displayModel.dbWritableCandidateCount === 0
    && displayModel.runtimeWritableCandidateCount === 0
    && displayModel.runtimeExecutableCandidateCount === 0
    && displayModel.executionUnlockCandidateCount === 0
    && displayModel.agentDispatchCandidateCount === 0
    && displayModel.workerExecutionCandidateCount === 0
    && displayModel.toolExecutionCandidateCount === 0
    && displayModel.projectMutationCandidateCount === 0
    && displayModel.hostedDbMutationCandidateCount === 0
    && displayModel.networkCallCandidateCount === 0
    && displayModel.providerSpendCandidateCount === 0,
);
addCheck("Command Center reusable card supports acceptance capture display", pageSource.includes("summaryRows") && pageSource.includes("ariaLabel") && pageSource.includes("rowAriaSuffix"));
addCheck("acceptance capture card rendered on scoped pages only", pageSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance Capture") && pageSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance Capture") && !pageSource.includes("Lite Approval Application Authority Grant Handoff Acceptance Capture") && !pageSource.includes("Chat Approval Application Authority Grant Handoff Acceptance Capture") && !pageSource.includes("Live Readiness Approval Application Authority Grant Handoff Acceptance Capture"));
addCheck("acceptance capture card renders founder-useful state", pageSource.includes("Capture read-only") && serializedDisplayModel.includes("Acceptance-record candidates") && serializedDisplayModel.includes("DB-writable candidates") && serializedDisplayModel.includes("Runtime-writable candidates") && primaryUxSource.includes("Approval Application Authority Grant Handoff Acceptance Capture") && primaryUxSource.includes("Execution unlock"));
addCheck("Playwright coverage added", routeTests.includes("Approval application authority grant handoff acceptance capture appears only on scoped pages") && routeTests.includes("Founder approval application authority grant handoff acceptance capture") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Acceptance capture safe dry-run report"));
addCheck("contract marks P127.5 complete", p1275.status === "complete" && ["planned", "complete"].includes(p1276.status));
addCheck("contract records expected export", p1275.expectedExports?.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel"));
addCheck("docs record P127.5", /P127\.5 Command Center Acceptance Capture UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P127.5", /P127\.5 is complete/.test(platformRoadmap) && /P127\.6\s+is\s+next/.test(platformRoadmap));
addCheck("README records P127.5", /P127\.5 Command Center acceptance capture UX/.test(readme) && /P127\.6\s+is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  p1275HandoffAccepted
    && ["in_progress", "complete"].includes(statusById.get("P127")?.status)
    && statusById.get("P127.4")?.status === "complete"
    && statusById.get("P127.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P127.6")?.status)
    && roadmapById.get("P127.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P127.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P127.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P127.5 contract avoids forbidden file scope", !(p1275.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names and record refs", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapture|approval_authority_grant_handoff_acceptance_capture|acceptanceCaptureDraftRef|acceptanceCaptureEventRef|acceptanceCaptureEvidenceRef|approvalApplicationAuthorityGrantHandoffAcceptanceCaptureKey|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P127|p127\d|reports\/p127/i.test(primaryUxSource));
addCheck("page avoids fake runnable actions", !/capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(pageSource));
addCheck("display model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture is enabled|handoff acceptance is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P127.5 Command Center acceptance capture UX.",
        "- Confirms Business Build and Agent Flow render display-safe acceptance capture readiness while Chat, Lite, OS Roadmap, and Live Readiness stay clean.",
        "- Does not capture acceptance, record acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1275.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P127.5 renders display-safe acceptance capture preview state only. It does not capture acceptance, record acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, persist decisions, write DB/runtime records, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P127.5 Command Center Acceptance Capture UX Report", phase: "P127.5" },
);

printCheckReport("P127.5 Command Center Acceptance Capture UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
