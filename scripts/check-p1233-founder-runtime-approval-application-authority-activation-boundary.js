import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES,
  buildFounderApprovalApplicationAuthorityActivationIntentModel,
  validateFounderApprovalApplicationAuthorityActivationIntentModel,
} from "../shared/founderApprovalApplicationAuthorityActivationIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1233-founder-runtime-approval-application-authority-activation-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p123-founder-runtime-approval-application-authority-activation-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1233 = subphaseById.get("P123.3") || {};
const p1234 = subphaseById.get("P123.4") || {};
const plan = readText("docs/architecture/P123_FOUNDER_RUNTIME_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1232Checker = readText("scripts/check-p1232-founder-runtime-approval-application-authority-activation-boundary.js");
const modelSource = readText("shared/founderApprovalApplicationAuthorityActivationIntentModel.js");
const defaultModel = buildFounderApprovalApplicationAuthorityActivationIntentModel();
const dryRunModel = buildFounderApprovalApplicationAuthorityActivationIntentModel({
  intentState: "ready_for_safe_activation_dry_run",
  founderIdeaSummary: "Founder approval application authority activation review for a future local runtime request.",
  blockers: ["Activation remains disabled.", "Runtime execution remains blocked."],
});
const defaultValidation = validateFounderApprovalApplicationAuthorityActivationIntentModel(defaultModel);
const dryRunValidation = validateFounderApprovalApplicationAuthorityActivationIntentModel(dryRunModel);
const invalidValidation = validateFounderApprovalApplicationAuthorityActivationIntentModel({
  ...dryRunModel,
  intentState: "activated",
  activationCandidateCount: 1,
  authorityActivated: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P123.3";
const allowedFiles = new Set(p1233.allowedFiles || []);
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
  "activationCandidateCount",
  "authorityGrantCandidateCount",
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
      row.canActivateAuthority === false
      && row.canGrantAuthority === false
      && row.canApplyDecision === false
      && row.canWriteDb === false
      && row.canWriteRuntime === false
      && row.canUnlockExecution === false
      && row.canDispatchAgent === false
      && row.canSpend === false
    ));
}

const p1233CurrentState = status.currentPhase === "P123.3"
  && status.previousPhase === "P123.2"
  && status.nextPhase === "P123.4"
  && roadmap.currentPhase === "P123.3"
  && roadmap.previousPhase === "P123.2"
  && roadmap.nextPhase === "P123.4";
const p1234StartedState = status.currentPhase === "P123.4"
  && status.previousPhase === "P123.3"
  && status.nextPhase === "P123.5"
  && roadmap.currentPhase === "P123.4"
  && roadmap.previousPhase === "P123.3"
  && roadmap.nextPhase === "P123.5";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1233-founder-runtime-approval-application-authority-activation-boundary"]));
addCheck("phase export is P123.3", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE === "P123.3" && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES.includes("ready_for_safe_activation_dry_run") && !FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES.includes("activated"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("dry-run-ready model validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|zero|false|blocked/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.localOnly === true && defaultModel.commandCenterVisible === false && dryRunModel.localOnly === true && dryRunModel.commandCenterVisible === false);
addCheck("models reuse P123.2 metadata", defaultModel.sourceMetadataPhase === "P123.2" && defaultModel.sourceMetadataVersion === "1.0" && dryRunModel.metadataSectionLabels?.includes("Activation scope"));
addCheck("models expose founder-useful status", Boolean(dryRunModel.founderIdeaSummary) && Boolean(dryRunModel.nextAction) && Boolean(dryRunModel.disabledReason) && Boolean(dryRunModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", dryRunModel.blockers.length > 0 && dryRunModel.evidenceLabels.length > 0 && dryRunModel.activityLabels.length > 0 && dryRunModel.costImpactLabel === "No provider spend");
addCheck("candidate counts remain zero", zeroCounts);
addCheck("readiness rows remain blocked", allRowsBlocked(defaultModel) && allRowsBlocked(dryRunModel));
addCheck("activation and authority grant are not performed", defaultModel.authorityActivated === false && defaultModel.authorityGranted === false && defaultModel.activationPersisted === false && dryRunModel.authorityActivated === false && dryRunModel.authorityGranted === false);
addCheck("approval application is not performed", defaultModel.approvalDecisionApplied === false && defaultModel.approvalDecisionPersisted === false && defaultModel.approvalDecisionRecorded === false && dryRunModel.approvalDecisionApplied === false);
addCheck("writes, execution, dispatch, project mutation, network, and spend stay blocked", defaultModel.dbWritePerformed === false && defaultModel.runtimeWritePerformed === false && defaultModel.executionUnlocked === false && defaultModel.providerCallPerformed === false && defaultModel.agentDispatchPerformed === false && defaultModel.projectMutationPerformed === false && defaultModel.networkCallPerformed === false && defaultModel.providerSpendPerformed === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(dryRunModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(modelSource));
addCheck("contract marks P123.3 complete and P123.4 handoff valid", p1233.status === "complete" && ["planned", "complete"].includes(p1234.status));
addCheck("contract records expected exports", [
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_PHASE",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_MODEL_VERSION",
  "FOUNDER_APPROVAL_APPLICATION_AUTHORITY_ACTIVATION_INTENT_STATES",
  "buildFounderApprovalApplicationAuthorityActivationIntentModel",
  "validateFounderApprovalApplicationAuthorityActivationIntentModel",
].every((name) => p1233.expectedExports?.includes(name)));
addCheck("P123.2 checker accepts P123.3 handoff", p1232Checker.includes("P123.3") && p1232Checker.includes("P123.4") && p1232Checker.includes("p1233StartedState"));
addCheck("docs record P123.3", /P123\.3 Governed Activation Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P123.3", /P123\.3 governed approval application authority activation intent model/i.test(readme) && /P123\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P123.3", /P123\.3 is complete/.test(platformRoadmap) && /P123\.4\s+is\s+next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  (p1233CurrentState || p1234StartedState)
    && statusById.get("P123")?.status === "in_progress"
    && statusById.get("P123.2")?.status === "complete"
    && statusById.get("P123.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P123.4")?.status)
    && roadmapById.get("P123.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P123.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P123.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw activation table names", !/(founder_runtime_approval_activation|approval_authority_activation_records|approval_authority_activation_events|approval_authority_activation_requests|activation_boundary_records)/i.test(publicDocsBundle));
addCheck("models avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels));
addCheck("models avoid fake runnable actions", !/activate now|grant authority now|apply approval now|apply decision now|approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModels));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /activation is enabled|approval application authority activation is enabled|approval decision application is enabled|approval application is enabled|approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed|authority activation is granted|authority grant is enabled|DB writes are enabled|runtime writes are enabled/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P123.3 governed local approval application authority activation intent model.",
        "- Confirms the model reuses P123.2 metadata and remains local, model-only, and hidden from primary Command Center UX.",
        "- Does not activate authority, grant authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: p1233.validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P123.3 is a pure local model only. It does not activate authority, grant authority, apply approvals, create DB tables, write runtime records, capture approvals, persist approvals, record approve/reject decisions, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P123.3 Approval Application Authority Activation Intent Model Report", phase: "P123.3" },
);

printCheckReport("P123.3 Approval Application Authority Activation Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
