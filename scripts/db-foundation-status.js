/**
 * db-foundation-status.js
 * Prints DB Foundation status for P41-LOCAL.
 * Run: npm run db:status
 */

import process from "node:process";
import { getDbHealth, summarizeDbStatus } from "../db/dbHealth.js";
import { buildDbImportPlan } from "../db/dbImportPlan.js";
import { createDbSeedPreview, writeDbFoundationStatus } from "../db/dbSnapshotMapper.js";
import { writeImportPlanReport } from "../db/dbImportPlan.js";

console.log("\nNEXUS DB Foundation Status\n==========================\n");

const health = getDbHealth();
const status = summarizeDbStatus();
const importPlan = buildDbImportPlan();

console.log(`Phase:              ${health.phase}`);
console.log(`Mode:               ${health.mode}`);
console.log(`DB writes enabled:  ${health.dbWritesEnabled}`);
console.log(`File fallback:      ${health.fileFallbackRequired}`);
console.log(`Schema defined:     ${health.schemaDefined}`);
console.log(`Schema version:     ${health.schemaVersion}`);
console.log(`Entity count:       ${health.entityCount}`);
console.log(`Config valid:       ${health.configValid}`);
console.log(`Status:             ${status.status}`);
console.log(`Next phase:         ${status.nextPhase}`);
console.log(`Next action:        ${status.nextPhaseAction}`);
console.log("");

console.log(`Import Plan:`);
console.log(`  Total entities:   ${importPlan.totalEntities}`);
console.log(`  Sources available: ${importPlan.sourcesAvailable}`);
console.log(`  Sources missing:  ${importPlan.sourcesMissing}`);
console.log(`  Dry-run only:     ${importPlan.dryRunOnly}`);
console.log(`  DB writes:        ${importPlan.dbWritesEnabled}`);
console.log("");

console.log("Entity source availability:");
for (const entry of importPlan.entries) {
  const mark = entry.sourceExists ? "✓" : "✗";
  console.log(`  ${mark} ${entry.entity.padEnd(24)} ${entry.sourceFile} (${entry.format})`);
}
console.log("");

// Write reports
const seedPreview = createDbSeedPreview();
writeDbFoundationStatus(seedPreview);
writeImportPlanReport(importPlan);

console.log("Reports written:");
console.log("  reports/db-foundation-status.json");
console.log("  reports/db-import-plan.json");
console.log("");
console.log(`P41-LOCAL: DB disabled. File-backed fallback is active. No data has been written to any database.`);
