/**
 * missionActionStore.js
 * Thin wrapper over action-bridge/actionStore.js filtered to mission.compose actions.
 *
 * JSONL is append-only — "update" appends a new record with updated status + same actionId.
 */

import { appendAction, readActions, readRecentActions } from "../action-bridge/actionStore.js";

// ─── appendMissionAction ────────────────────────────────────────────────────────

/**
 * Append a mission action record to actions.jsonl.
 * @param {object} action
 * @returns {{ ok: boolean, record: object|null, errors: string[], warnings: string[] }}
 */
export function appendMissionAction(action) {
  return appendAction(action);
}

// ─── updateMissionAction ────────────────────────────────────────────────────────

/**
 * "Update" a mission action — JSONL is append-only, so this appends a new record
 * with updated status and the same actionId.
 * @param {string} actionId
 * @param {object} updates - Fields to merge (e.g. { status: "completed" })
 * @returns {{ ok: boolean, record: object|null, errors: string[], warnings: string[] }}
 */
export function updateMissionAction(actionId, updates = {}) {
  if (!actionId) {
    return { ok: false, record: null, errors: ["actionId is required to update."], warnings: [] };
  }

  // Find the most recent record for this actionId
  const existing = getMissionAction(actionId);
  if (!existing) {
    return { ok: false, record: null, errors: [`No mission action found for actionId: ${actionId}`], warnings: [] };
  }

  const updatedRecord = {
    ...existing,
    ...updates,
    actionId,
    actionType: "mission.compose",
    createdAt: new Date().toISOString(),
    redacted: true,
    mutationRequested: false,
    requestedCommand: null,
  };

  return appendAction(updatedRecord);
}

// ─── getMissionAction ───────────────────────────────────────────────────────────

/**
 * Read actions.jsonl, find and return the last record with matching actionId
 * where actionType === "mission.compose". Returns null if not found.
 * @param {string} actionId
 * @returns {object|null}
 */
export function getMissionAction(actionId) {
  if (!actionId) return null;
  const { records } = readActions();
  const matching = records.filter(
    (r) => r.actionId === actionId && r.actionType === "mission.compose"
  );
  return matching.length > 0 ? matching[matching.length - 1] : null;
}

// ─── listMissionActionRecords ───────────────────────────────────────────────────

/**
 * Return records where actionType === "mission.compose", most recent first.
 * @param {number} limit
 * @returns {{ records: object[], errors: string[], warnings: string[] }}
 */
export function listMissionActionRecords(limit = 10) {
  const { records, errors, warnings } = readRecentActions(100);
  const missionRecords = records
    .filter((r) => r.actionType === "mission.compose")
    .slice(0, limit);
  return { records: missionRecords, errors, warnings };
}
