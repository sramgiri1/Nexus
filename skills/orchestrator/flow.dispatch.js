// skills/orchestrator/flow.dispatch.js
// Enqueue a task for a specific agent with optional dependsOn wiring.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export async function execute({ agentId, task, projectId, priority = "normal", dependsOn = [], context = {} }) {
  if (!agentId || !task) {
    return { result: "FAIL", issues: [{ severity: "error", message: "agentId and task are required" }], summary: "Missing parameters" };
  }

  const queuePath = path.join(ROOT, "memory", "task-queue.json");
  const queue     = JSON.parse(await fs.readFile(queuePath, "utf8"));

  const ORDER = { critical: 0, high: 1, normal: 2, low: 3 };
  const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const newTask = {
    id, agentId, task, projectId: projectId || null, priority, context,
    createdAt: new Date().toISOString(), status: "pending", dependsOn,
  };

  queue.queue.push(newTask);
  queue.queue.sort((a, b) => (ORDER[a.priority] ?? 2) - (ORDER[b.priority] ?? 2));
  queue.lastUpdated = new Date().toISOString();
  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));

  return {
    result: "PASS",
    issues: [],
    summary: `Dispatched ${agentId.toUpperCase()} task (${priority}) — id: ${id}`,
    data: { taskId: id },
  };
}
