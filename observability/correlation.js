import { randomBytes } from "node:crypto";

const CORRELATION_ID_RE = /^corr_[a-z0-9][a-z0-9_-]{7,}$/;
const ACTIVITY_ID_RE = /^act_[a-z0-9][a-z0-9_-]{7,}$/;

function normalizePrefix(prefix, fallback) {
  const clean = String(prefix || fallback).replace(/_+$/g, "");
  return clean || fallback;
}

function createToken(options = {}) {
  if (options.seed) {
    return String(options.seed).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32).padEnd(8, "0");
  }
  if (typeof options.random === "function") {
    return String(options.random()).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32).padEnd(8, "0");
  }
  return randomBytes(8).toString("hex");
}

export function createCorrelationId(prefix = "corr", options = {}) {
  return `${normalizePrefix(prefix, "corr")}_${createToken(options)}`;
}

export function createActivityId(prefix = "act", options = {}) {
  return `${normalizePrefix(prefix, "act")}_${createToken(options)}`;
}

function now(options = {}) {
  return options.now || new Date().toISOString();
}

export function createTraceContext(input = {}) {
  const correlationId = input.correlationId || createCorrelationId("corr", input);
  const rootActivityId = input.rootActivityId || input.activityId || createActivityId("act", input);

  return {
    correlationId,
    rootActivityId,
    parentActivityId: input.parentActivityId || null,
    projectId: input.projectId || null,
    missionId: input.missionId || null,
    taskId: input.taskId || null,
    agentId: input.agentId || null,
    scope: input.scope || "SYSTEM",
    source: input.source || "system",
    createdAt: now(input),
  };
}

export function validateTraceContext(context = {}) {
  const errors = [];
  if (!CORRELATION_ID_RE.test(context.correlationId || "")) {
    errors.push("correlationId must use corr_ prefix");
  }
  if (!ACTIVITY_ID_RE.test(context.rootActivityId || "")) {
    errors.push("rootActivityId must use act_ prefix");
  }
  if (context.parentActivityId && !ACTIVITY_ID_RE.test(context.parentActivityId)) {
    errors.push("parentActivityId must use act_ prefix when present");
  }
  if (!context.createdAt || Number.isNaN(Date.parse(context.createdAt))) {
    errors.push("createdAt must be ISO-8601");
  }
  return { ok: errors.length === 0, errors };
}

export function linkChildActivity(parent, childInput = {}) {
  const parentActivityId = parent.activityId || parent.rootActivityId;
  return {
    ...childInput,
    correlationId: parent.correlationId,
    parentActivityId,
  };
}

export function summarizeTraceContext(context = {}) {
  const project = context.projectId || "no-project";
  const task = context.taskId ? ` task ${context.taskId}` : "";
  return `${context.correlationId || "corr_missing"} · ${context.scope || "SYSTEM"} · ${project}${task}`;
}
