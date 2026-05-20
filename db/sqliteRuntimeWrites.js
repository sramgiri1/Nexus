import { randomUUID } from "node:crypto";
import { getSqliteRuntimeConfig } from "./sqliteRuntime.js";
import { insertSqliteEntity } from "./sqliteCrudRepository.js";

function sqliteWriteDisabledResult(entity) {
  const config = getSqliteRuntimeConfig();
  return {
    ok: true,
    entity,
    written: false,
    disabledReason: config.dbWritesEnabled
      ? ""
      : "SQLite runtime writes require NEXUS_DB_MODE=sqlite-live and NEXUS_DB_ENABLE_WRITES=1.",
  };
}

function appendSqliteEntity(entity, record, input = {}) {
  const config = getSqliteRuntimeConfig(input);
  if (!config.dbWritesEnabled) return sqliteWriteDisabledResult(entity);
  try {
    const written = insertSqliteEntity(entity, record, input);
    return {
      ok: true,
      entity,
      written: true,
      record: written,
      errors: [],
    };
  } catch (error) {
    return {
      ok: false,
      entity,
      written: false,
      errors: [error.message || String(error)],
    };
  }
}

export function appendSqliteEvidence(record = {}, input = {}) {
  return appendSqliteEntity("evidence", {
    evidenceId: record.evidenceId || randomUUID(),
    taskId: record.taskId || "",
    type: record.type || "runtime",
    result: record.result || "INFO",
    createdAt: record.createdAt || new Date().toISOString(),
  }, input);
}

export function appendSqliteAuditEvent(record = {}, input = {}) {
  return appendSqliteEntity("audit_events", {
    auditId: record.auditId || randomUUID(),
    taskId: record.taskId || "",
    eventType: record.eventType || "runtime_event",
    agent: record.agent || record.actorId || record.actorType || "system",
    timestamp: record.timestamp || record.createdAt || new Date().toISOString(),
  }, input);
}

export function appendSqliteActivityEvent(record = {}, input = {}) {
  return appendSqliteEntity("runtime_events", {
    eventId: record.eventId || record.activityId || randomUUID(),
    taskId: record.taskId || "",
    eventType: record.eventType || record.category || record.type || "activity",
    timestamp: record.timestamp || record.createdAt || new Date().toISOString(),
  }, input);
}

export function summarizeSqliteRuntimeWriteReadiness(input = {}) {
  const config = getSqliteRuntimeConfig(input);
  return {
    phase: "P92.4",
    dbWritesEnabled: config.dbWritesEnabled,
    sqliteLiveAllowed: config.sqliteLiveAllowed,
    allowedEntities: ["evidence", "audit_events", "runtime_events"],
    mutationScope: "append-only runtime ledger records",
    projectMutationAllowed: false,
    providerSpendAllowed: false,
  };
}
