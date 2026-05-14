import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_DECISIONS,
  ACTIVITY_LEVELS,
  ACTIVITY_MODES,
  ACTIVITY_SCOPES,
  ACTIVITY_SOURCES,
  ACTIVITY_STATUSES,
  validateActivityType,
} from "./activityTypes.js";
import { createActivityId, createCorrelationId } from "./correlation.js";
import {
  containsForbiddenActivityContent,
  redactActivityValue,
  sanitizeActivityPayload,
} from "./redactionPolicy.js";

export const ACTIVITY_EVENT_SCHEMA_VERSION = "1.0";

const DATA_CLASSIFICATIONS = ["public", "internal", "confidential", "restricted", "unknown"];

const REQUIRED_ACTIVITY_FIELDS = [
  "activityVersion",
  "activityId",
  "correlationId",
  "timestamp",
  "level",
  "category",
  "eventType",
  "scope",
  "mode",
  "source",
  "status",
  "decision",
  "summary",
  "dataClassification",
  "redacted",
  "evidenceIds",
  "auditIds",
  "relatedIds",
  "cost",
  "error",
  "metadata",
];

function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function normalizeCost(cost = {}) {
  return {
    estimatedUsd: Number.isFinite(Number(cost.estimatedUsd)) ? Number(cost.estimatedUsd) : 0,
    actualUsd: Number.isFinite(Number(cost.actualUsd)) ? Number(cost.actualUsd) : 0,
    tokensIn: Number.isFinite(Number(cost.tokensIn)) ? Number(cost.tokensIn) : 0,
    tokensOut: Number.isFinite(Number(cost.tokensOut)) ? Number(cost.tokensOut) : 0,
    provider: cost.provider ? redactActivityValue(cost.provider) : null,
    model: cost.model ? redactActivityValue(cost.model) : null,
  };
}

function normalizeError(error = {}) {
  return {
    code: error.code ? String(redactActivityValue(error.code)) : null,
    message: error.message ? String(redactActivityValue(error.message)) : null,
    retryable: Boolean(error.retryable),
  };
}

export function getRequiredActivityFields() {
  return [...REQUIRED_ACTIVITY_FIELDS];
}

export function normalizeActivityEvent(input = {}) {
  const category = input.category || "system";
  const eventType = input.eventType || "roadmap_status_updated";
  const timestamp = input.timestamp || new Date().toISOString();

  return {
    activityVersion: ACTIVITY_EVENT_SCHEMA_VERSION,
    activityId: input.activityId || createActivityId("act", input.idOptions || {}),
    correlationId: input.correlationId || createCorrelationId("corr", input.idOptions || {}),
    parentActivityId: input.parentActivityId || null,
    timestamp,
    level: input.level || "info",
    category,
    eventType,
    scope: input.scope || "SYSTEM",
    mode: input.mode || "unknown",
    projectId: input.projectId || null,
    missionId: input.missionId || null,
    taskId: input.taskId || null,
    agentId: input.agentId || null,
    capabilityId: input.capabilityId || null,
    source: input.source || "system",
    status: input.status || "pending",
    decision: input.decision || "NOT_APPLICABLE",
    summary: input.summary ? String(redactActivityValue(input.summary)) : "Activity event recorded.",
    dataClassification: input.dataClassification || "internal",
    redacted: input.redacted === undefined ? true : Boolean(input.redacted),
    durationMs: Number.isFinite(Number(input.durationMs)) ? Number(input.durationMs) : 0,
    evidenceIds: asArray(input.evidenceIds),
    auditIds: asArray(input.auditIds),
    relatedIds: asArray(input.relatedIds),
    cost: normalizeCost(input.cost || {}),
    error: normalizeError(input.error || {}),
    metadata: sanitizeActivityPayload(input.metadata || {}),
  };
}

export function createActivityEvent(input = {}) {
  const event = normalizeActivityEvent(input);
  const result = validateActivityEvent(event);
  if (!result.ok) {
    throw new Error(`Invalid activity event: ${result.errors.join("; ")}`);
  }
  return event;
}

