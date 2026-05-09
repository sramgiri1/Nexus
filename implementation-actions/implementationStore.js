/**
 * implementationStore.js
 * Append-only store for implementation action records — P39-LOCAL.
 * Reuses action-bridge/actionStore pattern; writes to local-state/runtime/actions.jsonl.
 */

import { appendAction, readActions } from "../action-bridge/actionStore.js";

const IMPLEMENTATION_ACTION_TYPE = "implementation.apply";
const PROPOSAL_ACTION_TYPE = "implementation.propose";

const IMPLEMENTATION_ACTION_TYPES = new Set([IMPLEMENTATION_ACTION_TYPE, PROPOSAL_ACTION_TYPE]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildImplementationRecord(action = {}) {
  return {
    actionId: normalizeString(action.actionId),
    actionType: normalizeString(action.actionType) || IMPLEMENTATION_ACTION_TYPE,
    requestedBy: normalizeString(action.requestedBy) || "local-operator",
    source: "command_center_v2",
    projectId: normalizeString(action.projectId) || "private-project-01",
    privateProject: true,
    mode: normalizeString(action.mode) || "local-private",
    target: {
      capabilityId: normalizeString(action.capabilityId) || "implementation.backend_code",
      targetAgent: normalizeString(action.targetAgent) || "CORE",
      riskLevel: normalizeString(action.riskLevel) || "low",
      dataClassification: "confidential",
      runtimeTaskId: normalizeString(action.runtimeTaskId),
      implementationType: normalizeString(action.implementationType),
      changedFiles: Array.isArray(action.changedFiles) ? action.changedFiles : [],
      patchSummary: normalizeString(action.patchSummary),
      validationStatus: normalizeString(action.validationStatus),
    },
    requestedCommand: null,
    mutationRequested: action.patchApplied === true,
    status: normalizeString(action.status) || "completed",
    createdAt: normalizeString(action.createdAt) || new Date().toISOString(),
    redacted: true,
    evidenceIds: Array.isArray(action.evidenceIds) ? action.evidenceIds : [],
    auditIds: Array.isArray(action.auditIds) ? action.auditIds : [],
  };
}

export function appendImplementationAction(action = {}) {
  const record = buildImplementationRecord(action);
  return appendAction(record);
}

export function updateImplementationAction(actionId, updates = {}) {
  const record = buildImplementationRecord({ ...updates, actionId });
  return appendAction(record);
}

export function getImplementationAction(actionId) {
  const all = readActions();
  if (!all.ok) return { ok: false, record: null, errors: all.errors };
  const record = all.records
    .filter((r) => IMPLEMENTATION_ACTION_TYPES.has(r.actionType))
    .find((r) => r.actionId === actionId);
  if (!record) return { ok: false, record: null, errors: [`Implementation action not found: ${actionId}`] };
  return { ok: true, record, errors: [] };
}

export function listImplementationActions() {
  const all = readActions();
  if (!all.ok) return { ok: false, records: [], errors: all.errors };
  const records = all.records.filter((r) => IMPLEMENTATION_ACTION_TYPES.has(r.actionType));
  return { ok: true, records, errors: [] };
}
