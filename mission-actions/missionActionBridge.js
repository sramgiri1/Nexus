/**
 * missionActionBridge.js
 * Command Center Mission Action Bridge — P35-LOCAL
 *
 * Bridges the UI Generate Plan button to runMissionComposer via a governed
 * local bridge. No provider calls. No network calls. No DB access.
 * All writes stay within local-state/runtime/ boundaries.
 */

import { randomUUID } from "node:crypto";
import { appendAction, readActions, readRecentActions } from "../action-bridge/actionStore.js";
import { runMissionComposer } from "../mission-composer/missionComposer.js";
import { withActivityCapture } from "../observability/index.js";
import { getNexusMode } from "../private-mode/privateMode.js";

const ALLOWED_ACTION_TYPES = new Set(["mission.compose"]);
const ALLOWED_MODES = new Set(["local-private", "test"]);

// ─── createMissionActionRequest ────────────────────────────────────────────────

/**
 * Build + validate a request object from raw UI input.
 * @param {object} input - { actionType, mode, projectId, projectLabel, missionText, requestedBy, source }
 * @returns {{ ok: boolean, request: object|null, errors: string[], warnings: string[] }}
 */
export function createMissionActionRequest(input = {}) {
  const errors = [];
  const warnings = [];

  const actionType = typeof input.actionType === "string" ? input.actionType.trim() : "";
  const mode = typeof input.mode === "string" ? input.mode.trim() : "";
  const projectId = typeof input.projectId === "string" ? input.projectId.trim() : "private-project-01";
  const projectLabel = typeof input.projectLabel === "string" ? input.projectLabel.trim() : "Private Project";
  const missionText = typeof input.missionText === "string" ? input.missionText.trim() : "";
  const source = typeof input.source === "string" ? input.source.trim() : "command_center_v2";

  let requestedBy = input.requestedBy;
  if (!requestedBy || typeof requestedBy !== "object") {
    requestedBy = { userId: "local-operator", role: "founder", authType: "local" };
    warnings.push("requestedBy not provided; using default local-operator.");
  }

  if (!ALLOWED_ACTION_TYPES.has(actionType)) {
    errors.push(`actionType must be one of: ${[...ALLOWED_ACTION_TYPES].join(", ")}. Got: ${actionType || "(empty)"}`);
  }

  if (!ALLOWED_MODES.has(mode)) {
    errors.push(`mode must be one of: ${[...ALLOWED_MODES].join(", ")}. Got: ${mode || "(empty)"}`);
  }

  if (!missionText) {
    errors.push("missionText is required and must be non-empty.");
  }

  if (errors.length > 0) {
    return { ok: false, request: null, errors, warnings };
  }

  const request = {
    actionId: randomUUID(),
    actionType,
    mode,
    projectId: "private-project-01",
    projectLabel,
    missionText,
    requestedBy,
    source,
    createdAt: new Date().toISOString(),
  };

  return { ok: true, request, errors: [], warnings };
}

// ─── validateMissionActionRequest ──────────────────────────────────────────────

/**
 * Validate fields of a built request object.
 * @param {object} request
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateMissionActionRequest(request = {}) {
  const errors = [];
  const warnings = [];

  if (!request || typeof request !== "object") {
    return { valid: false, errors: ["request must be an object."], warnings };
  }

  if (!request.actionId) {
    errors.push("actionId is required.");
  }

  if (!ALLOWED_ACTION_TYPES.has(request.actionType)) {
    errors.push(`actionType must be one of: ${[...ALLOWED_ACTION_TYPES].join(", ")}.`);
  }

  if (!ALLOWED_MODES.has(request.mode)) {
    errors.push(`mode must be one of: ${[...ALLOWED_MODES].join(", ")}.`);
  }

  if (!request.missionText || !request.missionText.trim()) {
    errors.push("missionText is required.");
  }

  if (!request.projectId) {
    warnings.push("projectId not provided; will use private-project-01.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── runMissionActionRequest ────────────────────────────────────────────────────

/**
 * Main entry: validates request, checks mode, appends action record, runs mission
 * composer, returns structured result.
 * @param {object} request
 * @returns {Promise<object>}
 */
