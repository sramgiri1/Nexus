/**
 * dbHealth.js — P41-LOCAL DB health and readiness checks.
 * Always returns file-backed mode in P41. No real DB connections.
 */

import { loadDbConfig, validateDbConfig } from "./dbConfig.js";
import { getSqliteRuntimeStatus } from "./sqliteRuntime.js";

export function getDbHealth() {
  const config = loadDbConfig();
  const { valid, errors } = validateDbConfig(config);
  const sqlite = getSqliteRuntimeStatus({ mode: config.mode, dbPath: config.sqlitePath });
  return {
    dbBacked: sqlite.ready,
    mode: config.mode,
    fallback: config.fileFallbackRequired ? "file-backed" : "",
    schemaDefined: true,
    schemaVersion: config.schemaVersion,
    entityCount: config.entityCount,
    dbWritesEnabled: config.dbWritesEnabled,
    sqlite,
    fileFallbackRequired: true,
    configValid: valid,
    configErrors: errors,
    phase: config.phase,
    checkedAt: new Date().toISOString(),
  };
}

export function getDbReadiness() {
  const health = getDbHealth();
  return {
    ready: true,
    mode: health.mode,
    fallbackReady: true,
    dbReady: health.sqlite.ready,
    reason: health.sqlite.ready
      ? "P92.1: local SQLite runtime is initialized. File-backed fallback remains available."
      : "DB disabled or not initialized. File-backed fallback is active.",
    health,
  };
}

export function summarizeDbStatus() {
  const readiness = getDbReadiness();
  return {
    status: readiness.dbReady ? "SQLITE_LOCAL_READY" : "FOUNDATION_ONLY",
    phase: readiness.dbReady ? "P92.1" : "P41-LOCAL",
    mode: readiness.mode,
    dbWritesEnabled: readiness.health.dbWritesEnabled,
    fallbackActive: true,
    schemaArtifactsPresent: true,
    sqlite: readiness.health.sqlite,
    nextPhase: readiness.dbReady ? "P92.2" : "P92.1",
    nextPhaseAction: readiness.dbReady ? "Wire selected runtime reads to SQLite repositories" : "Initialize local SQLite runtime",
    readiness,
  };
}
