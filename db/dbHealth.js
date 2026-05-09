/**
 * dbHealth.js — P41-LOCAL DB health and readiness checks.
 * Always returns file-backed mode in P41. No real DB connections.
 */

import { loadDbConfig, validateDbConfig } from "./dbConfig.js";

export function getDbHealth() {
  const config = loadDbConfig();
  const { valid, errors } = validateDbConfig(config);
  return {
    dbBacked: false,
    mode: config.mode,
    fallback: "file-backed",
    schemaDefined: true,
    schemaVersion: config.schemaVersion,
    entityCount: config.entityCount,
    dbWritesEnabled: false,
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
    dbReady: false,
    reason: "P41: DB disabled. File-backed fallback is active.",
    health,
  };
}

export function summarizeDbStatus() {
  const readiness = getDbReadiness();
  return {
    status: "FOUNDATION_ONLY",
    phase: "P41-LOCAL",
    mode: readiness.mode,
    dbWritesEnabled: false,
    fallbackActive: true,
    schemaArtifactsPresent: true,
    nextPhase: "P42-LOCAL",
    nextPhaseAction: "Enable DB writes and migrate file-backed state to DB",
    readiness,
  };
}
