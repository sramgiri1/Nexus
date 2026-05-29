import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_STATES,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary-report.md";

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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|model-only|planned-only|read-only|safe dry-run only|future)\b/i.test(context);
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
const p1273 = subphaseById.get("P127.3") || {};
const p1274 = subphaseById.get("P127.4") || {};
const p1275 = subphaseById.get("P127.5") || {};
const plan = readText("docs/architecture/P127_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1272Checker = readText("scripts/check-p1272-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js");
const p1274Checker = readText("scripts/check-p1274-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary.js");
const modelSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel.js");
const defaultModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel();
const dryRunModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel({
  intentState: "ready_for_safe_acceptance_capture_dry_run",
  founderIdeaSummary: "Founder approval application authority grant handoff acceptance capture review for a future local runtime request.",
  blockers: ["Acceptance capture remains disabled.", "Runtime execution remains blocked."],
});
const defaultValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel(defaultModel);
const dryRunValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel(dryRunModel);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel({
  ...dryRunModel,
  intentState: "captured",
  acceptanceCaptureCandidateCount: 1,
  acceptanceCaptured: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P127.3";
const allowedFiles = new Set(p1273.allowedFiles || []);
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
const serializedModels = JSON.stringify([defaultModel, dryRunModel]);
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;
const zeroCounts = [
  "acceptanceCandidateCount",
  "acceptanceCaptureCandidateCount",
  "captureRecordCandidateCount",
  "handoffCandidateCount",
  "grantCandidateCount",
  "activationCandidateCount",
  "applicationCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "providerSpendCandidateCount",
].every((key) => defaultModel[key] === 0 && dryRunModel[key] === 0);

function allFlagsFalse(model = {}) {
  return model.authorityFlags && Object.values(model.authorityFlags).every((value) => value === false);
}

function allRowsBlocked(model = {}) {
  return Array.isArray(model.readinessRows)
    && model.readinessRows.length === 4
    && model.readinessRows.every((row) => (
      row.canAcceptHandoff === false
      && row.canCaptureAcceptance === false
      && row.canRecordAcceptance === false
      && row.canHandoffAuthority === false
      && row.canGrantAuthority === false
      && row.canActivateAuthority === false
      && row.canApplyDecision === false
      && row.canWriteDb === false
      && row.canWriteRuntime === false
      && row.canUnlockExecution === false
      && row.canDispatchAgent === false
      && row.canSpend === false
    ));
}

const p1273CurrentState = status.currentPhase === "P127.3"
  && status.previousPhase === "P127.2"
  && status.nextPhase === "P127.4"
  && roadmap.currentPhase === "P127.3"
  && roadmap.previousPhase === "P127.2"
  && roadmap.nextPhase === "P127.4";
const p1274StartedState = status.currentPhase === "P127.4"
  && status.previousPhase === "P127.3"
  && status.nextPhase === "P127.5"
  && roadmap.currentPhase === "P127.4"
  && roadmap.previousPhase === "P127.3"
  && roadmap.nextPhase === "P127.5";
const p1275StartedState = status.currentPhase === "P127.5"
  && status.previousPhase === "P127.4"
  && status.nextPhase === "P127.6"
  && roadmap.currentPhase === "P127.5"
  && roadmap.previousPhase === "P127.4"
  && roadmap.nextPhase === "P127.6";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1273-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-boundary"]));
addCheck("phase export is P127.3", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_PHASE === "P127.3" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_STATES.includes("ready_for_safe_acceptance_capture_dry_run") && !FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_STATES.includes("captured"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("dry-run-ready model validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|zero|false|blocked/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.localOnly === true && defaultModel.commandCenterVisible === false && dryRunModel.localOnly === true && dryRunModel.commandCenterVisible === false);
addCheck("models reuse P127.2 metadata", defaultModel.sourceMetadataPhase === "P127.2" && defaultModel.sourceMetadataVersion === "1.0" && dryRunModel.metadataSectionLabels?.includes("Capture scope"));
addCheck("models expose founder-useful status", Boolean(dryRunModel.founderIdeaSummary) && Boolean(dryRunModel.nextAction) && Boolean(dryRunModel.disabledReason) && Boolean(dryRunModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", dryRunModel.blockers.length > 0 && dryRunModel.evidenceLabels.length > 0 && dryRunModel.activityLabels.length > 0 && dryRunModel.costImpactLabel === "No provider spend");
addCheck("candidate counts remain zero", zeroCounts);
addCheck("readiness rows remain blocked", allRowsBlocked(defaultModel) && allRowsBlocked(dryRunModel));
addCheck("acceptance capture, handoff, grant, and activation are not performed", defaultModel.handoffAccepted === false && defaultModel.acceptanceCaptured === false && defaultModel.acceptanceRecorded === false && defaultModel.authorityHandedOff === false && defaultModel.authorityGranted === false && defaultModel.authorityActivated === false && dryRunModel.acceptanceCaptured === false);
addCheck("approval application is not performed", defaultModel.approvalDecisionApplied === false && defaultModel.approvalDecisionPersisted === false && defaultModel.approvalDecisionRecorded === false && dryRunModel.approvalDecisionApplied === false);
addCheck("writes, execution, dispatch, project mutation, network, and spend stay blocked", defaultModel.dbWritePerformed === false && defaultModel.runtimeWritePerformed === false && defaultModel.executionUnlocked === false && defaultModel.providerCallPerformed === false && defaultModel.agentDispatchPerformed === false && defaultModel.projectMutationPerformed === false && defaultModel.networkCallPerformed === false && defaultModel.providerSpendPerformed === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(dryRunModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(modelSource));
addCheck("contract marks P127.3 complete and P127.4/P127.5 handoff valid", p1273.status === "complete" && ["planned", "complete"].includes(p1274.status) && ["planned", "complete"].includes(p1275.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_MODEL_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_BOUNDARY_INTENT_STATES",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundaryIntentModel",
].every((name) => p1273.expectedExports?.includes(name)));
addCheck("P127.2 checker accepts P127.3 handoff", p1272Checker.includes("P127.3") && p1272Checker.includes("P127.4") && p1272Checker.includes("p1273StartedState"));
addCheck("P127.4 checker validates dry-run handoff", !p1274StartedState || (p1274Checker.includes("buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCaptureBoundarySafeDryRun") && p1274Checker.includes("P127.5")));
addCheck("docs record P127.3", /P127\.3 Governed Acceptance Capture Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck(
  "README records P127.3",
  /P127\.3 governed approval application authority grant handoff acceptance capture\s+intent model/i.test(readme)
    && (/P127\.4\s+is\s+next/.test(readme) || /P127\.4 is complete/.test(readme)),
);
addCheck("platform roadmap records P127.3", /P127\.3 is complete/.test(platformRoadmap) && (/P127\.4\s+is\s+next/.test(platformRoadmap) || /P127\.4 is complete/.test(platformRoadmap)));
addCheck(
  "phase status advanced",
  (p1273CurrentState || p1274StartedState || p1275StartedState)
    && statusById.get("P127")?.status === "in_progress"
    && statusById.get("P127.2")?.status === "complete"
    && statusById.get("P127.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P127.4")?.status)
    && roadmapById.get("P127.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P127.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P127.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw capture table names", !/(approval_authority_grant_handoff_acceptance_capture_records|grant_handoff_acceptance_capture_events|acceptance_capture_requests|capture_boundary_records)/i.test(publicDocsBundle));
addCheck("models avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels));
addCheck("models avoid fake runnable actions", !/capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModels));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture is enabled|handoff acceptance is enabled|grant handoff is enabled|authority handoff is enabled|approval application authority grant handoff is enabled|grant authority is enabled|approval application authority grant is enabled|authority grant is enabled|activation is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority is granted|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P127.3 governed local approval application authority grant handoff acceptance capture intent model.",
        "- Confirms the model reuses P127.2 metadata and remains local, model-only, and hidden from primary Command Center UX.",
        "- Does not capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1273.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P127.3 is a pure local model only. It does not capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P127.3 Approval Application Authority Grant Handoff Acceptance Capture Boundary Intent Model Report", phase: "P127.3" },
);

printCheckReport("P127.3 Approval Application Authority Grant Handoff Acceptance Capture Boundary Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
