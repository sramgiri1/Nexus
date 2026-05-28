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
const REPORT_PATH = "reports/p1122-founder-live-agent-work-queue-schema-report.md";
const TEST_DB = "local-state/runtime/check-p1122.sqlite";
const QUEUE_ENTITIES = [
  "founder_agent_work_queue_items",
  "founder_agent_work_queue_events",
  "founder_agent_work_queue_evidence_refs",
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
const contract = readJson("contracts/os-roadmap/p112-founder-live-agent-work-queue-admission-contracts.json");
const plan = readText("docs/architecture/P112_FOUNDER_LIVE_AGENT_WORK_QUEUE_ADMISSION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const readme = readText("README.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const p1122 = contract.subphases?.find((entry) => entry.phaseId === "P112.2") || {};
const p1123 = contract.subphases?.find((entry) => entry.phaseId === "P112.3") || {};
const descriptions = Object.fromEntries(QUEUE_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

let queueItem = null;
let queueEvent = null;
let evidenceRef = null;
let queueItems = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  queueItem = insertSqliteEntity("founder_agent_work_queue_items", {
    queueItemId: "p1122-queue-item",
    workOrderId: "p1122-work-order",
    publicLabel: "Founder agent work queue item",
    queueLane: "Product Strategy",
    queueState: "schema_validated_locally",
    queueSummary: "Schema validation only; no dispatch or execution.",
    priorityLabel: "normal",
    nextAction: "Model governed local queue CRUD in P112.3.",
    disabledReason: "P112.2 is schema-only.",
    ownerCapability: "NEXUS Founder Agent Work Queue DB",
    localCrudAllowed: false,
    dbWriteAllowed: false,
    hostedDbMutationAllowed: false,
    dispatchAllowed: false,
    executionAllowed: false,
    workerExecutionAllowed: false,
    runtimeAdmissionAllowed: false,
    projectMutationAllowed: false,
    providerSpendAllowed: false,
    evidenceRefs: ["reports/p1122-founder-live-agent-work-queue-schema-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  queueEvent = insertSqliteEntity("founder_agent_work_queue_events", {
    queueEventId: "p1122-queue-event",
    queueItemId: "p1122-queue-item",
    workOrderId: "p1122-work-order",
    eventType: "schema_validation",
    eventState: "recorded_locally",
    actorLabel: "NEXUS schema checker",
    eventSummary: "Validated local queue schema mapping without dispatch or execution.",
    rollbackAvailable: true,
    dispatchAllowed: false,
    executionAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p1122-founder-live-agent-work-queue-schema-report.md"],
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  evidenceRef = insertSqliteEntity("founder_agent_work_queue_evidence_refs", {
    queueEvidenceRefId: "p1122-queue-evidence",
    queueItemId: "p1122-queue-item",
    workOrderId: "p1122-work-order",
    evidenceLabel: "P112.2 schema report",
    evidenceType: "validation_report",
    evidenceLocation: "reports/p1122-founder-live-agent-work-queue-schema-report.md",
    redactionRequired: true,
    retainedForAudit: true,
    createdAt: "2026-05-28T00:00:00.000Z",
  }, sqliteInput);
  queueItems = listSqliteEntityRecords("founder_agent_work_queue_items", { limit: 5 }, sqliteInput);
}

const allEntities = listSqliteCrudEntities();
const docsBundle = `${plan}\n${platformRoadmap}\n${readme}`;
const unsafeSource = `${schemaSql}\n${readText("db/schema.json")}`;

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p1122-founder-live-agent-work-queue-schema"]));
addCheck("contract marks P112.2 complete", p1122.status === "complete" && p1122.allowedFiles?.includes("db/schema.json") && p1122.allowedFiles?.includes("db/schema.sql"));
addCheck("P112.3 remains planned or complete", ["planned", "complete"].includes(p1123.status));
addCheck("queue entities exist in schema", QUEUE_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("queue entities are redacted low-risk local state", QUEUE_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.piiRisk === "low" && /^founder_agent_work_queue_/.test(entityByName.get(entity)?.retentionClass || "")));
addCheck("queue item shape is complete", entityByName.get("founder_agent_work_queue_items")?.primaryKey === "queueItemId" && entityByName.get("founder_agent_work_queue_items")?.fields?.queueState === "string" && entityByName.get("founder_agent_work_queue_items")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_work_queue_items")?.fields?.executionAllowed === "boolean");
addCheck("queue event shape blocks execution", entityByName.get("founder_agent_work_queue_events")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_agent_work_queue_events")?.fields?.projectMutationAllowed === "boolean");
addCheck("queue evidence shape is display-safe", entityByName.get("founder_agent_work_queue_evidence_refs")?.primaryKey === "queueEvidenceRefId" && entityByName.get("founder_agent_work_queue_evidence_refs")?.fields?.evidenceLocation === "string" && entityByName.get("founder_agent_work_queue_evidence_refs")?.fields?.redactionRequired === "boolean");
addCheck("SQL tables exist", QUEUE_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_agent_work_queue_items_queue_state") && schemaSql.includes("idx_founder_agent_work_queue_events_event_type") && schemaSql.includes("idx_founder_agent_work_queue_evidence_refs_evidence_location"));
addCheck("SQLite schema transforms queue tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_agent_work_queue_items") && sqliteSchema.includes("evidence_refs            TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include queue columns", descriptions.founder_agent_work_queue_items.fields.queueItemId.column === "queue_item_id" && descriptions.founder_agent_work_queue_events.fields.projectMutationAllowed.column === "project_mutation_allowed" && descriptions.founder_agent_work_queue_evidence_refs.fields.evidenceLocation.column === "evidence_location");
addCheck("CRUD repository sees queue entity set", allEntities.length >= 35 && QUEUE_ENTITIES.every((entity) => allEntities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P112.2 schema validation");
addCheck("isolated DB initializes queue tables", !cliAvailable || (init.initialized === true && init.tableCount >= 35 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated queue records can be inserted", !cliAvailable || (queueItem?.queueItemId === "p1122-queue-item" && queueEvent?.queueEventId === "p1122-queue-event" && evidenceRef?.queueEvidenceRefId === "p1122-queue-evidence"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(queueItem?.evidenceRefs) && queueItem?.dispatchAllowed === false && queueItem?.executionAllowed === false && queueEvent?.projectMutationAllowed === false && evidenceRef?.redactionRequired === true));
addCheck("isolated queue records can be listed", !cliAvailable || queueItems.some((entry) => entry.queueItemId === "p1122-queue-item"));
addCheck("docs record P112.2", /P112\.2 Agent Work Queue SQLite Schema[\s\S]*Status:\s+complete/.test(plan));
addCheck("README records P112.2", /P112\.2 work queue SQLite schema/.test(readme) && /P112\.3 is next/.test(readme));
addCheck("platform roadmap records P112.2", /P112\.2 is complete/.test(platformRoadmap) && /P112\.3 is next/.test(platformRoadmap));
addCheck(
  "phase status advanced",
  ((status.currentPhase === "P112.2"
      && status.previousPhase === "P112.1"
      && status.nextPhase === "P112.3"
      && roadmap.currentPhase === "P112.2"
      && roadmap.previousPhase === "P112.1"
      && roadmap.nextPhase === "P112.3")
    || (status.currentPhase === "P112.3"
      && status.previousPhase === "P112.2"
      && status.nextPhase === "P112.4"
      && roadmap.currentPhase === "P112.3"
      && roadmap.previousPhase === "P112.2"
      && roadmap.nextPhase === "P112.4"))
    && statusById.get("P112")?.status === "in_progress"
    && statusById.get("P112.2")?.status === "complete"
    && ["planned", "complete"].includes(statusById.get("P112.3")?.status)
    && ["planned", "complete"].includes(statusById.get("P112.4")?.status)
    && roadmapById.get("P112.2")?.status === "complete",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("docs do not claim unsafe authority live", !/hosted DB mutation is enabled|raw SQL is allowed|runtime admission is enabled|execution unlock is enabled|provider spend is enabled|agent dispatch is enabled|project mutation is enabled|queue execution is enabled|work queue execution is enabled/i.test(docsBundle));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P112.2 local SQLite schema definitions for founder agent work queue items, events, and evidence references.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new allowlisted local entities.",
        "- Confirms the schema remains display-safe and does not enable hosted DB mutation, raw SQL, runtime admission, execution unlock, provider/model calls, agent dispatch, worker/tool execution, project mutation, deploy, release, export, package, network calls, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p1122-founder-live-agent-work-queue-schema",
        "- npm run check:p1121-founder-live-agent-work-queue-admission-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P112.2 is schema-only. It does not add runtime CRUD admission, write persistent runtime data, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, use network calls, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P112.2 Founder Live Agent Work Queue Schema Report", phase: "P112.2" },
);

printCheckReport("P112.2 Founder Live Agent Work Queue Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
