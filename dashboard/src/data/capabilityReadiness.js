/**
 * capabilityReadiness.js — P41-LOCAL
 * Derives operator-facing capability state from completed phases.
 * Phase numbers stay in OS Roadmap data. Primary UX uses capability labels.
 */

export const CAPABILITY_READINESS = {
  missionComposer: {
    status: "ready",
    label: "Mission composer ready",
    userFacingState: "Available",
  },
  missionActionBridge: {
    status: "ready",
    label: "Mission action bridge ready",
    userFacingState: "Available",
  },
  taskActivation: {
    status: "ready",
    label: "Task activation ready",
    userFacingState: "Available",
  },
  agentWorkbench: {
    status: "ready",
    label: "Agent workbench ready",
    userFacingState: "Available",
  },
  humanReview: {
    status: "ready",
    label: "Human review loop ready",
    userFacingState: "Available",
  },
  controlledImplementation: {
    status: "ready",
    label: "Controlled implementation ready",
    userFacingState: "Available for scoped implementation",
  },
  liveLocalApi: {
    status: "ready",
    label: "Live local API ready",
    userFacingState: "Available",
  },
  dbFoundation: {
    status: "ready_read_only",
    label: "DB foundation ready",
    userFacingState: "DB foundation ready; DB writes disabled",
  },
  dbWrites: {
    status: "not_enabled",
    label: "DB writes not enabled",
    userFacingState: "DB writes not enabled",
  },
  workerRuntime: {
    status: "not_enabled",
    label: "Worker runtime not enabled",
    userFacingState: "Requires worker runtime",
  },
  providerDispatch: {
    status: "not_enabled",
    label: "Provider dispatch not enabled",
    userFacingState: "Requires governed provider dispatch",
  },
  iosRunner: {
    status: "not_enabled",
    label: "iOS/Xcode runner not enabled",
    userFacingState: "Requires iOS/Xcode runner",
  },
  releaseActionBridge: {
    status: "not_enabled",
    label: "Release action bridge not enabled",
    userFacingState: "Requires release action bridge",
  },
};

export function getCapabilityReadiness() {
  return CAPABILITY_READINESS;
}

export function getCapabilityState(capabilityId) {
  return CAPABILITY_READINESS[capabilityId] || null;
}

export function isCapabilityReady(capabilityId) {
  const cap = CAPABILITY_READINESS[capabilityId];
  return cap ? cap.status === "ready" || cap.status === "ready_read_only" : false;
}
