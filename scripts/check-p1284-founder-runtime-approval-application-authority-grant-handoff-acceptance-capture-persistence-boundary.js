import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS } from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryMetadata.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|dry run|preview-only|planned-only|read-only|future|local-only)\b/i.test(context);
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
const p1284 = subphaseById.get("P128.4") || {};
const p1285 = subphaseById.get("P128.5") || {};
const plan = readText(PLAN_PATH);
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1283Checker = readText("scripts/check-p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun.js");
const preview = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun({
  founderIdeaSummary: "Founder approval application authority grant handoff acceptance capture persistence review for a future local runtime request.",
  nextAction: "Prepare P128.5 scoped persistence display without saving records, granting authority, or execution controls.",
});
const validation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun(preview);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun({
  ...preview,
  data: {
    ...preview.data,
    dryRunOnly: false,
    acceptanceCapturePersisted: true,
    dbWritePerformed: true,
    approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceWriteAllowed: true,
  },
});
const data = preview.data || {};
const summary = data.acceptanceCapturePersistenceSummary || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P128.4";
const allowedFiles = new Set(p1284.allowedFiles || []);
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
  ...Object.keys(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_FLAGS),
  "approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceSafeDryRunAllowed",
  "approvalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceSafeDryRunWritten",
  "acceptanceCapturePersisted",
  "acceptanceCapturePersistenceDrafted",
  "acceptanceCapturePersistenceEventCreated",
  "acceptanceCapturePersistenceEvidenceCreated",
  "dbSchemaCreated",
  "dbMigrationRun",
  "dbWritePerformed",
  "runtimeWritePerformed",
  "handoffAccepted",
  "acceptanceCaptured",
  "acceptanceRecorded",
  "authorityHandedOff",
  "authorityGranted",
  "authorityActivated",
  "approvalDecisionApplied",
  "approvalDecisionPersisted",
  "approvalDecisionRecorded",
  "approvalDecisionAccepted",
  "approvalDecisionRejected",
  "executionUnlocked",
  "providerCallPerformed",
  "modelCallPerformed",
  "agentDispatchPerformed",
  "workerExecutionPerformed",
  "toolExecutionPerformed",
  "projectMutationPerformed",
  "networkCallPerformed",
  "providerSpendPerformed",
  "localCrudAllowed",
  "sqliteWriteAllowed",
  "hostedDbMutationAllowed",
  "deployAllowed",
  "releaseAllowed",
  "exportAllowed",
  "packageAllowed",
  "spendAllowed",
];
const zeroSummaryFields = [
  "persistenceCandidateCount",
  "persistableCaptureCandidateCount",
  "persistenceDraftCandidateCount",
  "persistenceEventCandidateCount",
  "persistenceEvidenceCandidateCount",
  "schemaCreatableCandidateCount",
  "migrationRunnableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "handoffCandidateCount",
  "authorityHandoffCandidateCount",
  "grantCandidateCount",
  "authorityGrantCandidateCount",
  "activationCandidateCount",
  "applicationCandidateCount",
  "approvalApplicationCandidateCount",
  "approvalDecisionRecordableCandidateCount",
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

const p1284CurrentState = status.currentPhase === "P128.4"
  && status.previousPhase === "P128.3"
  && status.nextPhase === "P128.5"
  && roadmap.currentPhase === "P128.4"
  && roadmap.previousPhase === "P128.3"
  && roadmap.nextPhase === "P128.5";
const p1285StartedState = status.currentPhase === "P128.5"
  && status.previousPhase === "P128.4"
  && status.nextPhase === "P128.6"
  && roadmap.currentPhase === "P128.5"
  && roadmap.previousPhase === "P128.4"
  && roadmap.nextPhase === "P128.6";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1284-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary"]));
addCheck("phase and version exports", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_PHASE === "P128.4" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_VERSION === "1.0");
addCheck("safe dry-run states are allowlisted", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES).includes("acceptance capture persistence dry run ready; live persistence blocked") && !Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES).includes("persistence_live"));
addCheck("preview validates", validation.valid, validation.errors.join("; "));
addCheck("invalid preview is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /dry run|authority flags|zero|false/i.test(error)));
addCheck("preview envelope shape", preview.ok === true && preview.status === "PASS" && data.schemaVersion === "1.0" && data.previewMode === "local-only-authority-grant-handoff-acceptance-capture-persistence-safe-dry-run" && data.dryRunOnly === true && data.localOnly === true);
addCheck("preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("preview reuses P128.3 intent model and P128.2 metadata", data.sourceIntentPhase === "P128.3" && data.sourceMetadataPhase === "P128.2" && data.sourceCapturePhase === "P127.2" && helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel"));
addCheck("preview rows are useful", data.previewRows?.length === 3 && data.previewRows.every((row) => row.rowLabel && row.currentState && row.readinessLabel && row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("preview sections are useful", data.previewSections?.length === 3 && data.previewSections.every((section) => section.sectionLabel && section.blockedCount === data.previewRows.length && section.disabledReason));
addCheck("summary keeps unsafe counts zero", zeroSummaryFields.every((field) => summary[field] === 0) && summary.previewRowCount === 3 && summary.blockedRowCount === 3);
addCheck("top-level authority flags false", flagsFalse(data));
addCheck("row authority flags false", data.previewRows?.every((row) => flagsFalse(row) && row.wouldPersistCapture === false && row.wouldCreatePersistenceDraft === false && row.wouldCreatePersistenceEvent === false && row.wouldCreatePersistenceEvidence === false && row.wouldCreateSchema === false && row.wouldRunMigration === false && row.wouldWriteDb === false && row.wouldWriteRuntime === false && row.wouldCaptureAcceptance === false && row.wouldAcceptHandoff === false && row.wouldRecordAcceptance === false && row.wouldHandoffAuthority === false && row.wouldGrantAuthority === false && row.wouldActivateAuthority === false && row.wouldApplyApproval === false && row.wouldPersistApproval === false && row.wouldRecordApprovalDecision === false && row.wouldAcceptDecision === false && row.wouldRejectDecision === false && row.wouldUnlockExecution === false && row.wouldDispatchAgent === false && row.wouldExecuteWorker === false && row.wouldExecuteTool === false && row.wouldMutateProject === false && row.wouldUseNetwork === false && row.wouldSpend === false));
addCheck("preview carries owner/evidence/activity/cost", Boolean(data.ownerCapability) && data.evidenceRefs?.includes(REPORT_PATH) && data.activityLocation === "reports/os-phase-status-report.md" && /No provider calls/i.test(data.costImpact));
addCheck("contract marks P128.4 complete and P128.5 handoff valid", p1284.status === "complete" && ["planned", "complete"].includes(p1285.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_SAFE_DRY_RUN_STATES",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundarySafeDryRun",
].every((name) => p1284.expectedExports?.includes(name)));
addCheck("P128.3 checker accepts P128.4 handoff", p1283Checker.includes("P128.4") && p1283Checker.includes("P128.5") && p1283Checker.includes("p1284StartedState"));
addCheck("docs record P128.4", /P128\.4 Capture Persistence Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P128.4", /P128\.4 acceptance capture persistence safe dry run/i.test(readme) && /P128\.5 is next/i.test(readme));
addCheck("platform roadmap records P128.4", /P128\.4 is complete/i.test(platformRoadmap) && /P128\.5 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1284CurrentState || p1285StartedState)
    && statusById.get("P128")?.status === "in_progress"
    && statusById.get("P128.3")?.status === "complete"
    && statusById.get("P128.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P128.5")?.status)
    && roadmapById.get("P128.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P128.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P128.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_boundary_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("preview avoids raw schema/table names", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistence|approval_authority_grant_handoff_acceptance_capture_persistence)/i.test(serializedPreview));
addCheck("preview avoids fake runnable actions", !/persist now|save now|write now|capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedPreview));
addCheck("preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPreview));
addCheck("preview helper has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(helperSource) && !/CREATE TABLE|INSERT INTO|DELETE FROM|ALTER TABLE|DROP TABLE|postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(helperSource));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture persistence is enabled|acceptance capture is persisted|DB writes are enabled|runtime writes are enabled|migration is created|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|authority handoff is enabled|authority activation is enabled|approval application is enabled|approval decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P128.4 acceptance capture persistence safe dry-run preview.",
        "- Confirms the preview reuses the P128.3 intent model, P128.2 persistence metadata, and P127.2 capture metadata while staying display-safe and hidden from primary Command Center UX.",
        "- Does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: (p1284.validationCommands || []).map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P128.4 is a local dry-run preview only. It does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P128.4 Capture Persistence Safe Dry Run Report", phase: "P128.4" },
);

printCheckReport("P128.4 Capture Persistence Safe Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
