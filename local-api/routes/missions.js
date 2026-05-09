import { readJsonSafe } from "../../local-state/safeFileReader.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

export function handleMissions(req, res, { mode }) {
  try {
    const contract = readJsonSafe("contracts/missions/private-project-mission-contract.json");
    const taskPlan = readJsonSafe("contracts/missions/private-project-task-plan.json");

    const missionData = contract.ok ? {
      contractId: contract.data?.contractId,
      contractVersion: contract.data?.contractVersion,
      mode: contract.data?.mode,
      source: contract.data?.source,
      createdAt: contract.data?.createdAt,
      projectId: contract.data?.projectId,
      projectLabel: contract.data?.projectLabel,
      missionText: contract.data?.missionText,
      constraints: contract.data?.constraints,
      governance: contract.data?.governance,
      redacted: contract.data?.redacted,
    } : null;

    const taskPlanSummary = taskPlan.ok ? {
      planVersion: taskPlan.data?.planVersion,
      taskCount: taskPlan.data?.tasks?.length || 0,
      agents: [...new Set((taskPlan.data?.tasks || []).map(t => t.targetAgent))],
      riskLevels: (taskPlan.data?.tasks || []).reduce((acc, t) => {
        acc[t.riskLevel] = (acc[t.riskLevel] || 0) + 1;
        return acc;
      }, {}),
      createdAt: taskPlan.data?.createdAt,
    } : null;

    const warnings = [];
    if (!contract.ok) warnings.push("Mission contract not found — run mission:compose first.");
    if (!taskPlan.ok) warnings.push("Task plan not found — run mission:compose first.");

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: { mission: missionData, taskPlan: taskPlanSummary },
      warnings,
    }));
  } catch (err) {
    sendError(res, 500, "missions_error", "Failed to read mission data.", null);
  }
}
