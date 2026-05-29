import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES,
  buildFounderApprovalDecisionApplicationIntentModel,
  validateFounderApprovalDecisionApplicationIntentModel,
} from "../shared/founderApprovalDecisionApplicationIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1213-founder-runtime-approval-decision-application-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|metadata-only|model-only|planned-only|read-only|safe dry-run only)\b/i.test(context);
  });
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p121-founder-runtime-approval-decision-application-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1213 = subphaseById.get("P121.3") || {};
const p1214 = subphaseById.get("P121.4") || {};
const p1215 = subphaseById.get("P121.5") || {};
const plan = readText("docs/architecture/P121_FOUNDER_RUNTIME_APPROVAL_DECISION_APPLICATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1211Checker = readText("scripts/check-p1211-founder-runtime-approval-decision-application-boundary-contract.js");
const p1212Checker = readText("scripts/check-p1212-founder-runtime-approval-decision-application-boundary.js");
const modelSource = readText("shared/founderApprovalDecisionApplicationIntentModel.js");
const defaultModel = buildFounderApprovalDecisionApplicationIntentModel();
const dryRunModel = buildFounderApprovalDecisionApplicationIntentModel({
  intentState: "ready_for_safe_dry_run",
  founderIdeaSummary: "Founder approval decision application review for a future runtime request.",
  blockers: ["Approval application remains disabled.", "Runtime execution remains blocked."],
});
const defaultValidation = validateFounderApprovalDecisionApplicationIntentModel(defaultModel);
const dryRunValidation = validateFounderApprovalDecisionApplicationIntentModel(dryRunModel);
const invalidValidation = validateFounderApprovalDecisionApplicationIntentModel({
  ...dryRunModel,
  intentState: "approved",
  applicationCandidateCount: 1,
  approvalDecisionApplied: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P121.3";
const allowedFiles = new Set(p1213.allowedFiles || []);
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
  "applicationCandidateCount",
  "applicableDecisionCount",
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
    && model.readinessRows.length === 3
    && model.readinessRows.every((row) => row.canApplyDecision === false && row.canWriteDb === false && row.canUnlockExecution === false);
}

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1213-founder-runtime-approval-decision-application-boundary"]));
addCheck("phase export is P121.3", FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE === "P121.3" && FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES.includes("application_blocked") && !FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES.includes("approved"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("dry-run-ready model validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|zero|blocked/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.localOnly === true && defaultModel.commandCenterVisible === false && dryRunModel.localOnly === true && dryRunModel.commandCenterVisible === false);
addCheck("models reuse P121.2 eligibility metadata", defaultModel.sourceMetadataPhase === "P121.2" && defaultModel.sourceMetadataVersion === "1.0" && dryRunModel.metadataSectionLabels?.includes("Decision source"));
addCheck("models expose founder-useful status", Boolean(dryRunModel.founderIdeaSummary) && Boolean(dryRunModel.nextAction) && Boolean(dryRunModel.disabledReason) && Boolean(dryRunModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", dryRunModel.blockers.length > 0 && dryRunModel.evidenceLabels.length > 0 && dryRunModel.activityLabels.length > 0 && dryRunModel.costImpactLabel === "No provider spend");
addCheck("candidate counts remain zero", zeroCounts);
addCheck("readiness rows remain blocked", allRowsBlocked(defaultModel) && allRowsBlocked(dryRunModel));
addCheck("approval decisions are not applied, persisted, or recorded", defaultModel.approvalDecisionApplied === false && defaultModel.approvalDecisionPersisted === false && defaultModel.approvalDecisionRecorded === false && dryRunModel.approvalDecisionApplied === false);
addCheck("approve/reject, DB writes, provider calls, dispatch, project mutation, and execution unlock stay blocked", defaultModel.approvalDecisionAccepted === false && defaultModel.approvalDecisionRejected === false && defaultModel.dbWritePerformed === false && defaultModel.providerCallPerformed === false && defaultModel.agentDispatchPerformed === false && defaultModel.projectMutationPerformed === false && defaultModel.executionUnlocked === false && dryRunModel.executionUnlocked === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(dryRunModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(modelSource));
addCheck("contract marks P121.3 complete and P121.4/P121.5 handoff valid", p1213.status === "complete" && ["planned", "complete"].includes(p1214.status) && ["planned", "complete"].includes(p1215.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_MODEL_PHASE",
  "FOUNDER_APPROVAL_DECISION_APPLICATION_INTENT_STATES",
  "buildFounderApprovalDecisionApplicationIntentModel",
  "validateFounderApprovalDecisionApplicationIntentModel",
].every((name) => p1213.expectedExports?.includes(name)));
addCheck("P121.1 checker accepts P121.3 handoff", p1211Checker.includes("P121.3") && p1211Checker.includes("P121.4") && p1211Checker.includes("p1213StartedState"));
addCheck("P121.2 checker accepts P121.3 handoff", p1212Checker.includes("P121.3") && p1212Checker.includes("P121.4") && p1212Checker.includes("scope check relaxed"));
addCheck("docs record P121.3", /P121\.3 Governed Application Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P121.3", /P121\.3 governed approval decision application intent model/i.test(readme) && /P121\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P121.3", /P121\.3 is complete/.test(platformRoadmap) && /P121\.4\s+is\s+next/.test(platformRoadmap));
const p1213CurrentState = status.currentPhase === "P121.3"
  && status.previousPhase === "P121.2"
  && status.nextPhase === "P121.4"
  && roadmap.currentPhase === "P121.3"
  && roadmap.previousPhase === "P121.2"
  && roadmap.nextPhase === "P121.4";
const p1214StartedState = status.currentPhase === "P121.4"
  && status.previousPhase === "P121.3"
  && status.nextPhase === "P121.5"
  && roadmap.currentPhase === "P121.4"
  && roadmap.previousPhase === "P121.3"
  && roadmap.nextPhase === "P121.5";
const p1215StartedState = status.currentPhase === "P121.5"
  && status.previousPhase === "P121.4"
  && status.nextPhase === "P121.6"
  && roadmap.currentPhase === "P121.5"
  && roadmap.previousPhase === "P121.4"
  && roadmap.nextPhase === "P121.6";
const p1213HandoffAccepted = p1213CurrentState || p1214StartedState || p1215StartedState;
addCheck(
  "phase status advanced",
  p1213HandoffAccepted
    && statusById.get("P121")?.status === "in_progress"
    && statusById.get("P121.2")?.status === "complete"
    && statusById.get("P121.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P121.4")?.status)
    && roadmapById.get("P121.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P121.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P121.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw application table names", !/(founder_runtime_approval_application|approval_decision_application_records|approval_decision_application_events|approval_decision_application_requests)/i.test(publicDocsBundle));
addCheck("models avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels));
addCheck("models avoid fake runnable actions", !/apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModels));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P121.3 governed local approval decision application intent model.",
        "- Confirms the model reuses P121.2 eligibility metadata and remains local, display-safe, and hidden from primary Command Center UX.",
        "- Does not apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1213.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P121.3 is a pure local model only. It does not apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P121.3 Founder Runtime Approval Decision Application Boundary Intent Model Report", phase: "P121.3" },
);

printCheckReport("P121.3 Founder Runtime Approval Decision Application Boundary Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
