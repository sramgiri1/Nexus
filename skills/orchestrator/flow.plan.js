// skills/orchestrator/flow.plan.js
// Read portfolio + queue to produce a structured execution plan for a project sprint.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export async function execute({ projectId = "careloop", sprint } = {}) {
  const portPath  = path.join(ROOT, "memory", "portfolio.json");
  const queuePath = path.join(ROOT, "memory", "task-queue.json");

  const port  = JSON.parse(await fs.readFile(portPath,  "utf8"));
  const queue = JSON.parse(await fs.readFile(queuePath, "utf8"));

  const project = port.projects.find(p => p.id === projectId);
  if (!project) return { result: "FAIL", issues: [{ severity: "error", message: `Project not found: ${projectId}` }], summary: "Unknown project" };

  const pending = queue.queue.filter(t => t.status === "pending" && (!sprint || t.sprint === sprint));
  const running = queue.queue.filter(t => t.status === "running");

  // Group pending by phase
  const byPhase = {};
  for (const t of pending) {
    const p = t.phase || 0;
    if (!byPhase[p]) byPhase[p] = [];
    byPhase[p].push({ agentId: t.agentId, priority: t.priority, taskPreview: t.task.slice(0, 80) });
  }

  const plan = Object.entries(byPhase).sort(([a], [b]) => Number(a) - Number(b)).map(([phase, tasks]) => ({
    phase: Number(phase), tasks, canRunNow: phase === String(Math.min(...Object.keys(byPhase).map(Number))),
  }));

  return {
    result: "INFO",
    issues: [],
    summary: `Sprint ${sprint || "?"} plan for ${projectId}: ${plan.length} phase(s), ${pending.length} tasks pending, ${running.length} running`,
    data: { projectId, sprint, phases: plan, gates: project.gates },
  };
}
