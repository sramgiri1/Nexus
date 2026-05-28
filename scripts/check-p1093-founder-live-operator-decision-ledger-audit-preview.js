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
  P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_PHASE,
  P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES,
  buildFounderLiveOperatorDecisionLedgerAuditPreview,
  validateFounderLiveOperatorDecisionLedgerAuditPreview,
} from "../live-ready/founderLiveOperatorDecisionLedgerAuditPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1093-founder-live-operator-decision-ledger-audit-preview-report.md";

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
const p1092Checker = readText("scripts/check-p1092-founder-live-operator-decision-ledger-model.js");
const source = readText("live-ready/founderLiveOperatorDecisionLedgerAuditPreview.js");
const envelope = buildFounderLiveOperatorDecisionLedgerAuditPreview({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const validation = validateFounderLiveOperatorDecisionLedgerAuditPreview(envelope);
const data = envelope.data || {};
const p1093 = subphaseById.get("P109.3") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serialized = JSON.stringify({ data, contract, plan, platformRoadmap, readme });
const serializedData = JSON.stringify(data);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1093-founder-live-operator-decision-ledger-audit-preview"]));
addCheck("contract marks P109.3 complete", contract.status === "in_progress" && p1093.status === "complete" && subphaseById.get("P109.2")?.status === "complete" && ["planned", "complete"].includes(subphaseById.get("P109.4")?.status));
addCheck("P109.3 is NEXUS OS scoped", p1093.scopeClassification === "NEXUS_OS_CHANGE");
addCheck("P109.3 records exact implementation files", (p1093.allowedFiles || []).includes("live-ready/founderLiveOperatorDecisionLedgerAuditPreview.js") && (p1093.allowedFiles || []).includes("scripts/check-p1093-founder-live-operator-decision-ledger-audit-preview.js"));
addCheck("P109.3 avoids forbidden file scope", !(p1093.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P109.3 expected exports present", ["P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_PHASE", "P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES", "buildFounderLiveOperatorDecisionLedgerAuditPreview", "validateFounderLiveOperatorDecisionLedgerAuditPreview"].every((name) => p1093.expectedExports?.includes(name)));
addCheck("module reuses P109.2 model", source.includes("buildFounderLiveOperatorDecisionLedgerModel"));
addCheck("phase constant", P109_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_PHASE === "P109.3");
addCheck("state constant", P109_OPERATOR_DECISION_LEDGER_AUDIT_PREVIEW_STATES.LEDGER_AUDIT_PREVIEW_READY_WRITES_BLOCKED.includes("writes_blocked"));
addCheck("schema validates", validation.valid, validation.errors.join("; "));
addCheck("schema shape", data.schemaVersion === "1.0" && data.operatorDecisionLedgerAuditSummary && Array.isArray(data.auditRows) && Array.isArray(data.auditSections) && data.sourceDecisionLedgerModelPhase === "P109.2");
addCheck("audit preview rows useful", data.auditRows?.length === 6 && data.auditRows.every((row) => row.previewRef && row.displayLabel && row.auditQuestions?.length >= 4 && row.disabledReason));
addCheck("audit sections useful", data.auditSections?.length === 1 && data.auditSections[0]?.auditPreviewCount === 6 && data.auditSections[0]?.blockedCount === 6);
addCheck("audit summary blocks unsafe counts", data.operatorDecisionLedgerAuditSummary?.auditPreviewCount === 6 && data.operatorDecisionLedgerAuditSummary?.capturableOperatorDecisionCount === 0 && data.operatorDecisionLedgerAuditSummary?.persistedOperatorDecisionCount === 0 && data.operatorDecisionLedgerAuditSummary?.writableLedgerDecisionCount === 0 && data.operatorDecisionLedgerAuditSummary?.dbWriteCount === 0 && data.operatorDecisionLedgerAuditSummary?.replayableLedgerDecisionCount === 0 && data.operatorDecisionLedgerAuditSummary?.executableLedgerDecisionCount === 0);
addCheck("required evidence retained", P109_OPERATOR_DECISION_LEDGER_REQUIRED_EVIDENCE.length >= 40 && data.requiredEvidence?.includes("operatorDecisionLedgerWritePathReviewed") && data.auditRows?.every((row) => row.missingEvidence?.includes("operatorDecisionLedgerDbWriteBoundaryReviewed")));
addCheck("forbidden actions retained", P109_OPERATOR_DECISION_LEDGER_FORBIDDEN_ACTIONS.includes("operator decision ledger write") && data.forbiddenActions?.includes("operator decision ledger replay"));
addCheck("all blocked flags false", P109_OPERATOR_DECISION_LEDGER_BLOCKED_FLAGS.every((flag) => data[flag] === false && data.auditRows?.every((row) => row[flag] === false)));
addCheck("ledger audit cannot write or unlock execution", data.operatorDecisionLedgerAuditSummary?.ledgerWriteCount === 0 && data.operatorDecisionLedgerAuditSummary?.runtimeAdmissionLedgerDecisionCount === 0 && data.auditRows?.every((row) => row.operatorDecisionLedgerWriteAllowed === false && row.executionUnlockAllowed === false));
addCheck("contract records validation commands", ["npm run check:p1093-founder-live-operator-decision-ledger-audit-preview", "npm run check:p1092-founder-live-operator-decision-ledger-model", "npm run check:os-phase-status", "npm run check:phase-validation-coverage", "git diff --check"].every((command) => p1093.validationCommands?.includes(command)));
addCheck("plan records P109.3 complete", /P109\.3 Decision Ledger Audit Preview[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P109.3", /P109\.3 is\s+complete/.test(platformRoadmap) && /P109\.4\s+is next/.test(platformRoadmap));
addCheck("README records P109.3", /P109\.3 decision-ledger audit preview/.test(readme) && /P109\.4\s+is next/.test(readme));
addCheck(
  "phase status advanced to P109.3",
  status.currentPhase === "P109.3"
    && status.previousPhase === "P109.2"
    && status.nextPhase === "P109.4"
    && statusById.get("P109")?.status === "in_progress"
    && statusById.get("P109.2")?.status === "complete"
    && statusById.get("P109.3")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P109.4")?.status)
    && roadmapById.get("P109")?.status === "in_progress"
    && roadmapById.get("P109.3")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P109")?.status}`,
);
addCheck("P109.2 checker accepts P109.3 handoff", p1092Checker.includes("P109.3") && p1092Checker.includes("P109.4"));
addCheck("decision-ledger audit preview stays Command Center hidden", data.commandCenterVisible === false);
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
        "- Validates P109.3 display-safe local founder live operator decision-ledger audit preview.",
        "- Confirms audit preview rows cannot capture, persist, write ledger or DB records, replay, unlock execution, or admit runtime execution.",
        "- Does not enable provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, runtime admission, ledger writes, DB writes, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1093-founder-live-operator-decision-ledger-audit-preview",
        "- npm run check:p1092-founder-live-operator-decision-ledger-model",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P109.3 is local audit preview only. It does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P109.3 Founder Live Operator Decision Ledger Audit Preview Report", phase: "P109.3" },
);

printCheckReport("P109.3 Founder Live Operator Decision Ledger Audit Preview Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
