import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_DECISION_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_DECISION_INTENT_STATES,
  buildFounderApprovalDecisionIntentModel,
  validateFounderApprovalDecisionIntentModel,
} from "../shared/founderApprovalDecisionIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1193-founder-runtime-approval-decision-recording-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p119-founder-runtime-approval-decision-recording-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1193 = subphaseById.get("P119.3") || {};
const p1194 = subphaseById.get("P119.4") || {};
const p1195 = subphaseById.get("P119.5") || {};
const plan = readText("docs/architecture/P119_FOUNDER_RUNTIME_APPROVAL_DECISION_RECORDING_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1192Checker = readText("scripts/check-p1192-founder-runtime-approval-decision-recording-boundary.js");
const modelSource = readText("shared/founderApprovalDecisionIntentModel.js");
const defaultModel = buildFounderApprovalDecisionIntentModel();
const readyModel = buildFounderApprovalDecisionIntentModel({
  intentState: "ready_for_future_decision_boundary",
  founderQuestion: "Can this future runtime request be reviewed for a founder decision?",
  requestedDecisionLabel: "Founder decision review readiness",
  proposedDecisionLabel: "Decision review only",
  blockers: ["Decision controls are not enabled.", "Decision persistence is not enabled."],
});
const defaultValidation = validateFounderApprovalDecisionIntentModel(defaultModel);
const readyValidation = validateFounderApprovalDecisionIntentModel(readyModel);
const invalidValidation = validateFounderApprovalDecisionIntentModel({
  ...readyModel,
  intentState: "approved",
  approvalDecisionRecorded: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P119.3";
const allowedFiles = new Set(p1193.allowedFiles || []);
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
const serializedModels = JSON.stringify([defaultModel, readyModel]);
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const publicDocsBundle = `${platformRoadmap}\n${readme}`;

function allFlagsFalse(model = {}) {
  return model.authorityFlags && Object.values(model.authorityFlags).every((value) => value === false);
}

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1193-founder-runtime-approval-decision-recording-boundary"]));
addCheck("phase export is P119.3", FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE === "P119.3" && FOUNDER_APPROVAL_DECISION_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_DECISION_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_DECISION_INTENT_STATES.includes("blocked_no_decision_recording") && !FOUNDER_APPROVAL_DECISION_INTENT_STATES.includes("approved"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("ready model validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|recorded/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.commandCenterVisible === false && readyModel.modelOnly === true && readyModel.commandCenterVisible === false);
addCheck("models reuse P119.2 schema metadata", defaultModel.sourceSchemaPhase === "P119.2" && readyModel.schemaEntityNames?.includes("founderApprovalDecisionRequests"));
addCheck("models are founder-useful", Boolean(readyModel.founderQuestion) && Boolean(readyModel.nextAction) && Boolean(readyModel.disabledReason) && Boolean(readyModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", readyModel.blockers.length > 0 && readyModel.evidenceLabels.length > 0 && readyModel.activityLabels.length > 0 && readyModel.costImpactLabel === "No provider spend");
addCheck("approval decisions are not recorded or persisted", defaultModel.approvalDecisionRecorded === false && defaultModel.approvalDecisionPersisted === false && readyModel.approvalDecisionRecorded === false && readyModel.approvalDecisionPersisted === false);
addCheck("approve/reject and execution unlock stay blocked", defaultModel.approvalDecisionAccepted === false && defaultModel.approvalDecisionRejected === false && defaultModel.executionUnlocked === false && readyModel.executionUnlocked === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(readyModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(modelSource));
addCheck("contract marks P119.3 complete and P119.4/P119.5 handoff valid", p1193.status === "complete" && ["planned", "complete"].includes(p1194.status) && ["planned", "complete"].includes(p1195.status));
addCheck("contract records expected exports", ["FOUNDER_APPROVAL_DECISION_INTENT_MODEL_PHASE", "FOUNDER_APPROVAL_DECISION_INTENT_STATES", "buildFounderApprovalDecisionIntentModel", "validateFounderApprovalDecisionIntentModel"].every((name) => p1193.expectedExports?.includes(name)));
addCheck("P119.2 checker accepts P119.3 handoff", p1192Checker.includes("P119.3") && p1192Checker.includes("P119.4") && p1192Checker.includes("scope check relaxed"));
addCheck("docs record P119.3", /P119\.3 Governed Local Approval Decision Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P119.3", /P119\.3 governed local approval decision intent model/i.test(readme) && /P119\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P119.3", /P119\.3 is complete/.test(platformRoadmap) && /P119\.4\s+is\s+next/.test(platformRoadmap));
const p1193HandoffAccepted = (status.currentPhase === "P119.3"
  && status.previousPhase === "P119.2"
  && status.nextPhase === "P119.4"
  && roadmap.currentPhase === "P119.3"
  && roadmap.previousPhase === "P119.2"
  && roadmap.nextPhase === "P119.4")
  || (status.currentPhase === "P119.4"
    && status.previousPhase === "P119.3"
    && status.nextPhase === "P119.5"
    && roadmap.currentPhase === "P119.4"
    && roadmap.previousPhase === "P119.3"
    && roadmap.nextPhase === "P119.5")
  || (status.currentPhase === "P119.5"
    && status.previousPhase === "P119.4"
    && status.nextPhase === "P119.6"
    && roadmap.currentPhase === "P119.5"
    && roadmap.previousPhase === "P119.4"
    && roadmap.nextPhase === "P119.6");
addCheck(
  "phase status advanced",
  p1193HandoffAccepted
    && statusById.get("P119")?.status === "in_progress"
    && statusById.get("P119.2")?.status === "complete"
    && statusById.get("P119.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P119.4")?.status)
    && roadmapById.get("P119.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P119.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P119.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_decision|approval_decision_requests|approval_decision_events|approval_decision_evidence_refs)/.test(publicDocsBundle));
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
        "- Validates P119.3 governed local approval decision intent model.",
        "- Confirms the model reuses P119.2 schema metadata and remains local, display-safe, and hidden from primary Command Center UX.",
        "- Does not record approve/reject decisions, persist decisions, write DB/runtime state, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1193.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P119.3 is a pure local model only. It does not capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P119.3 Founder Runtime Approval Decision Recording Boundary Intent Model Report", phase: "P119.3" },
);

printCheckReport("P119.3 Founder Runtime Approval Decision Recording Boundary Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
