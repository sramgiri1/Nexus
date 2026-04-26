// skills/orchestrator/flow.monitor.js
// Return real-time queue status — running, pending, blocked, failed.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();

export async function execute() {
  const queuePath  = path.join(ROOT, "memory", "task-queue.json");
  const statusPath = path.join(ROOT, "memory", "agent-status.json");

  const queue  = JSON.parse(await fs.readFile(queuePath,  "utf8"));
  const status = JSON.parse(await fs.readFile(statusPath, "utf8"));

  const running  = queue.queue.filter(t => t.status === "running");
  const pending  = queue.queue.filter(t => t.status === "pending");
  const failed   = queue.failed  || [];
  const done     = queue.completed || [];
  const completedIds = new Set(done.map(t => t.id));

  // Which pending tasks are actually runnable right now?
  const runnable = pending.filter(t =>
    !t.dependsOn?.length || t.dependsOn.every(id => completedIds.has(id))
  );

  // Blocked tasks (dependsOn not satisfied)
  const blocked  = pending.filter(t =>
    t.dependsOn?.length && !t.dependsOn.every(id => completedIds.has(id))
  );

  const blockedAgents = Object.entries(status.agents || {})
    .filter(([, a]) => a.status === "blocked")
    .map(([id, a]) => ({ id, reason: a.task?.slice(0, 80) }));

  return {
    result: blockedAgents.length > 0 || failed.length > 0 ? "FAIL" : "PASS",
    issues: [
      ...blockedAgents.map(a => ({ severity: "error",   message: `Agent ${a.id.toUpperCase()} blocked: ${a.reason}` })),
      ...failed.slice(-3).map(t => ({ severity: "error", message: `Task failed: ${t.agentId.toUpperCase()} — ${t.error?.slice(0, 80)}` })),
    ],
    summary: `Running: ${running.length} | Runnable: ${runnable.length} | Waiting: ${blocked.length} | Done: ${done.length} | Failed: ${failed.length}`,
    data: {
      running:  running.map(t => ({ id: t.id, agentId: t.agentId, startedAt: t.startedAt })),
      runnable: runnable.map(t => ({ id: t.id, agentId: t.agentId, priority: t.priority })),
      blocked:  blocked.map(t => ({ id: t.id, agentId: t.agentId, waitingOn: t.dependsOn?.length })),
      failed:   failed.slice(-5).map(t => ({ id: t.id, agentId: t.agentId, error: t.error })),
    },
  };
}
