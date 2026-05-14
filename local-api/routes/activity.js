import {
  buildActivityTrace,
  findActivityByCorrelationId,
  readRecentActivityEvents,
  summarizeActivityTrace,
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

function buildCorrelationSummaries(events = []) {
  const groups = events.reduce((acc, event) => {
    if (!event.correlationId) return acc;
    if (!acc[event.correlationId]) acc[event.correlationId] = [];
    acc[event.correlationId].push(event);
    return acc;
  }, {});

  return Object.entries(groups)
    .map(([correlationId, groupEvents]) => summarizeActivityTrace(buildActivityTrace(groupEvents, correlationId)))
    .sort((left, right) => {
      const leftTime = Date.parse(left.endedAt || left.startedAt || "");
      const rightTime = Date.parse(right.endedAt || right.startedAt || "");
      if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
      if (Number.isNaN(leftTime)) return 1;
      if (Number.isNaN(rightTime)) return -1;
      return rightTime - leftTime;
    })
    .slice(0, 10);
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
  const pathCorrelationId = url.pathname.startsWith("/activity/")
    ? decodeURIComponent(url.pathname.replace("/activity/", ""))
    : "";
  const correlationId = pathCorrelationId || url.searchParams.get("correlationId");
  const traceRequested = Boolean(pathCorrelationId) || url.searchParams.get("view") === "trace";
  const storeResult = correlationId
    ? findActivityByCorrelationId(correlationId)
    : readRecentActivityEvents(limit);

  const rawRecords = correlationId ? storeResult.events : storeResult.events;
  const filtered = filterRecords(rawRecords || [], url.searchParams).slice(-limit).reverse();
  const summary = summarizeActivityStore({ limit: 500 });
  const correlationSummaries = buildCorrelationSummaries(readRecentActivityEvents(500).events || []);

  if (traceRequested) {
    const trace = buildActivityTrace(rawRecords || [], correlationId || "");
    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        activityCaptureEnabled: true,
        traceViewEnabled: true,
        storePath: summary.storePath,
        generatedAt: new Date().toISOString(),
        correlationId: trace.correlationId || correlationId || "",
        trace,
        summary: summarizeActivityTrace(trace),
        records: filtered.map(summarizeRecord),
        providerLoggingEnabled: false,
        workerLoggingEnabled: false,
        dbBackedActivityEnabled: false,
        redacted: true,
      },
      warnings: [...(summary.warnings || []), ...(storeResult.warnings || []), ...(trace.warnings || [])],
    }));
    return;
  }

  sendJson(res, 200, buildEnvelope({
    ok: true,
    source: "live-local-api",
    mode,
    data: {
      activityCaptureEnabled: true,
      storePath: summary.storePath,
      generatedAt: new Date().toISOString(),
      count: filtered.length,
      limit,
      totalCount: summary.eventCount,
      warningCount: (summary.warnings || []).length + (storeResult.warnings || []).length,
      categories: summary.categories || {},
      correlationSummaries,
      tracesAvailableCount: correlationSummaries.length,
      failedTraceCount: correlationSummaries.filter((trace) => trace.status === "failed").length,
      blockedTraceCount: correlationSummaries.filter((trace) => trace.status === "blocked").length,
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
