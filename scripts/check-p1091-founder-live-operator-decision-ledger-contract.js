import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_BOUNDARY_PHASE,
  P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS,
  P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS,
  P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE,
  P109_OPERATOR_DECISION_LEDGER_STATES,
  buildFounderLiveOperatorDecisionLedgerBoundary,
  validateFounderLiveOperatorDecisionLedgerBoundary,
} from "../live-ready/founderLiveOperatorDecisionLedgerBoundary.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1091-founder-live-operator-decision-ledger-contract-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function changedPaths() {
  return execFileSync("git", ["status", "--short", "--porcelain"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => line.slice(3));
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

const packageJson = readJson("package.json");
const contract = readJson("contracts/os-roadmap/p109-founder-live-operator-decision-ledger-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const p1087Checker = readText("scripts/check-p1087-founder-live-approval-operator-review-final.js");
const source = readText("live-ready/founderLiveOperatorDecisionLedgerBoundary.js");
const envelope = buildFounderLiveOperatorDecisionLedgerBoundary({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveOperatorDecisionLedgerBoundary(envelope);
const data = envelope.data || {};
const p1091 = subphaseById.get("P109.1") || {};
const p109Subphases = ["P109.1", "P109.2", "P109.3", "P109.4", "P109.5", "P109.6", "P109.7"];
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/", ".env"];
const allowedChangedPrefixes = [
  "contracts/os-roadmap/p109-founder-live-operator-decision-ledger-contracts.json",
  "docs/architecture/P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PLAN.md",
  "live-ready/founderLiveOperatorDecisionLedgerBoundary.js",
  "live-ready/founderLiveOperatorDecisionLedgerModel.js",
  "scripts/check-p1091-founder-live-operator-decision-ledger-contract.js",
  "scripts/check-p1092-founder-live-operator-decision-ledger-model.js",
  "scripts/check-p1087-founder-live-approval-operator-review-final.js",
  "scripts/check-os-phase-status.js",
  "package.json",
  "README.md",
  "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",
  "os-roadmap/phase-status.json",
  "os-roadmap/nexus-phases.json",
  "reports/p1091-founder-live-operator-decision-ledger-contract-report.md",
  "reports/p1092-founder-live-operator-decision-ledger-model-report.md",
  "reports/p1087-founder-live-approval-operator-review-final-report.md",
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const serializedData = JSON.stringify(data);
const changed = changedPaths();
const enforceCurrentDiffScope = status.currentPhase === "P109.1";

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1091-founder-live-operator-decision-ledger-contract"]));
addCheck("contract phase identity", contract.phaseId === "P109" && contract.title === "Founder Live Operator Decision Ledger Readiness");
addCheck("contract is NEXUS OS scoped", contract.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("subphase split exists", p109Subphases.every((phaseId) => subphaseById.has(phaseId)));
addCheck("P109.1 complete and later subphases valid", subphaseById.get("P109.1")?.status === "complete" && p109Subphases.slice(1).every((phaseId) => ["planned", "complete"].includes(subphaseById.get(phaseId)?.status)));
addCheck("P109.1 includes implementation-grade fields", Boolean(p1091.narrowGoal && p1091.allowedFiles && p1091.forbiddenFiles && p1091.exactFiles && p1091.validationCommands && p1091.finalSafetyChecks && p1091.finalResponseChecklist));
addCheck("safety rules block ledger writes and unsafe execution", [
  "No approval capture.",
  "No operator decision capture.",
  "No operator decision persistence.",
  "No operator decision ledger writes.",
  "No DB writes or hosted DB mutation.",
  "No runtime admission or live mode transition.",
  "No execution unlock.",
  "No provider/model calls.",
  "No agent dispatch.",
  "No worker/tool execution.",
  "No project source mutation.",
].every((rule) => contract.safetyRules?.includes(rule)));
addCheck("reuse rules reference shared helpers and P108 audit preview", ["shared/reportWriter.js", "shared/resultEnvelope.js", "shared/checkResultFormatter.js", "live-ready/founderLiveApprovalOperatorReviewAuditPreview.js"].every((item) => contract.reuseRequired?.includes(item)));
addCheck("module reuses P108 operator-review audit preview", source.includes("buildFounderLiveApprovalOperatorReviewAuditPreview"));
addCheck("expected exports present", ["P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_BOUNDARY_PHASE", "P109_OPERATOR_DECISION_LEDGER_STATES", "P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS", "P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE", "P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS", "buildFounderLiveOperatorDecisionLedgerBoundary", "validateFounderLiveOperatorDecisionLedgerBoundary"].every((name) => p1091.expectedExports?.includes(name)));
addCheck("phase constant", P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_BOUNDARY_PHASE === "P109.1");
addCheck("state constant", P109_OPERATOR_DECISION_LEDGER_STATES.LEDGER_BOUNDARY_READY_WRITES_BLOCKED.includes("writes_blocked"));
addCheck("required evidence includes ledger boundary needs", P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.length >= 40 && P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.includes("operatorDecisionLedgerWritePathReviewed") && P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.includes("operatorDecisionLedgerDbWriteBoundaryReviewed"));
addCheck("forbidden actions cover ledger write and replay", P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS.includes("operator decision ledger write") && P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS.includes("operator decision ledger replay"));
addCheck("blocked flags cover ledger write and DB", ["operatorDecisionLedgerWriteAllowed", "operatorDecisionLedgerPersistenceAllowed", "operatorDecisionLedgerDbWriteAllowed", "operatorDecisionLedgerHostedDbWriteAllowed", "operatorDecisionLedgerRuntimeAdmissionAllowed"].every((flag) => P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS.includes(flag)));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && data.operatorDecisionLedgerShape && data.operatorDecisionLedgerReadiness && data.sourceOperatorReviewAuditPreviewPhase === "P108.3");
addCheck("ledger readiness is local and blocked", data.operatorDecisionLedgerReadiness?.sourceAuditPreviewCount === 6 && data.operatorDecisionLedgerReadiness?.ledgerCandidateCount === 6 && data.operatorDecisionLedgerReadiness?.writableLedgerDecisionCount === 0 && data.operatorDecisionLedgerReadiness?.persistedLedgerDecisionCount === 0 && data.operatorDecisionLedgerReadiness?.dbWriteCount === 0 && data.operatorDecisionLedgerReadiness?.executableLedgerDecisionCount === 0);
addCheck("all blocked flags false", P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.operatorDecisionLedgerShape?.[flag] === false));
addCheck("contract records validation commands", ["npm run check:p1091-founder-live-operator-decision-ledger-contract", "npm run check:p1087-founder-live-approval-operator-review-final", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1091.validationCommands?.includes(command)));
addCheck("P109.1 avoids forbidden file scope", !(p1091.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "current changed files stay in P109.1 scope",
  !enforceCurrentDiffScope || changed.every((file) => allowedChangedPrefixes.includes(file)),
  enforceCurrentDiffScope ? changed.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("plan records P109.1 complete", /P109\.1 Decision Ledger Contract \/ Schema Baseline[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P109.1", /P109 - Founder Live Operator Decision Ledger Readiness/.test(platformRoadmap) && /P109\.1 is\s+complete/.test(platformRoadmap) && /P109\.2 is\s+next/.test(platformRoadmap));
addCheck("README records P109.1", /P109\.1 decision-ledger boundary/.test(readme) && /P109\.2 is next/.test(readme));
addCheck(
  "phase status advanced to P109.1",
  ["P109.1", "P109.2", "P109.3", "P109.4", "P109.5"].includes(status.currentPhase)
    && ["P108.7", "P109.1", "P109.2", "P109.3", "P109.4"].includes(status.previousPhase)
    && ["P109.2", "P109.3", "P109.4", "P109.5", "P109.6"].includes(status.nextPhase)
    && statusById.get("P108")?.status === "complete"
    && statusById.get("P109")?.status === "in_progress"
    && statusById.get("P109.1")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P109.2")?.status)
    && roadmapById.get("P109")?.status === "in_progress"
    && roadmapById.get("P109.1")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P109")?.status}`,
);
addCheck("phase status checker accepts P109 subphases", ["P109", ...p109Subphases].every((phaseId) => osStatusChecker.includes(`"${phaseId}"`)));
addCheck("P108.7 checker accepts P109.1 handoff", p1087Checker.includes("p109ActiveState") && p1087Checker.includes("P109.1") && p1087Checker.includes("P109.2"));
addCheck("ledger boundary stays Command Center hidden", data.commandCenterVisible === false);
addCheck("schema avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("schema avoids raw packet keys", !/(recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|operatorDecisionLedgerKey)/.test(serializedData));
addCheck("schema avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(serialized));
addCheck("schema avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("docs do not claim ledger writes live", !/operator decision ledger writes are enabled|decision ledger is writable|approval capture is live|operator decision capture is live|runtime admission is enabled|provider spend is enabled/i.test(serialized));
addCheck("reports path reserved", REPORT_PATH.endsWith("p1091-founder-live-operator-decision-ledger-contract-report.md") && existsSync(join(ROOT, "reports")));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P109.1 founder live operator decision ledger readiness contract and local schema.",
        "- Confirms operator decisions cannot be captured, persisted, written to a ledger or DB, replayed, admitted to runtime, or used to unlock execution.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, runtime admission, execution unlock, ledger writes, DB writes, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1091-founder-live-operator-decision-ledger-contract",
        "- npm run check:p1087-founder-live-approval-operator-review-final",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P109.1 is contract/schema only. It does not capture operator decisions, persist approval state, write ledger or DB records, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P109.1 Founder Live Operator Decision Ledger Contract Report", phase: "P109.1" },
);

printCheckReport("P109.1 Founder Live Operator Decision Ledger Contract Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
