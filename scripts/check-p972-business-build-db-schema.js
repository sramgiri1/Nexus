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
const REPORT_PATH = "reports/p972-business-build-db-schema-report.md";
const TEST_DB = "local-state/runtime/check-p972.sqlite";
const BUSINESS_BUILD_ENTITIES = [
  "business_build_sessions",
  "business_build_execution_requests",
  "business_build_agent_lanes",
  "business_build_prd_snapshots",
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
const contract = readJson("contracts/os-roadmap/p97-execution-contracts.json");
const docs = readText("docs/architecture/P97_FOUNDER_BUSINESS_BUILD_GOVERNED_EXECUTION_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const contractP972 = contract.subphases?.find((entry) => entry.phaseId === "P97.2");
const descriptions = Object.fromEntries(BUSINESS_BUILD_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

let buildSession = null;
let executionRequest = null;
let agentLane = null;
let prdSnapshot = null;
let buildSessionList = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  buildSession = insertSqliteEntity("business_build_sessions", {
    buildSessionId: "p972-build-session",
    publicLabel: "Business Build session",
    sessionId: "p972-founder-session",
    prdId: "p972-prd",
    currentState: "schema_validated_locally",
    readinessPercent: 72,
    nextAction: "Model governed local CRUD admission.",
    ownerCapability: "NEXUS Business Build DB",
    evidenceRefs: ["reports/p972-business-build-db-schema-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
  }, sqliteInput);
  executionRequest = insertSqliteEntity("business_build_execution_requests", {
    requestId: "p972-request",
    buildSessionId: "p972-build-session",
    requestedLane: "product",
    requestedOperation: "local_crud_review",
    requestState: "blocked_until_governed_admission",
    approvalState: "not_approved",
    disabledReason: "P97.2 is schema-only.",
    validationCommands: ["npm run check:p972-business-build-db-schema"],
    executionAllowed: false,
    dispatchAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p972-business-build-db-schema-report.md"],
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
  }, sqliteInput);
  agentLane = insertSqliteEntity("business_build_agent_lanes", {
    laneId: "p972-lane",
    buildSessionId: "p972-build-session",
    lane: "product",
    ownerCapability: "NEXUS Product Strategy",
    currentState: "planned_locally",
    nextAction: "Wait for P97.3 CRUD admission model.",
    blockerSummary: "Agent dispatch remains blocked.",
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p972-business-build-db-schema-report.md"],
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
  }, sqliteInput);
  prdSnapshot = insertSqliteEntity("business_build_prd_snapshots", {
    snapshotId: "p972-snapshot",
    buildSessionId: "p972-build-session",
    prdId: "p972-prd",
    title: "iOS Snake Game PRD Snapshot",
    problemSummary: "Founder needs a scoped game build plan.",
    customerSummary: "Casual mobile game players",
    solutionSummary: "Simple Snake game with local launch plan",
    businessModelSummary: "Paid or ad-supported launch experiment",
    readinessPercent: 72,
    snapshotState: "captured_locally",
    evidenceRefs: ["reports/p972-business-build-db-schema-report.md"],
    createdAt: "2026-05-21T00:00:00.000Z",
    updatedAt: "2026-05-21T00:00:00.000Z",
  }, sqliteInput);
  buildSessionList = listSqliteEntityRecords("business_build_sessions", { limit: 5 }, sqliteInput);
}

const entities = listSqliteCrudEntities();
const unsafeSource = [
  schemaSql,
  readText("db/schema.json"),
].join("\n");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p972-business-build-db-schema"]));
addCheck("contract tracks P97.2 complete", contractP972?.status === "complete" && contractP972.allowedFiles?.includes("db/schema.json") && contractP972.allowedFiles.includes("db/schema.sql"));
addCheck("business build entities exist in schema", BUSINESS_BUILD_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("business build entities are redacted low-risk runtime state", BUSINESS_BUILD_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.retentionClass === "business_build_runtime_state" && entityByName.get(entity)?.piiRisk === "low"));
addCheck("business build session shape is complete", entityByName.get("business_build_sessions")?.primaryKey === "buildSessionId" && entityByName.get("business_build_sessions")?.fields?.readinessPercent === "integer");
addCheck("execution request blocks unsafe flags", entityByName.get("business_build_execution_requests")?.fields?.executionAllowed === "boolean" && entityByName.get("business_build_execution_requests")?.fields?.dispatchAllowed === "boolean" && entityByName.get("business_build_execution_requests")?.fields?.projectMutationAllowed === "boolean");
addCheck("agent lane blocks execution fields", entityByName.get("business_build_agent_lanes")?.fields?.dispatchAllowed === "boolean" && entityByName.get("business_build_agent_lanes")?.fields?.workerExecutionAllowed === "boolean" && entityByName.get("business_build_agent_lanes")?.fields?.projectMutationAllowed === "boolean");
addCheck("PRD snapshot shape is complete", entityByName.get("business_build_prd_snapshots")?.primaryKey === "snapshotId" && entityByName.get("business_build_prd_snapshots")?.fields?.businessModelSummary === "string");
addCheck("SQL tables exist", BUSINESS_BUILD_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_business_build_sessions_current_state") && schemaSql.includes("idx_business_build_agent_lanes_owner_capability"));
addCheck("SQLite schema transforms business build tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS business_build_sessions") && sqliteSchema.includes("evidence_refs     TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include business build fields", descriptions.business_build_sessions.fields.buildSessionId.column === "build_session_id" && descriptions.business_build_execution_requests.fields.projectMutationAllowed.column === "project_mutation_allowed");
addCheck("CRUD repository sees expanded entity set", entities.length >= 26 && BUSINESS_BUILD_ENTITIES.every((entity) => entities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P97.2 schema validation");
addCheck("isolated DB initializes business build tables", !cliAvailable || (init.initialized === true && init.tableCount >= 26 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated business build records can be inserted", !cliAvailable || (buildSession?.buildSessionId === "p972-build-session" && executionRequest?.requestId === "p972-request" && agentLane?.laneId === "p972-lane" && prdSnapshot?.snapshotId === "p972-snapshot"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(buildSession?.evidenceRefs) && executionRequest?.executionAllowed === false && agentLane?.projectMutationAllowed === false));
addCheck("isolated business build records can be listed", !cliAvailable || buildSessionList.some((entry) => entry.buildSessionId === "p972-build-session"));
addCheck("docs record P97.2", docs.includes("P97.2 is complete") && docs.includes("npm run check:p972-business-build-db-schema"));
addCheck("platform roadmap records P97.2", platformRoadmap.includes("P97.2 is complete") && (platformRoadmap.includes("P97.3 is next") || platformRoadmap.includes("P97.3 is complete")));
addCheck(
  "phase status advanced",
  statusById.get("P97.2")?.status === "complete"
    && ["P97.2", "P97.3", "P97.4", "P97.5", "P97.6", "P97.7"].includes(status.currentPhase)
    && ["P97.1", "P97.2", "P97.3", "P97.4", "P97.5", "P97.6"].includes(status.previousPhase)
    && ["P97.3", "P97.4", "P97.5", "P97.6", "P97.7", "P98"].includes(status.nextPhase),
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P97.2", roadmapById.get("P97.2")?.status === "complete" && ["planned", "complete"].includes(roadmapById.get("P97.3")?.status));
addCheck("no unsafe runtime imports or URLs", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(unsafeSource) && !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(unsafeSource));
addCheck("no unsafe enablement language", !/provider calls are enabled|agent dispatch is enabled|project mutation is enabled|hosted DB mutation is enabled|deploy is enabled|provider spend is enabled/i.test(`${docs}\n${platformRoadmap}`));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P97.2 Business Build DB schema definitions.",
        "- Confirms Business Build sessions, execution requests, agent lanes, and PRD snapshots are defined in schema.json and schema.sql.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new local Business Build entities.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p972-business-build-db-schema",
        "- npm run check:p922-sqlite-crud-repository",
        "- npm run check:p971-founder-business-build-governed-execution-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P97.2 is schema-only. It does not wire Command Center to DB records, add runtime CRUD admission, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P97.2 Business Build DB Schema Report", phase: "P97.2" },
);

printCheckReport("P97.2 Business Build DB Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
