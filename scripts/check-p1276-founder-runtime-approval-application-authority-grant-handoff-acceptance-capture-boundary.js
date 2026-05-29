import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata.js";
import {
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel.js";
import {
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun.js";
import { buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1276-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|preview-only|display-only|read-only|metadata-only|model-only|validation)\b/i.test(context);
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
const p1276 = subphaseById.get("P127.6") || {};
const p1277 = subphaseById.get("P127.7") || {};
const plan = readText("docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md");
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const routeTests = readText("dashboard/tests/routes.spec.js");
const businessBuildSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const metadata = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata();
const intentModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel({
  intentState: "ready_for_safe_acceptance_capture_dry_run",
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  nextAction: "Review acceptance capture readiness on scoped founder work pages while capture remains blocked.",
});
const preview = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun({ intentModel });
const displayModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel({
  founderIdeaSummary: "Build a simple iOS Snake game for the App Store",
  acceptanceCapturePreview: preview,
});
const metadataValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryMetadata(metadata);
const intentValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel(intentModel);
const previewValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun(preview);
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P127.6";
const allowedFiles = new Set(p1276.allowedFiles || []);
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "generated-projects/",
  "dashboard/src/",
  "dashboard/tests/",
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
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const serializedDisplayModel = JSON.stringify(displayModel);
const previousReportPaths = [
  "reports/p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md",
  "reports/p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md",
  "reports/p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md",
  "reports/p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md",
  "reports/p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md",
];
const packageScripts = [
  "check:p1271-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "check:p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "check:p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "check:p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "check:p1275-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
  "check:p1276-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary",
];
const completedSubphases = ["P127.1", "P127.2", "P127.3", "P127.4", "P127.5", "P127.6"];
const zeroDisplayCounts = [
  "acceptanceCandidateCount",
  "acceptanceCaptureCandidateCount",
  "acceptanceRecordCandidateCount",
  "handoffCandidateCount",
  "authorityHandoffCandidateCount",
  "grantCandidateCount",
  "authorityGrantCandidateCount",
  "activationCandidateCount",
  "applicationCandidateCount",
  "approvalApplicationCandidateCount",
  "decisionRecordableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "agentDispatchCandidateCount",
  "workerExecutionCandidateCount",
  "toolExecutionCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "networkCallCandidateCount",
  "providerSpendCandidateCount",
].every((field) => displayModel[field] === 0);
const p1276CurrentState =
  status.currentPhase === "P127.6"
    && status.previousPhase === "P127.5"
    && status.nextPhase === "P127.7"
    && roadmap.currentPhase === "P127.6"
    && roadmap.previousPhase === "P127.5"
    && roadmap.nextPhase === "P127.7"
    && statusById.get("P127")?.status === "in_progress"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && ["planned", "complete"].includes(statusById.get("P127.7")?.status);
const p1277FinalState =
  status.currentPhase === "P127.7"
    && status.previousPhase === "P127.6"
    && status.nextPhase === "P128"
    && roadmap.currentPhase === "P127.7"
    && roadmap.previousPhase === "P127.6"
    && roadmap.nextPhase === "P128"
    && statusById.get("P127")?.status === "complete"
    && roadmapById.get("P127")?.status === "complete"
    && completedSubphases.every((phaseId) => statusById.get(phaseId)?.status === "complete" && roadmapById.get(phaseId)?.status === "complete")
    && statusById.get("P127.7")?.status === "complete"
    && roadmapById.get("P127.7")?.status === "complete";

addCheck("package scripts registered", packageScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P127.1-P127.6 contract statuses complete", completedSubphases.every((phaseId) => subphaseById.get(phaseId)?.status === "complete") && ["planned", "complete"].includes(p1277.status));
addCheck("P127.6 contract records validation commands", p1276.validationCommands?.includes("npm run check:p1276-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary") && p1276.validationCommands?.includes("git diff --check"));
addCheck("previous reports exist", previousReportPaths.every((reportPath) => existsSync(join(ROOT, reportPath))));
addCheck("metadata, intent, and preview validate", metadataValidation.valid && intentValidation.valid && previewValidation.valid, `${metadataValidation.errors.join("; ")} ${intentValidation.errors.join("; ")} ${previewValidation.errors.join("; ")}`.trim());
addCheck("display model remains blocked and useful", displayModel.readinessRowCount === 4 && displayModel.blockedReadinessRowCount === 4 && zeroDisplayCounts && displayModel.ownerCapability === "NEXUS Approval Application Authority Grant Handoff Acceptance Capture Guard");
addCheck("scoped Command Center UX remains present", businessBuildSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryDisplayModel") && pageSource.includes("Business Build Approval Application Authority Grant Handoff Acceptance Capture") && pageSource.includes("Agent Flow Approval Application Authority Grant Handoff Acceptance Capture"));
addCheck("scoped Playwright coverage remains present", routeTests.includes("Approval application authority grant handoff acceptance capture appears only on scoped pages") && routeTests.includes("Founder approval application authority grant handoff acceptance capture"));
addCheck("docs record P127.6", /P127\.6 Acceptance Capture Validation \/ Docs[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P127.6", /P127\.6 acceptance capture validation/i.test(readme) && /P127\.7\s+is\s+next/.test(readme));
addCheck("platform roadmap records P127.6", /P127\.6 is complete/.test(platformRoadmap) && /P127\.7\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  p1276CurrentState || p1277FinalState,
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P127.6 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P127.6 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("display model avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDisplayModel));
addCheck("display model avoids raw schema names", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapture|approval_authority_grant_handoff_acceptance_capture|acceptanceCaptureDraftRef|acceptanceCaptureEventRef|acceptanceCaptureEvidenceRef|recordRef|requestKey)/i.test(serializedDisplayModel));
addCheck("display model avoids fake runnable actions", !/capture acceptance now|record acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedDisplayModel));
addCheck("primary UX source avoids internal phase labels and report paths", !/P127|p127\d|reports\/p127/i.test(`${pageSource}\n${serializedDisplayModel}`));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture is enabled|handoff acceptance is enabled|grant handoff is enabled|authority handoff is enabled|grant authority is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P127.1-P127.5 together before final validation.",
        "- Confirms contract, metadata, intent model, safe dry-run preview, scoped Command Center UX, docs, reports, package scripts, and phase status are aligned.",
        "- Does not capture acceptance, record acceptance, accept handoff, hand off authority, grant authority, activate authority, write DB/runtime records, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1276.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P127.6 is validation and docs only. Acceptance capture, record acceptance, handoff acceptance, authority handoff, authority grant, activation, approval application, approval capture, approval persistence, approve/reject decision recording, DB/runtime writes, runtime execution, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, raw SQL, deploy, release, export, package, network calls, and provider spend remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P127.6 Acceptance Capture Validation Report", phase: "P127.6" },
);

printCheckReport("P127.6 Acceptance Capture Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
