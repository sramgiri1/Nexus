import { readRuntimeAudit } from "../../local-state/normalizeRuntimeFiles.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

export function handleAudit(req, res, { mode }) {
  try {
    const result = readRuntimeAudit();
    const records = result.records || [];

    const byEventType = records.reduce((acc, e) => {
      acc[e.eventType || e.type || "unknown"] = (acc[e.eventType || e.type || "unknown"] || 0) + 1;
      return acc;
    }, {});

    const recent = [...records]
      .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))
      .slice(0, 15)
      .map(e => ({
        auditId: e.auditId || e.id,
        taskId: e.taskId || e.runtimeTaskId,
        eventType: e.eventType || e.type,
        agent: e.agent,
        timestamp: e.timestamp || e.createdAt,
        redacted: true,
      }));

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        totalCount: records.length,
        byEventType,
        recent,
      },
      warnings: result.warnings || [],
    }));
  } catch (err) {
    sendError(res, 500, "audit_error", "Failed to read audit trail.", null);
  }
}
