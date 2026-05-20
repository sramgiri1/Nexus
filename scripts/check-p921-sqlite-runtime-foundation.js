import { existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { loadDbConfig, validateDbConfig } from "../db/dbConfig.js";
import {
  getSqliteRuntimeStatus,
  initializeSqliteRuntime,
  isSqliteCliAvailable,
  loadSqliteSchema,
  transformSchemaForSqlite,
} from "../db/sqliteRuntime.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p921-sqlite-runtime-foundation-report.md";
const TEST_DB = "local-state/runtime/check-p921.sqlite";

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
const defaultConfig = loadDbConfig();
const defaultValidation = validateDbConfig(defaultConfig);
const sqliteSchema = loadSqliteSchema();
const transformed = transformSchemaForSqlite(readText("db/schema.sql"));
const cliAvailable = isSqliteCliAvailable();
const dryRun = initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: true });
let liveInit = { initialized: false, tableCount: 0 };
let status = { ready: false };
if (cliAvailable) {
  liveInit = initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true });
  status = getSqliteRuntimeStatus({ mode: "sqlite-live", dbPath: TEST_DB, enableWrites: true });
}
const source = [
  readText("db/sqliteRuntime.js"),
  readText("db/dbConfig.js"),
  readText("db/dbHealth.js"),
  readText("local-api/routes/db.js"),
  readText("scripts/db-sqlite-init.js"),
].join("\n");

addCheck("default DB remains non-writing", defaultConfig.dbWritesEnabled === false && defaultConfig.mode === "disabled");
addCheck("default DB config validates", defaultValidation.valid, defaultValidation.errors.join("; "));
addCheck("schema transformed for SQLite", sqliteSchema.includes("CURRENT_TIMESTAMP") && !sqliteSchema.includes("DEFAULT now()") && !sqliteSchema.includes("JSONB"));
addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P92.1 local DB initialization");
addCheck("dry-run does not initialize DB", dryRun.dryRun === true && dryRun.initialized === false && dryRun.tableCount >= 10);
addCheck("live init creates local SQLite DB", !cliAvailable || (liveInit.initialized === true && liveInit.tableCount >= 10 && existsSync(join(ROOT, TEST_DB))));
addCheck("runtime status reports local DB ready", !cliAvailable || (status.ready === true && status.dbExists === true && status.sqliteLiveAllowed === true));
addCheck("package scripts registered", Boolean(packageJson.scripts?.["db:init:sqlite"]) && Boolean(packageJson.scripts?.["check:p921-sqlite-runtime-foundation"]));
addCheck("local path guard present", source.includes("SQLite DB path must stay under local-state/runtime"));
addCheck("no production/external DB enabled", !source.includes("productionDbAllowed: true") && !source.includes("externalDbAllowed: true"));
addCheck("no provider/tool/worker/deploy imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));
addCheck("no DB URLs or secrets", !/postgres:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]/i.test(source));

rmSync(join(ROOT, TEST_DB), { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P92.1 local SQLite runtime foundation.",
        "- Confirms default NEXUS DB mode remains non-writing unless explicit local SQLite flags are set.",
        "- Confirms local SQLite initialization uses the existing DB schema transformed for SQLite and writes only under local-state/runtime.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p921-sqlite-runtime-foundation",
        "- npm run check:db-foundation",
        "- npm run db:init:sqlite",
        "- NEXUS_DB_MODE=sqlite-live NEXUS_DB_ENABLE_WRITES=1 npm run db:init:sqlite -- --apply --reset",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P92.1 initializes a local SQLite DB only. Runtime repositories still use file-backed reads until a later P92 subphase wires selected reads and governed writes to SQLite.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P92.1 SQLite Runtime Foundation Report", phase: "P92.1" },
);

printCheckReport("P92.1 SQLite Runtime Foundation Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
