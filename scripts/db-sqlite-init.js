import { initializeSqliteRuntime } from "../db/sqliteRuntime.js";

const dryRun = !process.argv.includes("--apply");
const reset = process.argv.includes("--reset");

const result = initializeSqliteRuntime({ dryRun, reset });
console.log(JSON.stringify({
  ok: dryRun ? true : result.initialized,
  ...result,
}, null, 2));

if (!dryRun && !result.initialized) process.exit(1);
