import { buildLiveExecutionGate } from "../../../live-execution/liveExecutionGate.js";
import { ACTION_BRIDGE_CAPABILITY_MAP } from "../../../live-execution/actionBridgeAdmissionController.js";
import { buildLiveReadyActivationViewModel } from "./liveReadyActivation.js";

export const LIVE_READINESS_ROUTE_ID = "live-readiness";

function labelFromCapability(value = "") {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

export function buildLiveReadinessViewModel() {
  const gate = buildLiveExecutionGate({ mode: "live" });
  const activation = buildLiveReadyActivationViewModel();
  const capabilities = gate.data.capabilities || [];
  const bridgeRows = Object.entries(ACTION_BRIDGE_CAPABILITY_MAP).map(([actionType, capability]) => ({
    label: actionType,
    currentState: "Blocked before bridge execution",
    capability: labelFromCapability(capability),
    disabledReason: "Live bridge execution is blocked until a future runtime subphase consumes approved admission records.",
  }));

  return {
    routeId: LIVE_READINESS_ROUTE_ID,
    pageTitle: "Live Readiness",
    whatChanged: "Command Center now shows evidence-backed live-ready labels, setup gaps, policy blockers, owner capabilities, evidence, activity, and cost posture.",
    currentState: "Live readiness labels are available; runtime execution remains blocked by governed admission gates.",
    nextAction: activation.nextAction,
    ownerAgent: "WARDEN",
    ownerCapability: activation.ownerCapability,
    evidenceLocation: activation.evidenceLocation,
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, worker runtime, network execution, DB writes, deploy, package, or provider spend.",
    disabledReason: activation.disabledReason,
    labelSummary: activation.labelSummary,
    readinessCards: [
      { label: "Ready", value: String(activation.labelSummary.Ready), tone: "pass", detail: "Local, display-safe Command Center capabilities with evidence." },
      { label: "Needs setup", value: String(activation.labelSummary["Needs setup"]), tone: "amber", detail: "Capabilities with explicit setup gaps and next actions." },
      { label: "Blocked by policy", value: String(activation.labelSummary["Blocked by policy"]), tone: "disabled", detail: "Mutation, deploy, spend, or execution surfaces blocked by governance." },
      { label: "Cost", value: "No spend", tone: "pass", detail: "Budget evidence is required before future execution phases." },
    ],
    activationRows: activation.readinessRows,
    gateRows: capabilities.map((capability) => ({
      label: labelFromCapability(capability.capability),
      currentState: capability.status === "blocked" ? "Blocked by policy" : capability.status,
      disabledReason: capability.disabledReason,
      blockers: capability.blockers,
      nextAction: capability.nextAction,
      ownerCapability: capability.ownerCapability,
      evidenceLocation: capability.evidenceLocation,
      activityLocation: capability.activityLocation,
      costImpact: "No spend in this view; cost gate remains blocked.",
    })),
    bridgeRows,
    disabledActions: capabilities.slice(0, 8).map((capability) => ({
      label: labelFromCapability(capability.capability),
      reason: capability.disabledReason,
    })),
    safety: {
      executionEnabled: false,
      providerCallsAllowed: gate.data.providerCallsAllowed,
      toolExecutionAllowed: gate.data.toolExecutionAllowed,
      workerExecutionAllowed: gate.data.workerExecutionAllowed,
      projectMutationAllowed: gate.data.projectMutationAllowed,
      dbWritesAllowed: gate.data.dbWritesAllowed,
      deployExecutionAllowed: gate.data.deployExecutionAllowed,
      providerSpendAllowed: gate.data.providerSpendAllowed,
    },
  };
}

export const liveReadinessViewModel = buildLiveReadinessViewModel();
