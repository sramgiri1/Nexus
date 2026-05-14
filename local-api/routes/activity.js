import {
  findActivityByCorrelationId,
  readRecentActivityEvents,
  summarizeActivityStore,
} from "../../observability/index.js";
import { sendJson, buildEnvelope } from "../safeResponse.js";

const MAX_LIMIT = 50;

function shortId(value) {
  return value ? `${String(value).slice(0, 14)}...` : null;
}

function normalizeLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 25;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function summarizeRecord(event = {}) {
  return {
    activityId: event.activityId,
    shortActivityId: shortId(event.activityId),
    correlationId: event.correlationId,
    shortCorrelationId: shortId(event.correlationId),
    timestamp: event.timestamp,
    category: event.category,
    eventType: event.eventType,
    source: event.source,
    scope: event.scope,
    mode: event.mode,
    status: event.status,
    decision: event.decision,
    summary: event.summary,
    projectId: event.projectId || null,
    missionId: event.missionId || null,
    taskId: event.taskId || null,
    agentId: event.agentId || null,
    capabilityId: event.capabilityId || null,
    durationMs: event.durationMs || 0,
    redacted: event.redacted === true,
    evidenceCount: Array.isArray(event.evidenceIds) ? event.evidenceIds.length : 0,
    auditCount: Array.isArray(event.auditIds) ? event.auditIds.length : 0,
  };
}

function filterRecords(records, query) {
  return records.filter((record) => {
    if (query.get("category") && record.category !== query.get("category")) return false;
    if (query.get("status") && record.status !== query.get("status")) return false;
    if (query.get("source") && record.source !== query.get("source")) return false;
    return true;
  });
}

export function handleActivity(req, res, { mode }) {
  const url = new URL(req.url, "http://127.0.0.1");
  const limit = normalizeLimit(url.searchParams.get("limit"));
  const correlationId = url.searchParams.get("correlationId");
  const storeResult = correlationId
    ? findActivityByCorrelationId(correlationId)
    : readRecentActivityEvents(limit);

  const rawRecords = correlationId ? storeResult.events : storeResult.events;
  const filtered = filterRecords(rawRecords || [], url.searchParams).slice(-limit).reverse();
  const summary = summarizeActivityStore({ limit: 500 });

  sendJson(res, 200, buildEnvelope({
    ok: true,
    source: "live-local-api",
    mode,
    data: {
      activityCaptureEnabled: true,
      storePath: summary.storePath,
      totalCount: summary.eventCount,
      warningCount: (summary.warnings || []).length + (storeResult.warnings || []).length,
      categories: summary.categories || {},
      latestActivityId: summary.latestActivityId,
      latestCorrelationId: summary.latestCorrelationId,
      records: filtered.map(summarizeRecord),
      providerLoggingEnabled: false,
      workerLoggingEnabled: false,
      dbBackedActivityEnabled: false,
      redacted: true,
    },
    warnings: [...(summary.warnings || []), ...(storeResult.warnings || [])],
  }));
}
