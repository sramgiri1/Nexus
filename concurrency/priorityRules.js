export const PRIORITY_RULES = Object.freeze([
  { signal: "blocked", priority: "blocked", weight: 100, reason: "Task is blocked and should not be scheduled." },
  { signal: "urgent", priority: "urgent", weight: 90, reason: "Task is marked urgent by operator context." },
  { signal: "approval", priority: "high", weight: 70, reason: "Task is waiting on approval or release gate." },
  { signal: "highRisk", priority: "high", weight: 60, reason: "High-risk task requires visible operator attention." },
  { signal: "dependencyReady", priority: "high", weight: 55, reason: "Dependencies are ready and task can be prepared." },
  { signal: "docsOnly", priority: "normal", weight: 30, reason: "Documentation or read-only work can be queued normally." },
]);

export function inferPrioritySignals(task = {}, context = {}) {
  const state = String(task.state || task.status || "").toLowerCase();
  const risk = String(task.riskLevel || task.risk || "medium").toLowerCase();
  return {
    blocked: state.includes("blocked") || Boolean(task.blocked),
    urgent: Boolean(task.urgent || context.urgentTaskIds?.includes(task.taskId || task.id)),
    approval: state.includes("approval") || Boolean(task.pendingApproval),
    highRisk: risk === "high",
    dependencyReady: task.dependenciesReady === true || context.dependenciesReady === true,
    docsOnly: task.scope === "documentation-only" || task.capabilityId === "documentation",
  };
}
