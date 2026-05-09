import { listMissionActions, getMissionActionResult } from "../../mission-actions/missionActionBridge.js";
import { listTaskActivationActions, getTaskActivationResult } from "../../task-actions/taskActivationBridge.js";
import { listReviewRecords } from "../../workbench/reviewStore.js";
import { listImplementationActions, getImplementationResult } from "../../implementation-actions/implementationBridge.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

export function handleListActions(req, res, { mode }) {
  try {
    const missions = listMissionActions();
    const tasks = listTaskActivationActions();
    const reviews = listReviewRecords();
    const implementations = listImplementationActions();

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        mission: { count: (missions.records || []).length, records: (missions.records || []).slice(0, 5) },
        taskActivation: { count: (tasks.records || []).length, records: (tasks.records || []).slice(0, 5) },
        review: { count: (reviews.records || []).length, records: (reviews.records || []).slice(0, 5) },
        implementation: { count: (implementations.records || []).length, records: (implementations.records || []).slice(0, 5) },
        total: (missions.records?.length || 0) + (tasks.records?.length || 0) + (reviews.records?.length || 0) + (implementations.records?.length || 0),
      },
    }));
  } catch (err) {
    sendError(res, 500, "actions_error", "Failed to read action records.", null);
  }
}

export function handleGetAction(req, res, { mode, actionId }) {
  if (!actionId) {
    sendError(res, 400, "action_id_required", "actionId is required.", null);
    return;
  }
  const impl = getImplementationResult(actionId);
  if (impl.ok) { sendJson(res, 200, buildEnvelope({ ok: true, source: "live-local-api", mode, data: impl.record })); return; }
  const task = getTaskActivationResult(actionId);
  if (task.ok) { sendJson(res, 200, buildEnvelope({ ok: true, source: "live-local-api", mode, data: task.record })); return; }
  const mission = getMissionActionResult(actionId);
  if (mission) { sendJson(res, 200, buildEnvelope({ ok: true, source: "live-local-api", mode, data: mission })); return; }
  sendError(res, 404, "action_not_found", `Action ${actionId.slice(0, 8)} not found.`, null);
}
