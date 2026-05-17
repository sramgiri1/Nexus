import careloopRoadmap from "../../../project-roadmap/careloop-roadmap.json";
import careloopPhaseStatus from "../../../project-roadmap/careloop-phase-status.json";
import careloopTaskPlan from "../../../contracts/projects/careloop/phase-2-task-plan.json";
import careloopReadiness from "../../../reports/careloop-phase-2-readiness.json";

export const CARELOOP_PROJECT_ROADMAP = careloopRoadmap;
export const CARELOOP_PHASE_STATUS = careloopPhaseStatus;
export const CARELOOP_PHASE_2_TASKS = careloopTaskPlan.tasks || [];
export const CARELOOP_PHASE_2_READINESS = careloopReadiness;

export function getCareLoopPhaseMilestones() {
  return (careloopRoadmap.phases || []).map((phase) => ({
    title: `${phase.phaseId}: ${phase.title}`,
    status: phase.status === "in_progress" ? "In Progress" : phase.status === "complete" ? "Complete" : "Planned",
    tone: phase.status === "in_progress" ? "pending" : phase.status === "complete" ? "pass" : "disabled",
    summary: phase.summary || "Planned future project phase.",
  }));
}

export function summarizeCareLoopPhase2() {
  return {
    projectId: careloopPhaseStatus.projectId,
    displayName: careloopPhaseStatus.displayName,
    activePhase: careloopPhaseStatus.activePhase,
    activeMission: careloopPhaseStatus.activeMission,
    status: careloopPhaseStatus.status,
    nextAction: careloopPhaseStatus.nextAction,
    plannedTasks: careloopPhaseStatus.taskCounts?.planned || CARELOOP_PHASE_2_TASKS.length,
    readiness: CARELOOP_PHASE_2_READINESS,
  };
}
