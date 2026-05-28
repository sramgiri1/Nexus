import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";
import {
  buildFounderLiveOperatorDecisionLedgerBoundary,
  validateFounderLiveOperatorDecisionLedgerBoundary,
} from "../live-ready/founderLiveOperatorDecisionLedgerBoundary.js";
import {
  buildFounderLiveOperatorDecisionLedgerModel,
  validateFounderLiveOperatorDecisionLedgerModel,
} from "../live-ready/founderLiveOperatorDecisionLedgerModel.js";
import {
  buildFounderLiveOperatorDecisionLedgerAuditPreview,
  validateFounderLiveOperatorDecisionLedgerAuditPreview,
} from "../live-ready/founderLiveOperatorDecisionLedgerAuditPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1095-founder-live-operator-decision-ledger-validation-report.md";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function currentChangedFiles() {
  try {
    return execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .map((line) => line.slice(3).trim())
      .map((line) => line.replace(/^.* -> /, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
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
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const dataSource = readText("dashboard/src/data/businessBuild.js");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1091Checker = readText("scripts/check-p1091-founder-live-operator-decision-ledger-contract.js");
const p1092Checker = readText("scripts/check-p1092-founder-live-operator-decision-ledger-model.js");
const p1093Checker = readText("scripts/check-p1093-founder-live-operator-decision-ledger-audit-preview.js");
const p1094Checker = readText("scripts/check-p1094-command-center-decision-ledger-ux.js");
const p1095 = subphaseById.get("P109.5") || {};
const forbiddenPrefixes = [
  "projects/",
  "careloop/",
  "dashboard/src/",
  "dashboard/tests/",
  "providers/",
  "tools/",
  "worker-runtime/",
  "deploy/",
  "release/",
  "exports/",
  "packages/",
];
const p109Scripts = [
  "check:p1091-founder-live-operator-decision-ledger-contract",
  "check:p1092-founder-live-operator-decision-ledger-model",
  "check:p1093-founder-live-operator-decision-ledger-audit-preview",
  "check:p1094-command-center-decision-ledger-ux",
  "check:p1095-founder-live-operator-decision-ledger-validation",
];
const p109Reports = [
  "reports/p1091-founder-live-operator-decision-ledger-contract-report.md",
  "reports/p1092-founder-live-operator-decision-ledger-model-report.md",
  "reports/p1093-founder-live-operator-decision-ledger-audit-preview-report.md",
  "reports/p1094-command-center-decision-ledger-ux-report.md",
];
const validationCommands = [
  "npm run check:p1095-founder-live-operator-decision-ledger-validation",
  "npm run check:p1094-command-center-decision-ledger-ux",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live decision ledger appears on non-chat founder routes\"",
  "cd dashboard && npm run build",
  "npm run check:p1093-founder-live-operator-decision-ledger-audit-preview",
  "npm run check:p1092-founder-live-operator-decision-ledger-model",
  "npm run check:p1091-founder-live-operator-decision-ledger-contract",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];
const boundaryEnvelope = buildFounderLiveOperatorDecisionLedgerBoundary({ founderIdea: "Build a simple iOS Snake game for the App Store" });
const modelEnvelope = buildFounderLiveOperatorDecisionLedgerModel({ decisionLedgerBoundaryEnvelope: boundaryEnvelope });
const auditPreviewEnvelope = buildFounderLiveOperatorDecisionLedgerAuditPreview({ decisionLedgerModelEnvelope: modelEnvelope });
const boundaryValidation = validateFounderLiveOperatorDecisionLedgerBoundary(boundaryEnvelope);
const modelValidation = validateFounderLiveOperatorDecisionLedgerModel(modelEnvelope);
const auditValidation = validateFounderLiveOperatorDecisionLedgerAuditPreview(auditPreviewEnvelope);
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const decisionLedger = build.founderLiveOperatorDecisionLedger || {};
const serializedDecisionLedger = JSON.stringify(decisionLedger);
const serializedAuditPreview = JSON.stringify(auditPreviewEnvelope.data || {});
const currentDiffFiles = currentChangedFiles();
const enforceCurrentDiffScope = status.currentPhase === "P109.5";
const p109AllowedFiles = new Set([
  ...(p1095.allowedFiles || []),
  "reports/os-phase-status-report.md",
  "reports/phase-validation-coverage-report.md",
  ...p109Reports,
]);

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1095-founder-live-operator-decision-ledger-validation"]));
addCheck("all P109 scripts registered", p109Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P109 reports exist", p109Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks P109.1-P109.5 complete", ["P109.1", "P109.2", "P109.3", "P109.4", "P109.5"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("contract keeps P109.6 planned or complete", ["planned", "complete"].includes(subphaseById.get("P109.6")?.status));
addCheck("contract records aggregate validation commands", validationCommands.every((command) => p1095.validationCommands?.includes(command)));
addCheck("P109.5 avoids forbidden file scope", !(p1095.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck(
  "working diff stays in P109.5 allowed scope",
  !enforceCurrentDiffScope || currentDiffFiles.every((file) => p109AllowedFiles.has(file)),
  enforceCurrentDiffScope ? currentDiffFiles.join(", ") : `scope check relaxed for ${status.currentPhase}`,
);
addCheck("decision ledger boundary schema validates", boundaryValidation.valid, boundaryValidation.errors.join("; "));
addCheck("decision ledger model schema validates", modelValidation.valid, modelValidation.errors.join("; "));
addCheck("decision ledger audit preview schema validates", auditValidation.valid, auditValidation.errors.join("; "));
addCheck("boundary readiness remains blocked", boundaryEnvelope.data?.operatorDecisionLedgerReadiness?.ledgerCandidateCount === 6 && boundaryEnvelope.data?.operatorDecisionLedgerReadiness?.writableLedgerDecisionCount === 0 && boundaryEnvelope.data?.operatorDecisionLedgerReadiness?.dbWriteCount === 0);
addCheck("model readiness remains blocked", modelEnvelope.data?.operatorDecisionLedgerModelSummary?.ledgerCandidateRecordCount === 6 && modelEnvelope.data?.operatorDecisionLedgerModelSummary?.writableLedgerDecisionCount === 0 && modelEnvelope.data?.operatorDecisionLedgerModelSummary?.dbWriteCount === 0);
addCheck("audit preview remains blocked", auditPreviewEnvelope.data?.operatorDecisionLedgerAuditSummary?.auditPreviewCount === 6 && auditPreviewEnvelope.data?.operatorDecisionLedgerAuditSummary?.capturableOperatorDecisionCount === 0 && auditPreviewEnvelope.data?.operatorDecisionLedgerAuditSummary?.dbWriteCount === 0);
addCheck("dashboard data and page still expose decision ledger UX", dataSource.includes("founderLiveOperatorDecisionLedger") && dataSource.includes("buildFounderLiveOperatorDecisionLedgerDisplayModel") && pageSource.includes("FounderLiveOperatorDecisionLedgerCard"));
addCheck("dashboard data remains browser safe", !dataSource.includes("founderLiveOperatorDecisionLedgerAuditPreview.js") && !dataSource.includes("node:fs"));
addCheck("route safety coverage retained", routeTests.includes("Founder live decision ledger appears on non-chat founder routes") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness") && routeTests.includes("Decision ledger read-only"));
addCheck("decision ledger UX remains useful", decisionLedger.auditPreviewCount === 6 && decisionLedger.blockedAuditPreviewCount === 6 && decisionLedger.auditRows?.length === 6 && decisionLedger.auditRows?.some((row) => row.proposedAgentLane === "Product Strategist"));
addCheck("decision ledger unsafe counts remain zero", decisionLedger.capturableOperatorDecisionCount === 0 && decisionLedger.persistedOperatorDecisionCount === 0 && decisionLedger.writableLedgerDecisionCount === 0 && decisionLedger.dbWriteCount === 0 && decisionLedger.replayableLedgerDecisionCount === 0 && decisionLedger.executableLedgerDecisionCount === 0 && decisionLedger.dispatchableLedgerDecisionCount === 0 && decisionLedger.projectMutationLedgerDecisionCount === 0 && decisionLedger.providerSpendLedgerDecisionCount === 0);
addCheck("decision ledger rows remain blocked", decisionLedger.auditRows?.every((row) => row.operatorDecisionCaptured === "Blocked" && row.operatorDecisionPersisted === "Blocked" && row.operatorDecisionLedgerWriteAllowed === "Blocked" && row.operatorDecisionLedgerDbWriteAllowed === "Blocked" && row.replayAllowed === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked" && row.dispatchAllowed === "Blocked"));
addCheck("chat and lite stay clean in source", !pageSource.includes("Chat Decision Ledger") && !pageSource.includes("Lite Decision Ledger"));
addCheck("handoff compatibility retained", p1091Checker.includes("P109.5") && p1092Checker.includes("P109.5") && p1093Checker.includes("P109.5") && p1094Checker.includes("P109.5"));
addCheck("docs record P109.5", /P109\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P109.5", /P109\.5 is\s+complete/.test(platformRoadmap) && (/P109\.6 is\s+next/.test(platformRoadmap) || /P109\.6 is\s+complete/.test(platformRoadmap)));
addCheck("README records P109.5", /P109\.5 aggregate validation/.test(readme) && (/P109\.6\s+is\s+next/.test(readme) || /P109\.6 docs closure/.test(readme)));
addCheck(
  "phase status advanced",
  ["P109.5", "P109.6", "P109.7"].includes(status.currentPhase)
    && ["P109.4", "P109.5", "P109.6"].includes(status.previousPhase)
    && ["P109.6", "P109.7", "P110"].includes(status.nextPhase)
    && statusById.get("P109")?.status === "in_progress"
    && statusById.get("P109.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P109.6")?.status)
    && roadmapById.get("P109.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("aggregate UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDecisionLedger));
addCheck("aggregate UX avoids raw packet keys", !/(candidateKey|previewRef|operatorDecisionLedgerKey|recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedDecisionLedger));
addCheck("aggregate audit preview remains hidden from primary UX", /(candidateKey|previewRef)/.test(serializedAuditPreview) && !/(candidateKey|previewRef)/.test(serializedDecisionLedger));
addCheck("aggregate UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(serializedDecisionLedger));
addCheck("aggregate UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedDecisionLedger));
addCheck("DemoApp not exposed in Command Center source", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P109 founder live operator decision-ledger coverage across contract, boundary schema, local model, audit preview, Command Center UX, route tests, docs, reports, and phase status.",
        "- Confirms decision-ledger UX remains display-safe, useful, non-runnable, and absent from Chat with NEXUS/Lite.",
        "- Does not enable operator decision capture, persistence, ledger writes, DB writes, replay, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1095-founder-live-operator-decision-ledger-validation",
        "- npm run check:p1094-command-center-decision-ledger-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live decision ledger appears on non-chat founder routes\"",
        "- cd dashboard && npm run build",
        "- npm run check:p1093-founder-live-operator-decision-ledger-audit-preview",
        "- npm run check:p1092-founder-live-operator-decision-ledger-model",
        "- npm run check:p1091-founder-live-operator-decision-ledger-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P109.5 is validation only. It does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P109.5 Founder Live Operator Decision Ledger Validation Report", phase: "P109.5" },
);

printCheckReport("P109.5 Founder Live Operator Decision Ledger Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
