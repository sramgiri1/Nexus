/**
 * dbRepository.js — read-only repository with file-backed fallback.
 * P92.3 reads from local SQLite when explicitly live and initialized.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { listSqliteEntityRecords } from "./sqliteCrudRepository.js";
import { getSqliteRuntimeConfig, getSqliteRuntimeStatus } from "./sqliteRuntime.js";

const ROOT = process.cwd();
const DEFAULT_READ_LIMIT = 500;

function safeReadJson(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  try { return JSON.parse(readFileSync(full, "utf8")); } catch { return null; }
}

function safeReadJsonl(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return [];
  try {
    return readFileSync(full, "utf8")
      .split("\n")
      .filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch { return []; }
}

export function createDbRepository() {
  const mode = getRepositoryMode();
  return {
    mode,
    dbWritesEnabled: false,
    runtimeWritesEnabled: false,
    fileFallbackRequired: true,
    sqliteReadsEnabled: mode === "sqlite-live",
  };
}

export function getRepositoryMode() {
  return sqliteReadsAreReady() ? "sqlite-live" : "file-backed";
}

function sqliteReadsAreReady() {
  try {
    const status = getSqliteRuntimeStatus();
    return status.ready === true;
  } catch {
    return false;
  }
}

function tryReadSqlite(entityName, options = {}) {
  if (!sqliteReadsAreReady()) return null;
  try {
    const config = getSqliteRuntimeConfig();
    const records = listSqliteEntityRecords(
      entityName,
      { limit: options.limit || DEFAULT_READ_LIMIT },
      { mode: config.mode, dbPath: config.dbPath, sqliteCli: config.sqliteCli },
    );
    return records.map((record) => ({ ...record, _source: "sqlite" }));
  } catch {
    return null;
  }
}

function firstSqliteRows(entityName, options = {}) {
  const rows = tryReadSqlite(entityName, options);
  return Array.isArray(rows) && rows.length > 0 ? rows : null;
}

export function getRepositoryReadStatus() {
  const config = getSqliteRuntimeConfig();
  const status = getSqliteRuntimeStatus();
  return {
    mode: getRepositoryMode(),
    sqliteReadsEnabled: status.ready === true,
    sqliteLiveAllowed: config.sqliteLiveAllowed,
    dbWritesEnabled: false,
    runtimeWritesEnabled: false,
    fileFallbackRequired: true,
    fallbackReason: status.ready
      ? ""
      : "SQLite reads require NEXUS_DB_MODE=sqlite-live and an initialized local DB.",
  };
}

export function getFileBackedRepositoryMode() {
  return "file-backed";
}

export function readProjects() {
  const sqliteRows = firstSqliteRows("projects");
  if (sqliteRows) return sqliteRows;
  const contract = safeReadJson("contracts/missions/private-project-mission-contract.json");
  if (!contract) return [];
  return [{
    projectId: contract.projectId || "unknown",
    label: contract.projectLabel || "Private Project",
    mode: contract.mode || "local-private",
    active: true,
    createdAt: contract.createdAt || null,
    updatedAt: contract.updatedAt || null,
    _source: "contracts/missions/private-project-mission-contract.json",
  }];
}

export function readMissions() {
  const sqliteRows = firstSqliteRows("missions");
  if (sqliteRows) return sqliteRows;
  const contract = safeReadJson("contracts/missions/private-project-mission-contract.json");
  if (!contract) return [];
  return [{
    contractId: contract.contractId || "unknown",
    projectId: contract.projectId || "unknown",
    missionText: contract.missionText || "",
    mode: contract.mode || "local-private",
    source: "mission-contract",
    createdAt: contract.createdAt || null,
    _source: "contracts/missions/private-project-mission-contract.json",
  }];
}

export function readTasks() {
  const sqliteMissionTasks = tryReadSqlite("mission_tasks");
  const sqliteRuntimeTasks = tryReadSqlite("runtime_tasks");
  if (sqliteMissionTasks || sqliteRuntimeTasks) {
    return {
      missionTasks: sqliteMissionTasks || [],
      runtimeTasks: sqliteRuntimeTasks || [],
    };
  }
  const plan = safeReadJson("contracts/missions/private-project-task-plan.json");
  const runtime = safeReadJson("local-state/runtime/tasks.json");
  const missionTasks = plan?.tasks || [];
  const runtimeTasks = runtime?.tasks || [];
  return { missionTasks, runtimeTasks };
}

export function readAgents() {
  const sqliteRows = firstSqliteRows("agents");
  if (sqliteRows) return sqliteRows;
  const status = safeReadJson("memory/agent-status.json");
  if (!status) return [];
  const agents = Array.isArray(status) ? status : Object.values(status);
  return agents.map(a => ({
    agentId: a.agentId || a.id || "unknown",
    role: a.role || "unknown",
    tier: a.tier || null,
    capabilities: a.capabilities || [],
    active: a.active !== false,
    _source: "memory/agent-status.json",
  }));
}

export function readEvidence() {
  const sqliteRows = tryReadSqlite("evidence");
  if (sqliteRows) return sqliteRows;
  return safeReadJsonl("local-state/runtime/evidence.jsonl");
}

export function readAuditEvents() {
  const sqliteRows = tryReadSqlite("audit_events");
  if (sqliteRows) return sqliteRows;
  return safeReadJsonl("local-state/runtime/audit.jsonl");
}

export function readRuntimeEvents() {
  const sqliteRows = tryReadSqlite("runtime_events");
  if (sqliteRows) return sqliteRows;
  return safeReadJsonl("local-state/runtime/events.jsonl");
}

export function readContracts() {
  const sqliteRows = firstSqliteRows("contracts");
  if (sqliteRows) return sqliteRows;
  const mission = safeReadJson("contracts/missions/private-project-mission-contract.json");
  const plan = safeReadJson("contracts/missions/private-project-task-plan.json");
  const contracts = [];
  if (mission) contracts.push({ contractId: mission.contractId || "mission", contractType: "mission", projectId: mission.projectId, _source: "contracts/missions/private-project-mission-contract.json" });
  if (plan) contracts.push({ contractId: plan.contractId || "task-plan", contractType: "task_plan", projectId: plan.projectId, _source: "contracts/missions/private-project-task-plan.json" });
  return contracts;
}

export function readRoadmap() {
  const sqliteRows = tryReadSqlite("roadmap_phases");
  if (sqliteRows) return sqliteRows;
  return safeReadJson("reports/command-center-snapshot.json")?.data?.roadmap?.phases || [];
}

export function readActions() {
  const sqliteRows = tryReadSqlite("actions");
  if (sqliteRows) return sqliteRows;
  return safeReadJsonl("local-state/runtime/actions.jsonl");
}

export function writeNotSupportedYet(entity, record) {
  throw new Error(`DB writes not supported in P41. entity=${entity}. Enable in P42.`);
}
