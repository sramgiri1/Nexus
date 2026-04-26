// skills/nexus/read.system_state.js
// Return consolidated snapshot of all memory files — portfolio, agents, queue.

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const mem  = (f) => path.join(ROOT, "memory", f);

export async function execute() {
  const [portfolio, agentStatus, queue] = await Promise.all([
    fs.readFile(mem("portfolio.json"),    "utf8").then(JSON.parse).catch(() => null),
    fs.readFile(mem("agent-status.json"), "utf8").then(JSON.parse).catch(() => null),
    fs.readFile(mem("task-queue.json"),   "utf8").then(JSON.parse).catch(() => null),
  ]);

  const activeProject = portfolio?.projects?.find(p => p.status === "active");
  const agents        = agentStatus?.agents || {};
  const working       = Object.entries(agents).filter(([, a]) => a.status === "working").map(([id]) => id);
  const blocked       = Object.entries(agents).filter(([, a]) => a.status === "blocked").map(([id]) => id);

  const pending   = queue?.queue?.filter(t => t.status === "pending")  || [];
  const running   = queue?.queue?.filter(t => t.status === "running")  || [];
  const completed = queue?.completed?.length || 0;
  const failed    = queue?.failed?.length    || 0;

  return {
    result: blocked.length > 0 ? "FAIL" : "PASS",
    issues: blocked.map(id => ({ severity: "error", message: `Agent ${id.toUpperCase()} is blocked: ${agents[id].task?.slice(0, 100)}` })),
    summary: `Active: ${activeProject?.id || "none"} | Agents working: ${working.length} blocked: ${blocked.length} | Queue: ${running.length} running, ${pending.length} pending, ${completed} done, ${failed} failed`,
    data: {
      activeProject: activeProject?.id,
      gates: activeProject?.gates,
      agentsSummary: Object.fromEntries(Object.entries(agents).map(([id, a]) => [id, { status: a.status, progress: a.progress }])),
      queue: { running: running.length, pending: pending.length, completed, failed },
    },
  };
}
