const TRACE_VERSION = "1.0";

const TRACE_CATEGORIES = ["ui", "api", "action", "task", "policy", "evidence", "audit", "error", "runtime"];
const TERMINAL_FAILURE_STATUSES = new Set(["failed", "blocked"]);
const BLOCKING_DECISIONS = new Set(["DENY", "REQUIRE_APPROVAL"]);

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function normalizeTraceCategory(event = {}) {
  if (event.category === "action_bridge") return "action";
  if (event.category === "api") return "api";
  if (event.category === "ui") return "ui";
  if (event.category === "task") return "task";
  if (event.category === "policy") return "policy";
  if (event.category === "evidence") return "evidence";
  if (event.category === "audit" || asArray(event.auditIds).length > 0) return "audit";
  if (event.category === "runtime") return "runtime";
  if (event.category === "error" || event.status === "failed" || event.level === "error") return "error";
  return "ui";
}

function sortEventsByTimestamp(events = []) {
  return [...events].sort((left, right) => {
    const leftTime = Date.parse(left.timestamp || "");
    const rightTime = Date.parse(right.timestamp || "");
    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;
    return leftTime - rightTime;
  });
}

function latestStatus(events = []) {
  if (events.length === 0) return "unknown";
  if (events.some((event) => TERMINAL_FAILURE_STATUSES.has(event.status))) {
    return events.some((event) => event.status === "success") ? "partial" : "failed";
  }
  if (events.some((event) => BLOCKING_DECISIONS.has(event.decision) || event.status === "requires_approval")) {
    return "blocked";
  }
  if (events.every((event) => event.status === "success")) return "success";
  if (events.some((event) => event.status === "success")) return "partial";
  return "unknown";
}

function traceDuration(startedAt, endedAt) {
  const start = Date.parse(startedAt || "");
  const end = Date.parse(endedAt || "");
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return end - start;
}

function addUnique(target, values) {
  for (const value of asArray(values)) {
    if (value && !target.includes(value)) target.push(value);
  }
}

function safeTimelineEvent(event = {}) {
  return {
    activityId: safeString(event.activityId, "activity-id-unavailable"),
    timestamp: safeString(event.timestamp, ""),
    category: normalizeTraceCategory(event),
    eventType: safeString(event.eventType, "activity_event"),
    source: safeString(event.source, "unknown"),
    agentId: event.agentId || null,
    taskId: event.taskId || null,
    status: safeString(event.status, "unknown"),
    summary: safeString(event.summary, "Activity event captured."),
    evidenceIds: asArray(event.evidenceIds),
    auditIds: asArray(event.auditIds),
    redacted: event.redacted !== false,
  };
}

export function buildTraceTimeline(events = []) {
  return sortEventsByTimestamp(events).map(safeTimelineEvent);
}

export function groupTraceByCategory(events = []) {
  return events.reduce((groups, event) => {
    const category = normalizeTraceCategory(event);
    groups[category] = (groups[category] || 0) + 1;
    return groups;
  }, {});
}

export function groupTraceBySource(events = []) {
  return events.reduce((groups, event) => {
    const source = safeString(event.source || event.agentId, "unknown");
    groups[source] = (groups[source] || 0) + 1;
    return groups;
  }, {});
}

export function findRelatedActivity(events = [], activityId) {
  if (!activityId) return [];
  return events.filter((event) => (
    event.activityId === activityId
    || event.parentActivityId === activityId
    || asArray(event.relatedIds).includes(activityId)
  ));
}

export function buildActivityTrace(events = [], correlationId = "") {
  const matchingEvents = correlationId
    ? events.filter((event) => event.correlationId === correlationId)
    : events;
  const orderedEvents = sortEventsByTimestamp(matchingEvents);
  const timeline = buildTraceTimeline(orderedEvents);
  const categories = TRACE_CATEGORIES.reduce((acc, category) => ({ ...acc, [category]: 0 }), {});
  for (const [category, count] of Object.entries(groupTraceByCategory(orderedEvents))) {
    categories[category] = (categories[category] || 0) + count;
  }

  const related = {
    taskIds: [],
    agentIds: [],
    evidenceIds: [],
    auditIds: [],
    actionIds: [],
  };

  for (const event of orderedEvents) {
    addUnique(related.taskIds, event.taskId);
    addUnique(related.agentIds, event.agentId);
    addUnique(related.evidenceIds, event.evidenceIds);
    addUnique(related.auditIds, event.auditIds);
    addUnique(related.actionIds, event.actionId || event.metadata?.actionId || event.relatedIds);
  }

  const startedAt = orderedEvents[0]?.timestamp || "";
  const endedAt = orderedEvents.at(-1)?.timestamp || "";
  const trace = {
    traceVersion: TRACE_VERSION,
    correlationId: correlationId || orderedEvents[0]?.correlationId || "",
    status: latestStatus(orderedEvents),
    startedAt,
    endedAt,
    durationMs: traceDuration(startedAt, endedAt),
    eventCount: orderedEvents.length,
    categories,
    timeline,
    related,
    warnings: [],
    errors: [],
  };

  const validation = validateActivityTrace(trace);
  return {
    ...trace,
    warnings: validation.warnings,
    errors: validation.errors,
  };
}

export function summarizeActivityTrace(trace = {}) {
  return {
    correlationId: trace.correlationId || "",
    status: trace.status || "unknown",
    eventCount: Number.isFinite(Number(trace.eventCount)) ? Number(trace.eventCount) : 0,
    durationMs: Number.isFinite(Number(trace.durationMs)) ? Number(trace.durationMs) : 0,
    startedAt: trace.startedAt || "",
    endedAt: trace.endedAt || "",
    categoryCount: Object.values(trace.categories || {}).reduce((sum, count) => sum + Number(count || 0), 0),
    taskCount: asArray(trace.related?.taskIds).length,
    agentCount: asArray(trace.related?.agentIds).length,
    evidenceCount: asArray(trace.related?.evidenceIds).length,
    auditCount: asArray(trace.related?.auditIds).length,
    redacted: true,
  };
}

export function validateActivityTrace(trace = {}) {
  const errors = [];
  const warnings = [];

  if (trace.traceVersion !== TRACE_VERSION) errors.push(`traceVersion must be ${TRACE_VERSION}`);
  if (!trace.correlationId) warnings.push("Trace has no correlation ID.");
  if (!["success", "failed", "blocked", "partial", "unknown"].includes(trace.status)) {
    errors.push(`Unsupported trace status: ${trace.status}`);
  }
  if (!Array.isArray(trace.timeline)) errors.push("Trace timeline must be an array.");
  if (!trace.categories || typeof trace.categories !== "object") errors.push("Trace categories must be an object.");
  if (!trace.related || typeof trace.related !== "object") errors.push("Trace related links must be an object.");
  if (trace.timeline?.some((item) => item.redacted !== true)) {
    errors.push("Trace timeline entries must be redacted.");
  }
  if (trace.timeline?.some((item) => item.metadata || item.payload || item.raw || item.error)) {
    errors.push("Trace timeline must not expose raw metadata, payloads, logs, or errors.");
  }
  if (trace.eventCount !== trace.timeline?.length) warnings.push("Trace event count differs from timeline length.");

  return { ok: errors.length === 0, warnings, errors };
}
