import { summarizeRuntimeFiles } from "../../local-state/normalizeRuntimeFiles.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

export function handleRuntime(req, res, { mode }) {
  try {
    const summary = summarizeRuntimeFiles();

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        counts: summary.counts || {},
        health: summary.health || {},
        recentEvents: (summary.recentEvents || []).slice(0, 10).map(e => ({
          type: e.eventType || e.type,
          taskId: e.taskId || e.runtimeTaskId,
          timestamp: e.timestamp || e.createdAt,
        })),
        files: summary.files || {},
      },
      warnings: summary.warnings || [],
      errors: summary.errors || [],
    }));
  } catch (err) {
    sendError(res, 500, "runtime_error", "Failed to read runtime state.", null);
  }
}
