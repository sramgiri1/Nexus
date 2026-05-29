import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES,
  buildFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffSafeDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1254-founder-runtime-approval-application-authority-grant-handoff-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|preview-only|planned-only|read-only|future|local-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p125-founder-runtime-approval-application-authority-grant-handoff-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1254 = subphaseById.get("P125.4") || {};
const p1255 = subphaseById.get("P125.5") || {};
const plan = readText("docs/architecture/P125_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1253Checker = readText("scripts/check-p1253-founder-runtime-approval-application-authority-grant-handoff.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffSafeDryRun.js");
const preview = buildFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun({
  founderIdeaSummary: "Founder approval application authority grant handoff review for a future local runtime request.",
  nextAction: "Prepare P125.5 scoped handoff display without handoff, grant, activate, apply, approve, reject, save, or execution controls.",
});
const validation = validateFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun(preview);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun({
  ...preview,
  data: {
    ...preview.data,
    dryRunOnly: false,
    authorityHandedOff: true,
    dbWriteAllowed: true,
  },
});
const data = preview.data || {};
const summary = data.handoffSummary || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P125.4";
const allowedFiles = new Set(p1254.allowedFiles || []);
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
  "approvalApplicationAuthorityActivationAllowed",
  "approvalApplicationAuthorityGrantAllowed",
  "approvalApplicationAuthorityGrantWriteAllowed",
  "approvalApplicationAuthorityGrantPersistenceAllowed",
  "approvalApplicationAuthorityGrantRuntimeAdmissionAllowed",
  "approvalApplicationAuthorityGrantOperatorOverrideAllowed",
  "approvalApplicationAuthorityGrantSpendAllowed",
  "approvalApplicationAuthorityGrantHandoffAllowed",
  "approvalApplicationAuthorityGrantHandoffWriteAllowed",
  "approvalApplicationAuthorityGrantHandoffPersistenceAllowed",
  "approvalApplicationAuthorityGrantHandoffRuntimeAdmissionAllowed",
  "approvalApplicationAuthorityGrantHandoffOperatorOverrideAllowed",
  "approvalApplicationAuthorityGrantHandoffSpendAllowed",
  "approvalApplicationAuthorityGrantHandoffSafeDryRunAllowed",
  "approvalApplicationAuthorityGrantHandoffSafeDryRunWritten",
  "authorityHandedOff",
  "authorityGranted",
  "authorityActivated",
  "handoffPersisted",
  "grantPersisted",
  "approvalDecisionApplied",
  "approvalDecisionPersisted",
  "approvalDecisionRecorded",
  "approvalDecisionAccepted",
  "approvalDecisionRejected",
  "approvalDecisionWriteAllowed",
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
];
const serializedPreview = JSON.stringify(data);
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;

function flagsFalse(target = {}) {
  return blockedFlagNames.every((flag) => target[flag] === false);
}

const p1254CurrentState = status.currentPhase === "P125.4"
  && status.previousPhase === "P125.3"
  && status.nextPhase === "P125.5"
  && roadmap.currentPhase === "P125.4"
  && roadmap.previousPhase === "P125.3"
  && roadmap.nextPhase === "P125.5";
const p1255StartedState = status.currentPhase === "P125.5"
  && status.previousPhase === "P125.4"
  && status.nextPhase === "P125.6"
  && roadmap.currentPhase === "P125.5"
  && roadmap.previousPhase === "P125.4"
  && roadmap.nextPhase === "P125.6";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1254-founder-runtime-approval-application-authority-grant-handoff"]));
