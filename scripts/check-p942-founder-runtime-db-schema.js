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
const REPORT_PATH = "reports/p942-founder-runtime-db-schema-report.md";
const TEST_DB = "local-state/runtime/check-p942.sqlite";
const FOUNDER_ENTITIES = [
  "founder_sessions",
  "founder_qna_turns",
  "founder_prd_artifacts",
  "founder_workstream_plans",
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
const contract = readJson("contracts/os-roadmap/p94-execution-contracts.json");
const docs = readText("docs/architecture/P94_FOUNDER_RUNTIME_DB_CRUD_WORKFLOW_WIRING_PLAN.md");
const platformRoadmap = readText("docs/architecture/NEXUS_PLATFORM_ROADMAP.md");
const status = readJson("os-roadmap/phase-status.json");
const roadmap = readJson("os-roadmap/nexus-phases.json");
const statusById = new Map((status.phases || []).map((entry) => [entry.phaseId, entry]));
const roadmapById = new Map((roadmap.phases || []).map((entry) => [entry.phaseId, entry]));
const entityByName = new Map((schema.entities || []).map((entry) => [entry.name, entry]));
const contractP942 = contract.subphases?.find((entry) => entry.phaseId === "P94.2");
const descriptions = Object.fromEntries(FOUNDER_ENTITIES.map((entity) => [entity, describeSqliteCrudEntity(entity)]));
const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

let session = null;
let qnaTurn = null;
let prdArtifact = null;
let workstreamPlan = null;
let sessionList = [];

if (cliAvailable && init.initialized) {
  const sqliteInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  session = insertSqliteEntity("founder_sessions", {
    sessionId: "p942-session",
    publicLabel: "Founder session",
    founderIdeaSummary: "iOS Snake game for the App Store",
    currentState: "needs_next_question",
    nextQuestion: "Who is the target player?",
    readinessPercent: 42,
    ownerCapability: "NEXUS Founder Runtime DB",
    evidenceRefs: ["reports/p942-founder-runtime-db-schema-report.md"],
    activityRefs: ["reports/os-phase-status-report.md"],
    createdAt: "2026-05-20T22:29:11.000Z",
    updatedAt: "2026-05-20T22:29:11.000Z",
  }, sqliteInput);
  qnaTurn = insertSqliteEntity("founder_qna_turns", {
    turnId: "p942-turn",
    sessionId: "p942-session",
    speaker: "founder",
    prompt: "Build a simple iOS Snake game for the App Store",
    responseSummary: "Founder wants a simple arcade game and feasibility read.",
    turnState: "captured_locally",
    createdAt: "2026-05-20T22:29:11.000Z",
  }, sqliteInput);
  prdArtifact = insertSqliteEntity("founder_prd_artifacts", {
    prdId: "p942-prd",
    sessionId: "p942-session",
    title: "iOS Snake Game PRD",
    problemSummary: "Founder needs a scoped mobile game product plan.",
    customerSummary: "Casual mobile players",
    solutionSummary: "Simple touch-controlled Snake game",
    businessModelSummary: "Low-cost paid or ad-supported launch test",
    readinessPercent: 68,
    currentState: "drafted_locally",
    evidenceRefs: ["reports/p942-founder-runtime-db-schema-report.md"],
    createdAt: "2026-05-20T22:29:11.000Z",
    updatedAt: "2026-05-20T22:29:11.000Z",
  }, sqliteInput);
  workstreamPlan = insertSqliteEntity("founder_workstream_plans", {
    planId: "p942-plan",
    sessionId: "p942-session",
    prdId: "p942-prd",
    lane: "product",
    ownerCapability: "Product Strategy Agent",
    currentState: "planned_locally",
    nextAction: "Validate scope and gameplay loop.",
    blockerSummary: "Dispatch remains blocked.",
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    evidenceRefs: ["reports/p942-founder-runtime-db-schema-report.md"],
    createdAt: "2026-05-20T22:29:11.000Z",
    updatedAt: "2026-05-20T22:29:11.000Z",
  }, sqliteInput);
  sessionList = listSqliteEntityRecords("founder_sessions", { limit: 5 }, sqliteInput);
}

const entities = listSqliteCrudEntities();
const unsafeSource = [
  schemaSql,
  readText("db/schema.json"),
].join("\n");

addCheck("package script registered", Boolean(packageJson.scripts?.["check:p942-founder-runtime-db-schema"]));
addCheck("contract tracks P94.2 complete", contractP942?.status === "complete" && contractP942.allowedFiles?.includes("db/schema.json") && contractP942.allowedFiles.includes("db/schema.sql"));
addCheck("founder entities exist in schema", FOUNDER_ENTITIES.every((entity) => entityByName.has(entity)));
addCheck("founder entities are redacted low-risk runtime state", FOUNDER_ENTITIES.every((entity) => entityByName.get(entity)?.redactionRequired === true && entityByName.get(entity)?.retentionClass === "founder_runtime_state" && entityByName.get(entity)?.piiRisk === "low"));
addCheck("founder session shape is complete", entityByName.get("founder_sessions")?.primaryKey === "sessionId" && entityByName.get("founder_sessions")?.fields?.nextQuestion === "string" && entityByName.get("founder_sessions")?.fields?.readinessPercent === "integer");
addCheck("founder Q&A turn shape is complete", entityByName.get("founder_qna_turns")?.primaryKey === "turnId" && entityByName.get("founder_qna_turns")?.fields?.responseSummary === "string");
addCheck("founder PRD artifact shape is complete", entityByName.get("founder_prd_artifacts")?.primaryKey === "prdId" && entityByName.get("founder_prd_artifacts")?.fields?.businessModelSummary === "string");
addCheck("founder workstream plan blocks execution fields", entityByName.get("founder_workstream_plans")?.fields?.dispatchAllowed === "boolean" && entityByName.get("founder_workstream_plans")?.fields?.workerExecutionAllowed === "boolean" && entityByName.get("founder_workstream_plans")?.fields?.projectMutationAllowed === "boolean");
addCheck("SQL tables exist", FOUNDER_ENTITIES.every((entity) => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${entity}`)));
addCheck("SQL indexes exist", schemaSql.includes("idx_founder_sessions_current_state") && schemaSql.includes("idx_founder_workstream_plans_owner_capability"));
addCheck("SQLite schema transforms founder tables", sqliteSchema.includes("CREATE TABLE IF NOT EXISTS founder_sessions") && sqliteSchema.includes("evidence_refs        TEXT") && !sqliteSchema.includes("JSONB"));
addCheck("CRUD entity descriptions include founder fields", descriptions.founder_sessions.fields.sessionId.column === "session_id" && descriptions.founder_workstream_plans.fields.projectMutationAllowed.column === "project_mutation_allowed");
addCheck("CRUD repository sees expanded entity set", entities.length >= 22 && FOUNDER_ENTITIES.every((entity) => entities.some((entry) => entry.name === entity)));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P94.2 schema validation");
addCheck("isolated DB initializes founder tables", !cliAvailable || (init.initialized === true && init.tableCount >= 22 && existsSync(join(ROOT, TEST_DB))));
addCheck("isolated founder records can be inserted", !cliAvailable || (session?.sessionId === "p942-session" && qnaTurn?.turnId === "p942-turn" && prdArtifact?.prdId === "p942-prd" && workstreamPlan?.planId === "p942-plan"));
addCheck("array and boolean fields serialize safely", !cliAvailable || (Array.isArray(session?.evidenceRefs) && workstreamPlan?.dispatchAllowed === false && workstreamPlan?.projectMutationAllowed === false));
addCheck("isolated founder records can be listed", !cliAvailable || sessionList.some((entry) => entry.sessionId === "p942-session"));
addCheck("docs record P94.2", docs.includes("P94.2 is complete") && docs.includes("npm run check:p942-founder-runtime-db-schema"));
addCheck("platform roadmap records P94.2", platformRoadmap.includes("P94.2 is complete") && platformRoadmap.includes("P94.3 is next"));
addCheck(
  "phase status advanced",
  statusById.get("P94.2")?.status === "complete"
    && status.currentPhase === "P94.2"
    && status.previousPhase === "P94.1"
    && status.nextPhase === "P94.3",
  `${status.currentPhase}/${status.previousPhase}/${status.nextPhase}`,
);
addCheck("roadmap tracks P94.2", roadmapById.get("P94.2")?.status === "complete" && roadmapById.get("P94.3")?.status === "planned");
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
        "- Validates P94.2 founder runtime DB schema definitions.",
        "- Confirms founder sessions, Q&A turns, PRD artifacts, and workstream plans are defined in schema.json and schema.sql.",
        "- Confirms isolated SQLite initialization and CRUD repository mapping for the new local founder workflow entities.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p942-founder-runtime-db-schema",
        "- npm run check:p922-sqlite-crud-repository",
        "- npm run check:p941-founder-runtime-db-crud-contract",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P94.2 is schema-only. It does not wire Command Center to DB records, add runtime CRUD admission, dispatch agents, execute tools/workers, create or mutate projects, call providers/models, use hosted DBs, deploy, release, export, package, or spend.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P94.2 Founder Runtime DB Schema Report", phase: "P94.2" },
);

printCheckReport("P94.2 Founder Runtime DB Schema Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
