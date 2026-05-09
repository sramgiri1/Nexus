import { readJsonSafe } from "../../local-state/safeFileReader.js";
import { readRuntimeTasks } from "../../local-state/normalizeRuntimeFiles.js";
import { sendJson, sendError, buildEnvelope } from "../safeResponse.js";

const KNOWN_AGENTS = ["nexus", "shepherd", "atlas", "prism", "core", "swift", "pixel", "canvas",
  "forge", "stream", "synapse", "auditor", "sentinel", "warden", "relay",
  "radar", "meridian", "beacon", "compass", "oracle"];

export function handleAgents(req, res, { mode }) {
  try {
    const planResult = readJsonSafe("contracts/missions/private-project-task-plan.json");
    const runtimeResult = readRuntimeTasks();

    const plannedTasks = planResult.ok ? (planResult.data?.tasks || []) : [];
    const runtimeTasks = runtimeResult.tasks || [];

    const agentMap = {};
    for (const task of plannedTasks) {
      const a = (task.targetAgent || "").toLowerCase();
      if (!agentMap[a]) agentMap[a] = { agent: a, plannedTasks: 0, runtimeTasks: 0, capabilities: new Set(), riskLevels: {} };
      agentMap[a].plannedTasks++;
      if (task.capabilityId || task.taskType) agentMap[a].capabilities.add(task.capabilityId || task.taskType);
      agentMap[a].riskLevels[task.riskLevel] = (agentMap[a].riskLevels[task.riskLevel] || 0) + 1;
    }
    for (const task of runtimeTasks) {
      const a = (task.targetAgent || "").toLowerCase();
      if (!agentMap[a]) agentMap[a] = { agent: a, plannedTasks: 0, runtimeTasks: 0, capabilities: new Set(), riskLevels: {} };
      agentMap[a].runtimeTasks++;
    }

    const agents = Object.values(agentMap).map(a => ({
      ...a,
      capabilities: [...a.capabilities],
    }));

    sendJson(res, 200, buildEnvelope({
      ok: true,
      source: "live-local-api",
      mode,
      data: {
        agents,
        knownAgentCount: KNOWN_AGENTS.length,
        assignedAgentCount: agents.length,
      },
    }));
  } catch (err) {
    sendError(res, 500, "agents_error", "Failed to read agent data.", null);
  }
}
