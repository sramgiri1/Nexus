import { useMemo } from "react";
import {
  AGENT_DIRECTORY,
  PROTOTYPE_AGENT_STATUS,
  PROTOTYPE_FOUNDER_ACTIONS,
  PROTOTYPE_PORTFOLIO,
  PROTOTYPE_TASK_QUEUE,
  TEAM_META,
} from "../data/studio.js";
import { LOCAL_REPORT_SNAPSHOT } from "../data/localReports.js";
import { RUNTIME_TRAFFIC_SAMPLE } from "../data/runtimeTrafficSample.js";

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

function buildCommandCenterLocalReports(localStateSnapshot) {
  const validation = localStateSnapshot.validation || {};
  const uiMirror = validation.uiMirror || {};
  const runtimeTrafficPlane = localStateSnapshot.runtime?.runtimeTrafficPlane || {};
  const runtimeFilesSnapshot = localStateSnapshot.runtimeFiles || {};
  const runtimeFiles = runtimeFilesSnapshot.runtimeState || {};
  const demo = localStateSnapshot.demo || {};

  return {
    validation: {
      demoShowcase: uiMirror.demoShowcase || "UNKNOWN",
      publicSafety: uiMirror.publicSafety || "UNKNOWN",
      runtimeTrafficPlane: uiMirror.runtimeTrafficPlane || "UNKNOWN",
      domainOwnership: uiMirror.domainOwnership || "UNKNOWN",
      capabilities: uiMirror.capabilities || "UNKNOWN",
      reliability: uiMirror.reliability || "UNKNOWN",
      securityBoundary: uiMirror.securityBoundary || "UNKNOWN",
      dataProtection: uiMirror.dataProtection || "UNKNOWN",
      agentReadiness: uiMirror.agentReadiness || "UNKNOWN",
      agentContext: uiMirror.agentContext || "UNKNOWN",
      formatReadability: uiMirror.formatReadability || {
        status: "UNKNOWN",
        warnings: 0,
        failures: 0,
      },
      reports: validation.reports || [],
      summary: validation.summary || {},
    },
    runtimeTrafficPlane: {
      status: runtimeTrafficPlane.status || "UNKNOWN",
      identityPropagation:
        runtimeTrafficPlane.identityPropagation === "ready" ? "Ready" : "Not ready",
      policyDecisions:
        runtimeTrafficPlane.policyDecision === "ready" ? "Ready" : "Not ready",
      evidenceRecords:
        runtimeTrafficPlane.evidenceRecords === "ready" ? "Ready" : "Not ready",
      behaviorBaseline:
        runtimeTrafficPlane.behaviorBaseline === "ready" ? "Ready" : "Not ready",
      dispatchWiring:
        runtimeTrafficPlane.dispatchWiring === "not_wired"
          ? "Not wired yet"
          : "Unknown",
    },
    runtimeFiles,
    runtimeSnapshot: runtimeFilesSnapshot,
    reports: (validation.reports || []).map((report) => ({
      id: report.id,
      name: report.name,
      status: report.status,
      path: report.path,
    })),
    evidence: (demo.reports || []).map((report) => ({
      id: report.id,
      name: report.name,
      type: report.type,
      status: report.status,
      path: report.path,
    })),
    notWiredYet: [
      "No live API",
      "No DB",
      "No orchestrator dispatch wiring",
      "No real provider calls",
      "No real Xcode execution",
      "No private product execution yet",
    ],
    lastUpdatedSource:
      runtimeFilesSnapshot.source ||
      localStateSnapshot.lastUpdatedSource ||
      "local snapshot mirror",
  };
}

function buildStudioSnapshot() {
  const portfolio = PROTOTYPE_PORTFOLIO;
  const agentStatus = PROTOTYPE_AGENT_STATUS;
  const founderActions = PROTOTYPE_FOUNDER_ACTIONS;
  const taskQueue = PROTOTYPE_TASK_QUEUE;
  const projects = portfolio.projects || [];
  const agentMap = agentStatus.agents || {};
  const actionItems = founderActions.actions || [];
  const queue = (taskQueue.queue || []).map(summarizeQueueTask);
  const completed = taskQueue.completed || [];
  const failed = taskQueue.failed || [];

  const activeProject =
    projects.find((project) => project.id === portfolio.activeProject) ||
    projects.find((project) => project.stage === "operator-prototype") ||
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
  const pendingStatuses = new Set(["pending", "queued", "implementation_done", "awaiting_verification", "deferred_batch", "blocked"]);
  const pendingQueue = queue.filter((task) => pendingStatuses.has(task.status || "pending"));
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

  const activeAgents = agentEntries.filter((agent) => ["active", "working", "blocked"].includes(agent.status));
  const currentLoad = activeAgents.slice(0, 6);

  const lastUpdated = maxTimestamp([
    portfolio.lastUpdated,
    agentStatus.lastUpdated,
    founderActions.lastUpdated,
    taskQueue.lastUpdated,
  ]);

  return {
    loading: false,
    refresh: () => {},
    portfolio,
    agentStatus,
    founderActions,
    taskQueue,
    sprintPlan: portfolio.sprintPlan || null,
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
    queueDepth: queue.filter((task) => !["completed", "failed"].includes(task.status)).length,
    localReports: buildCommandCenterLocalReports(LOCAL_REPORT_SNAPSHOT),
    localStateSnapshot: LOCAL_REPORT_SNAPSHOT,
    runtimeSnapshot: LOCAL_REPORT_SNAPSHOT.runtimeFiles || {},
    runtimeTrafficSample: RUNTIME_TRAFFIC_SAMPLE,
  };
}

export function useStudioData() {
  return useMemo(() => buildStudioSnapshot(), []);
}
