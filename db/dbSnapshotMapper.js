/**
 * dbSnapshotMapper.js — P41-LOCAL snapshot-to-entity mapper.
 * Dry-run mapping of local state files to DB entity shapes. No DB writes in P41.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { readProjects, readMissions, readTasks, readAgents, readEvidence, readAuditEvents, readRuntimeEvents, readContracts, readActions } from "./dbRepository.js";

const ROOT = process.cwd();

function safeReadJson(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  try { return JSON.parse(readFileSync(full, "utf8")); } catch { return null; }
}

export function mapLocalStateToDbEntities() {
  const { missionTasks, runtimeTasks } = readTasks();
  return {
    projects: readProjects(),
    missions: readMissions(),
    mission_tasks: missionTasks,
    runtime_tasks: runtimeTasks,
    agents: readAgents(),
    evidence: readEvidence(),
    audit_events: readAuditEvents(),
    runtime_events: readRuntimeEvents(),
    contracts: readContracts(),
    actions: readActions(),
  };
}

export function mapReportsToDbEntities() {
  const validation = safeReadJson("reports/careloop-backend-validation.json");
  return {
    validation_results: validation ? [{
      validationId: validation.runId || "careloop-validation",
      projectId: validation.projectId || null,
      total: validation.total || 0,
      pass: validation.pass || 0,
      status: validation.status || "UNKNOWN",
      createdAt: validation.createdAt || null,
      _source: "reports/careloop-backend-validation.json",
    }] : [],
  };
}

export function createDbSeedPreview() {
  const localState = mapLocalStateToDbEntities();
  const reports = mapReportsToDbEntities();
  const allEntities = { ...localState, ...reports };
  const summary = Object.entries(allEntities).map(([entity, records]) => ({
    entity,
    recordCount: Array.isArray(records) ? records.length : 0,
    wouldInsert: Array.isArray(records) ? records.length : 0,
    dbWritesEnabled: false,
    status: "DRY_RUN",
  }));
  return {
    phase: "P41-LOCAL",
    generatedAt: new Date().toISOString(),
    dbWritesEnabled: false,
    dryRunOnly: true,
    totalEntities: summary.length,
    totalRecords: summary.reduce((sum, e) => sum + e.recordCount, 0),
    summary,
    entities: allEntities,
  };
}

export function validateDbSeedPreview(preview) {
  const errors = [];
  if (!preview) { errors.push("preview is required"); return { valid: false, errors }; }
  if (preview.dbWritesEnabled !== false) errors.push("dbWritesEnabled must be false in P41");
  if (!preview.dryRunOnly) errors.push("dryRunOnly must be true in P41");
  return { valid: errors.length === 0, errors };
}

export function writeDbFoundationStatus(preview) {
  try {
    mkdirSync(join(ROOT, "reports"), { recursive: true });
    const status = {
      phase: "P41-LOCAL",
      generatedAt: preview.generatedAt,
      dbWritesEnabled: false,
      schemaDefined: true,
      entityCount: preview.totalEntities,
      recordsMapped: preview.totalRecords,
      summary: preview.summary,
    };
    writeFileSync(join(ROOT, "reports/db-foundation-status.json"), JSON.stringify(status, null, 2) + "\n");
    return true;
  } catch { return false; }
}
