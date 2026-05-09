/**
 * dbImportPlan.js — P41-LOCAL DB import plan builder.
 * Maps existing file sources to DB entities. Dry-run only.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();

const ENTITY_SOURCE_MAP = [
  { entity: "projects",               file: "contracts/missions/private-project-mission-contract.json", format: "json" },
  { entity: "missions",               file: "contracts/missions/private-project-mission-contract.json", format: "json" },
  { entity: "mission_tasks",          file: "contracts/missions/private-project-task-plan.json",        format: "json" },
  { entity: "runtime_tasks",          file: "local-state/runtime/tasks.json",                           format: "json" },
  { entity: "actions",                file: "local-state/runtime/actions.jsonl",                        format: "jsonl" },
  { entity: "agents",                 file: "memory/agent-status.json",                                 format: "json" },
  { entity: "capabilities",           file: "guardrails/agent-permissions.json",                        format: "json" },
  { entity: "contracts",              file: "contracts/missions/private-project-mission-contract.json", format: "json" },
  { entity: "evidence",               file: "local-state/runtime/evidence.jsonl",                       format: "jsonl" },
  { entity: "audit_events",           file: "local-state/runtime/audit.jsonl",                         format: "jsonl" },
  { entity: "runtime_events",         file: "local-state/runtime/events.jsonl",                        format: "jsonl" },
  { entity: "approvals",              file: "local-state/runtime/approvals.jsonl",                     format: "jsonl" },
  { entity: "incidents",              file: "local-state/runtime/incidents.jsonl",                     format: "jsonl" },
  { entity: "roadmap_phases",         file: "docs/architecture/NEXUS_PLATFORM_ROADMAP.md",             format: "markdown" },
  { entity: "workflow_templates",     file: "dashboard/src/data/commandCenterViewModel.js",            format: "js" },
  { entity: "implementation_records", file: "local-state/runtime/actions.jsonl",                       format: "jsonl" },
  { entity: "review_records",         file: "local-state/runtime/reviews.jsonl",                      format: "jsonl" },
  { entity: "validation_results",     file: "reports/careloop-backend-validation.json",               format: "json" },
];

function checkFile(relPath) {
  return existsSync(join(ROOT, relPath));
}

function countJsonlRecords(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return 0;
  try {
    return readFileSync(full, "utf8").split("\n").filter(l => l.trim()).length;
  } catch { return 0; }
}

export function buildDbImportPlan() {
  const entries = ENTITY_SOURCE_MAP.map(({ entity, file, format }) => {
    const sourceExists = checkFile(file);
    let estimatedRows = 0;
    if (sourceExists) {
      if (format === "jsonl") estimatedRows = countJsonlRecords(file);
      else if (format === "json") estimatedRows = 1;
      else estimatedRows = 0;
    }
    return {
      entity,
      sourceFile: file,
      format,
      sourceExists,
      estimatedRows,
      importReady: sourceExists,
      dbWritesEnabled: false,
      status: sourceExists ? "SOURCE_AVAILABLE" : "SOURCE_MISSING",
    };
  });

  return {
    phase: "P41-LOCAL",
    generatedAt: new Date().toISOString(),
    dbWritesEnabled: false,
    dryRunOnly: true,
    totalEntities: entries.length,
    sourcesAvailable: entries.filter(e => e.sourceExists).length,
    sourcesMissing: entries.filter(e => !e.sourceExists).length,
    importReady: entries.filter(e => e.importReady).length,
    entries,
  };
}

export function validateDbImportPlan(plan) {
  const errors = [];
  if (!plan) { errors.push("plan is required"); return { valid: false, errors }; }
  if (plan.dbWritesEnabled !== false) errors.push("dbWritesEnabled must be false in P41");
  if (!plan.dryRunOnly) errors.push("dryRunOnly must be true in P41");
  if (!Array.isArray(plan.entries)) errors.push("entries must be an array");
  return { valid: errors.length === 0, errors };
}

export function summarizeImportReadiness() {
  const plan = buildDbImportPlan();
  const { valid, errors } = validateDbImportPlan(plan);
  return {
    ready: valid && plan.sourcesAvailable > 0,
    sourcesAvailable: plan.sourcesAvailable,
    totalEntities: plan.totalEntities,
    planValid: valid,
    errors,
    plan,
  };
}

export function writeImportPlanReport(plan) {
  try {
    mkdirSync(join(ROOT, "reports"), { recursive: true });
    writeFileSync(join(ROOT, "reports/db-import-plan.json"), JSON.stringify(plan, null, 2) + "\n");
    return true;
  } catch { return false; }
}
