// skills/orchestrator/flow.aggregate.js
// Summarize results from a completed sprint phase — outputs, status, blockers.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export async function execute({ sprint, phase, projectId } = {}) {
  const queuePath = path.join(ROOT, "memory", "task-queue.json");
  const queue     = JSON.parse(await fs.readFile(queuePath, "utf8"));

  // Filter completed tasks matching sprint/phase/project filters
  let tasks = queue.completed || [];
  if (sprint)    tasks = tasks.filter(t => t.sprint === sprint);
  if (phase)     tasks = tasks.filter(t => t.phase  === phase);
  if (projectId) tasks = tasks.filter(t => t.projectId === projectId);

  const successCount = tasks.filter(t => t.success !== false).length;
  const failCount    = tasks.filter(t => t.success === false).length;

  const byAgent = {};
  for (const t of tasks) {
    if (!byAgent[t.agentId]) byAgent[t.agentId] = { count: 0, failed: 0 };
    byAgent[t.agentId].count++;
    if (!t.success) byAgent[t.agentId].failed++;
  }

  const issues = tasks
    .filter(t => t.success === false)
    .map(t => ({ severity: "error", message: `${t.agentId.toUpperCase()} failed: ${t.error?.slice(0, 100)}` }));

  const label = [sprint && `Sprint ${sprint}`, phase && `Phase ${phase}`, projectId].filter(Boolean).join(" / ") || "all";

  return {
    result: failCount > 0 ? "FAIL" : "PASS",
    issues,
    summary: `Phase aggregate [${label}]: ${successCount} succeeded, ${failCount} failed across ${Object.keys(byAgent).length} agents`,
    data: { tasks: tasks.length, success: successCount, failed: failCount, byAgent },
  };
}
