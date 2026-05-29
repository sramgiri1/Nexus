import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS } from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryMetadata.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_STATES,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p126-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1264 = subphaseById.get("P126.4") || {};
const p1265 = subphaseById.get("P126.5") || {};
const p1266 = subphaseById.get("P126.6") || {};
const plan = readText("docs/architecture/P126_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1263Checker = readText("scripts/check-p1263-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary.js");
const helperSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun.js");
const preview = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun({
  founderIdeaSummary: "Founder approval application authority grant handoff acceptance review for a future local runtime request.",
  nextAction: "Prepare P126.5 scoped acceptance display without accepting handoff, granting authority, saving records, or execution controls.",
});
const validation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun(preview);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun({
  ...preview,
  data: {
    ...preview.data,
    dryRunOnly: false,
    handoffAccepted: true,
    approvalApplicationAuthorityGrantHandoffAcceptanceWriteAllowed: true,
  },
});
const data = preview.data || {};
const summary = data.acceptanceSummary || {};
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P126.4";
const allowedFiles = new Set(p1264.allowedFiles || []);
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
  ...Object.keys(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_FLAGS),
  "approvalApplicationAuthorityGrantHandoffAcceptanceSafeDryRunAllowed",
  "approvalApplicationAuthorityGrantHandoffAcceptanceSafeDryRunWritten",
  "handoffAccepted",
  "acceptanceCaptured",
  "acceptancePersisted",
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
  "acceptanceCandidateCount",
  "acceptanceCaptureCandidateCount",
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

const p1264CurrentState = status.currentPhase === "P126.4"
  && status.previousPhase === "P126.3"
  && status.nextPhase === "P126.5"
  && roadmap.currentPhase === "P126.4"
  && roadmap.previousPhase === "P126.3"
  && roadmap.nextPhase === "P126.5";
const p1265StartedState = status.currentPhase === "P126.5"
  && status.previousPhase === "P126.4"
  && status.nextPhase === "P126.6"
  && roadmap.currentPhase === "P126.5"
  && roadmap.previousPhase === "P126.4"
  && roadmap.nextPhase === "P126.6";
const p1266StartedState = status.currentPhase === "P126.6"
  && status.previousPhase === "P126.5"
  && status.nextPhase === "P126.7"
  && roadmap.currentPhase === "P126.6"
  && roadmap.previousPhase === "P126.5"
  && roadmap.nextPhase === "P126.7";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1264-founder-runtime-approval-application-authority-grant-handoff-acceptance-boundary"]));
addCheck("phase and version exports", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_PHASE === "P126.4" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_VERSION === "1.0");
addCheck("safe dry-run states are allowlisted", Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_STATES).includes("acceptance dry run ready; handoff acceptance blocked") && !Object.values(FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_STATES).includes("acceptance_live"));
addCheck("preview validates", validation.valid, validation.errors.join("; "));
addCheck("invalid preview is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /dry run|authority flags|false/i.test(error)));
addCheck("preview envelope shape", preview.ok === true && preview.status === "PASS" && data.schemaVersion === "1.0" && data.previewMode === "local-only-authority-grant-handoff-acceptance-safe-dry-run" && data.dryRunOnly === true && data.localOnly === true);
addCheck("preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("preview reuses P126.3 intent model and P126.2 metadata", data.sourceIntentPhase === "P126.3" && data.sourceMetadataPhase === "P126.2" && data.sourceHandoffPhase === "P125.2" && helperSource.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundaryIntentModel"));
addCheck("preview rows are useful", data.previewRows?.length === 4 && data.previewRows.every((row) => row.rowLabel && row.currentState && row.readinessLabel && row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("preview sections are useful", data.previewSections?.length === 3 && data.previewSections.every((section) => section.sectionLabel && section.blockedCount === data.previewRows.length && section.disabledReason));
addCheck("summary keeps unsafe counts zero", zeroSummaryFields.every((field) => summary[field] === 0) && summary.previewRowCount === 4 && summary.blockedRowCount === 4);
addCheck("top-level authority flags false", flagsFalse(data));
addCheck("row authority flags false", data.previewRows?.every((row) => flagsFalse(row) && row.wouldAcceptHandoff === false && row.wouldCaptureAcceptance === false && row.wouldHandoffAuthority === false && row.wouldGrantAuthority === false && row.wouldActivateAuthority === false && row.wouldApplyDecision === false && row.wouldCaptureApproval === false && row.wouldPersistAcceptance === false && row.wouldPersistApproval === false && row.wouldRecordDecision === false && row.wouldAcceptDecision === false && row.wouldRejectDecision === false && row.wouldWriteDb === false && row.wouldWriteRuntime === false && row.wouldUnlockExecution === false && row.wouldDispatchAgent === false && row.wouldExecuteWorker === false && row.wouldExecuteTool === false && row.wouldMutateProject === false && row.wouldUseNetwork === false && row.wouldSpend === false));
addCheck("preview carries owner/evidence/activity/cost", Boolean(data.ownerCapability) && data.evidenceRefs?.includes(REPORT_PATH) && data.activityLocation === "reports/os-phase-status-report.md" && /No provider calls/i.test(data.costImpact));
addCheck("contract marks P126.4 complete and P126.5/P126.6 handoff valid", p1264.status === "complete" && p1265.status === "complete" && ["planned", "complete"].includes(p1266.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_BOUNDARY_SAFE_DRY_RUN_STATES",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceBoundarySafeDryRun",
].every((name) => p1264.expectedExports?.includes(name)));
addCheck("P126.3 checker accepts P126.4 handoff", p1263Checker.includes("P126.4") && p1263Checker.includes("P126.5") && p1263Checker.includes("p1264StartedState"));
addCheck("docs record P126.4", /P126\.4 Acceptance Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck(
  "README records P126.4",
  /P126\.4 approval application authority grant handoff acceptance safe dry run/i.test(readme)
    && (/P126\.5\s+is\s+next/.test(readme) || /P126\.5 is complete/.test(readme)),
);
addCheck(
  "platform roadmap records P126.4",
  /P126\.4 is complete/.test(platformRoadmap)
    && (/P126\.5\s+is\s+next/.test(platformRoadmap) || /P126\.5 is complete/.test(platformRoadmap)),
);
addCheck(
  "phase status advanced",
  (p1264CurrentState || p1265StartedState || p1266StartedState)
    && statusById.get("P126")?.status === "in_progress"
    && statusById.get("P126.3")?.status === "complete"
    && statusById.get("P126.4")?.status === "complete"
    && statusById.get("P126.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P126.6")?.status)
    && roadmapById.get("P126.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P126.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P126.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw acceptance table names", !/(approval_authority_grant_handoff_acceptance_records|grant_handoff_acceptance_events|handoff_acceptance_requests|acceptance_boundary_records)/i.test(publicDocsBundle));
addCheck("preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("preview avoids raw schema/table names", !/(founderApprovalApplicationAuthorityGrantHandoffAcceptance|approval_authority_grant_handoff_acceptance)/i.test(serializedPreview));
addCheck("preview avoids fake runnable actions", !/accept handoff now|capture acceptance now|handoff authority now|grant authority now|activate now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedPreview));
addCheck("preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPreview));
addCheck("preview helper has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(helperSource) && !/CREATE TABLE|INSERT INTO|DELETE FROM|ALTER TABLE|DROP TABLE|postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(helperSource));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /handoff acceptance is enabled|acceptance capture is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P126.4 approval application authority grant handoff acceptance safe dry-run preview.",
        "- Confirms the preview reuses the P126.3 intent model, P126.2 acceptance metadata, and P125.2 handoff metadata while staying display-safe and hidden from primary Command Center UX.",
        "- Does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: (p1264.validationCommands || []).map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P126.4 is a local dry-run preview only. It does not accept handoff, capture acceptance, hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P126.4 Approval Application Authority Grant Handoff Acceptance Boundary Safe Dry Run Report", phase: "P126.4" },
);

printCheckReport("P126.4 Approval Application Authority Grant Handoff Acceptance Boundary Safe Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
