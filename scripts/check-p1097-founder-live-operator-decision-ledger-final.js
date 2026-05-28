import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { buildBusinessBuildViewModel } from "../dashboard/src/data/businessBuild.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1097-founder-live-operator-decision-ledger-final-report.md";

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
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const osStatusChecker = readText("scripts/check-os-phase-status.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const decisionLedger = build.founderLiveOperatorDecisionLedger || {};
const p1097 = subphaseById.get("P109.7") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "dashboard/src/", "dashboard/tests/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const p109Scripts = [
  "check:p1091-founder-live-operator-decision-ledger-contract",
  "check:p1092-founder-live-operator-decision-ledger-model",
  "check:p1093-founder-live-operator-decision-ledger-audit-preview",
  "check:p1094-command-center-decision-ledger-ux",
  "check:p1095-founder-live-operator-decision-ledger-validation",
  "check:p1096-founder-live-operator-decision-ledger-docs",
  "check:p1097-founder-live-operator-decision-ledger-final",
];
const p109Reports = [
  "reports/p1091-founder-live-operator-decision-ledger-contract-report.md",
  "reports/p1092-founder-live-operator-decision-ledger-model-report.md",
  "reports/p1093-founder-live-operator-decision-ledger-audit-preview-report.md",
  "reports/p1094-command-center-decision-ledger-ux-report.md",
  "reports/p1095-founder-live-operator-decision-ledger-validation-report.md",
  "reports/p1096-founder-live-operator-decision-ledger-docs-report.md",
];
const serializedDecisionLedger = JSON.stringify(decisionLedger);
const docsBundle = [contract, plan, platformRoadmap, readme].map((entry) => JSON.stringify(entry)).join(" ");
const p110PlaceholderState =
  ((status.currentPhase === "P109.7"
    && status.previousPhase === "P109.6"
    && status.nextPhase === "P110"
    && roadmap.currentPhase === "P109.7"
    && roadmap.previousPhase === "P109.6"
    && roadmap.nextPhase === "P110")
    || (status.currentPhase === "P110.1"
      && status.previousPhase === "P109.7"
      && status.nextPhase === "P110.2"
      && roadmap.currentPhase === "P110.1"
      && roadmap.previousPhase === "P109.7"
      && roadmap.nextPhase === "P110.2")
    || (status.currentPhase === "P110.2"
      && status.previousPhase === "P110.1"
      && status.nextPhase === "P110.3"
      && roadmap.currentPhase === "P110.2"
      && roadmap.previousPhase === "P110.1"
      && roadmap.nextPhase === "P110.3")
    || (status.currentPhase === "P110.3"
      && status.previousPhase === "P110.2"
      && status.nextPhase === "P110.4"
      && roadmap.currentPhase === "P110.3"
      && roadmap.previousPhase === "P110.2"
      && roadmap.nextPhase === "P110.4"))
    && osStatusChecker.includes('"P110"')
    && osStatusChecker.includes('"P110.1"')
    && osStatusChecker.includes('"P110.2"')
    && osStatusChecker.includes('"P110.3"')
    && osStatusChecker.includes('"P110.4"');

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1097-founder-live-operator-decision-ledger-final"]));
addCheck("all P109 scripts registered", p109Scripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("all prior P109 reports exist", p109Reports.every((report) => readText(report).includes("Result")));
addCheck("contract marks parent complete", contract.status === "complete");
addCheck("contract marks all P109 subphases complete", (contract.subphases || []).every((entry) => entry.status === "complete"));
addCheck("contract records final validation commands", [
  "npm run check:p1097-founder-live-operator-decision-ledger-final",
  "npm run check:p1096-founder-live-operator-decision-ledger-docs",
  "npm run check:p1095-founder-live-operator-decision-ledger-validation",
  "npm run check:p1094-command-center-decision-ledger-ux",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live decision ledger appears on non-chat founder routes\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
].every((command) => p1097.validationCommands?.includes(command)));
addCheck("P109.7 avoids forbidden file scope", !(p1097.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P110 handoff placeholder is supported", p110PlaceholderState, `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`);
addCheck("docs record P109.7", /P109\.7 Final Validation[\s\S]*Status:\s+complete/.test(plan));
addCheck("platform roadmap records P109 complete", /P109\.7 is\s+complete/.test(platformRoadmap) && /P109 is\s+complete/.test(platformRoadmap) && /P110 is\s+next/.test(platformRoadmap));
addCheck("README records P109 complete", /P109\.7 final validation/.test(readme) && /P109 is complete/.test(readme) && /P110 is next/.test(readme));
addCheck("Command Center decision-ledger UX retained", decisionLedger.auditPreviewCount === 6 && decisionLedger.blockedAuditPreviewCount === 6 && decisionLedger.auditRows?.length === 6 && pageSource.includes("FounderLiveOperatorDecisionLedgerCard"));
addCheck("route safety coverage retained", routeTests.includes("Founder live decision ledger appears on non-chat founder routes") && routeTests.includes("/command-center/lite") && routeTests.includes("/command-center/live-readiness"));
addCheck(
  "phase status closed",
  p110PlaceholderState
    && statusById.get("P109")?.status === "complete"
    && statusById.get("P109.7")?.status === "complete"
    && roadmapById.get("P109")?.status === "complete"
    && roadmapById.get("P109.7")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}/${statusById.get("P109")?.status}`,
);
addCheck("phase commits recorded", [statusById.get("P109")?.commit, statusById.get("P109.7")?.commit, roadmapById.get("P109")?.commit, roadmapById.get("P109.7")?.commit].every((commit) => commit && commit !== "planned"));
addCheck("command center visibility retained", statusById.get("P109")?.commandCenterVisible === true && statusById.get("P109.7")?.commandCenterVisible === true);
addCheck("decision ledger authority remains blocked", decisionLedger.capturableOperatorDecisionCount === 0 && decisionLedger.persistedOperatorDecisionCount === 0 && decisionLedger.writableLedgerDecisionCount === 0 && decisionLedger.dbWriteCount === 0 && decisionLedger.replayableLedgerDecisionCount === 0 && decisionLedger.executableLedgerDecisionCount === 0);
addCheck("final UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(serializedDecisionLedger));
addCheck("final UX avoids raw packet keys", !/(candidateKey|previewRef|operatorDecisionLedgerKey|recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceApprovalPlanKey|reviewPacketKey|sourceReviewPacketKey|approvalRequestKey|approvalCaptureRecordKey|auditPreviewKey)/.test(serializedDecisionLedger));
addCheck("final UX avoids unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(serializedDecisionLedger + pageSource + docsBundle));
addCheck("final UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(serializedDecisionLedger));
addCheck("docs do not claim ledger or execution live", !/decision ledger is writable|operator decision ledger writes are enabled|operator decision capture is live|runtime admission is enabled|execution is live|provider spend is enabled/i.test(docsBundle));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates final P109 founder live operator decision-ledger readiness closure.",
        "- Confirms parent P109 and all subphases are complete, reports and scripts exist, Command Center route safety is retained, and P110 is the next planned handoff placeholder.",
        "- Does not enable operator decision capture, persistence, ledger writes, DB writes, replay, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, hosted DB mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1097-founder-live-operator-decision-ledger-final",
        "- npm run check:p1096-founder-live-operator-decision-ledger-docs",
        "- npm run check:p1095-founder-live-operator-decision-ledger-validation",
        "- npm run check:p1094-command-center-decision-ledger-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Founder live decision ledger appears on non-chat founder routes\"",
        "- cd dashboard && npm run build",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P109.7 closes P109 validation only. It does not capture operator decisions, persist approval state, write ledger or DB records, replay decisions, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, use hosted DBs, deploy, release, export, package, use network calls, or spend. P110 is a planned handoff placeholder only.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P109.7 Founder Live Operator Decision Ledger Final Report", phase: "P109.7" },
);

printCheckReport("P109.7 Founder Live Operator Decision Ledger Final Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
