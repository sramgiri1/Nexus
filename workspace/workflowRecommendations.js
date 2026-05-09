/**
 * workflowRecommendations.js
 * NEXUS Agentic Workspace
 *
 * Derives next-best action and recommended workflows from current OS context.
 * No execution. No provider calls. No mutations. Read-only recommendation logic.
 * Uses capability-based language — phase numbers are OS Roadmap metadata only.
 */

import { getWorkflowTemplates } from "./workflowTemplates.js";

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

export function recommendWorkflows(context = {}) {
  const status = buildWorkspaceStatus(context);
  const templates = getWorkflowTemplates();

  return templates
    .filter((t) => t.recommendedForCurrentMission)
    .map((t) => {
      let contextualEnabled = t.enabledNow;
      let contextualRequirement = t.userFacingRequirement;

      if (t.id === "govern-agent-work") {
        contextualEnabled = true;
        contextualRequirement = "";
      }

      if (t.id === "validate-backend" && !status.backendValidated) {
        contextualRequirement = "Backend not yet validated — run controlled backend validation.";
      }

      return { ...t, enabledNow: contextualEnabled, userFacingRequirement: contextualRequirement };
    })
    .sort((a, b) => {
      if (a.enabledNow !== b.enabledNow) return a.enabledNow ? -1 : 1;
      const riskOrder = { low: 0, medium: 1, high: 2 };
      return (riskOrder[a.riskLevel] ?? 1) - (riskOrder[b.riskLevel] ?? 1);
    });
}

export function getNextBestAction(context = {}) {
  const status = buildWorkspaceStatus(context);

  if (!status.missionReady) {
    return {
      title: "Generate Mission Plan",
      description: "Use the Mission Composer to define your mission. NEXUS will generate a governed 6-task plan.",
      workflowId: "build-product",
      enabled: true,
      userFacingRequirement: "",
      requiredCapability: "missionComposer",
      targetPhase: "P37",
    };
  }

  if (status.missionReady && status.planReady && !status.tasksActivated) {
    return {
      title: "Activate First Mission Task",
      description: "Mission plan is ready. Activate the first task to move it from planned to queued state in the runtime.",
      workflowId: "govern-agent-work",
      enabled: true,
      userFacingRequirement: "",
      requiredCapability: "taskActivation",
      targetPhase: "P37",
    };
  }

  if (status.tasksActivated && !status.backendValidated) {
    return {
      title: "Validate Backend",
      description: "Run controlled backend validation to confirm tests pass before the implementation workflow.",
      workflowId: "validate-backend",
      enabled: true,
      userFacingRequirement: "Uses controlled runner and evidence capture.",
      requiredCapability: "taskActivation",
      targetPhase: "P37",
    };
  }

  if (status.prdGapsExist) {
    return {
      title: "Plan Next Sprint",
      description: "PRD gaps exist. Convert open gaps into a governed sprint plan with agents, gates, and evidence requirements.",
      workflowId: "plan-sprint",
      enabled: true,
      userFacingRequirement: "",
      requiredCapability: "taskActivation",
      targetPhase: "P37",
    };
  }

  return {
    title: "Govern Agent Work",
    description: "Inspect active tasks, agent states, evidence, and governance posture from the Command Center.",
    workflowId: "govern-agent-work",
    enabled: true,
    userFacingRequirement: "",
    requiredCapability: "agentWorkbench",
    targetPhase: "P36",
  };
}

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
      "Broad autonomous build requires worker runtime and provider dispatch.",
      "Release review requires release action bridge.",
      "iOS validation requires iOS/Xcode runner.",
      "DB writes not enabled — DB foundation is read-only (file-backed).",
    ],
  };
}
