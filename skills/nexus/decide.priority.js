// skills/nexus/decide.priority.js
// Read the task queue and return a priority recommendation based on dependencies and blockers.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export async function execute({ topN = 5 } = {}) {
  const queuePath = path.join(ROOT, "memory", "task-queue.json");
  const portPath  = path.join(ROOT, "memory", "portfolio.json");

  const queue = JSON.parse(await fs.readFile(queuePath, "utf8"));
  const port  = JSON.parse(await fs.readFile(portPath, "utf8"));

  const pending   = queue.queue.filter(t => t.status === "pending");
  const running   = queue.queue.filter(t => t.status === "running");
  const completed = new Set(queue.completed.map(t => t.id));

  const activeProject = port.projects.find(p => p.status === "active");

  // Score each task: critical=0, high=1, normal=2, low=3 + phase bonus
  const ORDER = { critical: 0, high: 1, normal: 2, low: 3 };
  const ranked = pending
    .filter(t => !t.dependsOn?.length || t.dependsOn.every(id => completed.has(id)))
    .sort((a, b) => (ORDER[a.priority] ?? 2) - (ORDER[b.priority] ?? 2))
    .slice(0, topN);

  const summary = ranked.length === 0
    ? running.length > 0
      ? `${running.length} task(s) running, nothing new to dispatch`
      : "Queue empty"
    : `Top ${ranked.length} tasks ready: ${ranked.map(t => `${t.agentId.toUpperCase()}(${t.priority})`).join(", ")}`;

  return {
    result: "INFO",
    issues: [],
    summary,
    data: {
      activeProject: activeProject?.id || null,
      ready:   ranked.map(t => ({ id: t.id, agentId: t.agentId, priority: t.priority, task: t.task.slice(0, 80) })),
      running: running.map(t => ({ id: t.id, agentId: t.agentId })),
      pendingTotal: pending.length,
      completedTotal: queue.completed.length,
    },
  };
}
