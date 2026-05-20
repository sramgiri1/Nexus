import { createPassResult } from "../shared/resultEnvelope.js";
import { buildFounderAgentPlanAdmission } from "./founderAgentPlanAdmission.js";
import { buildFounderTaskBoardAdmission } from "./enterpriseFounderTaskBoardAdmission.js";
import { buildSecretProviderReadiness } from "./secretProviderReadiness.js";

export const P87_LOCAL_AGENT_DISPATCH_ADMISSION_PHASE = "P87.3";

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
  "providerSpendAllowed",
  "activationAllowed",
  "executionAllowed",
]);

const CONTEXT_PACKET_SHAPE = Object.freeze([
  "taskContract",
  "selectedProjectProfile",
  "scopedMemoryPacket",
  "trustedContextPacket",
  "selectedSkillOrToolContract",
  "budgetPolicyLimits",
]);

function blockedRuntimeFlags() {
  return Object.fromEntries(BLOCKED_RUNTIME_FLAGS.map((flag) => [flag, false]));
}

function normalizeLaneName(value = "") {
  return String(value || "agent-lane").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
}

function buildDispatchLane(row = {}, index = 0) {
  return {
    laneId: `local-agent-dispatch-${index + 1}-${normalizeLaneName(row.lane)}`,
    label: row.lane,
    ownerCapability: row.ownerCapability,
    objective: row.objective,
    admissionState: "ready_for_dispatch_review",
    dispatchAllowed: false,
    contextPacketShape: [...CONTEXT_PACKET_SHAPE],
    requiredBeforeDispatch: [
      "approved dispatch contract",
      "selected task contract",
      "scoped memory packet",
      "trusted context packet",
      "budget and policy limits",
      "worker execution admission",
      "project mutation admission",
      "activity evidence",
      "cost evidence",
      "rollback plan",
      "validation commands",
    ],
    blockers: ["dispatchExecutorNotEnabled", "workerExecutionAdmission", "projectMutationAdmission", ...(row.blockers || [])],
    nextAction: "Keep this lane in local planning until a later P87 subphase explicitly scopes dispatch execution.",
    disabledReason:
      "P87.3 defines local agent dispatch admission records only. It does not dispatch agents or execute workers, tools, providers, or project writes.",
    validationCommands: [
      "npm run check:p873-local-agent-dispatch-admission",
      "npm run check:os-phase-status",
      "npm run check:phase-validation-coverage",
    ],
    evidenceRefs: ["reports/p873-local-agent-dispatch-admission-report.md", ...(row.evidenceRefs || [])],
    activityLocation: row.activityLocation || "reports/os-phase-status-report.md",
    costImpact: "No provider calls, agent runtime, worker runtime, project writes, DB writes, network calls, deploy, package, or spend.",
    commandCenterVisible: true,
    ...blockedRuntimeFlags(),
  };
}

function summarizeLanes(lanes) {
  return lanes.reduce((acc, lane) => {
    acc[lane.admissionState] = (acc[lane.admissionState] || 0) + 1;
    return acc;
  }, {});
}

