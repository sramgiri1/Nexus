import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_VERSION,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES,
  buildFounderApprovalDecisionApplicationAuthorityPreview,
  validateFounderApprovalDecisionApplicationAuthorityPreview,
} from "../shared/founderApprovalDecisionApplicationAuthorityPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1224-founder-runtime-approval-decision-application-authority-handoff-report.md";

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
    const context = `${lines[index - 1] || ""} ${line}`;
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|planned-only|read-only|future)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p122-founder-runtime-approval-decision-application-authority-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1224 = subphaseById.get("P122.4") || {};
const p1225 = subphaseById.get("P122.5") || {};
const p1226 = subphaseById.get("P122.6") || {};
const plan = readText("docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1223Checker = readText("scripts/check-p1223-founder-runtime-approval-decision-application-authority-handoff.js");
const previewSource = readText("shared/founderApprovalDecisionApplicationAuthorityPreview.js");
const preview = buildFounderApprovalDecisionApplicationAuthorityPreview({
  intentState: "ready_for_safe_dry_run",
  founderIdeaSummary: "Founder approval application authority review for a future local runtime request.",
  nextAction: "Render P122.5 scoped authority handoff UX without grant, apply, approve, reject, save, or execution controls.",
});
const validation = validateFounderApprovalDecisionApplicationAuthorityPreview(preview);
const data = preview.data || {};
const summary = data.authorityHandoffSummary || {};
const invalidValidation = validateFounderApprovalDecisionApplicationAuthorityPreview({
  ...preview,
  data: {
    ...data,
    dryRunOnly: false,
    authorityHandoffGranted: true,
    dbWriteAllowed: true,
  },
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P122.4";
const allowedFiles = new Set(p1224.allowedFiles || []);
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
const blockedFlagNames = [
  "approvalDecisionApplicationAllowed",
  "approvalCaptureAllowed",
  "approvalPersistenceAllowed",
  "approvalDecisionRecordingAllowed",
  "approveDecisionAllowed",
  "rejectDecisionAllowed",
  "dbWriteAllowed",
  "hostedDbMutationAllowed",
  "runtimeWriteAllowed",
  "runtimeExecutionAllowed",
  "executionUnlockAllowed",
  "providerCallAllowed",
  "agentDispatchAllowed",
  "workerExecutionAllowed",
  "toolExecutionAllowed",
  "projectMutationAllowed",
  "deployActionAllowed",
  "releaseActionAllowed",
  "exportActionAllowed",
  "packageActionAllowed",
  "networkCallAllowed",
  "providerSpendAllowed",
  "approvalApplicationAuthorityHandoffAllowed",
  "approvalApplicationRuntimeAdmissionAllowed",
  "approvalApplicationStateMutationAllowed",
  "approvalApplicationOperatorOverrideAllowed",
  "approvalApplicationAuthorityPreviewAllowed",
  "approvalApplicationAuthorityPreviewWritten",
  "approvalDecisionApplied",
  "approvalDecisionPersisted",
  "approvalDecisionRecorded",
  "approvalDecisionAccepted",
  "approvalDecisionRejected",
  "approvalDecisionWriteAllowed",
  "authorityHandoffGranted",
  "runtimeAdmissionGranted",
  "localCrudAllowed",
  "sqliteWriteAllowed",
  "runtimeApprovalAllowed",
  "executionAllowed",
  "executionUnlocked",
  "dispatchAllowed",
  "providerCallsAllowed",
  "modelCallsAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageAllowed",
  "spendAllowed",
];
const zeroSummaryFields = [
  "authorityCandidateCount",
  "handoffCandidateCount",
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
];
const serializedPreview = JSON.stringify(data);
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;

function flagsFalse(target = {}) {
  return blockedFlagNames.every((flag) => target[flag] === false);
}

const p1224HandoffAccepted = (status.currentPhase === "P122.4"
  && status.previousPhase === "P122.3"
  && status.nextPhase === "P122.5"
  && roadmap.currentPhase === "P122.4"
  && roadmap.previousPhase === "P122.3"
  && roadmap.nextPhase === "P122.5")
  || (status.currentPhase === "P122.5"
    && status.previousPhase === "P122.4"
    && status.nextPhase === "P122.6"
    && roadmap.currentPhase === "P122.5"
    && roadmap.previousPhase === "P122.4"
    && roadmap.nextPhase === "P122.6")
  || (status.currentPhase === "P122.6"
    && status.previousPhase === "P122.5"
    && status.nextPhase === "P122.7"
    && roadmap.currentPhase === "P122.6"
    && roadmap.previousPhase === "P122.5"
    && roadmap.nextPhase === "P122.7");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1224-founder-runtime-approval-decision-application-authority-handoff"]));
addCheck("preview exports exist", previewSource.includes("buildFounderApprovalDecisionApplicationAuthorityPreview") && previewSource.includes("validateFounderApprovalDecisionApplicationAuthorityPreview"));
addCheck("phase and version exports", FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_PHASE === "P122.4" && FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_VERSION === "1.0");
addCheck("preview states are allowlisted", Object.values(FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES).includes("authority preview ready; authority blocked") && !Object.values(FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_STATES).includes("approval_application_authority_live"));
addCheck("preview validates", validation.valid, validation.errors.join("; "));
addCheck("invalid preview is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /dry run|authority flags/i.test(error)));
addCheck("preview envelope shape", preview.ok === true && preview.status === "PASS" && data.schemaVersion === "1.0" && data.previewMode === "local-only-authority-handoff-dry-run" && data.dryRunOnly === true);
addCheck("preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("preview reuses P122.3 intent model and P122.2 metadata", data.sourceIntentPhase === "P122.3" && data.sourceMetadataPhase === "P122.2" && previewSource.includes("buildFounderApprovalDecisionApplicationAuthorityIntentModel") && previewSource.includes("buildFounderApprovalDecisionApplicationAuthorityEligibilityMetadata"));
addCheck("preview rows are useful", data.previewRows?.length === 4 && data.previewRows.every((row) => row.rowLabel && row.currentState && row.readinessLabel && row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("preview sections are useful", data.previewSections?.length === 3 && data.previewSections.every((section) => section.sectionLabel && section.blockedCount === data.previewRows.length && section.disabledReason));
addCheck("summary keeps unsafe counts zero", zeroSummaryFields.every((field) => summary[field] === 0) && summary.previewRowCount === 4 && summary.blockedRowCount === 4);
addCheck("top-level authority flags false", flagsFalse(data));
addCheck("row authority flags false", data.previewRows?.every((row) => flagsFalse(row) && row.wouldGrantAuthority === false && row.wouldApplyDecision === false && row.wouldCaptureApproval === false && row.wouldPersistApproval === false && row.wouldRecordDecision === false && row.wouldAcceptDecision === false && row.wouldRejectDecision === false && row.wouldWriteDb === false && row.wouldWriteRuntime === false && row.wouldUnlockExecution === false && row.wouldDispatchAgent === false && row.wouldExecuteWorker === false && row.wouldExecuteTool === false && row.wouldMutateProject === false && row.wouldUseNetwork === false && row.wouldSpend === false));
addCheck("preview carries owner/evidence/activity/cost", Boolean(data.ownerCapability) && data.evidenceRefs?.includes(REPORT_PATH) && data.activityLocation === "reports/os-phase-status-report.md" && /No provider calls/i.test(data.costImpact));
addCheck("contract marks P122.4 complete", p1224.status === "complete" && ["planned", "complete"].includes(p1225.status) && ["planned", "complete"].includes(p1226.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_PREVIEW_PHASE",
  "buildFounderApprovalDecisionApplicationAuthorityPreview",
  "validateFounderApprovalDecisionApplicationAuthorityPreview",
].every((name) => p1224.expectedExports?.includes(name)));
addCheck("P122.3 checker accepts P122.4 handoff", p1223Checker.includes("P122.4") && p1223Checker.includes("P122.5") && p1223Checker.includes("p1224StartedState"));
addCheck("docs record P122.4", /P122\.4 Authority Handoff Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P122.4", /P122\.4 approval decision application authority safe dry run/i.test(readme) && /P122\.5\s+is\s+next/.test(readme));
addCheck("platform roadmap records P122.4", /P122\.4 is complete/.test(platformRoadmap) && /P122\.5\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  p1224HandoffAccepted
    && statusById.get("P122")?.status === "in_progress"
    && statusById.get("P122.3")?.status === "complete"
    && statusById.get("P122.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P122.5")?.status)
    && roadmapById.get("P122.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P122.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P122.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw authority table names", !/(founder_runtime_approval_application|approval_decision_application_records|approval_decision_application_events|approval_decision_application_requests|approval_application_authority_records|approval_authority_events|founderApprovalDecisionApplication)/i.test(publicDocsBundle));
addCheck("preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("preview avoids raw schema/table names", !/(founderApprovalDecisionApplication|approval_decision_application)/i.test(serializedPreview));
addCheck("preview avoids fake runnable actions", !/approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedPreview));
addCheck("preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPreview));
addCheck("preview helper has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(previewSource) && !/CREATE TABLE|INSERT INTO|DELETE FROM|ALTER TABLE|DROP TABLE|postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(previewSource));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority handoff is granted/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P122.4 approval decision application authority handoff safe dry-run preview.",
        "- Confirms the preview reuses the P122.3 intent model and P122.2 metadata while staying display-safe and hidden from primary Command Center UX.",
        "- Does not grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1224.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P122.4 is a local dry-run preview only. It does not grant authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P122.4 Founder Runtime Approval Decision Application Authority Handoff Safe Dry Run Report", phase: "P122.4" },
);

printCheckReport("P122.4 Founder Runtime Approval Decision Application Authority Handoff Safe Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
