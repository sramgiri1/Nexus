import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";

const ROOT = process.cwd();
const DEFAULT_SQLITE_PATH = "local-state/runtime/nexus.sqlite";
const SQLITE_MODE = "sqlite-live";

function normalizeDbPath(value = "") {
  const requested = value || DEFAULT_SQLITE_PATH;
  const fullPath = resolve(ROOT, requested);
  const runtimeRoot = resolve(ROOT, "local-state/runtime");
  if (!fullPath.startsWith(runtimeRoot)) {
    throw new Error("SQLite DB path must stay under local-state/runtime");
  }
  return fullPath;
}

export function transformSchemaForSqlite(schemaSql = "") {
  return String(schemaSql)
    .replace(/TIMESTAMPTZ\s+NOT\s+NULL\s+DEFAULT\s+now\(\)/g, "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP")
    .replace(/\bJSONB\b/g, "TEXT")
    .replace(/\bBOOLEAN\b/g, "INTEGER")
    .replace(/DEFAULT\s+true/g, "DEFAULT 1")
    .replace(/DEFAULT\s+false/g, "DEFAULT 0");
}

export function loadSqliteSchema() {
  return transformSchemaForSqlite(readFileSync(join(ROOT, "db/schema.sql"), "utf8"));
}

export function getSqliteRuntimeConfig(input = {}) {
  const mode = input.mode || process.env.NEXUS_DB_MODE || "disabled";
  const dbPath = normalizeDbPath(input.dbPath || process.env.NEXUS_SQLITE_PATH || DEFAULT_SQLITE_PATH);
  const writesExplicitlyEnabled = input.enableWrites === true || process.env.NEXUS_DB_ENABLE_WRITES === "1";
  return {
    phase: "P92.1",
    mode,
    dbPath,
    sqliteCli: input.sqliteCli || process.env.NEXUS_SQLITE_CLI || "sqlite3",
    sqliteLiveAllowed: mode === SQLITE_MODE,
    dbWritesEnabled: mode === SQLITE_MODE && writesExplicitlyEnabled,
    productionDbAllowed: false,
    externalDbAllowed: false,
    fileFallbackRequired: true,
  };
}

export function isSqliteCliAvailable(sqliteCli = "sqlite3") {
  try {
    execFileSync(sqliteCli, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runSqlite(dbPath, sql, sqliteCli = "sqlite3") {
  execFileSync(sqliteCli, [dbPath], {
    input: sql,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

export function initializeSqliteRuntime(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  const schema = loadSqliteSchema();
  const dryRun = input.dryRun !== false;
  const cliAvailable = isSqliteCliAvailable(config.sqliteCli);
  const result = {
    phase: "P92.1",
    mode: config.mode,
    dbPath: config.dbPath,
    dryRun,
    cliAvailable,
    dbWritesEnabled: config.dbWritesEnabled,
    initialized: false,
    tableCount: 0,
    disabledReason: "SQLite initialization requires NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.",
  };

  if (!cliAvailable) return result;
  if (dryRun) {
    return {
      ...result,
      tableCount: (schema.match(/CREATE TABLE IF NOT EXISTS/g) || []).length,
      disabledReason: "Dry run only. No SQLite DB file was created.",
    };
  }
  if (!config.dbWritesEnabled) return result;

  mkdirSync(dirname(config.dbPath), { recursive: true });
  if (input.reset === true && existsSync(config.dbPath)) rmSync(config.dbPath, { force: true });
  runSqlite(config.dbPath, schema, config.sqliteCli);
  const tableRows = execFileSync(config.sqliteCli, [
    config.dbPath,
    "SELECT count(*) FROM sqlite_master WHERE type='table';",
  ], { encoding: "utf8" }).trim();

  return {
    ...result,
    initialized: true,
    tableCount: Number(tableRows || 0),
    disabledReason: "",
  };
}

export function getSqliteRuntimeStatus(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  const cliAvailable = isSqliteCliAvailable(config.sqliteCli);
  const dbExists = existsSync(config.dbPath);
  return {
    phase: "P92.1",
    mode: config.mode,
    dbPath: config.dbPath,
    sqliteCliAvailable: cliAvailable,
    dbExists,
    dbWritesEnabled: config.dbWritesEnabled,
    sqliteLiveAllowed: config.sqliteLiveAllowed,
    productionDbAllowed: false,
    externalDbAllowed: false,
    fileFallbackRequired: true,
    ready: cliAvailable && dbExists && config.sqliteLiveAllowed,
    nextAction: dbExists
      ? "Use the local SQLite DB for governed NEXUS runtime persistence after repository wiring is complete."
      : "Run npm run db:init:sqlite with explicit local DB write flags.",
  };
}