export function buildLocalAgentDispatchAdmission(input = {}) {
  const agentPlan = input.agentPlan || buildFounderAgentPlanAdmission(input);
  const taskBoard = input.taskBoard || buildFounderTaskBoardAdmission(input);
  const secretProviderReadiness = input.secretProviderReadiness || buildSecretProviderReadiness(input);
  const lanes = (agentPlan.data?.agentPlan || []).map(buildDispatchLane);

  return createPassResult({
    phase: P87_LOCAL_AGENT_DISPATCH_ADMISSION_PHASE,
    mode: "live-activation-contract",
    source: "live-ready/localAgentDispatchAdmission.js",
    summary: "Local agent dispatch admission records are available; no agents are dispatched.",
    data: {
      schemaVersion: "1.0",
      currentState: "local_agent_dispatch_admission_ready",
      readinessLabel: "Dispatch review only",
      dispatchLaneCount: lanes.length,
      dispatchSummary: summarizeLanes(lanes),
      lanes,
      contextPacketShape: [...CONTEXT_PACKET_SHAPE],
      taskBoardPhase: taskBoard.phase,
      secretProviderReadinessPhase: secretProviderReadiness.phase,
      nextAction: "Implement P87.4 generated project workspace admission without project source mutation.",
      blockers: ["dispatchExecutorNotEnabled", "workerExecutionAdmission", "projectMutationAdmission", "perLaneOperatorApproval"],
      disabledReason:
        "P87.3 is local dispatch admission metadata only. Provider/model calls, agent dispatch, tool execution, worker execution, project creation, project mutation, DB writes, network calls, deploy, release, export, package creation, and provider spend remain blocked.",
      ownerCapability: "NEXUS Agent Dispatch Governance",
      evidenceRefs: ["reports/p873-local-agent-dispatch-admission-report.md", "reports/p872-secret-provider-readiness-report.md"],
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No provider calls, agent runtime, worker runtime, project writes, DB writes, network calls, deploy, package, or spend.",
      commandCenterVisible: true,
      ...blockedRuntimeFlags(),
    },
    evidence: [
      "reports/p873-local-agent-dispatch-admission-report.md",
      "contracts/os-roadmap/p87-execution-contracts.json",
    ],
    warnings: ["P87.3 does not dispatch agents, start workers, execute tools, mutate projects, call providers, or spend."],
  });
}

export function validateLocalAgentDispatchAdmission(envelope = {}) {
  const errors = [];
  const data = envelope.data || {};
  if (envelope.phase !== P87_LOCAL_AGENT_DISPATCH_ADMISSION_PHASE) errors.push("phase must be P87.3");
  for (const field of ["schemaVersion", "currentState", "readinessLabel", "dispatchLaneCount", "dispatchSummary", "lanes", "contextPacketShape", "nextAction", "blockers", "disabledReason", "ownerCapability", "evidenceRefs", "activityLocation", "costImpact"]) {
    if (!(field in data)) errors.push(`${field} missing`);
  }
  if (!Array.isArray(data.lanes) || data.lanes.length !== 8) errors.push("lanes must cover 8 local agent workstreams");
  if (!Array.isArray(data.contextPacketShape) || data.contextPacketShape.length !== CONTEXT_PACKET_SHAPE.length) errors.push("contextPacketShape must stay scoped");
  for (const flag of BLOCKED_RUNTIME_FLAGS) {
    if (data[flag] !== false) errors.push(`${flag} must be false`);
  }
  for (const lane of data.lanes || []) {
    for (const field of ["laneId", "label", "ownerCapability", "objective", "admissionState", "dispatchAllowed", "contextPacketShape", "requiredBeforeDispatch", "blockers", "nextAction", "disabledReason", "validationCommands", "evidenceRefs", "activityLocation", "costImpact"]) {
      if (!(field in lane)) errors.push(`${lane.label || "lane"}.${field} missing`);
    }
    if (lane.dispatchAllowed !== false) errors.push(`${lane.label}.dispatchAllowed must be false`);
    if (!Array.isArray(lane.contextPacketShape) || lane.contextPacketShape.length !== CONTEXT_PACKET_SHAPE.length) errors.push(`${lane.label}.contextPacketShape must stay scoped`);
    for (const flag of BLOCKED_RUNTIME_FLAGS) {
      if (lane[flag] !== false) errors.push(`${lane.label}.${flag} must be false`);
    }
  }
  const serialized = JSON.stringify(data);
  if (/(?:project|private|token|tenant|workspace|founder)_[A-Za-z0-9_-]*\d[A-Za-z0-9_-]*/.test(serialized)) errors.push("local agent dispatch admission must not expose raw private IDs");
  if (/dispatch agent now|run worker now|write project now|deploy now|spend now|call provider now|create project now/i.test(serialized)) errors.push("local agent dispatch admission must not expose fake unsafe runnable actions");
  return { valid: errors.length === 0, errors };
}
