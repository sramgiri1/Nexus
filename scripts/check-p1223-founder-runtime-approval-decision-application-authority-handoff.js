import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES,
  buildFounderApprovalDecisionApplicationAuthorityIntentModel,
  validateFounderApprovalDecisionApplicationAuthorityIntentModel,
} from "../shared/founderApprovalDecisionApplicationAuthorityIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1223-founder-runtime-approval-decision-application-authority-handoff-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|model-only|planned-only|read-only|safe dry-run only|future)\b/i.test(context);
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
const p1223 = subphaseById.get("P122.3") || {};
const p1224 = subphaseById.get("P122.4") || {};
const p1225 = subphaseById.get("P122.5") || {};
const plan = readText("docs/architecture/P122_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_AUTHORITY_HANDOFF_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1222Checker = readText("scripts/check-p1222-founder-runtime-approval-decision-application-authority-handoff.js");
const modelSource = readText("shared/founderApprovalDecisionApplicationAuthorityIntentModel.js");
const defaultModel = buildFounderApprovalDecisionApplicationAuthorityIntentModel();
const dryRunModel = buildFounderApprovalDecisionApplicationAuthorityIntentModel({
  intentState: "ready_for_safe_dry_run",
  founderIdeaSummary: "Founder approval application authority review for a future local runtime request.",
  blockers: ["Authority remains disabled.", "Runtime execution remains blocked."],
});
const defaultValidation = validateFounderApprovalDecisionApplicationAuthorityIntentModel(defaultModel);
const dryRunValidation = validateFounderApprovalDecisionApplicationAuthorityIntentModel(dryRunModel);
const invalidValidation = validateFounderApprovalDecisionApplicationAuthorityIntentModel({
  ...dryRunModel,
  intentState: "approved",
  authorityCandidateCount: 1,
  authorityHandoffGranted: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P122.3";
const allowedFiles = new Set(p1223.allowedFiles || []);
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
  "authorityCandidateCount",
  "handoffCandidateCount",
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
      row.canApplyDecision === false
      && row.canWriteDb === false
      && row.canWriteRuntime === false
      && row.canUnlockExecution === false
      && row.canDispatchAgent === false
      && row.canSpend === false
    ));
}

const p1223CurrentState = status.currentPhase === "P122.3"
  && status.previousPhase === "P122.2"
  && status.nextPhase === "P122.4"
  && roadmap.currentPhase === "P122.3"
  && roadmap.previousPhase === "P122.2"
  && roadmap.nextPhase === "P122.4";
const p1224StartedState = status.currentPhase === "P122.4"
  && status.previousPhase === "P122.3"
  && status.nextPhase === "P122.5"
  && roadmap.currentPhase === "P122.4"
  && roadmap.previousPhase === "P122.3"
  && roadmap.nextPhase === "P122.5";
const p1225StartedState = status.currentPhase === "P122.5"
  && status.previousPhase === "P122.4"
  && status.nextPhase === "P122.6"
  && roadmap.currentPhase === "P122.5"
  && roadmap.previousPhase === "P122.4"
  && roadmap.nextPhase === "P122.6";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1223-founder-runtime-approval-decision-application-authority-handoff"]));
addCheck("phase export is P122.3", FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE === "P122.3" && FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES.includes("ready_for_safe_dry_run") && !FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES.includes("approved"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("dry-run-ready model validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|zero|false|blocked/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.localOnly === true && defaultModel.commandCenterVisible === false && dryRunModel.localOnly === true && dryRunModel.commandCenterVisible === false);
addCheck("models reuse P122.2 metadata", defaultModel.sourceMetadataPhase === "P122.2" && defaultModel.sourceMetadataVersion === "1.0" && dryRunModel.metadataSectionLabels?.includes("Authority scope"));
addCheck("models expose founder-useful status", Boolean(dryRunModel.founderIdeaSummary) && Boolean(dryRunModel.nextAction) && Boolean(dryRunModel.disabledReason) && Boolean(dryRunModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", dryRunModel.blockers.length > 0 && dryRunModel.evidenceLabels.length > 0 && dryRunModel.activityLabels.length > 0 && dryRunModel.costImpactLabel === "No provider spend");
addCheck("candidate counts remain zero", zeroCounts);
addCheck("readiness rows remain blocked", allRowsBlocked(defaultModel) && allRowsBlocked(dryRunModel));
addCheck("approval application and authority handoff are not granted", defaultModel.approvalDecisionApplied === false && defaultModel.approvalDecisionPersisted === false && defaultModel.approvalDecisionRecorded === false && defaultModel.authorityHandoffGranted === false && dryRunModel.authorityHandoffGranted === false);
addCheck("writes, execution, dispatch, project mutation, network, and spend stay blocked", defaultModel.dbWritePerformed === false && defaultModel.runtimeWritePerformed === false && defaultModel.executionUnlocked === false && defaultModel.providerCallPerformed === false && defaultModel.agentDispatchPerformed === false && defaultModel.projectMutationPerformed === false && defaultModel.networkCallPerformed === false && defaultModel.providerSpendPerformed === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(dryRunModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(modelSource));
addCheck("contract marks P122.3 complete and P122.4/P122.5 handoff valid", p1223.status === "complete" && ["planned", "complete"].includes(p1224.status) && ["planned", "complete"].includes(p1225.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_MODEL_PHASE",
  "FOUNDER_APPROVAL_DECISION_APPLICATION_AUTHORITY_INTENT_STATES",
  "buildFounderApprovalDecisionApplicationAuthorityIntentModel",
  "validateFounderApprovalDecisionApplicationAuthorityIntentModel",
].every((name) => p1223.expectedExports?.includes(name)));
addCheck("P122.2 checker accepts P122.3 handoff", p1222Checker.includes("P122.3") && p1222Checker.includes("P122.4") && p1222Checker.includes("p1223StartedState"));
addCheck("docs record P122.3", /P122\.3 Governed Local Authority Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P122.3", /P122\.3 governed approval decision application authority intent model/i.test(readme) && /P122\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P122.3", /P122\.3 is complete/.test(platformRoadmap) && /P122\.4\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1223CurrentState || p1224StartedState || p1225StartedState)
    && statusById.get("P122")?.status === "in_progress"
    && statusById.get("P122.2")?.status === "complete"
    && statusById.get("P122.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P122.4")?.status)
    && roadmapById.get("P122.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P122.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P122.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw authority table names", !/(founder_runtime_approval_application|approval_decision_application_records|approval_decision_application_events|approval_decision_application_requests|approval_application_authority_records|approval_authority_events)/i.test(publicDocsBundle));
addCheck("models avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels));
addCheck("models avoid fake runnable actions", !/apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModels));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority handoff is granted/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P122.3 governed local approval decision application authority intent model.",
        "- Confirms the model reuses P122.2 metadata and remains local, model-only, and hidden from primary Command Center UX.",
        "- Does not apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1223.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P122.3 is a pure local model only. It does not apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P122.3 Founder Runtime Approval Decision Application Authority Handoff Intent Model Report", phase: "P122.3" },
);

printCheckReport("P122.3 Founder Runtime Approval Decision Application Authority Handoff Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
