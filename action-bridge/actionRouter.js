import process from "node:process";
import { randomUUID } from "node:crypto";
import { appendEvidence } from "../local-state/appendEvidence.js";
import { appendAuditEvent } from "../local-state/appendAuditEvent.js";
import { appendRuntimeEvent } from "../local-state/stateStore.js";
import { ACTION_STATUSES } from "./actionSchema.js";
import { appendAction } from "./actionStore.js";
import { validateActionRequest } from "./actionValidator.js";

const RUNTIME_PROJECT_ID = "private-project-01";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildRoutingRecord(action, validationResult) {
  return {
    routingId: randomUUID(),
    actionId: normalizeString(action.actionId),
    actionType: normalizeString(action.actionType),
    status: validationResult.valid ? ACTION_STATUSES.VALIDATED : ACTION_STATUSES.BLOCKED,
    mode: validationResult.mode,
    approvalRequired: validationResult.approvalRequired,
    governanceApplied: true,
    trafficPlaneApplied: true,
    stateMachineApplied: true,
    localWriteBoundaryApplied: true,
    commandExecuted: false,
    mutationApplied: false,
    providerCalled: false,
    networkCalled: false,
    dbAccessed: false,
    createdAt: new Date(Date.now()).toISOString(),
    errors: validationResult.errors,
    warnings: validationResult.warnings,
  };
}

function emitRoutingEvidence(action, routing) {
  return appendEvidence({
    type: "action_bridge_routing",
    projectId: RUNTIME_PROJECT_ID,
    taskId: `pvt-action-bridge-${normalizeString(action.actionId).slice(0, 8)}`,
    agentId: "system",
    capabilityId: normalizeString(action.target?.capabilityId),
    result: routing.status === ACTION_STATUSES.VALIDATED ? "PASS" : "BLOCKED",
    summary: `Action bridge routing: ${normalizeString(action.actionType)} → ${routing.status}`,
    artifactPaths: [],
    traceIds: [routing.routingId],
    policyDecisionId: "",
    dataClassification: "confidential",
  });
}

function emitRoutingAudit(action, routing) {
  return appendAuditEvent({
    eventType: "action_bridge_routing_evaluated",
    actorId: "system",
    actorType: "system",
    projectId: RUNTIME_PROJECT_ID,
    taskId: `pvt-action-bridge-${normalizeString(action.actionId).slice(0, 8)}`,
    capabilityId: normalizeString(action.target?.capabilityId),
    policyDecisionId: "",
    approvalId: "",
    summary: `Action bridge: ${normalizeString(action.actionType)} evaluated, status=${routing.status}`,
    previousState: "",
    nextState: routing.status,
  });
}

function emitRoutingEvent(action, routing) {
  return appendRuntimeEvent({
    eventType: "action_bridge_request_routed",
    projectId: RUNTIME_PROJECT_ID,
    taskId: `pvt-action-bridge-${normalizeString(action.actionId).slice(0, 8)}`,
    agentId: "system",
    capabilityId: normalizeString(action.target?.capabilityId),
    summary: `Action request ${normalizeString(action.actionType)} routed through governance`,
    outcome: routing.status,
    metadata: {
      actionId: normalizeString(action.actionId),
      approvalRequired: routing.approvalRequired,
      commandExecuted: false,
    },
  });
}

export function routeActionRequest(action, options = {}) {
  const env = options.env || process.env;
  const validationResult = validateActionRequest(action, { env });
  const routing = buildRoutingRecord(action, validationResult);

  const updatedAction = {
    ...action,
    status: routing.status,
    auditIds: [],
    evidenceIds: [],
  };

  const storeResult = appendAction(updatedAction);
  if (!storeResult.ok) {
    return {
      ok: false,
      routing,
      storeResult,
      errors: [...storeResult.errors, "Failed to persist action record."],
      warnings: validationResult.warnings,
    };
  }

  const evidenceResult = emitRoutingEvidence(action, routing);
  const auditResult = emitRoutingAudit(action, routing);
  const eventResult = emitRoutingEvent(action, routing);

  return {
    ok: true,
    routing,
    storeResult,
    evidence: evidenceResult,
    audit: auditResult,
    event: eventResult,
    errors: validationResult.errors,
    warnings: [
      ...validationResult.warnings,
      ...(evidenceResult.ok ? [] : evidenceResult.errors),
      ...(auditResult.ok ? [] : auditResult.errors),
      ...(eventResult.ok ? [] : [eventResult.error || "Event write warning."]),
    ],
  };
}
