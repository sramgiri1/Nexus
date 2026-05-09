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
  const mode = modeEnv === "file-backed" ? "file-backed" : "disabled";
  return {
    ...DEFAULT_CONFIG,
    mode,
    dbWritesEnabled: false,
  };
}

export function validateDbConfig(config) {
  const errors = [];
  if (!config) { errors.push("config is required"); return { valid: false, errors }; }
  if (config.dbWritesEnabled !== false) errors.push("dbWritesEnabled must be false in P41");
  if (config.productionDbAllowed !== false) errors.push("productionDbAllowed must be false in P41");
  if (config.externalDbAllowed !== false) errors.push("externalDbAllowed must be false in P41");
  if (!config.fileFallbackRequired) errors.push("fileFallbackRequired must be true in P41");
  return { valid: errors.length === 0, errors };
}

export function getDbMode() {
  const config = loadDbConfig();
  return config.mode;
}
