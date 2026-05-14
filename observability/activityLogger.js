import {
  createActivityEvent as createSchemaActivityEvent,
  normalizeActivityEvent,
  validateActivityEvent,
} from "./activitySchema.js";
import { appendActivityEvent, summarizeActivityStore } from "./activityStore.js";
import { createTraceContext, linkChildActivity } from "./correlation.js";
import { sanitizeActivityPayload } from "./redactionPolicy.js";

export function createActivityEvent(input = {}) {
  const traceContext = input.traceContext
    ? linkChildActivity(input.traceContext, input)
    : input;
  return createSchemaActivityEvent({
    mode: "local-private",
    source: "system",
    scope: "SYSTEM",
    status: "pending",
    decision: "NOT_APPLICABLE",
    dataClassification: "internal",
    redacted: true,
    ...traceContext,
    metadata: sanitizeActivityPayload(traceContext.metadata || {}),
    error: traceContext.error ? sanitizeActivityPayload(traceContext.error) : undefined,
  });
}

export function validateActivityForLogging(event) {
  const normalized = normalizeActivityEvent({
    ...event,
    redacted: true,
    metadata: sanitizeActivityPayload(event?.metadata || {}),
    error: event?.error ? sanitizeActivityPayload(event.error) : undefined,
  });
  return {
    event: normalized,
    ...validateActivityEvent(normalized),
  };
}

export function logActivityDryRun(input = {}, options = {}) {
  const event = createActivityEvent(input);
  const validation = validateActivityForLogging(event);
  if (!validation.ok) {
    return { ok: false, dryRun: true, written: false, event, errors: validation.errors };
  }
  return {
    ok: true,
    dryRun: true,
    written: false,
    event,
    errors: [],
    storePath: options.storePath || "local-state/runtime/activity.jsonl",
  };
}

export function logActivity(input = {}, options = {}) {
  if (options.dryRun) {
    return logActivityDryRun(input, options);
  }
  const event = createActivityEvent(input);
  const validation = validateActivityForLogging(event);
  if (!validation.ok) {
    return { ok: false, dryRun: false, written: false, event, errors: validation.errors };
  }
  const appendResult = appendActivityEvent(event, options);
  return {
    ok: true,
    dryRun: false,
    written: appendResult.written,
    event,
    errors: [],
    warnings: appendResult.warnings || [],
    storePath: appendResult.storePath,
  };
}

export function buildActivityLoggerSummary(options = {}) {
  return {
    loggerVersion: "1.0",
    phase: "P41.8.2",
    dryRunSupported: true,
    appendOnly: true,
    redactionRequired: true,
    broadInstrumentationEnabled: false,
    activityApiEndpointEnabled: false,
    commandCenterActivityUiEnabled: false,
    store: summarizeActivityStore(options),
  };
}

export function createActivityLogger(options = {}) {
  const baseTraceContext = options.traceContext || createTraceContext({
    scope: options.scope || "SYSTEM",
    source: options.source || "system",
    projectId: options.projectId || null,
    missionId: options.missionId || null,
    taskId: options.taskId || null,
    agentId: options.agentId || null,
  });

  return {
    traceContext: baseTraceContext,
    createEvent(input = {}) {
      return createActivityEvent({ ...input, traceContext: input.traceContext || baseTraceContext });
    },
    validate(event) {
      return validateActivityForLogging(event);
    },
    dryRun(input = {}) {
      return logActivityDryRun({ ...input, traceContext: input.traceContext || baseTraceContext }, options);
    },
    log(input = {}) {
      return logActivity({ ...input, traceContext: input.traceContext || baseTraceContext }, options);
    },
    summary() {
      return buildActivityLoggerSummary(options);
    },
  };
}
