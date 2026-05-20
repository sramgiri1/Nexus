import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  createSqliteCrudRepository,
  deleteSqliteEntity,
  describeSqliteCrudEntity,
  getSqliteEntityById,
  insertSqliteEntity,
  listSqliteCrudEntities,
  listSqliteEntityRecords,
  updateSqliteEntity,
  validateSqliteCrudRepository,
} from "../db/sqliteCrudRepository.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p922-sqlite-crud-repository-report.md";
const TEST_DB = "local-state/runtime/check-p922.sqlite";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function capturesThrow(fn) {
  try {
    fn();
    return "";
  } catch (error) {
    return error.message || String(error);
  }
}

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

rmSync(join(ROOT, TEST_DB), { force: true });

const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

let runtimeTask = null;
let runtimeTaskRead = null;
let runtimeTaskAfterUpdate = null;
let runtimeTaskList = [];
let deleted = { deleted: false };
let agent = null;
let writeBlockedMessage = "";
let unknownEntityMessage = "";
let unknownFieldMessage = "";

if (cliAvailable && init.initialized) {
  writeBlockedMessage = capturesThrow(() => {
    insertSqliteEntity("runtime_tasks", {
      taskId: "p922-blocked-write",
      projectId: "nexus-os",
      title: "Blocked write",
      state: "planned",
    }, { mode: "sqlite-live", dbPath: TEST_DB });
  });

  runtimeTask = insertSqliteEntity("runtime_tasks", {
    taskId: "p922-runtime-task",
    missionId: "p92",
    projectId: "nexus-os",
    title: "P92.2 CRUD validation task",
    targetAgent: "db-runtime",
    capabilityId: "sqlite-crud",
    riskLevel: "low",
    state: "planned",
    mutationAllowed: false,
    executionAllowed: false,
  }, { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB });
  runtimeTaskRead = getSqliteEntityById("runtime_tasks", "p922-runtime-task", { mode: "sqlite-live", dbPath: TEST_DB });

  runtimeTaskAfterUpdate = updateSqliteEntity(
    "runtime_tasks",
    "p922-runtime-task",
    { state: "ready", updatedAt: "2026-05-20T00:00:00.000Z" },
    { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB },
  );
  runtimeTaskList = listSqliteEntityRecords("runtime_tasks", { limit: 5 }, { mode: "sqlite-live", dbPath: TEST_DB });

  agent = insertSqliteEntity("agents", {
    agentId: "p922-agent",
    role: "Database Runtime Checker",
    tier: "os",
    capabilities: ["sqlite-read", "sqlite-write"],
    active: true,
  }, { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB });

  unknownEntityMessage = capturesThrow(() => {
    listSqliteEntityRecords("runtime_tasks; DROP TABLE agents", {}, { mode: "sqlite-live", dbPath: TEST_DB });
  });
  unknownFieldMessage = capturesThrow(() => {
    updateSqliteEntity("runtime_tasks", "p922-runtime-task", { rawSql: "DROP TABLE agents" }, { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB });
  });

  deleted = deleteSqliteEntity("runtime_tasks", "p922-runtime-task", { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB });
}

const packageJson = readJson("package.json");
const entities = listSqliteCrudEntities();
const runtimeTaskDescription = describeSqliteCrudEntity("runtime_tasks");
const validation = validateSqliteCrudRepository({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB });
const exportedIndex = readText("db/index.js");
const source = [
  readText("db/sqliteCrudRepository.js"),
  readText("scripts/check-p922-sqlite-crud-repository.js"),
].join("\n");
const crudSource = readText("db/sqliteCrudRepository.js");

addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P92.2 CRUD validation");
addCheck("test DB initialized", !cliAvailable || (init.initialized === true && init.tableCount >= 10 && existsSync(join(ROOT, TEST_DB))));
addCheck("all schema entities are allowlisted", entities.length >= 22 && entities.some((entity) => entity.name === "runtime_tasks") && entities.some((entity) => entity.name === "founder_sessions"));
addCheck("entity description maps fields to SQLite columns", runtimeTaskDescription.fields.taskId.column === "task_id" && runtimeTaskDescription.fields.mutationAllowed.column === "mutation_allowed");
addCheck("default writes are blocked without explicit flag", !cliAvailable || writeBlockedMessage.includes("NEXUS_DB_ENABLE_WRITES=1"));
addCheck("insert/get works for runtime task", !cliAvailable || (runtimeTask?.taskId === "p922-runtime-task" && runtimeTaskRead?.projectId === "nexus-os"));
addCheck("update works for runtime task", !cliAvailable || runtimeTaskAfterUpdate?.state === "ready");
addCheck("list works with limit", !cliAvailable || runtimeTaskList.length >= 1);
addCheck("array field serializes and restores", !cliAvailable || Array.isArray(agent?.capabilities) && agent.capabilities.includes("sqlite-write"));
addCheck("delete works for runtime task", !cliAvailable || deleted.deleted === true);
addCheck("unknown entities are rejected", !cliAvailable || unknownEntityMessage.includes("Unknown SQLite entity"));
addCheck("unknown fields are rejected", !cliAvailable || unknownFieldMessage.includes("Unknown field"));
addCheck("repository factory exposes CRUD shape", typeof createSqliteCrudRepository({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB }).insert === "function");
addCheck("validation envelope is display-safe", validation.phase === "P92.2" && validation.rawSqlAccepted === false && validation.fileFallbackRequired === true);
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p922-sqlite-crud-repository"]));
addCheck("index exports sqlite CRUD repository", exportedIndex.includes("createSqliteCrudRepository") && exportedIndex.includes("validateSqliteCrudRepository"));
addCheck("no provider/tool/worker/project/deploy imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));
addCheck("no DB URLs or secrets", !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]/i.test(crudSource));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P92.2 SQLite CRUD repository core.",
        "- Confirms CRUD is schema allowlisted and rejects unknown entities or fields.",
        "- Confirms writes require explicit local SQLite live flags and remain disabled by default.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p922-sqlite-crud-repository",
        "- npm run check:p921-sqlite-runtime-foundation",
        "- npm run check:os-phase-status",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P92.2 adds the guarded SQLite CRUD core only. Runtime routes and Command Center screens are wired to DB-backed CRUD in later P92 subphases.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P92.2 SQLite CRUD Repository Report", phase: "P92.2" },
);

printCheckReport("P92.2 SQLite CRUD Repository Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
