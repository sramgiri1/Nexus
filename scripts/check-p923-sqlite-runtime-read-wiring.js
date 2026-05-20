import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import { insertSqliteEntity } from "../db/sqliteCrudRepository.js";
import {
  createDbRepository,
  getRepositoryMode,
  getRepositoryReadStatus,
  readActions,
  readAgents,
  readAuditEvents,
  readContracts,
  readEvidence,
  readMissions,
  readProjects,
  readRoadmap,
  readRuntimeEvents,
  readTasks,
  writeNotSupportedYet,
} from "../db/dbRepository.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p923-sqlite-runtime-read-wiring-report.md";
const TEST_DB = "local-state/runtime/check-p923.sqlite";

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function withEnv(env, fn) {
  const previous = {
    NEXUS_DB_MODE: process.env.NEXUS_DB_MODE,
    NEXUS_DB_ENABLE_WRITES: process.env.NEXUS_DB_ENABLE_WRITES,
    NEXUS_SQLITE_PATH: process.env.NEXUS_SQLITE_PATH,
  };
  Object.entries(env).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
  try {
    return fn();
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
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

if (cliAvailable && init.initialized) {
  const writeInput = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB };
  insertSqliteEntity("projects", {
    projectId: "p923-project",
    label: "P92.3 SQLite Project",
    mode: "local-private",
    active: true,
  }, writeInput);
  insertSqliteEntity("missions", {
    contractId: "p923-mission",
    projectId: "p923-project",
    missionText: "Validate SQLite runtime read wiring.",
    mode: "local-private",
    source: "sqlite-checker",
  }, writeInput);
  insertSqliteEntity("mission_tasks", {
    taskId: "p923-mission-task",
    missionId: "p923-mission",
    projectId: "p923-project",
    title: "Mission task from SQLite",
    targetAgent: "db-runtime",
    capabilityId: "sqlite-read",
    riskLevel: "low",
    state: "planned",
    mutationAllowed: false,
    executionAllowed: false,
  }, writeInput);
  insertSqliteEntity("runtime_tasks", {
    taskId: "p923-runtime-task",
    missionId: "p923-mission",
    projectId: "p923-project",
    title: "Runtime task from SQLite",
    targetAgent: "db-runtime",
    capabilityId: "sqlite-read",
    riskLevel: "low",
    state: "ready",
    mutationAllowed: false,
    executionAllowed: false,
  }, writeInput);
  insertSqliteEntity("agents", {
    agentId: "p923-agent",
    role: "Runtime Read Checker",
    tier: "os",
    capabilities: ["sqlite-read"],
    active: true,
  }, writeInput);
  insertSqliteEntity("evidence", {
    evidenceId: "p923-evidence",
    taskId: "p923-runtime-task",
    type: "checker",
    result: "pass",
  }, writeInput);
  insertSqliteEntity("audit_events", {
    auditId: "p923-audit",
    taskId: "p923-runtime-task",
    eventType: "read_wiring_checked",
    agent: "nexus-db",
  }, writeInput);
  insertSqliteEntity("runtime_events", {
    eventId: "p923-event",
    taskId: "p923-runtime-task",
    eventType: "read_wiring_ready",
  }, writeInput);
  insertSqliteEntity("contracts", {
    contractId: "p923-contract",
    contractType: "runtime_read_wiring",
    projectId: "p923-project",
    targetAgent: "db-runtime",
  }, writeInput);
  insertSqliteEntity("actions", {
    actionId: "p923-action",
    actionType: "runtime_read",
    projectId: "p923-project",
    taskId: "p923-runtime-task",
    status: "complete",
  }, writeInput);
  insertSqliteEntity("roadmap_phases", {
    phase: "P92.3",
    label: "SQLite Runtime Read Wiring",
    status: "complete",
    current: true,
    next: false,
  }, writeInput);
}

const packageJson = readJson("package.json");
const fallbackMode = withEnv({
  NEXUS_DB_MODE: undefined,
  NEXUS_DB_ENABLE_WRITES: undefined,
  NEXUS_SQLITE_PATH: undefined,
}, () => getRepositoryMode());

const sqliteReadResults = withEnv({
  NEXUS_DB_MODE: "sqlite-live",
  NEXUS_DB_ENABLE_WRITES: undefined,
  NEXUS_SQLITE_PATH: TEST_DB,
}, () => {
  return {
    repo: createDbRepository(),
    status: getRepositoryReadStatus(),
    projects: readProjects(),
    missions: readMissions(),
    tasks: readTasks(),
    agents: readAgents(),
    evidence: readEvidence(),
    auditEvents: readAuditEvents(),
    runtimeEvents: readRuntimeEvents(),
    contracts: readContracts(),
    actions: readActions(),
    roadmap: readRoadmap(),
    writeBlockedMessage: capturesThrow(() => writeNotSupportedYet("runtime_tasks", { taskId: "blocked" })),
  };
});

const source = [
  readText("db/dbRepository.js"),
  readText("scripts/check-p923-sqlite-runtime-read-wiring.js"),
].join("\n");
const dbRepositorySource = readText("db/dbRepository.js");

addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P92.3 read wiring validation");
addCheck("test DB initialized", !cliAvailable || (init.initialized === true && init.tableCount >= 10 && existsSync(join(ROOT, TEST_DB))));
addCheck("disabled mode falls back to file-backed", fallbackMode === "file-backed");
addCheck("repository reports sqlite-live read mode", !cliAvailable || sqliteReadResults.repo.mode === "sqlite-live");
addCheck("repository keeps runtime writes disabled", sqliteReadResults.repo.dbWritesEnabled === false && sqliteReadResults.repo.runtimeWritesEnabled === false);
addCheck("readProjects uses SQLite rows", !cliAvailable || sqliteReadResults.projects[0]?.projectId === "p923-project" && sqliteReadResults.projects[0]?._source === "sqlite");
addCheck("readMissions uses SQLite rows", !cliAvailable || sqliteReadResults.missions[0]?.contractId === "p923-mission");
addCheck("readTasks uses SQLite mission and runtime rows", !cliAvailable || sqliteReadResults.tasks.missionTasks[0]?.taskId === "p923-mission-task" && sqliteReadResults.tasks.runtimeTasks[0]?.taskId === "p923-runtime-task");
addCheck("readAgents restores array fields", !cliAvailable || sqliteReadResults.agents[0]?.capabilities?.includes("sqlite-read"));
addCheck("readEvidence uses SQLite rows", !cliAvailable || sqliteReadResults.evidence[0]?.evidenceId === "p923-evidence");
addCheck("readAuditEvents uses SQLite rows", !cliAvailable || sqliteReadResults.auditEvents[0]?.auditId === "p923-audit");
addCheck("readRuntimeEvents uses SQLite rows", !cliAvailable || sqliteReadResults.runtimeEvents[0]?.eventId === "p923-event");
addCheck("readContracts uses SQLite rows", !cliAvailable || sqliteReadResults.contracts[0]?.contractId === "p923-contract");
addCheck("readActions uses SQLite rows", !cliAvailable || sqliteReadResults.actions[0]?.actionId === "p923-action");
addCheck("readRoadmap uses SQLite rows", !cliAvailable || sqliteReadResults.roadmap[0]?.phase === "P92.3");
addCheck("repository read status is display-safe", !cliAvailable || sqliteReadResults.status.sqliteReadsEnabled === true && sqliteReadResults.status.dbWritesEnabled === false);
addCheck("writeNotSupportedYet remains blocked", sqliteReadResults.writeBlockedMessage.includes("DB writes not supported"));
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p923-sqlite-runtime-read-wiring"]));
addCheck("no provider/tool/worker/project/deploy imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));
addCheck("no DB URLs or secrets", !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(dbRepositorySource));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P92.3 SQLite runtime read wiring.",
        "- Confirms repository reads use local SQLite when live and initialized.",
        "- Confirms repository writes remain blocked and file-backed fallback remains available.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p923-sqlite-runtime-read-wiring",
        "- npm run check:p922-sqlite-crud-repository",
        "- npm run check:p921-sqlite-runtime-foundation",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P92.3 wires read paths only. Governed runtime writes and Command Center DB live-state UX are later P92 subphases.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P92.3 SQLite Runtime Read Wiring Report", phase: "P92.3" },
);

printCheckReport("P92.3 SQLite Runtime Read Wiring Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
