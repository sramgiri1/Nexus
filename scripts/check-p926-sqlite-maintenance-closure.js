import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCheckTable, writeMarkdownReport } from "../shared/reportWriter.js";
import { printCheckReport } from "../shared/checkResultFormatter.js";
import { initializeSqliteRuntime, isSqliteCliAvailable } from "../db/sqliteRuntime.js";
import {
  buildSqliteBackupPlan,
  createSqliteRuntimeBackup,
  validateSqliteMaintenance,
} from "../db/sqliteMaintenance.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/p926-sqlite-maintenance-closure-report.md";
const TEST_DB = "local-state/runtime/check-p926.sqlite";
const TEST_BACKUP = "check-p926-backup.sqlite";
const TEST_BACKUP_PATH = join(ROOT, "local-state/runtime/backups", TEST_BACKUP);

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
rmSync(TEST_BACKUP_PATH, { force: true });

const cliAvailable = isSqliteCliAvailable();
const init = cliAvailable
  ? initializeSqliteRuntime({ mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, dryRun: false, reset: true })
  : { initialized: false, tableCount: 0 };
const input = { mode: "sqlite-live", enableWrites: true, dbPath: TEST_DB, backupName: TEST_BACKUP };
const dryRun = createSqliteRuntimeBackup({ ...input, dryRun: true });
const dryRunCreatedFile = existsSync(TEST_BACKUP_PATH);
const applied = cliAvailable && init.initialized
  ? createSqliteRuntimeBackup({ ...input, dryRun: false, apply: true, reset: true })
  : { created: false };
const traversalError = capturesThrow(() => buildSqliteBackupPlan({ ...input, backupName: "../bad.sqlite" }));
const validation = validateSqliteMaintenance(input);
const packageJson = readJson("package.json");
const source = [
  readText("db/sqliteMaintenance.js"),
  readText("scripts/db-sqlite-backup.js"),
  readText("scripts/check-p926-sqlite-maintenance-closure.js"),
].join("\n");
const maintenanceSource = [
  readText("db/sqliteMaintenance.js"),
  readText("scripts/db-sqlite-backup.js"),
].join("\n");

addCheck("SQLite CLI available", cliAvailable, "sqlite3 command is required for P92.6 maintenance validation");
addCheck("test DB initialized", !cliAvailable || (init.initialized === true && init.tableCount >= 10 && existsSync(join(ROOT, TEST_DB))));
addCheck("backup dry-run does not create file", dryRun.created === false && dryRun.dryRun === true && !dryRunCreatedFile);
addCheck("backup apply creates local copy", !cliAvailable || (applied.created === true && existsSync(TEST_BACKUP_PATH) && applied.backupSizeBytes > 0));
addCheck("backup path traversal blocked", traversalError.includes("file name"));
addCheck("maintenance validation is local-only", validation.localOnly === true && validation.externalDbAllowed === false && validation.productionDbAllowed === false);
addCheck("package scripts registered", Boolean(packageJson.scripts?.["db:backup:sqlite"]) && Boolean(packageJson.scripts?.["check:p926-sqlite-maintenance-closure"]));
addCheck("index exports maintenance helpers", readText("db/index.js").includes("createSqliteRuntimeBackup"));
addCheck("no provider/tool/worker/project/deploy imports", !/from\s+["'][^"']*(providers|tools|worker-runtime|deploy|release|projects)\//.test(source));
addCheck("no hosted DB URLs or secrets", !/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\/|DATABASE_URL=|Bearer\s+|sk-[A-Za-z0-9]{20,}/i.test(maintenanceSource));

rmSync(join(ROOT, TEST_DB), { force: true });
rmSync(TEST_BACKUP_PATH, { force: true });

const failed = checks.filter((check) => check.status === "FAIL");

writeMarkdownReport(
  join(ROOT, REPORT_PATH),
  [
    {
      title: "Scope",
      body: [
        "- Validates P92.6 local SQLite maintenance closure.",
        "- Confirms SQLite backup is dry-run by default and path-guarded under local-state/runtime/backups.",
        "- Confirms backup validation is local-only and does not enable hosted DBs, production DBs, providers, project mutation, deploy, package, or spend.",
      ].join("\n"),
    },
    { title: "Checks", body: buildCheckTable(checks) },
    {
      title: "Validation Commands",
      body: [
        "- npm run check:p926-sqlite-maintenance-closure",
        "- npm run check:p925-command-center-db-live-state-ux",
        "- npm run check:p924-governed-sqlite-runtime-writes",
        "- npm run check:os-phase-status",
        "- npm run check:phase-validation-coverage",
        "- git diff --check",
      ].join("\n"),
    },
    {
      title: "Known Limitations",
      body: "- P92.6 adds local backup maintenance only. Hosted DB migration, production DBs, and project mutation remain blocked.",
    },
    { title: "Result", body: failed.length === 0 ? `PASS (${checks.length}/${checks.length})` : `FAIL (${failed.length} failed)` },
  ],
  { title: "P92.6 SQLite Maintenance Closure Report", phase: "P92.6" },
);

printCheckReport("P92.6 SQLite Maintenance Closure Check", checks, failed.length === 0 ? "PASS" : "FAIL");
if (failed.length > 0) process.exit(1);
