import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import {
  buildBusinessBuildViewModel,
  buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel,
} from "../dashboard/src/data/businessBuild.js";
import { buildDbRuntimeReadinessViewModel } from "../dashboard/src/data/dbRuntimeReadiness.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1104-command-center-decision-ledger-persistence-ux-report.md";

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
const dataSource = readText("dashboard/src/data/businessBuild.js");
const dbRuntimeSource = readText("dashboard/src/data/dbRuntimeReadiness.js");
const pageSource = readText("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = readText("dashboard/tests/routes.spec.js");
const p1103Checker = readText("scripts/check-p1103-founder-live-operator-decision-ledger-crud-model.js");
const build = buildBusinessBuildViewModel("Build a simple iOS Snake game for the App Store");
const dbRuntime = buildDbRuntimeReadinessViewModel();
const persistence = build.founderLiveOperatorDecisionLedgerPersistence || {};
const directPersistence = buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel("Build a simple iOS Snake game for the App Store");
const dbPersistence = dbRuntime.operatorDecisionLedgerPersistence || {};
const p1104 = subphaseById.get("P110.4") || {};
const p1105 = subphaseById.get("P110.5") || {};
const forbiddenPrefixes = ["projects/", "careloop/", "providers/", "tools/", "worker-runtime/", "deploy/", "release/", "exports/", "packages/"];
const serializedPersistence = JSON.stringify([persistence, directPersistence, dbPersistence]);
const uxText = [
  serializedPersistence,
  "Business Build Decision Ledger Persistence",
  "Agent Flow Decision Ledger Persistence",
  "Live Readiness Decision Ledger Persistence",
  "DB Runtime Decision Ledger Persistence",
  "Decision Ledger Persistence",
  "Local CRUD guarded",
].join(" ");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1104-command-center-decision-ledger-persistence-ux"]));
addCheck("dashboard data exposes persistence display model", dataSource.includes("buildFounderLiveOperatorDecisionLedgerPersistenceDisplayModel") && dataSource.includes("founderLiveOperatorDecisionLedgerPersistence"));
addCheck("dashboard data stays browser safe", !dataSource.includes("founderLiveOperatorDecisionLedgerPersistence.js") && !dataSource.includes("sqliteRuntime") && !dataSource.includes("sqliteCrudRepository") && !dataSource.includes("node:fs"));
addCheck("DB runtime includes decision ledger persistence", dbRuntimeSource.includes("operatorDecisionLedgerPersistence") && dbPersistence.currentState?.includes("Operator Decision Ledger Persistence"));
addCheck("page renders persistence only on non-chat routes", pageSource.includes("FounderLiveOperatorDecisionLedgerPersistenceCard") && pageSource.includes("Business Build Decision Ledger Persistence") && pageSource.includes("Agent Flow Decision Ledger Persistence") && pageSource.includes("Live Readiness Decision Ledger Persistence") && pageSource.includes("DB Runtime Decision Ledger Persistence") && !pageSource.includes("Chat Decision Ledger Persistence") && !pageSource.includes("Lite Decision Ledger Persistence"));
addCheck("route test covers persistence UX", routeTests.includes("Decision ledger persistence appears on non-chat founder routes") && routeTests.includes("Founder live decision ledger persistence") && routeTests.includes("Local CRUD guarded"));
addCheck("persistence model is useful", persistence.currentState?.includes("Persistence") && persistence.readyRecordCount === 3 && persistence.totalRecordCount === 3 && persistence.lanes?.length === 3 && persistence.allowedLocalCrudOperations?.join(",") === "Create,Read,Update,Upsert,List");
addCheck("persistence model includes required UX fields", ["nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceLocation", "activityLocation", "costImpact"].every((field) => field in persistence));
addCheck("persistence rows are display safe", persistence.lanes?.every((lane) => lane.label && lane.currentState && lane.ownerCapability && lane.nextAction && lane.blocker && !("ledgerEntryId" in lane) && !("ledgerEventId" in lane) && !("evidenceRefId" in lane)));
addCheck("persistence safety rows retain blocked authority", persistence.safetyRows?.some((row) => row.label === "Local SQLite CRUD" && row.value === "Guarded") && persistence.safetyRows?.some((row) => row.label === "Hosted DB" && row.value === "Blocked") && persistence.safetyRows?.some((row) => row.label === "Provider spend" && row.value === "Blocked"));
addCheck("DB runtime persistence matches business build persistence", dbPersistence.allowedLocalCrudOperations?.join(",") === persistence.allowedLocalCrudOperations?.join(",") && dbPersistence.readyRecordCount === persistence.readyRecordCount);
addCheck("contract marks P110.4 complete", p1104.status === "complete" && ["planned", "complete"].includes(p1105.status));
addCheck("docs record P110.4", /P110\.4 Command Center Ledger Persistence UX[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P110.4", /P110\.4 Command Center decision-ledger persistence UX/.test(readme) && /P110\.5\s+is next/.test(readme));
addCheck("platform roadmap records P110.4", /P110\.4 is\s+complete/.test(platformRoadmap) && /P110\.5\s+is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  status.currentPhase === "P110.4"
    && status.previousPhase === "P110.3"
    && status.nextPhase === "P110.5"
    && statusById.get("P110")?.status === "in_progress"
    && statusById.get("P110.4")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P110.5")?.status)
    && roadmap.currentPhase === "P110.4"
    && roadmap.previousPhase === "P110.3"
    && roadmap.nextPhase === "P110.5"
    && roadmapById.get("P110.4")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("P110.4 avoids forbidden file scope", !(p1104.allowedFiles || []).some((file) => forbiddenPrefixes.some((prefix) => file.startsWith(prefix))));
addCheck("P110.3 checker accepts P110.4 handoff", p1103Checker.includes("P110.4") && p1103Checker.includes("P110.5"));
addCheck("primary UX avoids raw private IDs", !/(?:private|token|tenant|workspace|project|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/i.test(uxText));
addCheck("primary UX avoids raw DB entity names", !/operator_decision_ledger_entries|operator_decision_ledger_events|operator_decision_ledger_evidence_refs/i.test(serializedPersistence));
addCheck("primary UX avoids raw packet keys", !/(ledgerEntryId|ledgerEventId|evidenceRefId|requestKey|sqliteEntity|recordRef|auditPreviewRef|reviewPacketId|approvalPlanId|sourceReviewPacketKey)/.test(serializedPersistence));
addCheck("primary UX avoids fake unsafe runnable actions", !/run now|execute now|deploy now|apply now|approve now|call provider now|create project now|dispatch agent now|write sqlite now|write ledger now/i.test(uxText));
addCheck("primary UX avoids raw dumps", !/raw JSON|raw logs|raw policy dump/i.test(uxText));
addCheck("DemoApp not exposed", !pageSource.includes("DemoApp"));

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P110.4 Command Center decision-ledger persistence UX.",
        "- Confirms Business Build, Agent Flow, Live Readiness, and Database render display-safe local decision-ledger persistence state while Chat with NEXUS and Lite stay clean.",
        "- Confirms the dashboard model stays browser-safe and does not import Node SQLite runtime modules.",
        "- Does not expose mutation buttons, hosted DB mutation, raw SQL, execution unlock, runtime admission, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1104-command-center-decision-ledger-persistence-ux",
        "- cd dashboard && npx playwright test tests/routes.spec.js --grep \"Decision ledger persistence appears on non-chat founder routes\"",
        "- cd dashboard && npm run build",
        "- npm run check:p1103-founder-live-operator-decision-ledger-crud-model",
        "- npm run check:p1102-founder-live-operator-decision-ledger-schema",
        "- npm run check:p1101-founder-live-operator-decision-ledger-persistence-contract",
        "- npm run check:p1097-founder-live-operator-decision-ledger-final",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P110.4 is display-only. It does not expose local mutation controls, write DB records, use hosted DBs, run raw SQL, unlock execution, admit runtime execution, call providers/models, dispatch agents, run workers/tools, mutate projects, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P110.4 Command Center Decision Ledger Persistence UX Report", phase: "P110.4" },
);

printCheckReport("P110.4 Command Center Decision Ledger Persistence UX Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
