import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderPrdReviewGate } from "./enterpriseFounderPrdReviewGate.js";

export const P85_FOUNDER_TASK_BOARD_ADMISSION_PHASE = "P85.4";

const BLOCKED_RUNTIME_FLAGS = Object.freeze([
  "providerCallsAllowed",
  "modelCallsAllowed",
  "agentDispatchAllowed",
  "toolExecutionAllowed",
  "workerExecutionAllowed",
  "projectCreationAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "networkCallsAllowed",
  "deployExecutionAllowed",
  "releaseExecutionAllowed",
  "exportExecutionAllowed",
  "packageCreationAllowed",
  "authSessionUserWorkspaceMutationAllowed",
  "providerSpendAllowed",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function normalizeCommand(lane = "") {
  return `npm run check:p854-task-board-admission # ${String(lane || "agent lane").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function buildTasks(agentFlow = [], reviewGate = {}) {
  const allowedForPlanning = reviewGate.downstreamPlanningAllowed === true;
  return agentFlow.map((lane, index) => ({
    taskNumber: index + 1,
    title: `${lane.lane} planning task`,
    ownerCapability: lane.ownerCapability,
    state: allowedForPlanning ? "Ready for local task planning" : "Blocked on PRD review",
    nextInput: lane.nextAction || "Review local PRD draft",
    blocker: allowedForPlanning ? "Dispatch remains disabled until a later explicit phase." : reviewGate.blockers?.[0] || "Founder PRD review is not approved.",
    validationCommand: normalizeCommand(lane.lane),
    dispatchAllowed: false,
    workerExecutionAllowed: false,
    projectMutationAllowed: false,
    costImpact: lane.costImpact || "No provider calls, worker runtime, project writes, DB writes, deploy, package creation, or provider spend.",
  }));
}

export function buildFounderTaskBoardAdmission(input = {}) {
  const qnaState = input.qnaState?.data || input.qnaState || {};
  const prdReview = input.prdReview?.data || input.prdReview || buildFounderPrdReviewGate({
    qnaState,
    founderDecision: input.founderDecision,
    versionNumber: input.versionNumber,
  }).data;
  const tasks = buildTasks(qnaState.agentFlow || [], prdReview);
  const boardReady = prdReview.downstreamPlanningAllowed === true && tasks.length > 0;
  const data = {
    schemaVersion: "1.0",
    boardState: boardReady ? "Ready for local task planning" : "Blocked on PRD review",
    taskCount: tasks.length,
    tasks,
    blockers: boardReady ? ["Dispatch, worker execution, project mutation, DB writes, deploy, package, and spend remain disabled."] : prdReview.blockers || ["Founder PRD review is not approved."],
    nextAction: boardReady ? "Route local task board to P85.5 Command Center UX review." : "Complete founder PRD review before admitting local task-board planning.",
    dispatchAllowed: false,
    executionAllowed: false,
    disabledReason:
      "P85.4 admits a local task board only. Agent dispatch, worker execution, tool execution, provider/model calls, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain disabled.",
    ownerCapability: "NEXUS Founder Task Board Admission",
    evidenceRefs: input.evidenceRefs || ["reports/p854-task-board-admission-report.md"],
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "Local planning board only. No provider/model calls, worker runtime, project writes, DB writes, deploy, package creation, network calls, or provider spend.",
    commandCenterVisible: true,
    safety: {
      localTaskBoardAllowed: true,
      ...blockedRuntimeFlags(),
    },
    ...blockedRuntimeFlags(),
  };
  return createPassResult({
    phase: P85_FOUNDER_TASK_BOARD_ADMISSION_PHASE,
    mode: "live-local",
    source: "live-ready/enterpriseFounderTaskBoardAdmission.js",
    summary: "Local agent task board planning is admitted without dispatch or execution.",
    data,
    evidence: data.evidenceRefs,
    warnings: ["P85.4 does not dispatch agents, execute workers/tools, mutate projects, write DB state, deploy, package, export, call providers, or spend."],
  });
}

export function validateFounderTaskBoardAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P85_FOUNDER_TASK_BOARD_ADMISSION_PHASE) errors.push("phase must be P85.4");
  for (const field of ["schemaVersion", "boardState", "taskCount", "tasks", "blockers", "nextAction", "dispatchAllowed", "executionAllowed", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact", "safety"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.tasks) || data.tasks.length < 4) errors.push("tasks must include multiple agent lanes");
  for (const task of data.tasks || []) {
    if (!task.title || !task.ownerCapability || !task.state || !task.nextInput || !task.blocker || !task.validationCommand) errors.push("task shape is incomplete");
    if (task.dispatchAllowed !== false || task.workerExecutionAllowed !== false || task.projectMutationAllowed !== false) errors.push(`${task.title || "task"} must remain non-executing`);
  }
  if (data.dispatchAllowed !== false || data.executionAllowed !== false) errors.push("board execution flags must be false");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
    if (data.safety?.[flag] !== false) errors.push(`safety.${flag} must be false`);
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("task board must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|create project now/i.test(serialized)) errors.push("task board must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