addCheck("phase and version exports", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_PHASE === "P125.4" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_VERSION === "1.0");
addCheck("safe dry-run states are allowlisted", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES).includes("handoff dry run ready; authority handoff blocked") && !Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES).includes("handoff_live"));
addCheck("preview validates", validation.valid, validation.errors.join("; "));
addCheck("invalid preview is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /dry run|authority flags/i.test(error)));
addCheck("preview envelope shape", preview.ok === true && preview.status === "PASS" && data.schemaVersion === "1.0" && data.previewMode === "local-only-authority-grant-handoff-safe-dry-run" && data.dryRunOnly === true);
addCheck("preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("preview reuses P125.3 intent model and P125.2 metadata", data.sourceIntentPhase === "P125.3" && data.sourceMetadataPhase === "P125.2" && data.sourceGrantPhase === "P124.2" && helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffIntentModel"));
addCheck("preview rows are useful", data.previewRows?.length === 4 && data.previewRows.every((row) => row.rowLabel && row.currentState && row.readinessLabel && row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("preview sections are useful", data.previewSections?.length === 3 && data.previewSections.every((section) => section.sectionLabel && section.blockedCount === data.previewRows.length && section.disabledReason));
addCheck("summary keeps unsafe counts zero", zeroSummaryFields.every((field) => summary[field] === 0) && summary.previewRowCount === 4 && summary.blockedRowCount === 4);
addCheck("top-level authority flags false", flagsFalse(data));
addCheck("row authority flags false", data.previewRows?.every((row) => flagsFalse(row) && row.wouldHandoffAuthority === false && row.wouldGrantAuthority === false && row.wouldActivateAuthority === false && row.wouldApplyDecision === false && row.wouldCaptureApproval === false && row.wouldPersistApproval === false && row.wouldRecordDecision === false && row.wouldAcceptDecision === false && row.wouldRejectDecision === false && row.wouldWriteDb === false && row.wouldWriteRuntime === false && row.wouldUnlockExecution === false && row.wouldDispatchAgent === false && row.wouldExecuteWorker === false && row.wouldExecuteTool === false && row.wouldMutateProject === false && row.wouldUseNetwork === false && row.wouldSpend === false));
addCheck("preview carries owner/evidence/activity/cost", Boolean(data.ownerCapability) && data.evidenceRefs?.includes(REPORT_PATH) && data.activityLocation === "reports/os-phase-status-report.md" && /No provider calls/i.test(data.costImpact));
addCheck("contract marks P125.4 complete and P125.5 handoff valid", p1254.status === "complete" && ["planned", "complete"].includes(p1255.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_SAFE_DRY_RUN_STATES",
  "buildFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun",
  "validateFounderApprovalApplicationAuthorityGrantHandoffSafeDryRun",
].every((name) => p1254.expectedExports?.includes(name)));
addCheck("P125.3 checker accepts P125.4 handoff", p1253Checker.includes("P125.4") && p1253Checker.includes("P125.5") && p1253Checker.includes("p1254StartedState"));
addCheck("docs record P125.4", /P125\.4 Handoff Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck(
  "README records P125.4",
  /P125\.4 approval application authority grant handoff safe dry run/i.test(readme)
    && (/P125\.5\s+is\s+next/.test(readme) || /P125\.5\s+is\s+complete/.test(readme)),
);
addCheck(
  "platform roadmap records P125.4",
  /P125\.4 is complete/.test(platformRoadmap)
    && (/P125\.5\s+is\s+next/.test(platformRoadmap) || /P125\.5 is complete/.test(platformRoadmap)),
);
addCheck(
  "phase status advanced",
  (p1254CurrentState || p1255StartedState)
    && statusById.get("P125")?.status === "in_progress"
    && statusById.get("P125.3")?.status === "complete"
    && statusById.get("P125.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P125.5")?.status)
    && roadmapById.get("P125.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P125.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P125.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw handoff table names", !/(approval_authority_grant_handoff_records|grant_handoff_events|grant_handoff_requests|handoff_boundary_records)/i.test(publicDocsBundle));
addCheck("preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("preview avoids raw schema/table names", !/(founderApprovalApplicationAuthorityGrantHandoff|approval_authority_grant_handoff)/i.test(serializedPreview));
addCheck("preview avoids fake runnable actions", !/handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedPreview));
addCheck("preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPreview));
addCheck("preview helper has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(helperSource) && !/CREATE TABLE|INSERT INTO|DELETE FROM|ALTER TABLE|DROP TABLE|postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(helperSource));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P125.4 approval application authority grant handoff safe dry-run preview.",
        "- Confirms the preview reuses the P125.3 intent model, P125.2 handoff metadata, and P124.2 grant metadata while staying display-safe and hidden from primary Command Center UX.",
        "- Does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1254.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P125.4 is a local dry-run preview only. It does not hand off authority, grant authority, activate authority, apply approvals, accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P125.4 Approval Application Authority Grant Handoff Safe Dry Run Report", phase: "P125.4" },
);

printCheckReport("P125.4 Approval Application Authority Grant Handoff Safe Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
