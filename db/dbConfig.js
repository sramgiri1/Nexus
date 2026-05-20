/**
 * dbConfig.js — P41-LOCAL DB configuration loader.
 * DB is disabled by default in P41. No real DB connections are made.
 */

import process from "node:process";

const DEFAULT_CONFIG = {
  phase: "P41-LOCAL",
  mode: "disabled",
  dbWritesEnabled: false,
  fileFallbackRequired: true,
  productionDbAllowed: false,
  externalDbAllowed: false,
  schemaVersion: "1.0",
  entityCount: 18,
};

export function loadDbConfig() {
  const modeEnv = process.env.NEXUS_DB_MODE;
  const mode = modeEnv === "file-backed" || modeEnv === "sqlite-live" ? modeEnv : "disabled";
  const sqliteWritesEnabled = mode === "sqlite-live" && process.env.NEXUS_DB_ENABLE_WRITES === "1";
  return {
    ...DEFAULT_CONFIG,
    phase: mode === "sqlite-live" ? "P92.1" : DEFAULT_CONFIG.phase,
    mode,
    dbWritesEnabled: sqliteWritesEnabled,
    sqliteLiveAllowed: mode === "sqlite-live",
    sqlitePath: process.env.NEXUS_SQLITE_PATH || "local-state/runtime/nexus.sqlite",
  };
}

export function validateDbConfig(config) {
  const errors = [];
  if (!config) { errors.push("config is required"); return { valid: false, errors }; }
  if (config.mode !== "sqlite-live" && config.dbWritesEnabled !== false) errors.push("dbWritesEnabled must be false outside sqlite-live mode");
  if (config.mode === "sqlite-live" && config.dbWritesEnabled !== (process.env.NEXUS_DB_ENABLE_WRITES === "1")) errors.push("sqlite-live writes require NEXUS_DB_ENABLE_WRITES=1");
  if (config.productionDbAllowed !== false) errors.push("productionDbAllowed must be false in P41");
  if (config.externalDbAllowed !== false) errors.push("externalDbAllowed must be false in P41");
  if (!config.fileFallbackRequired) errors.push("fileFallbackRequired must be true in P41");
  return { valid: errors.length === 0, errors };
}

export function getDbMode() {
  const config = loadDbConfig();
  return config.mode;
}