export function validateActivityEvent(event = {}) {
  const errors = [];

  for (const field of REQUIRED_ACTIVITY_FIELDS) {
    if (!(field in event)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (event.activityVersion !== ACTIVITY_EVENT_SCHEMA_VERSION) {
    errors.push(`activityVersion must be ${ACTIVITY_EVENT_SCHEMA_VERSION}`);
  }
  if (!/^act_[a-z0-9][a-z0-9_-]{7,}$/.test(event.activityId || "")) {
    errors.push("activityId must use act_ prefix");
  }
  if (!/^corr_[a-z0-9][a-z0-9_-]{7,}$/.test(event.correlationId || "")) {
    errors.push("correlationId must use corr_ prefix");
  }
  if (event.parentActivityId && !/^act_[a-z0-9][a-z0-9_-]{7,}$/.test(event.parentActivityId)) {
    errors.push("parentActivityId must use act_ prefix when present");
  }
  if (!event.timestamp || Number.isNaN(Date.parse(event.timestamp))) {
    errors.push("timestamp must be ISO-8601");
  }
  if (!ACTIVITY_LEVELS.includes(event.level)) {
    errors.push(`Unsupported level: ${event.level}`);
  }
  if (!ACTIVITY_CATEGORIES.includes(event.category)) {
    errors.push(`Unsupported category: ${event.category}`);
  }
  if (!validateActivityType(event.category, event.eventType)) {
    errors.push(`Unsupported eventType for category: ${event.category}.${event.eventType}`);
  }
  if (!ACTIVITY_SCOPES.includes(event.scope)) {
    errors.push(`Unsupported scope: ${event.scope}`);
  }
  if (!ACTIVITY_MODES.includes(event.mode)) {
    errors.push(`Unsupported mode: ${event.mode}`);
  }
  if (!ACTIVITY_SOURCES.includes(event.source)) {
    errors.push(`Unsupported source: ${event.source}`);
  }
  if (!ACTIVITY_STATUSES.includes(event.status)) {
    errors.push(`Unsupported status: ${event.status}`);
  }
  if (!ACTIVITY_DECISIONS.includes(event.decision)) {
    errors.push(`Unsupported decision: ${event.decision}`);
  }
  if (!DATA_CLASSIFICATIONS.includes(event.dataClassification)) {
    errors.push(`Unsupported dataClassification: ${event.dataClassification}`);
  }
  if (event.redacted !== true) {
    errors.push("redacted must be true for persisted or shared activity events");
  }
  if (!event.summary || typeof event.summary !== "string") {
    errors.push("summary is required and must be a string");
  }
  if (event.mode === "local-private" && containsForbiddenActivityContent(event)) {
    errors.push("local-private activity event contains forbidden raw private or secret content");
  } else if (containsForbiddenActivityContent(event.summary) || containsForbiddenActivityContent(event.metadata)) {
    errors.push("activity event contains forbidden raw private or secret content");
  }
  for (const field of ["evidenceIds", "auditIds", "relatedIds"]) {
    if (!Array.isArray(event[field])) {
      errors.push(`${field} must be an array`);
    }
  }
  if (typeof event.cost !== "object" || event.cost === null) {
    errors.push("cost must be an object");
  }
  if (typeof event.error !== "object" || event.error === null) {
    errors.push("error must be an object");
  }
  if (typeof event.metadata !== "object" || event.metadata === null || Array.isArray(event.metadata)) {
    errors.push("metadata must be an object");
  }

  return { ok: errors.length === 0, errors };
}

export function summarizeActivityEvent(event = {}) {
  const timestamp = event.timestamp || "unknown-time";
  const category = event.category || "unknown";
  const eventType = event.eventType || "unknown";
  const status = event.status || "unknown";
  const summary = event.summary || "No summary";
  return `${timestamp} ${event.level || "info"} ${category}:${eventType} ${status} - ${summary}`;
}

export function isActivityEventRedacted(event = {}) {
  return event.redacted === true && !containsForbiddenActivityContent(event);
}
