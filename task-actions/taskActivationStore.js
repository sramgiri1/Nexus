/**
 * taskActivationStore.js
 * Append-only store for task activation action records — P37-LOCAL.
 * Reuses action-bridge/actionStore pattern; writes to local-state/runtime/actions.jsonl.
 */

import { appendAction, readActions, readRecentActions } from "../action-bridge/actionStore.js";

const TASK_ACTIVATION_ACTION_TYPE = "task.activate";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildTaskActivationRecord(action = {}) {
  return {
    actionId: normalizeString(action.actionId),
    actionType: TASK_ACTIVATION_ACTION_TYPE,
    requestedBy: normalizeString(action.requestedBy) || "local-operator",
    source: "command_center_v2",
    projectId: normalizeString(action.projectId) || "private-project-01",
    privateProject: true,
    mode: normalizeString(action.mode) || "local-private",
    target: {
      capabilityId: normalizeString(action.capabilityId),
      targetAgent: normalizeString(action.targetAgent),
      riskLevel: normalizeString(action.riskLevel) || "medium",
      dataClassification: "confidential",
      planTaskId: normalizeString(action.planTaskId),
      runtimeTaskId: normalizeString(action.runtimeTaskId),
    },
    requestedCommand: null,
    mutationRequested: false,
    status: normalizeString(action.status) || "completed",
    createdAt: normalizeString(action.createdAt) || new Date().toISOString(),
    redacted: true,
    evidenceIds: Array.isArray(action.evidenceIds) ? action.evidenceIds : [],
    auditIds: Array.isArray(action.auditIds) ? action.auditIds : [],
  };
}

export function appendTaskActivationAction(action = {}) {
  const record = buildTaskActivationRecord(action);
  return appendAction(record);
}

export function updateTaskActivationAction(actionId, updates = {}) {
  // Actions are append-only; updates are stored as new records with parent reference
  const record = buildTaskActivationRecord({
    ...updates,
    actionId,
    status: normalizeString(updates.status) || "updated",
  });
  return appendAction(record);
}

export function getTaskActivationAction(actionId) {
  const all = readActions();
  if (!all.ok) return { ok: false, record: null, errors: all.errors };
  const record = all.records
    .filter((r) => r.actionType === TASK_ACTIVATION_ACTION_TYPE)
    .find((r) => r.actionId === actionId);
  if (!record) return { ok: false, record: null, errors: ["Action not found"] };
  return { ok: true, record, errors: [] };
}

export function listTaskActivationActionRecords() {
  const all = readActions();
  if (!all.ok) return { ok: false, records: [], errors: all.errors };
  const records = all.records.filter((r) => r.actionType === TASK_ACTIVATION_ACTION_TYPE);
  return { ok: true, records, errors: [] };
}
