import { readRuntimeEvidence } from "../../local-state/normalizeRuntimeFiles.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

export function handleEvidence(req, res, { mode }) {
  try {
    const result = readRuntimeEvidence();
    const records = result.records || [];

    const byType = records.reduce((acc, e) => {
      acc[e.evidenceType || e.type || "unknown"] = (acc[e.evidenceType || e.type || "unknown"] || 0) + 1;
      return acc;
    }, {});

    const byResult = records.reduce((acc, e) => {
      acc[e.result || "unknown"] = (acc[e.result || "unknown"] || 0) + 1;
      return acc;
    }, {});

    const recent = [...records]
      .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0))
      .slice(0, 10)
      .map(e => ({
        evidenceId: e.evidenceId || e.id,
        taskId: e.taskId || e.runtimeTaskId,
        type: e.evidenceType || e.type,
        result: e.result,
        createdAt: e.createdAt || e.timestamp,
        redacted: true,
      }));

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        totalCount: records.length,
        byType,
        byResult,
        recent,
      },
      warnings: result.warnings || [],
    }));
  } catch (err) {
    sendError(res, 500, "evidence_error", "Failed to read evidence.", null);
  }
}
