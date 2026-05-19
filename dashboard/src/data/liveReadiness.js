import { buildLiveExecutionGate } from "../../../live-execution/liveExecutionGate.js";
import { ACTION_BRIDGE_CAPABILITY_MAP } from "../../../live-execution/actionBridgeAdmissionController.js";

export const LIVE_READINESS_ROUTE_ID = "live-readiness";

function labelFromCapability(value = "") {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

export function buildLiveReadinessViewModel() {
  const gate = buildLiveExecutionGate({ mode: "live" });
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
    whatChanged: "Command Center now shows live execution gates, bridge admission posture, blockers, evidence locations, and cost impact.",
    currentState: "Live mode is recognized, but runtime execution remains blocked by capability gates.",
    nextAction: "Complete live Command Center UX validation, then aggregate tests and final readiness before any runtime-enabling phase.",
    ownerAgent: "WARDEN",
    ownerCapability: "NEXUS OS Live Runtime Governance",
    evidenceLocation: "reports/live-readiness-ux-report.md",
    activityLocation: "reports/os-phase-status-report.md",
    costImpact: "No provider calls, worker runtime, network execution, DB writes, deploy, package, or provider spend.",
    disabledReason: "Live readiness is display-only. Founder intake runtime, autonomous Q&A, PRD generation execution, agent dispatch, self-healing apply, provider calls, tool execution, worker execution, project mutation, DB writes, network calls, deploy, release, export, package creation, auth/session/user/workspace mutation, and provider spend remain disabled.",
    readinessCards: [
      { label: "Live mode", value: "Recognized", tone: "pass", detail: "Mode guard accepts live as a governed policy state." },
      { label: "Execution", value: "Blocked", tone: "disabled", detail: "Admission records are not consumed by a runtime executor." },
      { label: "Bridge", value: "Gated", tone: "amber", detail: "Live bridge routes stop before local action handlers." },
      { label: "Cost", value: "No spend", tone: "pass", detail: "Budget evidence is required before future execution phases." },
    ],
    gateRows: capabilities.map((capability) => ({
      label: labelFromCapability(capability.capability),
      currentState: capability.status === "blocked" ? "Blocked" : capability.status,
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
