import {
  createTraceContext,
} from "./correlation.js";
import { logActivity, logActivityDryRun } from "./activityLogger.js";
import { sanitizeActivityPayload } from "./redactionPolicy.js";

const ACTION_EVENT_TYPES = {
  "mission.compose": {
    requested: "mission_compose_requested",
    completed: "mission_compose_completed",
  },
  "task.activate": {
    requested: "task_activation_requested",
    completed: "task_activation_completed",
  },
  "task.review": {
    requested: "review_requested",
    completed: "review_completed",
  },
  "implementation.propose": {
    requested: "implementation_requested",
    completed: "implementation_completed",
  },
  "implementation.apply": {
    requested: "implementation_requested",
    completed: "implementation_completed",
  },
};

function normalizeScope(scope) {
  return ["NEXUS_OS_CHANGE", "PROJECT_CHANGE", "CROSS_CUTTING_CHANGE", "DEMO", "SYSTEM"].includes(scope)
    ? scope
    : "PROJECT_CHANGE";
}

function normalizeMode(mode) {
  return ["local-private", "demo", "public-safe", "test", "unknown"].includes(mode)
    ? mode
    : "local-private";
}

function normalizeStatus(status) {
  if (status === "completed" || status === "proposed" || status === "ok") return "success";
  if (status === "error") return "failed";
  if (["started", "success", "failed", "blocked", "skipped", "pending", "requires_approval"].includes(status)) {
    return status;
  }
  return "success";
}

function isSuccessfulResult(result = {}) {
  return result?.ok === true || result?.status === "completed" || result?.status === "proposed";
}

function actionEventTypes(actionType) {
  return ACTION_EVENT_TYPES[actionType] || {
    requested: "operator_action_requested",
    completed: "operator_action_requested",
  };
}

function safeSummary(summary, fallback) {
  return String(summary || fallback).slice(0, 240);
}

export function createActivityContext(input = {}) {
  const correlationId = typeof input.correlationId === "string" ? input.correlationId : undefined;
  return createTraceContext({
    correlationId,
    rootActivityId: input.rootActivityId,
    parentActivityId: input.parentActivityId,
    projectId: input.projectId || "private-project-01",
    missionId: input.missionId || null,
    taskId: input.taskId || input.runtimeTaskId || null,
    agentId: input.agentId || input.targetAgent || null,
    scope: normalizeScope(input.scope),
    source: input.source || "system",
  });
}

function recordCapturedActivity(input = {}, options = {}) {
  const traceContext = input.traceContext || createActivityContext(input);
  const event = {
    traceContext,
    category: input.category || "system",
    eventType: input.eventType || "roadmap_status_updated",
    mode: normalizeMode(input.mode),
    source: input.source || traceContext.source || "system",
    scope: normalizeScope(input.scope || traceContext.scope),
    projectId: input.projectId || traceContext.projectId || "private-project-01",
    missionId: input.missionId || traceContext.missionId || null,
    taskId: input.taskId || input.runtimeTaskId || traceContext.taskId || null,
    agentId: input.agentId || input.targetAgent || traceContext.agentId || null,
    capabilityId: input.capabilityId || null,
    status: normalizeStatus(input.status || "success"),
    level: input.level || "info",
    decision: input.decision || "NOT_APPLICABLE",
    summary: safeSummary(input.summary, "Activity capture recorded."),
    dataClassification: input.dataClassification || "internal",
    redacted: true,
    durationMs: input.durationMs || 0,
    evidenceIds: input.evidenceIds || [],
    auditIds: input.auditIds || [],
    relatedIds: input.relatedIds || [],
    metadata: sanitizeActivityPayload(input.metadata || {}),
    error: input.error ? sanitizeActivityPayload(input.error) : undefined,
  };

  return options.dryRun ? logActivityDryRun(event, options) : logActivity(event, options);
}

export async function withActivityCapture(context = {}, fn, options = {}) {
  const startedAt = Date.now();
  const traceContext = createActivityContext(context);
  const eventTypes = actionEventTypes(context.actionType);
  recordCapturedActivity({
    ...context,
    traceContext,
    category: "action_bridge",
    source: "action_bridge",
    eventType: context.requestedEventType || eventTypes.requested,
    status: "started",
    summary: context.requestSummary || "Governed action bridge request started.",
    metadata: {
      actionId: context.actionId || null,
      actionType: context.actionType || null,
      source: context.source || null,
    },
  }, options);

  try {
    const result = await fn();
    const status = result?.status === "blocked" ? "blocked" : (isSuccessfulResult(result) ? "success" : "failed");
    recordCapturedActivity({
      ...context,
      traceContext,
      category: "action_bridge",
      source: "action_bridge",
      eventType: context.completedEventType || eventTypes.completed,
      status,
      durationMs: Date.now() - startedAt,
      evidenceIds: [],
      auditIds: [],
      summary: buildActivitySummary({
        category: "action_bridge",
        actionType: context.actionType,
        status,
      }),
      metadata: {
        actionId: result?.actionId || context.actionId || null,
        actionType: context.actionType || result?.actionType || null,
        resultStatus: result?.status || null,
        warningCount: Array.isArray(result?.warnings) ? result.warnings.length : 0,
        errorCount: Array.isArray(result?.errors) ? result.errors.length : 0,
      },
    }, options);
    return result;
  } catch (error) {
    recordActivityFailure({
      ...context,
      traceContext,
      category: "action_bridge",
      source: "action_bridge",
      eventType: context.completedEventType || eventTypes.completed,
      summary: "Governed action bridge request failed.",
      error,
      durationMs: Date.now() - startedAt,
    }, options);
    throw error;
  }
}

export function recordUiActivity(input = {}, options = {}) {
  return recordCapturedActivity({
    ...input,
    category: input.category || "ui",
    source: "command_center",
    eventType: input.eventType || "operator_action_requested",
    status: input.status || "success",
    summary: input.summary || "Command Center UI activity captured.",
  }, options);
}

export function recordApiActivity(input = {}, options = {}) {
  return recordCapturedActivity({
    ...input,
    category: "api",
    source: "local_api",
    eventType: input.eventType || "local_api_request_completed",
    status: input.status || "success",
    summary: input.summary || "Local API read request captured.",
  }, options);
}

export function recordActionBridgeActivity(input = {}, options = {}) {
  const eventTypes = actionEventTypes(input.actionType);
  return recordCapturedActivity({
    ...input,
    category: "action_bridge",
    source: "action_bridge",
    eventType: input.eventType || eventTypes.completed,
    status: input.status || "success",
    summary: input.summary || "Governed action bridge activity captured.",
  }, options);
}

export function recordActivityFailure(input = {}, options = {}) {
  const message = input.error?.message || input.error || "Activity capture failure.";
  return recordCapturedActivity({
    ...input,
    status: "failed",
    level: "error",
    summary: input.summary || "Activity capture failure recorded.",
    error: { code: input.errorCode || "activity_capture_failure", message, retryable: false },
  }, options);
}

export function buildActivitySummary(event = {}) {
  const category = event.category || "activity";
  const action = event.actionType || event.eventType || "event";
  const status = normalizeStatus(event.status || "success");
  return `${category} ${action} ${status}`.replaceAll("_", " ");
}
