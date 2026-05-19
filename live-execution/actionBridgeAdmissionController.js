import { buildLiveCommandAdmission } from "../command-interface/liveCommandAdmission.js";
import { createBlockedResult, createPassResult } from "../shared/resultEnvelope.js";

export const LIVE_ACTION_BRIDGE_PHASE = "P79.3";

export const ACTION_BRIDGE_CAPABILITY_MAP = {
  "mission.compose": "prdGeneration",
  "task.activate": "agentDispatch",
  "task.review": "workerExecution",
  "implementation.propose": "workerExecution",
  "implementation.apply": "projectMutation",
};

function pickIntentShape(body = {}) {
  return {
    missionText: body.missionText || "",
    planTaskId: body.planTaskId ? "selected-plan-task" : "",
    runtimeTaskId: body.runtimeTaskId ? "selected-runtime-task" : "",
    decision: body.decision || "",
    implementationType: body.implementationType || "",
  };
}

export function admitLiveActionBridgeRequest(input = {}) {
  const mode = input.mode || "unknown";
  const actionType = input.actionType || "";
  const capability = input.capability || ACTION_BRIDGE_CAPABILITY_MAP[actionType] || "";
  const liveMode = mode === "live";
  if (!liveMode) {
    return createPassResult({
      phase: LIVE_ACTION_BRIDGE_PHASE,
      mode,
      source: "live-execution/actionBridgeAdmissionController.js",
      summary: "Non-live bridge request may continue through the existing local bridge policy.",
      data: {
        actionType,
        capability,
        bridgeExecutionAllowed: true,
        liveAdmissionRequired: false,
        providerCallsAllowed: false,
        toolExecutionAllowed: false,
        workerExecutionAllowed: false,
        projectMutationAllowed: false,
        dbWritesAllowed: false,
        deployExecutionAllowed: false,
        providerSpendAllowed: false,
      },
      evidence: ["reports/p793-action-bridge-admission-report.md"],
    });
  }

  const admission = buildLiveCommandAdmission({
    mode,
    capability,
    intent: pickIntentShape(input.body || {}),
    approval: input.approval || {},
  });

  return createBlockedResult({
    phase: LIVE_ACTION_BRIDGE_PHASE,
    mode,
    source: "live-execution/actionBridgeAdmissionController.js",
    summary: "Live action bridge request is blocked before local bridge execution.",
    data: {
      actionType,
      capability,
      admission: admission.data,
      bridgeExecutionAllowed: false,
      liveAdmissionRequired: true,
      disabledReason: "P79.3 blocks live action bridge execution until a later runtime subphase explicitly enables execution consumption.",
      nextAction: admission.data?.nextAction || "Complete missing live admission evidence.",
      blockers: admission.data?.blockers || [],
      ownerCapability: admission.data?.ownerCapability || "NEXUS OS Runtime Governance",
      evidenceLocation: "reports/p793-action-bridge-admission-report.md",
      activityLocation: "reports/os-phase-status-report.md",
      costImpact: "No spend in P79.3; bridge execution is blocked.",
      providerCallsAllowed: false,
      toolExecutionAllowed: false,
      workerExecutionAllowed: false,
      projectMutationAllowed: false,
      dbWritesAllowed: false,
      deployExecutionAllowed: false,
      providerSpendAllowed: false,
    },
    warnings: ["Admission is not execution. Live bridge execution remains blocked."],
    evidence: ["reports/p793-action-bridge-admission-report.md", "reports/os-phase-status-report.md"],
  });
}
