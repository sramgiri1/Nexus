import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS,
  P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS,
  P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE,
} from "../live-ready/founderLiveOperatorDecisionLedgerBoundary.js";
import {
  P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_MODEL_PHASE,
  P109_OPERATOR_DECISION_LEDGER_MODEL_STATES,
  buildFounderLiveOperatorDecisionLedgerModel,
  validateFounderLiveOperatorDecisionLedgerModel,
} from "../live-ready/founderLiveOperatorDecisionLedgerModel.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1092-founder-live-operator-decision-ledger-model-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
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
const p1091Checker = readText("scripts/check-p1091-founder-live-operator-decision-ledger-contract.js");
const source = readText("live-ready/founderLiveOperatorDecisionLedgerModel.js");
const envelope = buildFounderLiveOperatorDecisionLedgerModel({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveOperatorDecisionLedgerModel(envelope);
const data = envelope.data || {};
const p1092 = subphaseById.get("P109.2") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1092-founder-live-operator-decision-ledger-model"]));
addCheck("contract marks P109.2 complete", contract.status === "in_progress" && p1092.status === "complete" && subphaseById.get("P109.1")?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P109.3")?.status));
addCheck("P109.2 is NEXUS OS scoped", p1092.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("P109.2 records exact implementation files", (p1092.allowedFiles || []).includes("live-ready/founderLiveOperatorDecisionLedgerModel.js") && (p1092.allowedFiles || []).includes("scripts/check-p1092-founder-live-operator-decision-ledger-model.js"));
addCheck("P109.2 avoids forbidden file scope", !(p1092.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P109.2 expected exports present", ["P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_MODEL_PHASE", "P109_OPERATOR_DECISION_LEDGER_MODEL_STATES", "buildFounderLiveOperatorDecisionLedgerModel", "validateFounderLiveOperatorDecisionLedgerModel"].every((name) => p1092.expectedExports?.includes(name)));
addCheck("module reuses P109.1 boundary and P108 audit preview", source.includes("buildFounderLiveOperatorDecisionLedgerBoundary") && source.includes("buildFounderLiveApprovalOperatorReviewAuditPreview"));
addCheck("phase constant", P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_MODEL_PHASE === "P109.2");
addCheck("state constant", P109_OPERATOR_DECISION_LEDGER_MODEL_STATES.LEDGER_CANDIDATES_READY_WRITES_BLOCKED.includes("writes_blocked"));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && data.operatorDecisionLedgerModelSummary && Array.isArray(data.operatorDecisionLedgerCandidates) && data.sourceDecisionLedgerBoundaryPhase === "P109.1");
addCheck("decision-ledger candidates useful", data.operatorDecisionLedgerCandidates?.length === 6 && data.operatorDecisionLedgerCandidates.every((candidate) => candidate.candidateKey && candidate.displayLabel && candidate.requiredEvidence?.length >= 40 && candidate.disabledReason));
addCheck("model readiness blocks unsafe counts", data.operatorDecisionLedgerModelSummary?.ledgerCandidateRecordCount === 6 && data.operatorDecisionLedgerModelSummary?.capturedOperatorDecisionCount === 0 && data.operatorDecisionLedgerModelSummary?.persistedOperatorDecisionCount === 0 && data.operatorDecisionLedgerModelSummary?.writableLedgerDecisionCount === 0 && data.operatorDecisionLedgerModelSummary?.dbWriteCount === 0 && data.operatorDecisionLedgerModelSummary?.executableLedgerDecisionCount === 0);
addCheck("required evidence retained", P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.length >= 40 && data.requiredEvidence?.includes("operatorDecisionLedgerWritePathReviewed") && data.operatorDecisionLedgerCandidates?.every((candidate) => candidate.missingEvidence?.includes("operatorDecisionLedgerDbWriteBoundaryReviewed")));
addCheck("forbidden actions retained", P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS.includes("operator decision ledger write") && data.forbiddenActions?.includes("operator decision ledger replay"));
addCheck("all blocked flags false", P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.operatorDecisionLedgerCandidates?.every((candidate) => candidate[flag] === false)));
addCheck("ledger model cannot write or unlock execution", data.operatorDecisionLedgerModelSummary?.ledgerWriteCount === 0 && data.operatorDecisionLedgerModelSummary?.runtimeAdmissionLedgerDecisionCount === 0 && data.operatorDecisionLedgerCandidates?.every((candidate) => candidate.operatorDecisionLedgerWriteAllowed === false && candidate.executionUnlockAllowed === false));
addCheck("contract records validation commands", ["npm run check:p1092-founder-live-operator-decision-ledger-model", "npm run check:p1091-founder-live-operator-decision-ledger-contract", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1092.validationCommands?.includes(command)));
addCheck("plan records P109.2 complete", /P109\.2 Decision Ledger Model[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P109.2", /P109\.2 is\s+complete/.test(platformRoadmap) && /P109\.3 is\s+next/.test(platformRoadmap));
addCheck("README records P109.2", /P109\.2 decision-ledger model/.test(readme) && /P109\.3\s+is next/.test(readme));
addCheck(
  "phase status advanced to P109.2",
  ["P109.2", "P109.3", "P109.4", "P109.5"].includes(status.currentPhase)
    && ["P109.1", "P109.2", "P109.3", "P109.4"].includes(status.previousPhase)
    && ["P109.3", "P109.4", "P109.5", "P109.6"].includes(status.nextPhase)
    && statusById.get("P109")?.status === "in_progress"
    && statusById.get("P109.1")?.status === "complete"
    && statusById.get("P109.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P109.3")?.status)
    && roadmapById.get("P109")?.status === "in_progress"
    && roadmapById.get("P109.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P109")?.status}`,
);
addCheck("P109.1 checker accepts P109.2 handoff", p1091Checker.includes("P109.2") && p1091Checker.includes("P109.3"));
addCheck("decision-ledger model stays Command Center hidden", data.commandCenterVisible === false);
addCheck("schema avoids raw private IDs", !/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serialized));
addCheck("schema avoids unsafe runnable action text", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(serialized));
addCheck("schema avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedData));
addCheck("docs do not claim ledger writes live", !/operator decision ledger writes are enabled|decision ledger is writable|approval capture is live|operator decision capture is live|runtime admission is enabled|provider spend is enabled/i.test(serialized));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P109.2 deterministic local founder live operator decision-ledger candidate records.",
        "- Confirms decision-ledger candidates cannot capture, persist, write ledger or DB records, replay, unlock execution, or admit runtime execution.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, runtime admission, ledger writes, DB writes, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1092-founder-live-operator-decision-ledger-model",
        "- npm run check:p1091-founder-live-operator-decision-ledger-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P109.2 is local model only. It does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P109.2 Founder Live Operator Decision Ledger Model Report", phase: "P109.2" },
);

printCheckReport("P109.2 Founder Live Operator Decision Ledger Model Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
