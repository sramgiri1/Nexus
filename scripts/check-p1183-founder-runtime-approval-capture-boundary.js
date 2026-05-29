import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE,
  FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_VERSION,
  FOUNDER_APPROVAL_CAPTURE_INTENT_STATES,
  buildFounderApprovalCaptureIntentModel,
  validateFounderApprovalCaptureIntentModel,
} from "../shared/founderApprovalCaptureIntentModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1183-founder-runtime-approval-capture-boundary-report.md";

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
const contract = readJson("contracts/os-roadmap/p118-founder-runtime-approval-capture-boundary-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const p1183 = subphaseById.get("P118.3") || {};
const p1184 = subphaseById.get("P118.4") || {};
const plan = readText("docs/architecture/P118_FOUNDER_RUNTIME_APPROVAL_CAPTURE_BOUNDARY_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const p1182Checker = readText("scripts/check-p1182-founder-runtime-approval-capture-boundary.js");
const modelSource = readText("shared/founderApprovalCaptureIntentModel.js");
const defaultModel = buildFounderApprovalCaptureIntentModel();
const readyModel = buildFounderApprovalCaptureIntentModel({
  intentState: "ready_for_future_capture_boundary",
  founderQuestion: "Can this future execution request be reviewed by the founder?",
  requestedDecisionLabel: "Founder approval review readiness",
  blockers: ["Capture UI is not enabled.", "Decision persistence is not enabled."],
});
const defaultValidation = validateFounderApprovalCaptureIntentModel(defaultModel);
const readyValidation = validateFounderApprovalCaptureIntentModel(readyModel);
const invalidValidation = validateFounderApprovalCaptureIntentModel({
  ...readyModel,
  intentState: "approve_now",
  approvalDecisionRecorded: true,
});
const changed = changedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P118.3";
const allowedFiles = new Set(p1183.allowedFiles || []);
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

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1183-founder-runtime-approval-capture-boundary"]));
addCheck("phase export is P118.3", FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE === "P118.3" && FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_VERSION === "1.0");
addCheck("intent states are allowlisted", FOUNDER_APPROVAL_CAPTURE_INTENT_STATES.length === 4 && FOUNDER_APPROVAL_CAPTURE_INTENT_STATES.includes("blocked_no_capture") && !FOUNDER_APPROVAL_CAPTURE_INTENT_STATES.includes("approved"));
addCheck("default model validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("ready model validates", readyValidation.valid, readyValidation.errors.join("; "));
addCheck("invalid model is rejected", invalidValidation.valid === false && invalidValidation.errors.some((error) => /allowlisted|decisions/i.test(error)));
addCheck("models are local and hidden", defaultModel.modelOnly === true && defaultModel.commandCenterVisible === false && readyModel.modelOnly === true && readyModel.commandCenterVisible === false);
addCheck("models reuse P118.2 schema metadata", defaultModel.sourceSchemaPhase === "P118.2" && readyModel.schemaEntityNames?.includes("founderApprovalCaptureRequests"));
addCheck("models are founder-useful", Boolean(readyModel.founderQuestion) && Boolean(readyModel.nextAction) && Boolean(readyModel.disabledReason) && Boolean(readyModel.ownerCapability));
addCheck("models keep blockers and evidence/activity/cost labels", readyModel.blockers.length > 0 && readyModel.evidenceLabels.length > 0 && readyModel.activityLabels.length > 0 && readyModel.costImpactLabel === "No provider spend");
addCheck("approval decisions are not recorded", defaultModel.approvalDecisionRecorded === false && defaultModel.approvalIntentRecorded === false && readyModel.approvalDecisionRecorded === false && readyModel.approvalIntentRecorded === false);
addCheck("authority flags stay blocked", allFlagsFalse(defaultModel) && allFlagsFalse(readyModel));
addCheck("model has no DB/runtime/provider imports", !/from\s+["']\.\.\/db|from\s+["']\.\.\/local-state|from\s+["']\.\.\/providers|from\s+["']\.\.\/tools|sqlite|CREATE TABLE|INSERT INTO|UPDATE\s+/i.test(modelSource));
addCheck("contract marks P118.3 complete", p1183.status === "complete" && ["planned", "complete"].includes(p1184.status));
addCheck("contract records expected exports", ["FOUNDER_APPROVAL_CAPTURE_INTENT_MODEL_PHASE", "FOUNDER_APPROVAL_CAPTURE_INTENT_STATES", "buildFounderApprovalCaptureIntentModel", "validateFounderApprovalCaptureIntentModel"].every((name) => p1183.expectedExports?.includes(name)));
addCheck("P118.2 checker accepts P118.3 handoff", p1182Checker.includes("P118.3") && p1182Checker.includes("P118.4") && p1182Checker.includes("scope check relaxed"));
addCheck("docs record P118.3", /P118\.3 Governed Local Approval Intent Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P118.3", /P118\.3 governed local approval intent model/i.test(readme) && /P118\.4\s+is\s+next/.test(readme));
addCheck("platform roadmap records P118.3", /P118\.3 is complete/.test(platformRoadmap) && /P118\.4\s+is\s+next/.test(platformRoadmap));
const p1183HandoffAccepted = (status.currentPhase === "P118.3"
  && status.previousPhase === "P118.2"
  && status.nextPhase === "P118.4"
  && roadmap.currentPhase === "P118.3"
  && roadmap.previousPhase === "P118.2"
  && roadmap.nextPhase === "P118.4")
  || (status.currentPhase === "P118.4"
    && status.previousPhase === "P118.3"
    && status.nextPhase === "P118.5"
    && roadmap.currentPhase === "P118.4"
    && roadmap.previousPhase === "P118.3"
    && roadmap.nextPhase === "P118.5")
  || (status.currentPhase === "P118.5"
    && status.previousPhase === "P118.4"
    && status.nextPhase === "P118.6"
    && roadmap.currentPhase === "P118.5"
    && roadmap.previousPhase === "P118.4"
    && roadmap.nextPhase === "P118.6");
addCheck(
  "phase status advanced",
  p1183HandoffAccepted
    && statusById.get("P118")?.status === "in_progress"
    && statusById.get("P118.2")?.status === "complete"
    && statusById.get("P118.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P118.4")?.status)
    && roadmapById.get("P118.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck(
  "changed files stay in P118.3 allowed scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedFiles.has(file) || file === REPORT_PATH),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck(
  "forbidden paths unchanged",
  !enforceCurrentDiffScope || changed.every((file) => !forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  enforceCurrentDiffScope ? changed.join(", ") : `P118.3 forbidden path check relaxed for ${status.currentPhase}`,
);
addCheck("public docs avoid raw table names", !/(founder_runtime_approval_capture|approval_capture_requests|approval_capture_events|approval_capture_evidence_refs)/.test(publicDocsBundle));
addCheck("models avoid raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedModels));
addCheck("models avoid fake runnable actions", !/approve now|reject now|run now|execute now|deploy now|apply now|call provider now|create project now|dispatch agent now|write sqlite now|write approval now|unlock execution now/i.test(serializedModels));
addCheck("docs avoid unsafe positive claims", !hasUnsafePositiveClaim(docsBundle, /approval capture is enabled|approval persistence is enabled|approval decision recording is enabled|runtime execution is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|raw SQL is allowed/i));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P118.3 governed local approval intent model.",
        "- Confirms the model reuses P118.2 schema metadata and remains in-memory, display-safe, and hidden from primary Command Center UX.",
        "- Does not record approve/reject decisions, write DB/runtime state, enable approval capture, unlock runtime execution, call providers/models, dispatch agents, mutate projects, deploy, release, export, package, use network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: p1183.validationCommands.map((command) => `- ${command}`).join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P118.3 is a pure local model only. It does not capture approvals, persist approvals, record approve/reject decisions, write DB/runtime records, unlock execution, run runtime work, call providers/models, dispatch agents, execute workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P118.3 Founder Runtime Approval Capture Boundary Intent Model Report", phase: "P118.3" },
);

printCheckReport("P118.3 Founder Runtime Approval Capture Boundary Intent Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
