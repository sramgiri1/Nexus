import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1094-command-center-decision-ledger-ux-report.md";

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
const dataSource = readText("dashboard/src/data/businessBuild.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1093Checker = readText("scripts/check-p1093-founder-live-operator-decision-ledger-audit-preview.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const decisionLedger = build.founderLiveOperatorDecisionLedger || {};
const p1094 = subphaseById.get("P109.4") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedDecisionLedger = JSON.stringify(decisionLedger);
const decisionLedgerUxText = [
  serializedDecisionLedger,
  "Founder Live Decision Ledger",
  "Business Build Decision Ledger",
  "Agent Flow Decision Ledger",
  "Live Readiness Decision Ledger",
  "Decision ledger read-only",
].join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1094-command-center-decision-ledger-ux"]));
addCheck("dashboard data exposes decision ledger", dataSource.includes("buildFounderLiveOperatorDecisionLedgerDisplayModel") && dataSource.includes("founderLiveOperatorDecisionLedger"));
addCheck("dashboard data stays browser safe", !dataSource.includes("founderLiveOperatorDecisionLedgerAuditPreview.js") && !dataSource.includes("node:fs"));
addCheck("page renders decision ledger only on non-chat founder routes", pageSource.includes("FounderLiveOperatorDecisionLedgerCard") && pageSource.includes("Business Build Decision Ledger") && pageSource.includes("Agent Flow Decision Ledger") && pageSource.includes("Live Readiness Decision Ledger") && !pageSource.includes("Chat Decision Ledger") && !pageSource.includes("Lite Decision Ledger"));
addCheck("route test covers decision ledger", routeTests.includes("Founder live decision ledger appears on non-chat founder routes") && routeTests.includes("Founder live decision ledger audit preview") && routeTests.includes("Decision ledger read-only"));
addCheck("decision ledger display model useful", decisionLedger.currentState?.includes("Decision Ledger") && decisionLedger.auditPreviewCount === 6 && decisionLedger.blockedAuditPreviewCount === 6 && decisionLedger.auditRows?.length === 6);
addCheck("decision ledger zeroes unsafe counts", decisionLedger.capturableOperatorDecisionCount === 0 && decisionLedger.persistedOperatorDecisionCount === 0 && decisionLedger.writableLedgerDecisionCount === 0 && decisionLedger.dbWriteCount === 0 && decisionLedger.replayableLedgerDecisionCount === 0 && decisionLedger.executableLedgerDecisionCount === 0 && decisionLedger.dispatchableLedgerDecisionCount === 0 && decisionLedger.projectMutationLedgerDecisionCount === 0);
addCheck("decision ledger rows display safe and blocked", decisionLedger.auditRows?.every((row) => row.operatorDecisionCaptured === "Blocked" && row.operatorDecisionPersisted === "Blocked" && row.operatorDecisionLedgerWriteAllowed === "Blocked" && row.operatorDecisionLedgerDbWriteAllowed === "Blocked" && row.replayAllowed === "Blocked" && row.executionUnlockAllowed === "Blocked" && row.runtimeAdmissionAllowed === "Blocked" && !("candidateKey" in row) && !("previewRef" in row) && !("operatorDecisionLedgerKey" in row)));
addCheck("decision ledger rows include useful value", decisionLedger.auditRows?.every((row) => row.proposedAgentLane && row.proposedOutcome && row.auditQuestions?.length >= 4 && row.validationCommand === "npm run check:p1093-founder-live-operator-decision-ledger-audit-preview"));
addCheck("safety rows retained", decisionLedger.safetyRows?.some((row) => row.label === "Ledger writes" && row.value === "Blocked") && decisionLedger.safetyRows?.some((row) => row.label === "DB writes" && row.value === "Blocked") && decisionLedger.safetyRows?.some((row) => row.label === "Provider spend" && row.value === "Blocked"));
addCheck("contract marks P109.4 complete", p1094.status === "complete");
addCheck("P109.5 remains planned or complete", ["planned", "complete"].includes(subphaseById.get("P109.5")?.status));
addCheck("docs record P109.4", /P109\.4 Command Center Decision Ledger UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P109.4", /P109\.4 is\s+complete/.test(platformRoadmap) && /P109\.5\s+is next/.test(platformRoadmap));
addCheck("README records P109.4", /P109\.4 Command Center decision-ledger UX/.test(readme) && /P109\.5\s+is next/.test(readme));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P109.4"
    && status.previousPhase === "P109.3"
    && status.nextPhase === "P109.5")
    || (status.currentPhase === "P109.5"
      && status.previousPhase === "P109.4"
      && status.nextPhase === "P109.6")
    || (status.currentPhase === "P109.6"
      && status.previousPhase === "P109.5"
      && status.nextPhase === "P109.7"))
    && statusById.get("P109")?.status === "in_progress"
    && statusById.get("P109.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P109.5")?.status)
    && roadmapById.get("P109.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P109.4 avoids forbidden file scope", !(p1094.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P109.3 checker accepts P109.4 handoff", p1093Checker.includes("P109.4") && p1093Checker.includes("P109.5"));
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(decisionLedgerUxText));
addCheck("primary UX avoids raw packet keys", !/(candidateKey|previewRef|operatorDecisionLedgerKey|recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedDecisionLedger));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(decisionLedgerUxText));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(decisionLedgerUxText));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P109.4 Command Center decision-ledger UX.",
        "- Confirms Business Build, Agent Flow, and Live Readiness render display-safe decision-ledger audit state while Chat with NEXUS and Lite stay clean.",
        "- Does not enable operator decision capture, ledger writes, DB writes, replay, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1094-command-center-decision-ledger-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live decision ledger appears on non-chat founder routes\"",
        "- cd dashboard && npm run build",
        "- npm run check:p1093-founder-live-operator-decision-ledger-audit-preview",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P109.4 is display-only. It does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P109.4 Command Center Decision Ledger UX Report", phase: "P109.4" },
);

printCheckReport("P109.4 Command Center Decision Ledger UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
