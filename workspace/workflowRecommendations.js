/**
 * workflowRecommendations.js
 * NEXUS Agentic Workspace — P36-LOCAL
 *
 * Derives next-best action and recommended workflows from current OS context.
 * No execution. No provider calls. No mutations. Read-only recommendation logic.
 */

import { getWorkflowTemplates } from "./workflowTemplates.js";

/**
 * Build workspace status from context.
 * @param {object} context
 * @returns {object}
 */
function buildWorkspaceStatus(context = {}) {
  const missionReady = !!(context.missionExists);
  const planReady = !!(context.taskPlanExists && context.taskCount > 0);
  const tasksActivated = !!(context.activatedTaskCount > 0);
  const backendValidated = context.backendTestsPassed === context.backendTestsTotal && context.backendTestsTotal > 0;
  const prdGapsExist = Array.isArray(context.prdGaps) && context.prdGaps.length > 0;

  return {
    missionReady,
    planReady,
    tasksActivated,
    backendValidated,
    tests: `${context.backendTestsPassed ?? 58}/${context.backendTestsTotal ?? 58} ${backendValidated ? "PASS" : "PENDING"}`,
    readyForTaskActivation: missionReady && planReady && !tasksActivated,
    prdGapsExist,
  };
}

/**
 * Determine which workflows are recommended given context.
 * @param {object} context
 * @returns {object[]} recommended templates (with contextual enabledNow override)
 */
export function recommendWorkflows(context = {}) {
  const status = buildWorkspaceStatus(context);
  const templates = getWorkflowTemplates();

  return templates
    .filter((t) => t.recommendedForCurrentMission)
    .map((t) => {
      let contextualEnabled = t.enabledNow;
      let contextualReason = t.disabledReason;

      // govern-agent-work is always available as a navigation action
      if (t.id === "govern-agent-work") {
        contextualEnabled = true;
        contextualReason = "";
      }

      // validate-backend: available if backend is not yet validated
      if (t.id === "validate-backend" && !status.backendValidated) {
        contextualReason = "Backend not yet validated — run controlled backend validation";
      }

      return { ...t, enabledNow: contextualEnabled, disabledReason: contextualReason };
    })
    .sort((a, b) => {
      // Enabled first, then by risk (low → high)
      if (a.enabledNow !== b.enabledNow) return a.enabledNow ? -1 : 1;
      const riskOrder = { low: 0, medium: 1, high: 2 };
      return (riskOrder[a.riskLevel] ?? 1) - (riskOrder[b.riskLevel] ?? 1);
    });
}

/**
 * Compute the single next-best action for the operator.
 * @param {object} context
 * @returns {object}
 */
export function getNextBestAction(context = {}) {
  const status = buildWorkspaceStatus(context);

  if (!status.missionReady) {
    return {
      title: "Generate Mission Plan",
      description: "Use the Mission Composer to define your mission. NEXUS will generate a governed 6-task plan.",
      workflowId: "build-product",
      enabled: true,
      disabledReason: "",
      targetPhase: "P35",
    };
  }

  if (status.missionReady && status.planReady && !status.tasksActivated) {
    return {
      title: "Activate First Mission Task",
      description: "Mission plan is ready. Activate the first task to move from planned to queued state in the runtime.",
      workflowId: "govern-agent-work",
      enabled: false,
      disabledReason: "Requires P37 task activation bridge",
      targetPhase: "P37",
    };
  }

  if (status.tasksActivated && !status.backendValidated) {
    return {
      title: "Validate Backend",
      description: "Run controlled backend validation to confirm tests pass before the implementation workflow.",
      workflowId: "validate-backend",
      enabled: false,
      disabledReason: "Requires backend validation action bridge",
      targetPhase: "P37",
    };
  }

  if (status.prdGapsExist) {
    return {
      title: "Plan Next Sprint",
      description: "PRD gaps exist. Convert open gaps into a governed sprint plan with agents, gates, and evidence requirements.",
      workflowId: "plan-sprint",
      enabled: false,
      disabledReason: "Requires task activation bridge",
      targetPhase: "P37",
    };
  }

  return {
    title: "Govern Agent Work",
    description: "Inspect active tasks, agent states, evidence, and governance posture from the Command Center.",
    workflowId: "govern-agent-work",
    enabled: true,
    disabledReason: "",
    targetPhase: "P36",
  };
}

/**
 * Build the complete workspace summary for the Command Center view model.
 * @param {object} context
 * @returns {object}
 */
export function buildWorkspaceSummary(context = {}) {
  const status = buildWorkspaceStatus(context);
  const recommendedWorkflows = recommendWorkflows(context);
  const nextBestAction = getNextBestAction(context);
  const allTemplates = getWorkflowTemplates();

  return {
    workspaceVersion: "1.0",
    activeMode: context.mode || "local-private",
    activeProject: context.activeProject || "Private Project",
    activeMission: {
      id: context.missionId || "private-project-governed-build-mission",
      exists: status.missionReady,
      planReady: status.planReady,
      taskCount: context.taskCount || 0,
    },
    recommendedWorkflows,
    workflowTemplates: allTemplates,
    nextBestAction,
    workspaceStatus: status,
    currentLimitations: [
      "Workflow execution not available in P36 — arrives in P37 (task activation bridge)",
      "Task activation requires P37 task activation bridge",
      "Agent dispatch requires P39 implementation workflow bridge",
      "Live API backend requires P40",
      "DB-backed state requires P41",
    ],
  };
}
