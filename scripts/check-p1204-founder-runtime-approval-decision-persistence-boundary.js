import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_PHASE,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_VERSION,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES,
  buildFounderApprovalDecisionPersistencePreview,
  validateFounderApprovalDecisionPersistencePreview,
} from "../shared/founderApprovalDecisionPersistencePreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1204-founder-runtime-approval-decision-persistence-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|dry-run|preview-only|planned-only|read-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p120-founder-runtime-approval-decision-persistence-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1204 = subphaseById.get("P120.4") || {};
const p1205 = subphaseById.get("P120.5") || {};
const p1206 = subphaseById.get("P120.6") || {};
const plan = readText("docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1203Checker = readText("scripts/check-p1203-founder-runtime-approval-decision-persistence-boundary.js");
const previewSource = readText("shared/founderApprovalDecisionPersistencePreview.js");
const preview = buildFounderApprovalDecisionPersistencePreview({
  intentState: "ready_for_safe_dry_run",
  founderIdeaSummary: "Founder approval decision persistence review for a future runtime request.",
  nextAction: "Render P120.5 scoped persistence boundary UX without save, approve, reject, or execution controls.",
});
const validation = validateFounderApprovalDecisionPersistencePreview(preview);
const data = preview.data || {};
const summary = data.approvalDecisionPersistenceSummary || {};
const invalidValidation = validateFounderApprovalDecisionPersistencePreview({
  ...preview,
  data: {
    ...data,
    dryRunOnly: false,
    dbWriteAllowed: true,
  },
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P120.4";
const allowedFiles = new Set(p1204.allowedFiles || []);
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
  "approvalCaptureAllowed",
  "approvalPersistenceAllowed",
  "approvalDecisionRecordingAllowed",
  "approveDecisionAllowed",
  "rejectDecisionAllowed",
  "decisionPersistenceAllowed",
  "dbWriteAllowed",
  "hostedDbMutationAllowed",
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
  "approvalPersistencePreviewAllowed",
  "approvalPersistencePreviewWritten",
  "approvalDecisionPersisted",
  "approvalDecisionRecorded",
  "approvalDecisionAccepted",
  "approvalDecisionRejected",
  "approvalDecisionWriteAllowed",
  "localCrudAllowed",
  "sqliteWriteAllowed",
  "runtimeWriteAllowed",
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
  "persistenceCandidateCount",
  "persistableCandidateCount",
  "decisionRecordableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "executionUnlockCandidateCount",
  "agentDispatchCandidateCount",
  "projectMutationCandidateCount",
  "hostedDbMutationCandidateCount",
  "providerSpendCandidateCount",
];
const serializedPreview = JSON.stringify(data);
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;

function flagsFalse(target = {}) {
  return blockedFlagNames.every((flag) => target[flag] === false);
}

const p1204HandoffAccepted = (status.currentPhase === "P120.4"
  && status.previousPhase === "P120.3"
  && status.nextPhase === "P120.5"
  && roadmap.currentPhase === "P120.4"
  && roadmap.previousPhase === "P120.3"
  && roadmap.nextPhase === "P120.5")
  || (status.currentPhase === "P120.5"
    && status.previousPhase === "P120.4"
    && status.nextPhase === "P120.6"
    && roadmap.currentPhase === "P120.5"
    && roadmap.previousPhase === "P120.4"
    && roadmap.nextPhase === "P120.6")
  || (status.currentPhase === "P120.6"
    && status.previousPhase === "P120.5"
    && status.nextPhase === "P120.7"
    && roadmap.currentPhase === "P120.6"
    && roadmap.previousPhase === "P120.5"
    && roadmap.nextPhase === "P120.7");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1204-founder-runtime-approval-decision-persistence-boundary"]));
addCheck("preview exports exist", previewSource.includes("buildFounderApprovalDecisionPersistencePreview") && previewSource.includes("validateFounderApprovalDecisionPersistencePreview"));
addCheck("phase and version exports", FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_PHASE === "P120.4" && FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_VERSION === "1.0");
addCheck("preview states are allowlisted", Object.values(FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES).includes("persistence preview ready; writes blocked") && !Object.values(FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_STATES).includes("approval_decision_persistence_live"));
addCheck("preview validates", validation.valid, validation.errors.join("; "));
addCheck("invalid preview is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /dry run|authority flags/i.test(error)));
addCheck("preview envelope shape", preview.ok === true && preview.status === "PASS" && data.schemaVersion === "1.0" && data.previewMode === "local-only-persistence-dry-run" && data.dryRunOnly === true);
addCheck("preview stays Command Center hidden", data.commandCenterVisible === false);
addCheck("preview reuses P120.3 intent model and P120.2 schema", data.sourceIntentPhase === "P120.3" && data.sourceSchemaPhase === "P120.2" && previewSource.includes("buildFounderApprovalDecisionPersistenceIntentModel") && previewSource.includes("buildFounderApprovalDecisionPersistenceSchemaMetadata"));
addCheck("preview rows are useful", data.previewRows?.length === 3 && data.previewRows.every((row) => row.rowLabel && row.currentState && row.readinessLabel && row.nextAction && row.blocker && row.disabledReason && row.ownerCapability));
addCheck("preview sections are useful", data.previewSections?.length === 3 && data.previewSections.every((section) => section.sectionLabel && section.blockedCount === data.previewRows.length && section.disabledReason));
addCheck("summary keeps unsafe counts zero", zeroSummaryFields.every((field) => summary[field] === 0) && summary.previewRowCount === 3 && summary.blockedRowCount === 3);
addCheck("top-level authority flags false", flagsFalse(data));
addCheck("row authority flags false", data.previewRows?.every((row) => flagsFalse(row) && row.wouldCaptureApproval === false && row.wouldPersistApproval === false && row.wouldRecordDecision === false && row.wouldAcceptDecision === false && row.wouldRejectDecision === false && row.wouldWriteDb === false && row.wouldWriteRuntime === false && row.wouldUnlockExecution === false && row.wouldDispatchAgent === false && row.wouldMutateProject === false && row.wouldSpend === false));
addCheck("preview carries owner/evidence/activity/cost", Boolean(data.ownerCapability) && data.evidenceRefs?.includes(REPORT_PATH) && data.activityLocation === "reports/os-phase-status-report.md" && /No provider calls/i.test(data.costImpact));
addCheck("contract marks P120.4 complete", p1204.status === "complete" && ["planned", "complete"].includes(p1205.status) && ["planned", "complete"].includes(p1206.status));
addCheck("contract records expected exports", ["FOUNDER_APPROVAL_DECISION_PERSISTENCE_PREVIEW_PHASE", "buildFounderApprovalDecisionPersistencePreview", "validateFounderApprovalDecisionPersistencePreview"].every((name) => p1204.expectedExports?.includes(name)));
addCheck("P120.3 checker accepts P120.4 handoff", p1203Checker.includes("P120.4") && p1203Checker.includes("P120.5") && p1203Checker.includes("scope check relaxed"));
addCheck("docs record P120.4", /P120\.4 Approval Decision Persistence Safe Dry Run[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P120.4", /P120\.4 approval decision persistence safe dry run/i.test(readme) && /P120\.5\s+is\s+next/.test(readme));
addCheck("platform roadmap records P120.4", /P120\.4 is complete/.test(platformRoadmap) && /P120\.5\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  p1204HandoffAccepted
    && statusById.get("P120")?.status === "in_progress"
    && statusById.get("P120.3")?.status === "complete"
    && statusById.get("P120.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P120.5")?.status)
    && roadmapById.get("P120.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P120.4 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P120.4 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_decision|approval_decision_persistence_drafts|approval_decision_persistence_events|approval_decision_persistence_evidence_refs|founderApprovalDecisionPersistenceDrafts|founderApprovalDecisionPersistenceEvents|founderApprovalDecisionPersistenceEvidenceRefs)/.test(publicDocsBundle));
addCheck("preview avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedPreview));
addCheck("preview avoids raw schema/table names", !/(founderApprovalDecisionPersistenceDrafts|founderApprovalDecisionPersistenceEvents|founderApprovalDecisionPersistenceEvidenceRefs|approval_decision_persistence)/i.test(serializedPreview));
addCheck("preview avoids fake runnable actions", !/approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedPreview));
addCheck("preview avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedPreview));
addCheck("preview helper has no unsafe imports or URLs", !/from\s+["'][^"']*(db|local-state|providers|tools|worker-runtime|deploy|release|projects)\//.test(previewSource) && !/CREATE TABLE|INSERT INTO|DELETE FROM|ALTER TABLE|DROP TABLE|postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(previewSource));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P120.4 approval decision persistence safe dry-run preview.",
        "- Confirms the preview reuses the P120.3 intent model and P120.2 schema metadata while staying display-safe and hidden from primary Command Center UX.",
        "- Does not accept approvals, persist approvals, record approve/reject decisions, write DB/runtime state, unlock execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1204.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P120.4 is a local dry-run preview only. It does not accept approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P120.4 Founder Runtime Approval Decision Persistence Boundary Safe Dry Run Report", phase: "P120.4" },
);

printCheckReport("P120.4 Founder Runtime Approval Decision Persistence Boundary Safe Dry Run Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
