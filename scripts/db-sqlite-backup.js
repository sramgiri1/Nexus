import { createSqliteRuntimeBackup } from "../db/sqliteMaintenance.js";

const args = new Set(process.argv.slice(2));
const backupNameArg = process.argv.find((arg) => arg.startsWith("--name="));

const result = createSqliteRuntimeBackup({
  dryRun: !args.has("--apply"),
  apply: args.has("--apply"),
  reset: args.has("--reset"),
  backupName: backupNameArg ? backupNameArg.replace("--name=", "") : undefined,
});

console.log(JSON.stringify({
  phase: result.phase,
  mode: result.mode,
  sourceReady: result.sourceReady,
  created: result.created,
  dryRun: result.dryRun,
  backupRoot: "local-state/runtime/backups",
  backupSizeBytes: result.backupSizeBytes || 0,
  disabledReason: result.disabledReason,
  nextAction: result.nextAction,
}, null, 2));

if (result.created === false && result.dryRun === false && !result.disabledReason.includes("Dry run")) {
  process.exit(1);
}