async function runMissionActionRequestInner(request = {}) {
  // 1. Validate request
  const validation = validateMissionActionRequest(request);
  if (!validation.valid) {
    return buildMissionActionResponse({
      ok: false,
      actionId: request.actionId || "",
      status: "failed",
      mode: request.mode || "local-private",
      errors: validation.errors,
      warnings: validation.warnings,
      result: null,
    });
  }

  // 2. Check mode via env
  const envMode = getNexusMode(process.env);
  if (!ALLOWED_MODES.has(envMode)) {
    return buildMissionActionResponse({
      ok: false,
      actionId: request.actionId,
      status: "blocked",
      mode: envMode,
      errors: [`Mission action bridge requires local-private or test mode. NEXUS_MODE=${envMode}`],
      warnings: [],
      result: null,
    });
  }

  // 3. Append action record with status "queued"
  // NOTE: projectLabel must NOT be stored — assertNoPrivateProjectReference blocks product names.
  // Only use projectId "private-project-01".
  const actionRecord = {
    actionId: request.actionId,
    actionType: "mission.compose",
    source: "command_center",
    projectId: "private-project-01",
    privateProject: true,
    mode: envMode,
    requestedBy: typeof request.requestedBy === "object"
      ? (request.requestedBy.userId || "local-operator")
      : "local-operator",
    status: "queued",
    redacted: true,
    mutationRequested: false,
    requestedCommand: null,
    createdAt: request.createdAt || new Date().toISOString(),
    evidenceIds: [],
    auditIds: [],
  };

  const appendResult = appendAction(actionRecord);
  if (!appendResult.ok) {
    return buildMissionActionResponse({
      ok: false,
      actionId: request.actionId,
      status: "failed",
      mode: envMode,
      errors: ["Failed to append action record: " + appendResult.errors.join(", ")],
      warnings: [],
      result: null,
    });
  }

  // 4. Call runMissionComposer
  let composerResult;
  try {
    composerResult = await runMissionComposer({
      missionText: request.missionText,
      projectId: "private-project-01",
      projectLabel: request.projectLabel || "Private Project",
      mode: envMode,
      requestedBy: request.requestedBy,
    });
  } catch (err) {
    // Append failed status record
    appendAction({
      ...actionRecord,
      actionId: request.actionId,
      status: "failed",
      createdAt: new Date().toISOString(),
    });

    return buildMissionActionResponse({
      ok: false,
      actionId: request.actionId,
      status: "failed",
      mode: envMode,
      errors: [`Mission composer threw: ${err && err.message ? err.message : String(err)}`],
      warnings: [],
      result: null,
    });
  }

  if (!composerResult.ok) {
    // Append failed status record
    appendAction({
      ...actionRecord,
      actionId: request.actionId,
      status: "failed",
      createdAt: new Date().toISOString(),
    });

    return buildMissionActionResponse({
      ok: false,
      actionId: request.actionId,
      status: "failed",
      mode: envMode,
      errors: composerResult.errors || ["Mission composer failed."],
      warnings: composerResult.warnings || [],
      result: null,
    });
  }

  // 5. Append completed status record
  appendAction({
    ...actionRecord,
    actionId: request.actionId,
    status: "completed",
    createdAt: new Date().toISOString(),
    evidenceIds: composerResult.evidence?.evidenceId ? [composerResult.evidence.evidenceId] : [],
    auditIds: composerResult.audit?.auditId ? [composerResult.audit.auditId] : [],
  });

  // 6. Return structured result
  return buildMissionActionResponse({
    ok: true,
    actionId: request.actionId,
    status: "completed",
    mode: envMode,
    errors: [],
    warnings: composerResult.warnings || [],
    result: {
      missionContractPath: composerResult.contract?.path || "contracts/missions/private-project-mission-contract.json",
      taskPlanPath: composerResult.taskPlan?.path || "contracts/missions/private-project-task-plan.json",
      reportPath: "reports/mission-composer-output.json",
      tasksCreated: composerResult.taskPlan?.taskCount || 6,
      evidenceCreated: composerResult.evidence != null,
      auditCreated: composerResult.audit != null,
      contractId: composerResult.contract?.contractId || null,
      localTaskId: composerResult.localTask?.taskId || null,
    },
  });
}

export async function runMissionActionRequest(request = {}) {
  return withActivityCapture({
    actionId: request.actionId,
    actionType: "mission.compose",
    projectId: "private-project-01",
    missionId: request.missionId || null,
    mode: request.mode || "local-private",
    scope: "PROJECT_CHANGE",
    source: request.source || "command_center",
    requestSummary: "Mission compose action requested.",
  }, () => runMissionActionRequestInner(request));
}

// ─── getMissionActionResult ─────────────────────────────────────────────────────

/**
 * Look up a mission action from actions.jsonl by actionId.
 * Returns the last matching record, or null.
 * @param {string} actionId
 * @returns {object|null}
 */
export function getMissionActionResult(actionId) {
  if (!actionId) return null;
  const { records } = readActions();
  const matching = records.filter(
    (r) => r.actionId === actionId && r.actionType === "mission.compose"
  );
  return matching.length > 0 ? matching[matching.length - 1] : null;
}

// ─── listMissionActions ─────────────────────────────────────────────────────────

/**
 * Return recent mission.compose actions from actions.jsonl.
 * @param {number} limit
 * @returns {{ records: object[], errors: string[], warnings: string[] }}
 */
export function listMissionActions(limit = 10) {
  const { records, errors, warnings } = readRecentActions(50);
  const missionRecords = records
    .filter((r) => r.actionType === "mission.compose")
    .slice(0, limit);
  return { records: missionRecords, errors, warnings };
}

// ─── buildMissionActionResponse ─────────────────────────────────────────────────

/**
 * Format result into standard response shape.
 * @param {object} result
 * @returns {object}
 */
export function buildMissionActionResponse(result = {}) {
  const ok = result.ok === true;
  const status = result.status || (ok ? "completed" : "failed");
  const missionResult = result.result || null;

  return {
    ok,
    actionId: result.actionId || "",
    actionType: "mission.compose",
    status,
    mode: result.mode || "local-private",
    projectId: "private-project-01",
    result: ok && missionResult
      ? {
          missionContractPath: missionResult.missionContractPath || "contracts/missions/private-project-mission-contract.json",
          taskPlanPath: missionResult.taskPlanPath || "contracts/missions/private-project-task-plan.json",
          reportPath: missionResult.reportPath || "reports/mission-composer-output.json",
          tasksCreated: missionResult.tasksCreated ?? 6,
          evidenceCreated: missionResult.evidenceCreated === true,
          auditCreated: missionResult.auditCreated === true,
        }
      : null,
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
    errors: Array.isArray(result.errors) ? result.errors : [],
  };
}
