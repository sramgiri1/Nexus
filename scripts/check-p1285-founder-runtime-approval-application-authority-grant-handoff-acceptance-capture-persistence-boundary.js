import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1285-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md";
const CONTRACT_PATH = "contracts/os-roadmap/p128-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-contracts.json";
const PLAN_PATH = "docs/architecture/P128_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_PLAN.md";

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
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1285 = subphaseById.get("P128.5") || {};
const p1286 = subphaseById.get("P128.6") || {};
const plan = readText(PLAN_PATH);
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1284Checker = readText("scripts/check-p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js");
const displayModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
});
const serializedDisplayModel = JSON.stringify(displayModel);
const primaryUxSource = `${pageSource}\n${serializedDisplayModel}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P128.5";
const allowedFiles = new Set(p1285.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "db/",
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
const p1285HandoffAccepted = (status.currentPhase === "P128.5"
  && status.previousPhase === "P128.4"
  && status.nextPhase === "P128.6"
  && roadmap.currentPhase === "P128.5"
  && roadmap.previousPhase === "P128.4"
  && roadmap.nextPhase === "P128.6")
  || (status.currentPhase === "P128.6"
    && status.previousPhase === "P128.5"
    && status.nextPhase === "P128.7"
    && roadmap.currentPhase === "P128.6"
    && roadmap.previousPhase === "P128.5"
    && roadmap.nextPhase === "P128.7")
  || (status.currentPhase === "P128.7"
    && status.previousPhase === "P128.6"
    && status.nextPhase === "P129"
    && roadmap.currentPhase === "P128.7"
    && roadmap.previousPhase === "P128.6"
    && roadmap.nextPhase === "P129");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1285-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary"]));
addCheck("business build exposes browser-safe persistence display model", businessBuildSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryDisplayModel") && businessBuildSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun"));
addCheck("display model shape", displayModel.currentState && displayModel.previewMode && displayModel.readinessRowCount === 3 && displayModel.blockedReadinessRowCount === 3 && Array.isArray(displayModel.readinessRows) && displayModel.readinessRows.length === 3 && Array.isArray(displayModel.summaryRows));
addCheck("display model rows useful", displayModel.readinessRows.every((row) => row.label && row.decisionState && row.nextAction && row.blocker && row.evidenceLocation));
addCheck("display model sections useful", displayModel.readinessSections.every((section) => section.label && section.blockedCount === 3 && section.nextAction));
addCheck(
  "display model safety counts blocked",
  displayModel.persistenceCandidateCount === 0
    && displayModel.persistableCaptureCandidateCount === 0
    && displayModel.persistenceDraftCandidateCount === 0
    && displayModel.persistenceEventCandidateCount === 0
    && displayModel.persistenceEvidenceCandidateCount === 0
    && displayModel.schemaCreatableCandidateCount === 0
    && displayModel.migrationRunnableCandidateCount === 0
    && displayModel.dbWritableCandidateCount === 0
    && displayModel.runtimeWritableCandidateCount === 0
    && displayModel.runtimeExecutableCandidateCount === 0
    && displayModel.executionUnlockCandidateCount === 0
    && displayModel.handoffCandidateCount === 0
    && displayModel.authorityHandoffCandidateCount === 0
    && displayModel.grantCandidateCount === 0
    && displayModel.authorityGrantCandidateCount === 0
    && displayModel.activationCandidateCount === 0
    && displayModel.applicationCandidateCount === 0
    && displayModel.approvalApplicationCandidateCount === 0
    && displayModel.approvalDecisionRecordableCandidateCount === 0
    && displayModel.agentDispatchCandidateCount === 0
    && displayModel.workerExecutionCandidateCount === 0
    && displayModel.toolExecutionCandidateCount === 0
    && displayModel.projectMutationCandidateCount === 0
    && displayModel.hostedDbMutationCandidateCount === 0
    && displayModel.networkCallCandidateCount === 0
    && displayModel.providerSpendCandidateCount === 0,
);
addCheck("Command Center reusable card supports persistence display", pageSource.includes("summaryRows") && pageSource.includes("ariaLabel") && pageSource.includes("rowAriaSuffix"));
addCheck("persistence card rendered on scoped pages only", pageSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance Capture Persistence") && pageSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance Capture Persistence") && !pageSource.includes("Lite Approval Application Authority Grant Handoff Acceptance Capture Persistence") && !pageSource.includes("Chat Approval Application Authority Grant Handoff Acceptance Capture Persistence") && !pageSource.includes("Live Readiness Approval Application Authority Grant Handoff Acceptance Capture Persistence"));
addCheck("persistence card renders founder-useful state", pageSource.includes("Persistence read-only") && serializedDisplayModel.includes("Persistence rows") && serializedDisplayModel.includes("DB-writable candidates") && serializedDisplayModel.includes("Runtime-writable candidates") && primaryUxSource.includes("Approval Application Authority Grant Handoff Acceptance Capture Persistence") && primaryUxSource.includes("Persistence write boundary"));
addCheck("Playwright coverage added", routeTests.includes("Approval application authority grant handoff acceptance capture persistence appears only on scoped pages") && routeTests.includes("Founder approval application authority grant handoff acceptance capture persistence") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/os-roadmap") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Capture persistence safe dry-run report"));
addCheck("contract marks P128.5 complete", p1285.status === "complete" && ["planned", "complete"].includes(p1286.status));
addCheck("contract records expected export", p1285.expectedExports?.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryDisplayModel"));
addCheck("P128.4 checker accepts P128.5 handoff", p1284Checker.includes("p1285StartedState") && p1284Checker.includes('status.nextPhase === "P128.6"'));
addCheck("docs record P128.5", /P128\.5 Command Center Capture Persistence UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P128.5", /P128\.5 is complete/.test(platformRoadmap) && /P128\.6\s+is\s+next/.test(platformRoadmap));
addCheck("README records P128.5", /P128\.5 Command Center capture persistence UX/.test(readme) && /P128\.6\s+is\s+next/.test(readme));
addCheck(
  "phase status advanced",
  p1285HandoffAccepted
    && ["in_progress", "complete"].includes(statusById.get("P128")?.status)
    && statusById.get("P128.4")?.status === "complete"
    && statusById.get("P128.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P128.6")?.status)
    && roadmapById.get("P128.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P128.5 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P128.5 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("P128.5 contract avoids forbidden file scope", !(p1285.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names and record refs", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistence|approval_authority_grant_handoff_acceptance_capture_persistence|acceptanceCapturePersistenceDraftRef|acceptanceCapturePersistenceEventRef|acceptanceCapturePersistenceEvidenceRef|approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceKey|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids unsafe runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX avoids internal phase labels and report paths", !/P128|p128\d|reports\/p128/i.test(primaryUxSource));
addCheck("page avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(pageSource));
addCheck("display model avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedDisplayModel));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("no unsafe imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(pageSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(`${businessBuildSource}\n${pageSource}`));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture persistence is enabled|acceptance capture is persisted|DB writes are enabled|runtime writes are enabled|migration is created|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|authority handoff is enabled|authority activation is enabled|approval application is enabled|approval decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P128.5 Command Center acceptance capture persistence UX.",
        "- Confirms Business Build and Agent Flow render display-safe persistence readiness while Chat, Lite, OS Roadmap, and Live Readiness stay clean.",
        "- Does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: (p1285.validationCommands || []).map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P128.5 renders display-safe acceptance capture persistence preview state only. It does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, run runtime work, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P128.5 Command Center Capture Persistence UX Report", phase: "P128.5" },
);

printCheckReport("P128.5 Command Center Capture Persistence UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
