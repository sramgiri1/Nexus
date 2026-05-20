/**
 * local-api/routes/db.js — GET /db
 * Returns DB health, entity list, and import plan summary. P41-LOCAL.
 */

import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";
import { getDbHealth, summarizeDbStatus } from "../../db/dbHealth.js";
import { buildDbImportPlan } from "../../db/dbImportPlan.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = process.cwd();

function loadSchema() {
  const p = join(ROOT, "db/schema.json");
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}

export function handleDb(req, res) {
  try {
    const health = getDbHealth();
    const status = summarizeDbStatus();
    const importPlan = buildDbImportPlan();
    const schema = loadSchema();
    const entities = schema?.entities?.map(e => ({
      name: e.name,
      purpose: e.purpose,
      primaryKey: e.primaryKey,
      fieldCount: Object.keys(e.fields || {}).length,
      piiRisk: e.piiRisk,
      retentionClass: e.retentionClass,
      fileFallbackSource: e.fileFallbackSource,
    })) || [];

    const data = {
      dbBacked: false,
      mode: health.mode,
      fallback: health.fallback,
      schemaDefined: health.schemaDefined,
      schemaVersion: health.schemaVersion,
      entityCount: health.entityCount,
      dbWritesEnabled: health.dbWritesEnabled,
      sqlite: health.sqlite,
      fileFallbackRequired: true,
      status: status.status,
      phase: status.phase,
      nextPhase: status.nextPhase,
      nextPhaseAction: status.nextPhaseAction,
      importPlan: {
        totalEntities: importPlan.totalEntities,
        sourcesAvailable: importPlan.sourcesAvailable,
        sourcesMissing: importPlan.sourcesMissing,
        dryRunOnly: true,
        dbWritesEnabled: false,
      },
      entities,
    };

    sendJson(res, 200, buildEnvelope({ ok: true, source: "live-local-api", mode: "local-private", data }));
  } catch (err) {
    sendError(res, 500, "DB_ERROR", "DB health check failed");
  }
}
