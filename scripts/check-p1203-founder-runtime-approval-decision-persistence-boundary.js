import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES,
  buildFounderApprovalDecisionPersistenceIntentModel,
  validateFounderApprovalDecisionPersistenceIntentModel,
} from "../shared/founderApprovalDecisionPersistenceIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1203-founder-runtime-approval-decision-persistence-boundary-report.md";

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
    return pattern.test(line) && !/\b(no|not|never|without|blocked|unavailable|disabled|forbidden|do not|does not|remain|remains|schema-only|metadata-only|model-only|planned-only|read-only)\b/i.test(context);
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
const p1203 = subphaseById.get("P120.3") || {};
const p1204 = subphaseById.get("P120.4") || {};
const p1205 = subphaseById.get("P120.5") || {};
const plan = readText("docs/architecture/P120_FOUNDER_RUNTIME_APPROVAL_DECISION_PERSISTENCE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1202Checker = readText("scripts/check-p1202-founder-runtime-approval-decision-persistence-boundary.js");
const modelSource = readText("shared/founderApprovalDecisionPersistenceIntentModel.js");
const defaultModel = buildFounderApprovalDecisionPersistenceIntentModel();
const dryRunModel = buildFounderApprovalDecisionPersistenceIntentModel({
  intentState: "ready_for_safe_dry_run",
  founderIdeaSummary: "Founder approval decision persistence review for a future runtime request.",
  blockers: ["Decision persistence writes remain disabled.", "Runtime execution remains blocked."],
});
const defaultValidation = validateFounderApprovalDecisionPersistenceIntentModel(defaultModel);
const dryRunValidation = validateFounderApprovalDecisionPersistenceIntentModel(dryRunModel);
const invalidValidation = validateFounderApprovalDecisionPersistenceIntentModel({
  ...dryRunModel,
  intentState: "approved",
  dbWritableCandidateCount: 1,
  dbWritePerformed: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P120.3";
const allowedFiles = new Set(p1203.allowedFiles || []);
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
  "persistenceCandidateCount",
  "persistableCandidateCount",
  "dbWritableCandidateCount",
  "approvalDecisionRecordableCandidateCount",
  "runtimeExecutableCandidateCount",
  "providerSpendCandidateCount",
].every((key) => defaultModel[key] === 0 && dryRunModel[key] === 0);

function allFlagsFalse(model = {}) {
  return model.authorityFlags && Object.values(model.authorityFlags).every((value) => value === false);
}

function allRowsBlocked(model = {}) {
  return Array.isArray(model.readinessRows)
    && model.readinessRows.length === 3
    && model.readinessRows.every((row) => row.canPersist === false && row.canWriteDb === false && row.canUnlockExecution === false);
}

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1203-founder-runtime-approval-decision-persistence-boundary"]));
addCheck("phase export is P120.3", FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE === "P120.3" && FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES.includes("persistence_blocked") && !FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES.includes("approved"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("dry-run-ready model validates", dryRunValidation.valid, dryRunValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|zero|blocked|writes/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.localOnly === true && defaultModel.commandCenterVisible === false && dryRunModel.localOnly === true && dryRunModel.commandCenterVisible === false);
addCheck("models reuse P120.2 schema metadata", defaultModel.sourceSchemaPhase === "P120.2" && defaultModel.sourceSchemaVersion === "1.0" && dryRunModel.schemaEntityLabels?.includes("Approval decision persistence draft"));
addCheck("models expose founder-useful status", Boolean(dryRunModel.founderIdeaSummary) && Boolean(dryRunModel.nextAction) && Boolean(dryRunModel.disabledReason) && Boolean(dryRunModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", dryRunModel.blockers.length > 0 && dryRunModel.evidenceLabels.length > 0 && dryRunModel.activityLabels.length > 0 && dryRunModel.costImpactLabel === "No provider spend");
addCheck("candidate counts remain zero", zeroCounts);
addCheck("readiness rows remain blocked", allRowsBlocked(defaultModel) && allRowsBlocked(dryRunModel));
addCheck("approval decisions are not persisted or recorded", defaultModel.approvalDecisionPersisted === false && defaultModel.approvalDecisionRecorded === false && dryRunModel.approvalDecisionPersisted === false && dryRunModel.approvalDecisionRecorded === false);
addCheck("approve/reject, DB writes, provider calls, and execution unlock stay blocked", defaultModel.approvalDecisionAccepted === false && defaultModel.approvalDecisionRejected === false && defaultModel.dbWritePerformed === false && defaultModel.providerCallPerformed === false && defaultModel.executionUnlocked === false && dryRunModel.executionUnlocked === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(dryRunModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(modelSource));
addCheck("contract marks P120.3 complete and P120.4/P120.5 handoff valid", p1203.status === "complete" && ["planned", "complete"].includes(p1204.status) && ["planned", "complete"].includes(p1205.status));
addCheck("contract records expected exports", ["FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_MODEL_PHASE", "FOUNDER_APPROVAL_DECISION_PERSISTENCE_INTENT_STATES", "buildFounderApprovalDecisionPersistenceIntentModel", "validateFounderApprovalDecisionPersistenceIntentModel"].every((name) => p1203.expectedExports?.includes(name)));
addCheck("P120.2 checker accepts P120.3 handoff", p1202Checker.includes("P120.3") && p1202Checker.includes("P120.4") && p1202Checker.includes("scope check relaxed"));
addCheck("docs record P120.3", /P120\.3 Governed Local Approval Decision Persistence Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P120.3", /P120\.3 governed local approval decision persistence intent model/i.test(readme) && /P120\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P120.3", /P120\.3 is complete/.test(platformRoadmap) && /P120\.4\s+is\s+next/.test(platformRoadmap));
const p1203HandoffAccepted = (status.currentPhase === "P120.3"
  && status.previousPhase === "P120.2"
  && status.nextPhase === "P120.4"
  && roadmap.currentPhase === "P120.3"
  && roadmap.previousPhase === "P120.2"
  && roadmap.nextPhase === "P120.4")
  || (status.currentPhase === "P120.4"
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
    && roadmap.nextPhase === "P120.6");
addCheck(
  "phase status advanced",
  p1203HandoffAccepted
    && statusById.get("P120")?.status === "in_progress"
    && statusById.get("P120.2")?.status === "complete"
    && statusById.get("P120.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P120.4")?.status)
    && roadmapById.get("P120.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P120.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P120.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_decision|approval_decision_persistence_drafts|approval_decision_persistence_events|approval_decision_persistence_evidence_refs)/.test(publicDocsBundle));
addCheck("models avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels));
addCheck("models avoid fake runnable actions", !/approve now|reject now|save decision now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModels));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|approve\/reject decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P120.3 governed local approval decision persistence intent model.",
        "- Confirms the model reuses P120.2 schema metadata and remains local, display-safe, and hidden from primary Command Center UX.",
        "- Does not persist approvals, record approve/reject decisions, write DB/runtime state, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1203.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P120.3 is a pure local model only. It does not capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P120.3 Founder Runtime Approval Decision Persistence Boundary Intent Model Report", phase: "P120.3" },
);

printCheckReport("P120.3 Founder Runtime Approval Decision Persistence Boundary Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
