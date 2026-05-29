import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES,
  buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel,
  validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel,
} from "../shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary-report.md";
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
      && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|schema-only|model-only|planned-only|read-only|safe dry-run only|future|local-only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

function allFlagsFalse(model = {}) {
  return model.authorityFlags && Object.values(model.authorityFlags).every((value) => value === false);
}

function allRowsBlocked(model = {}) {
  return Array.isArray(model.readinessRows)
    && model.readinessRows.length === 4
    && model.readinessRows.every((row) => (
      row.canPersistCapture === false
      && row.canCreateSchema === false
      && row.canRunMigration === false
      && row.canWriteDb === false
      && row.canWriteRuntime === false
      && row.canCaptureAcceptance === false
      && row.canAcceptHandoff === false
      && row.canHandoffAuthority === false
      && row.canGrantAuthority === false
      && row.canActivateAuthority === false
      && row.canApplyApproval === false
      && row.canUnlockExecution === false
      && row.canDispatchAgent === false
      && row.canSpend === false
    ));
}

const packageJson = readJson("package.json");
const contract = readJson(CONTRACT_PATH);
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1283 = subphaseById.get("P128.3") || {};
const p1284 = subphaseById.get("P128.4") || {};
const plan = readText(PLAN_PATH);
const readme = readText("README.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const p1282Checker = readText("scripts/check-p1282-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary.js");
const modelSource = readText("shared/founderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel.js");
const defaultModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel();
const dryRunModel = buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel({
  intentState: "ready_for_safe_capture_persistence_dry_run",
  founderIdeaSummary: "Founder approval application authority grant handoff acceptance capture persistence review for a future local runtime request.",
  blockers: ["Acceptance capture persistence remains disabled.", "Runtime execution remains blocked."],
});
const defaultValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel(defaultModel);
const dryRunValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel(dryRunModel);
const invalidValidation = validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel({
  ...dryRunModel,
  intentState: "persisted",
  persistenceCandidateCount: 1,
  acceptanceCapturePersisted: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P128.3";
const allowedFiles = new Set(p1283.allowedFiles || []);
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
const docsBundle = `${plan}\n${readme}\n${platformRoadmap}`;
const publicDocsBundle = `${readme}\n${platformRoadmap}`;
const zeroCounts = [
  "persistenceCandidateCount",
  "persistableCaptureCandidateCount",
  "schemaCreatableCandidateCount",
  "migrationRunnableCandidateCount",
  "dbWritableCandidateCount",
  "runtimeWritableCandidateCount",
  "runtimeExecutableCandidateCount",
  "providerSpendCandidateCount",
].every((key) => defaultModel[key] === 0 && dryRunModel[key] === 0);
const p1283CurrentState = status.currentPhase === "P128.3"
  && status.previousPhase === "P128.2"
  && status.nextPhase === "P128.4"
  && roadmap.currentPhase === "P128.3"
  && roadmap.previousPhase === "P128.2"
  && roadmap.nextPhase === "P128.4";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1283-founder-runtime-approval-application-authority-grant-handoff-acceptance-capture-persistence-boundary"]));
addCheck("phase export is P128.3", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE === "P128.3" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES.includes("ready_for_safe_capture_persistence_dry_run") && !FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES.includes("persisted"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("dry-run-ready model validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|zero|false|blocked/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.localOnly === true && defaultModel.commandCenterVisible === false && dryRunModel.localOnly === true && dryRunModel.commandCenterVisible === false);
addCheck("models reuse P128.2 metadata", defaultModel.sourceMetadataPhase === "P128.2" && defaultModel.sourceMetadataVersion === "1.0" && dryRunModel.metadataEntityLabels?.includes("Acceptance capture persistence draft"));
addCheck("models expose founder-useful status", Boolean(dryRunModel.founderIdeaSummary) && Boolean(dryRunModel.nextAction) && Boolean(dryRunModel.disabledReason) && Boolean(dryRunModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", dryRunModel.blockers.length > 0 && dryRunModel.evidenceLabels.length > 0 && dryRunModel.activityLabels.length > 0 && dryRunModel.costImpactLabel === "No provider spend");
addCheck("candidate counts remain zero", zeroCounts);
addCheck("readiness rows remain blocked", allRowsBlocked(defaultModel) && allRowsBlocked(dryRunModel));
addCheck("persistence, schema, migration, and writes are not performed", defaultModel.acceptanceCapturePersisted === false && defaultModel.acceptanceCapturePersistenceDrafted === false && defaultModel.acceptanceCapturePersistenceEventCreated === false && defaultModel.acceptanceCapturePersistenceEvidenceCreated === false && defaultModel.dbSchemaCreated === false && defaultModel.dbMigrationRun === false && defaultModel.dbWritePerformed === false && defaultModel.runtimeWritePerformed === false);
addCheck("capture, handoff, grant, activation, and approval application are not performed", defaultModel.handoffAccepted === false && defaultModel.acceptanceCaptured === false && defaultModel.acceptanceRecorded === false && defaultModel.authorityHandedOff === false && defaultModel.authorityGranted === false && defaultModel.authorityActivated === false && defaultModel.approvalDecisionApplied === false);
addCheck("execution, dispatch, mutation, network, and spend stay blocked", defaultModel.executionUnlocked === false && defaultModel.providerCallPerformed === false && defaultModel.agentDispatchPerformed === false && defaultModel.workerExecutionPerformed === false && defaultModel.toolExecutionPerformed === false && defaultModel.projectMutationPerformed === false && defaultModel.networkCallPerformed === false && defaultModel.providerSpendPerformed === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(dryRunModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+|DELETE\s+FROM/i.test(modelSource));
addCheck("contract marks P128.3 complete and P128.4 handoff valid", p1283.status === "complete" && ["planned", "complete"].includes(p1284.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_MODEL_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_GRANT_HANDOFF_ACCEPTANCE_CAPTURE_PERSISTENCE_BOUNDARY_INTENT_STATES",
  "buildFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel",
  "validateFounderApprovalApplicationAuthorityGrantHandoffAcceptanceCapturePersistenceBoundaryIntentModel",
].every((name) => p1283.expectedExports?.includes(name)));
addCheck("P128.2 checker accepts P128.3 handoff", p1282Checker.includes("p1283StartedState") && p1282Checker.includes('status.nextPhase === "P128.4"'));
addCheck("docs record P128.3", /## P128\.3 Capture Persistence Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P128.3", /P128\.3 capture persistence intent model/i.test(readme) && /P128\.4 is next/i.test(readme));
addCheck("platform roadmap records P128.3", /P128\.3 is complete/i.test(platformRoadmap) && /P128\.4 is next/i.test(platformRoadmap));
addCheck(
  "phase status advanced",
  p1283CurrentState
    && statusById.get("P128")?.status === "in_progress"
    && statusById.get("P128.2")?.status === "complete"
    && statusById.get("P128.3")?.status === "complete"
    && roadmapById.get("P128.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P128.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P128.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw persistence table names", !/(approval_authority_grant_handoff_acceptance_capture_persistence_records|acceptance_capture_persistence_events|capture_persistence_records|persistence_boundary_records|CREATE TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM)/i.test(publicDocsBundle));
addCheck("models avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels));
addCheck("models avoid fake runnable actions", !/persist now|save now|write now|capture acceptance now|accept handoff now|handoff authority now|grant authority now|activate now|apply approval now|approve now|reject now|run now|execute now|deploy now|call provider now|create project now|dispatch agent now|write sqlite now|unlock execution now/i.test(serializedModels));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /acceptance capture persistence is enabled|acceptance capture is persisted|DB writes are enabled|runtime writes are enabled|migration is created|table is created|raw SQL is allowed|acceptance capture is live|handoff acceptance is enabled|authority grant is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P128.3 governed local acceptance capture persistence intent model.",
        "- Confirms the model reuses P128.2 metadata and remains local, model-only, and hidden from primary Command Center UX.",
        "- Does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1283.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P128.3 is a pure local model only. It does not persist acceptance capture, create DB schemas, create migrations, write DB/runtime records, capture acceptance, accept handoff, hand off authority, grant authority, activate authority, apply approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P128.3 Capture Persistence Intent Model Report", phase: "P128.3" },
);

printCheckReport("P128.3 Capture Persistence Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
