import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel,
} from "../dashboard/src/data/businessBuild.js";
import {
  P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE,
  P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES,
  buildFounderLiveOperatorDecisionLedgerPersistenceContract,
  validateFounderLiveOperatorDecisionLedgerPersistenceContract,
} from "../live-ready/founderLiveOperatorDecisionLedgerPersistence.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1105-founder-live-operator-decision-ledger-persistence-validation-report.md";

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
const contract = readJson("contracts/os-roadmap/p110-founder-live-operator-decision-ledger-persistence-contracts.json");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const subphaseById = new Map((contract.subphases || []).map((entry) => [entry.phaseId, entry]));
const plan = readText("docs/architecture/P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const dashboardData = readText("dashboard/src/data/businessBuild.js");
const dashboardPage = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const checkerSources = [
  "scripts/check-p1101-founder-live-operator-decision-ledger-persistence-contract.js",
  "scripts/check-p1102-founder-live-operator-decision-ledger-schema.js",
  "scripts/check-p1103-founder-live-operator-decision-ledger-crud-model.js",
  "scripts/check-p1104-command-center-decision-ledger-persistence-ux.js",
].map(readText).join("\n");
const reportPaths = [
  "reports/p1101-founder-live-operator-decision-ledger-persistence-contract-report.md",
  "reports/p1102-founder-live-operator-decision-ledger-schema-report.md",
  "reports/p1103-founder-live-operator-decision-ledger-crud-model-report.md",
  "reports/p1104-command-center-decision-ledger-persistence-ux-report.md",
];
const p1105 = subphaseById.get("P110.5") || {};
const p1106 = subphaseById.get("P110.6") || {};
const blockedContract = buildFounderLiveOperatorDecisionLedgerPersistenceContract();
const readyContract = buildFounderLiveOperatorDecisionLedgerPersistenceContract({
  operatorApproval: true,
  rollbackAccepted: true,
  auditAccepted: true,
  validationCommandsAccepted: true,
  mode: "sqlite-live",
  enableWrites: true,
});
const blockedValidation = validateFounderLiveOperatorDecisionLedgerPersistenceContract(blockedContract);
const readyValidation = validateFounderLiveOperatorDecisionLedgerPersistenceContract(readyContract);
const businessBuild = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const persistenceDisplay = buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel("Build a simple iOS Snake game for the App Store");
const docsBundle = [JSON.stringify(contract), plan, platformRoadmap, readme].join("\n");
const uxBundle = [
  JSON.stringify(businessBuild.founderLiveOperatorDecisionLedgerPersistence),
  JSON.stringify(persistenceDisplay),
  "Business Build Decision Ledger Persistence",
  "Agent Flow Decision Ledger Persistence",
  "Live Readiness Decision Ledger Persistence",
  "DB Runtime Decision Ledger Persistence",
].join("\n");
const requiredScripts = [
  "check:p1101-founder-live-operator-decision-ledger-persistence-contract",
  "check:p1102-founder-live-operator-decision-ledger-schema",
  "check:p1103-founder-live-operator-decision-ledger-crud-model",
  "check:p1104-command-center-decision-ledger-persistence-ux",
  "check:p1105-founder-live-operator-decision-ledger-persistence-validation",
];
const validationCommands = [
  "npm run check:p1105-founder-live-operator-decision-ledger-persistence-validation",
  "npm run check:p1104-command-center-decision-ledger-persistence-ux",
  "npm run check:p1103-founder-live-operator-decision-ledger-crud-model",
  "npm run check:p1102-founder-live-operator-decision-ledger-schema",
  "npm run check:p1101-founder-live-operator-decision-ledger-persistence-contract",
  "npm run check:p1097-founder-live-operator-decision-ledger-final",
  "cd dashboard && npx playwright test tests/routes.spec.js --grep \"Decision ledger persistence appears on non-chat founder routes\"",
  "cd dashboard && npm run build",
  "npm run check:os-phase-status",
  "npm run check:phase-validation-coverage",
  "git diff --check",
];

addCheck("package scripts registered", requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])));
addCheck("P110.1-P110.4 are complete", ["P110.1", "P110.2", "P110.3", "P110.4"].every((phaseId) => subphaseById.get(phaseId)?.status === "complete"));
addCheck("P110.5 contract is complete", p1105.status === "complete" && ["planned", "complete"].includes(p1106.status));
addCheck("P110.5 records validation commands", validationCommands.every((command) => p1105.validationCommands?.includes(command)));
addCheck("prior reports exist and pass", reportPaths.every((report) => existsSync(join(ROOT, report)) && /Result[\s\S]*PASS/.test(readText(report))));
addCheck("persistence runtime contract validates", P110_FOUNDER_LIVE_OPERATOR_DECISION_LEDGER_PERSISTENCE_PHASE === "P110.3" && blockedValidation.valid && readyValidation.valid);
addCheck("persistence DB entity allowlist is narrow", P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES.length === 3 && P110_OPERATOR_DECISION_LEDGER_DB_ENTITIES.every((entity) => entity.startsWith("operator_decision_ledger_")));
addCheck("blocked contract keeps unsafe authority false", blockedContract.data?.providerCallsAllowed === false && blockedContract.data?.agentDispatchAllowed === false && blockedContract.data?.projectMutationAllowed === false && blockedContract.data?.hostedDbWritesAllowed === false && blockedContract.data?.providerSpendAllowed === false);
addCheck("Command Center persistence UX remains available", businessBuild.founderLiveOperatorDecisionLedgerPersistence?.readyRecordCount === 3 && persistenceDisplay.lanes?.length === 3 && dashboardPage.includes("FounderLiveOperatorDecisionLedgerPersistenceCard"));
addCheck("Command Center chat routes remain clean", !dashboardPage.includes("Chat Decision Ledger Persistence") && !dashboardPage.includes("Lite Decision Ledger Persistence") && routeTests.includes("toHaveCount(0)"));
addCheck("focused Playwright route test is present", routeTests.includes("Decision ledger persistence appears on non-chat founder routes") && routeTests.includes("dark") && routeTests.includes("light") && routeTests.includes("system"));
addCheck("dashboard model stays browser safe", !dashboardData.includes("sqliteRuntime") && !dashboardData.includes("sqliteCrudRepository") && !dashboardData.includes("node:fs"));
addCheck("compatibility checkers accept P110.5", checkerSources.includes("P110.5") && checkerSources.includes("P110.6"));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P110.5"
      && status.previousPhase === "P110.4"
      && status.nextPhase === "P110.6"
      && roadmap.currentPhase === "P110.5"
      && roadmap.previousPhase === "P110.4"
      && roadmap.nextPhase === "P110.6")
    || (status.currentPhase === "P110.6"
      && status.previousPhase === "P110.5"
      && status.nextPhase === "P110.7"
      && roadmap.currentPhase === "P110.6"
      && roadmap.previousPhase === "P110.5"
      && roadmap.nextPhase === "P110.7")
    || (status.currentPhase === "P110.7"
      && status.previousPhase === "P110.6"
      && status.nextPhase === "P111"
      && roadmap.currentPhase === "P110.7"
      && roadmap.previousPhase === "P110.6"
      && roadmap.nextPhase === "P111"))
    && ["in_progress", "complete"].includes(statusById.get("P110")?.status)
    && statusById.get("P110.5")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P110.6")?.status)
    && ["planned", "complete"].includes(statusById.get("P110.7")?.status)
    && roadmapById.get("P110.5")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("docs record P110.5", /P110\.5 Tests \/ Checkers[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P110.5", /P110\.5 aggregate persistence validation/.test(readme) && /P110\.6\s+is next/.test(readme));
addCheck("platform roadmap records P110.5", /P110\.5 is\s+complete/.test(platformRoadmap) && /P110\.6\s+is next/.test(platformRoadmap));
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxBundle));
addCheck("primary UX avoids raw DB entity names", !/operator_decision_ledger_entries|operator_decision_ledger_events|operator_decision_ledger_evidence_refs/i.test(uxBundle));
addCheck("primary UX avoids raw packet keys", !/(ledgerEntryId|ledgerEventId|evidenceRefId|requestKey|sqliteEntity|recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceReviewPacketKey)/.test(uxBundle));
addCheck("docs avoid fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(docsBundle));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution is live|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|operator decision ledger writes are enabled/i.test(docsBundle));
addCheck("DemoApp not exposed", !dashboardPage.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates aggregate P110.1-P110.4 decision-ledger persistence evidence.",
        "- Confirms contract, schema, governed local CRUD model, Command Center persistence UX, route safety, docs/status, and reports are present.",
        "- Accepts the P110.5/P110.6, P110.6/P110.7, and P110.7/P111 status handoff states during final closure.",
        "- Does not add runtime behavior, mutation controls, hosted DB mutation, raw SQL, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    { title: "Validation Commands", body: validationCommands.map((command) => `- ${command}`).join("\n") },
    {
      title: "Known Limitations",
      body: "- P110.5 is aggregate validation only. It does not change Command Center UX, write DB records, use hosted DBs, run raw SQL, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P110.5 Founder Live Operator Decision Ledger Persistence Validation Report", phase: "P110.5" },
);

printCheckReport("P110.5 Founder Live Operator Decision Ledger Persistence Validation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
