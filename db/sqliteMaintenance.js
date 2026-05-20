import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import process from "node:process";
import { getSqliteRuntimeConfig, getSqliteRuntimeStatus } from "./sqliteRuntime.js";

const ROOT = process.cwd();
const BACKUP_ROOT = "local-state/runtime/backups";

function normalizeBackupPath(value = "") {
  const safeName = value || `nexus-sqlite-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`;
  if (safeName.includes("/") || safeName.includes("\\")) {
    throw new Error("SQLite backup name must be a file name, not a path");
  }
  const fullPath = resolve(ROOT, BACKUP_ROOT, basename(safeName));
  const backupRoot = resolve(ROOT, BACKUP_ROOT);
  if (!fullPath.startsWith(backupRoot)) {
    throw new Error("SQLite backup path must stay under local-state/runtime/backups");
  }
  return fullPath;
}

export function buildSqliteBackupPlan(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  const status = getSqliteRuntimeStatus(input);
  const backupPath = normalizeBackupPath(input.backupName);
  return {
    phase: "P92.6",
    mode: config.mode,
    sourceReady: status.ready === true,
    sourceExists: existsSync(config.dbPath),
    backupPath,
    backupRoot: resolve(ROOT, BACKUP_ROOT),
    dryRun: input.dryRun !== false,
    externalDbAllowed: false,
    productionDbAllowed: false,
    providerSpendAllowed: false,
    nextAction: status.ready
      ? "Run backup with explicit local backup apply flag when an operator wants a local SQLite copy."
      : "Initialize local SQLite before creating a backup.",
  };
}

export function createSqliteRuntimeBackup(input = {}) {
  const plan = buildSqliteBackupPlan(input);
  const apply = input.apply === true || process.env.NEXUS_SQLITE_BACKUP_APPLY === "1";
  if (plan.dryRun || !apply) {
    return {
      ...plan,
      created: false,
      disabledReason: "Dry run only. Set --apply or NEXUS_SQLITE_BACKUP_APPLY=1 to create a local backup.",
    };
  }
  if (!plan.sourceReady || !plan.sourceExists) {
    return {
      ...plan,
      created: false,
      disabledReason: "SQLite backup requires an initialized local sqlite-live DB.",
    };
  }

  mkdirSync(dirname(plan.backupPath), { recursive: true });
  if (input.reset === true && existsSync(plan.backupPath)) rmSync(plan.backupPath, { force: true });
  copyFileSync(getSqliteRuntimeConfig(input).dbPath, plan.backupPath);
  const backupSizeBytes = statSync(plan.backupPath).size;
  return {
    ...plan,
    created: true,
    backupSizeBytes,
    disabledReason: "",
  };
}

export function validateSqliteMaintenance(input = {}) {
  const plan = buildSqliteBackupPlan(input);
  return {
    phase: "P92.6",
    backupRoot: plan.backupRoot,
    sourceReady: plan.sourceReady,
    dryRunDefault: plan.dryRun === true,
    localOnly: true,
    externalDbAllowed: false,
    productionDbAllowed: false,
    providerSpendAllowed: false,
  };
}
