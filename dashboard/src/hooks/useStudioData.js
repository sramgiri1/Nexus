import { useCallback, useEffect, useMemo, useState } from "react";
import { AGENT_DIRECTORY, TEAM_META } from "../data/studio.js";
import { readMemory } from "../utils/memory.js";

const PRIORITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function maxTimestamp(values) {
  const dates = values.map(parseDate).filter(Boolean);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function computeGateProgress(gates) {
  const entries = Object.values(gates || {});
  if (!entries.length) return 0;
  const score = entries.reduce((sum, status) => {
    if (status === "done") return sum + 1;
    if (status === "partial") return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((score / entries.length) * 100);
}

function sortActions(actions) {
  return [...actions].sort((a, b) => {
    const pa = PRIORITY_ORDER[(a.priority || "").toLowerCase()] ?? 9;
    const pb = PRIORITY_ORDER[(b.priority || "").toLowerCase()] ?? 9;
    if (pa !== pb) return pa - pb;
    return (a.text || "").localeCompare(b.text || "");
  });
}

function summarizeQueueTask(task) {
  return {
    ...task,
    agentId: task.agentId || "orchestrator",
    projectId: task.projectId || null,
    label: task.skill || task.task || "Queued operation",
  };
}

export function useStudioData(intervalMs = 4000) {
  const [portfolio, setPortfolio] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [founderActions, setFounderActions] = useState(null);
  const [taskQueue, setTaskQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [nextPortfolio, nextAgentStatus, nextFounderActions, nextTaskQueue] = await Promise.all([
      readMemory("portfolio"),
      readMemory("agent-status"),
      readMemory("founder-actions"),
      readMemory("task-queue"),
    ]);

    setPortfolio(nextPortfolio);
    setAgentStatus(nextAgentStatus);
    setFounderActions(nextFounderActions);
    setTaskQueue(nextTaskQueue);
    setLoading(false);
  }, []);

  useEffect(() => {
    let live = true;

    const tick = async () => {
      if (!live) return;
      await refresh();
    };

    tick();
    const interval = setInterval(tick, intervalMs);

    return () => {
      live = false;
      clearInterval(interval);
    };
  }, [intervalMs, refresh]);

  return useMemo(() => {
    const projects = portfolio?.projects || [];
    const agentMap = agentStatus?.agents || {};
    const actionItems = founderActions?.actions || [];
    const queue = (taskQueue?.queue || []).map(summarizeQueueTask);
    const completed = taskQueue?.completed || [];
    const failed = taskQueue?.failed || [];

    const activeProject =
      projects.find((project) => project.id === portfolio?.activeProject) ||
      projects.find((project) => project.stage === "sprint") ||
      projects[0] ||
      null;

    const projectCards = projects.map((project) => ({
      ...project,
      isActive: project.id === activeProject?.id,
      progress: computeGateProgress(project.gates),
    }));

    const agentEntries = AGENT_DIRECTORY.map((agent) => {
      const live = agentMap[agent.id] || {};
      return {
        ...agent,
        status: live.status || "idle",
        task: live.task || "",
        project: live.project || null,
        progress: typeof live.progress === "number" ? live.progress : 0,
        lastRun: live.lastRun || null,
      };
    });

    const statusCounts = agentEntries.reduce(
      (acc, agent) => {
        acc[agent.status] = (acc[agent.status] || 0) + 1;
        return acc;
      },
      { active: 0, working: 0, blocked: 0, done: 0, idle: 0 }
    );

    const teamGroups = Object.values(TEAM_META).map((team) => ({
      ...team,
      agents: agentEntries.filter((agent) => agent.team === team.id),
    }));

    const openActions = sortActions(actionItems.filter((action) => !action.done));
    const closedActions = sortActions(actionItems.filter((action) => action.done));

    const pendingQueue = queue.filter((task) => task.status === "pending" || !task.status);
    const runningQueue = queue.filter((task) => task.status === "running");
    const recentCompletions = [...completed].slice(-10).reverse();

    const openFailures = failed.filter((item) => item.status !== "completed" && !item.resolvedFromFailure);
    const resolvedFailures = completed.filter((item) => item.resolvedFromFailure);

    const hotAgents = [...agentEntries].sort((a, b) => {
      const order = { blocked: 0, active: 1, working: 2, done: 3, idle: 4 };
      const ao = order[a.status] ?? 9;
      const bo = order[b.status] ?? 9;
      if (ao !== bo) return ao - bo;
      return (b.progress || 0) - (a.progress || 0);
    });

    const activeAgents = agentEntries.filter((agent) => ["active", "working"].includes(agent.status));
    const currentLoad = activeAgents.slice(0, 6);

    const lastUpdated = maxTimestamp([
      portfolio?.lastUpdated,
      agentStatus?.lastUpdated,
      founderActions?.lastUpdated,
      taskQueue?.lastUpdated,
    ]);

    return {
      loading,
      refresh,
      portfolio,
      agentStatus,
      founderActions,
      taskQueue,
      sprintPlan: portfolio?.sprintPlan || null,
      projects,
      projectCards,
      activeProject,
      agentEntries,
      teamGroups,
      statusCounts,
      actions: actionItems,
      openActions,
      closedActions,
      queue,
      pendingQueue,
      runningQueue,
      completed,
      recentCompletions,
      openFailures,
      resolvedFailures,
      hotAgents,
      currentLoad,
      lastUpdated,
      systemScore: activeProject?.score || 0,
      gateProgress: computeGateProgress(activeProject?.gates),
      openDirectiveCount: openActions.length,
      queueDepth: pendingQueue.length + runningQueue.length,
    };
  }, [agentStatus, founderActions, loading, portfolio, refresh, taskQueue]);
}
