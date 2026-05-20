import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import { summarizeSqliteRuntimeWriteReadiness } from "../db/sqliteRuntimeWrites.js";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { appendActivityEvent } from "../observability/activityStore.js";
import { readEvidence, readAuditEvents, readRuntimeEvents } from "../db/dbRepository.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p924-governed-sqlite-runtime-writes-report.md";
const TEST_DB = "local-state/runtime/check-p924.sqlite";
const RUNTIME_FILES = [
  "local-state/runtime/evidence.jsonl",
  "local-state/runtime/audit.jsonl",
  "local-state/runtime/activity.jsonl",
];

function readText(relativePath) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function snapshotFiles() {
  return Object.fromEntries(RUNTIME_FILES.map((relativePath) => {
    const fullPath = join(ROOT, relativePath);
    return [relativePath, existsSync(fullPath) ? readFileSync(fullPath, "utf8") : null];
  }));
}

function restoreFiles(snapshot) {
  for (const [relativePath, content] of Object.entries(snapshot)) {
    const fullPath = join(ROOT, relativePath);
    if (content === null) rmSync(fullPath, { force: true });
    else writeFileSync(fullPath, content, "utf8");
  }
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

const checks = [];
function addCheck(name, passed, details = "") {
  checks.push({ name, status: passed ? "PASS" : "FAIL", details });
}

rmSync(join(ROOT, TEST_DB), { force: true });
const runtimeSnapshot = snapshotFiles();

const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };

const disabledEvidenceResult = withEnv({
  NEXUS_DB_MODE: undefined,
  NEXUS_DB_ENABLE_WRITES: undefined,
  NEXUS_SQLITE_PATH: undefined,
}, () => appendEvidence({
  evidenceId: "p924-disabled-evidence",
  type: "checker",
  result: "INFO",
  dataClassification: "internal",
  summary: "Disabled SQLite write check.",
}));

const liveResults = cliAvailable && init.initialized
  ? withEnv({
    NEXUS_DB_MODE: "sqlite-live",
    NEXUS_DB_ENABLE_WRITES: "1",
    NEXUS_SQLITE_PATH: TEST_DB,
  }, () => {
    const evidence = appendEvidence({
      evidenceId: "p924-evidence",
      taskId: "p924-task",
      type: "checker",
      result: "PASS",
      dataClassification: "internal",
      summary: "SQLite evidence write check.",
    });
    const audit = appendAuditEvent({
      auditId: "p924-audit",
      taskId: "p924-task",
      eventType: "sqlite_runtime_write_checked",
      actorId: "nexus-db",
      actorType: "system",
      summary: "SQLite audit write check.",
    });
    const activity = appendActivityEvent({
      activityId: "p924-activity",
      taskId: "p924-task",
      category: "sqlite_runtime_write_checked",
      createdAt: "2026-05-20T00:00:00.000Z",
    });
    return {
      evidence,
      audit,
      activity,
      evidenceRows: readEvidence(),
      auditRows: readAuditEvents(),
      runtimeRows: readRuntimeEvents(),
      readiness: summarizeSqliteRuntimeWriteReadiness(),
    };
  })
  : {
    evidence: {},
    audit: {},
    activity: {},
    evidenceRows: [],
    auditRows: [],
    runtimeRows: [],
    readiness: summarizeSqliteRuntimeWriteReadiness({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB }),
  };

restoreFiles(runtimeSnapshot);

const packageJson = readJson("package.json");
const source = [
  readText("db/sqliteRuntimeWrites.js"),
  readText("local-state/appendEvidence.js"),
  readText("local-state/appendAuditEvent.js"),
  readText("observability/activityStore.js"),
  readText("scripts/check-p924-governed-sqlite-runtime-writes.js"),
].join("\n");
const runtimeWriteSource = readText("db/sqliteRuntimeWrites.js");

addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P92.4 write validation");
addCheck("test DB initialized", !cliAvailable || (init.initialized === true && init.tableCount >= 10 && existsSync(join(ROOT, TEST_DB))));
addCheck("disabled evidence write keeps SQLite disabled", disabledEvidenceResult.ok === true && disabledEvidenceResult.sqlite?.written === false);
addCheck("live evidence append writes SQLite", !cliAvailable || liveResults.evidence.sqlite?.written === true);
addCheck("live audit append writes SQLite", !cliAvailable || liveResults.audit.sqlite?.written === true);
addCheck("live activity append writes SQLite runtime event", !cliAvailable || liveResults.activity.sqlite?.written === true);
addCheck("readEvidence sees SQLite evidence", !cliAvailable || liveResults.evidenceRows.some((row) => row.evidenceId === "p924-evidence"));
addCheck("readAuditEvents sees SQLite audit", !cliAvailable || liveResults.auditRows.some((row) => row.auditId === "p924-audit"));
addCheck("readRuntimeEvents sees SQLite activity", !cliAvailable || liveResults.runtimeRows.some((row) => row.eventId === "p924-activity"));
addCheck("write readiness is narrowly scoped", liveResults.readiness.allowedEntities.length === 3 && liveResults.readiness.projectMutationAllowed === false);
addCheck("package script registered", Boolean(packageJson.scripts?.["check:p924-governed-sqlite-runtime-writes"]));
addCheck("append modules call SQLite bridge", source.includes("appendSqliteEvidence") && source.includes("appendSqliteAuditEvent") && source.includes("appendSqliteActivityEvent"));
addCheck("no general project/provider/deploy mutation imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));
addCheck("no DB URLs or secrets", !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(runtimeWriteSource));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P92.4 governed SQLite runtime writes.",
        "- Confirms evidence, audit, and activity append paths can persist to local SQLite when explicit write flags are set.",
        "- Confirms file-backed append behavior remains available and SQLite writes stay disabled by default.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p924-governed-sqlite-runtime-writes",
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
      body: "- P92.4 limits SQLite write wiring to evidence, audit, and activity/runtime event ledgers. Broader entity mutation remains blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P92.4 Governed SQLite Runtime Writes Report", phase: "P92.4" },
);

printCheckReport("P92.4 Governed SQLite Runtime Writes Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
