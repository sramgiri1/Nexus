import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable, loadSqliteSchema } from "../db/sqliteRuntime.js";
import {
  describeSqliteCrudEntity,
  insertSqliteEntity,
  listSqliteCrudEntities,
  listSqliteEntityRecords,
} from "../db/sqliteCrudRepository.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p1112-founder-live-agent-work-order-schema-report.md";
const TEST_DB = "local-state/runtime/check-p1112.sqlite";
const WORK_ORDER_ENTITIES = [
  "founder_agent_work_orders",
  "founder_agent_work_order_events",
  "founder_agent_work_order_evidence_refs",
];

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

rmSync(join(ROOT, TEST_DB), { force: true });

const packageJson = readJson("package.json");
const schema = readJson("db/schema.json");
const schemaSql = readText("db/schema.sql");
const sqliteSchema = loadSqliteSchema();
const contract = readJson("contracts/os-roadmap/p111-founder-live-agent-work-order-persistence-contracts.json");
const plan = readText("docs/architecture/P111_FOUNDER_LIVE_AGENT_WORK_ORDER_PERSISTENCE_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const p1112 = contract.subphases?.find((entry) => entry.phaseId === "P111.2") || {};
const p1113 = contract.subphases?.find((entry) => entry.phaseId === "P111.3") || {};
const descriptions = Object.fromEntries(WORK_ORDER_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

let workOrder = null;
let workOrderEvent = null;
let evidenceRef = null;
let workOrders = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  workOrder = insertSqliteEntity("founder_agent_work_orders", {
    workOrderId: "p1112-work-order",
    publicLabel: "Founder agent work order",
    sourceHandoffLabel: "Founder live handoff",
    sourceAdmissionLabel: "Founder live work admission",
    proposedAgent: "Product Strategy",
    proposedWork: "Translate accepted PRD scope into a governed local work order.",
    workOrderState: "schema_validated_locally",
    workOrderSummary: "Schema validation only; no agent dispatch or execution.",
    nextAction: "Model governed local CRUD admission in P111.3.",
    disabledReason: "P111.2 is schema-only.",
    ownerCapability: "NEXUS Founder Agent Work Order DB",
    localCrudAllowed: false,
    dbWriteAllowed: false,
    hostedDbMutationAllowed: false,
    dispatchAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    runtimeAdmissionAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1112-founder-live-agent-work-order-schema-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  workOrderEvent = insertSqliteEntity("founder_agent_work_order_events", {
    workOrderEventId: "p1112-event",
    workOrderId: "p1112-work-order",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local work order schema mapping without dispatch or execution.",
    rollbackAvailable: true,
    dispatchAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p1112-founder-live-agent-work-order-schema-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  evidenceRef = insertSqliteEntity("founder_agent_work_order_evidence_refs", {
    workOrderEvidenceRefId: "p1112-evidence",
    workOrderId: "p1112-work-order",
    evidenceLabel: "P111.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1112-founder-live-agent-work-order-schema-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  workOrders = listSqliteEntityRecords("founder_agent_work_orders", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const unsafeSource = `${schemaSql}\n${readText("db/schema.json")}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1112-founder-live-agent-work-order-schema"]));
addCheck("contract marks P111.2 complete", p1112.status === "complete" && p1112.allowedFiles?.includes("db/schema.json") && p1112.allowedFiles?.includes("db/schema.sql"));
addCheck("P111.3 remains planned or complete", ["planned", "complete"].includes(p1113.status));
addCheck("work order entities exist in schema", WORK_ORDER_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("work order entities are redacted low-risk local state", WORK_ORDER_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^founder_agent_work_order_/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("work order shape is complete", entityByName.get("founder_agent_work_orders")?.primaryKey === "workOrderId" && entityByName.get("founder_agent_work_orders")?.fields?.workOrderState === "string" && entityByName.get("founder_agent_work_orders")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_work_orders")?.fields?.executionAllowed === "boolean");
addCheck("work order event shape blocks execution", entityByName.get("founder_agent_work_order_events")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_work_order_events")?.fields?.projectMutationAllowed === "boolean");
addCheck("work order evidence shape is display-safe", entityByName.get("founder_agent_work_order_evidence_refs")?.primaryKey === "workOrderEvidenceRefId" && entityByName.get("founder_agent_work_order_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("founder_agent_work_order_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", WORK_ORDER_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_agent_work_orders_work_order_state") && schemaSql.includes("idx_founder_agent_work_order_events_event_type") && schemaSql.includes("idx_founder_agent_work_order_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms work order tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_agent_work_orders") && sqliteSchema.includes("evidence_refs             TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include work order columns", descriptions.founder_agent_work_orders.fields.workOrderId.column === "work_order_id" && descriptions.founder_agent_work_order_events.fields.projectMutationAllowed.column === "project_mutation_allowed" && descriptions.founder_agent_work_order_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees work order entity set", allEntities.length >= 32 && WORK_ORDER_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P111.2 schema validation");
addCheck("isolated DB initializes work order tables", !cliAvailable || (init.initialized === true && init.tableCount >= 32 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated work order records can be inserted", !cliAvailable || (workOrder?.workOrderId === "p1112-work-order" && workOrderEvent?.workOrderEventId === "p1112-event" && evidenceRef?.workOrderEvidenceRefId === "p1112-evidence"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(workOrder?.evidenceRefs) && workOrder?.dispatchAllowed === false && workOrder?.executionAllowed === false && workOrderEvent?.projectMutationAllowed === false && evidenceRef?.redactionRequired === true));
addCheck("isolated work order records can be listed", !cliAvailable || workOrders.some((entry) => entry.workOrderId === "p1112-work-order"));
addCheck("docs record P111.2", /P111\.2 Agent Work Order SQLite Schema[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P111.2", /P111\.2 work order SQLite schema/.test(readme) && /P111\.3 is next/.test(readme));
addCheck("platform roadmap records P111.2", /P111\.2 is complete/.test(platformRoadmap) && /P111\.3 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P111.2"
      && status.previousPhase === "P111.1"
      && status.nextPhase === "P111.3"
      && roadmap.currentPhase === "P111.2"
      && roadmap.previousPhase === "P111.1"
      && roadmap.nextPhase === "P111.3")
    || (status.currentPhase === "P111.3"
      && status.previousPhase === "P111.2"
      && status.nextPhase === "P111.4"
      && roadmap.currentPhase === "P111.3"
      && roadmap.previousPhase === "P111.2"
      && roadmap.nextPhase === "P111.4"))
    && statusById.get("P111")?.status === "in_progress"
    && statusById.get("P111.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P111.3")?.status)
    && roadmapById.get("P111.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|work order execution is enabled/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P111.2 local SQLite schema definitions for founder agent work orders, events, and evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1112-founder-live-agent-work-order-schema",
        "- npm run check:p1111-founder-live-agent-work-order-persistence-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P111.2 is schema-only. It does not add runtime CRUD admission, write persistent runtime data, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P111.2 Founder Live Agent Work Order Schema Report", phase: "P111.2" },
);

printCheckReport("P111.2 Founder Live Agent Work Order Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
