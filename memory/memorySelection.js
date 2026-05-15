import { containsForbiddenMemoryContent } from "./memorySchema.js";

function isModeForbidden(item, mode) {
  return Array.isArray(item.forbiddenModes) && item.forbiddenModes.includes(mode);
}

function isProjectCompatible(item, projectId) {
  if (!item.projectId) return true;
  return item.projectId === projectId;
}

function isTaskCompatible(item, taskId) {
  if (!item.taskId) return true;
  return item.taskId === taskId;
}

function isAgentAllowed(item, agentId) {
  if (!Array.isArray(item.allowedAgents) || item.allowedAgents.length === 0) return true;
  return item.allowedAgents.includes(agentId) || item.allowedAgents.includes("NEXUS");
}

export function scoreMemoryItem(item, input = {}) {
  let score = 0;
  if (item.scope === input.scope) score += 4;
  if (item.projectId && item.projectId === input.projectId) score += 3;
  if (item.taskId && item.taskId === input.taskId) score += 3;
  if (item.missionId && item.missionId === input.missionId) score += 2;
  if (isAgentAllowed(item, input.agentId)) score += 1;
  if (item.freshness === "fresh") score += 2;
  if (item.freshness === "unknown") score -= 1;
  if (item.freshness === "expired" || item.freshness === "invalidated") score -= 5;
  return score;
}

export function selectMemoryItems(items = [], input = {}) {
  const excludedMemory = [];
  const eligible = [];

  for (const item of items) {
    const exclusionReasons = [];
    if (isModeForbidden(item, input.mode)) exclusionReasons.push("Mode cannot access this memory");
    if (!isProjectCompatible(item, input.projectId)) exclusionReasons.push("Unrelated project memory");
    if (!isTaskCompatible(item, input.taskId)) exclusionReasons.push("Unrelated task memory");
    if (!isAgentAllowed(item, input.agentId)) exclusionReasons.push("Agent is not allowed for this memory");
    if (containsForbiddenMemoryContent(item.summary)) exclusionReasons.push("Forbidden content class");
    if (item.classification === "forbidden") exclusionReasons.push("Forbidden classification");

    if (exclusionReasons.length > 0) {
      excludedMemory.push({ memoryId: item.memoryId, reasons: exclusionReasons });
      continue;
    }

    eligible.push({
      item,
      score: scoreMemoryItem(item, input),
      reasons: [
        item.projectId === input.projectId ? "Project scope matches" : "OS/global memory is compatible",
        item.taskId === input.taskId ? "Task scope matches" : "No unrelated task binding",
        item.freshness === "fresh" ? "Memory is fresh" : `Freshness is ${item.freshness}`,
      ],
    });
  }

  eligible.sort((a, b) => b.score - a.score || a.item.memoryId.localeCompare(b.item.memoryId));
  return { eligible, excludedMemory };
}
