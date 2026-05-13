export const CAPABILITY_READINESS = {
  missionComposer: {
    status: "ready",
    userFacingState: "Available",
    description: "Mission planning is available.",
  },
  missionActionBridge: {
    status: "ready",
    userFacingState: "Available",
    description: "Governed mission actions are available.",
  },
  taskActivation: {
    status: "ready",
    userFacingState: "Available",
    description: "Planned tasks can be activated into runtime.",
  },
  agentWorkbench: {
    status: "ready",
    userFacingState: "Available",
    description: "Activated tasks can be inspected and reviewed.",
  },
  humanReview: {
    status: "ready",
    userFacingState: "Available",
    description: "Human review decisions can be captured.",
  },
  controlledImplementation: {
    status: "ready_scoped",
    userFacingState: "Available for scoped implementation",
    description: "Documentation-only controlled implementation is available.",
  },
  controlledValidation: {
    status: "not_enabled",
    userFacingState: "Requires controlled validation bridge",
    description: "Controlled validation can be inspected, but a generic UI gate runner is not enabled yet.",
  },
  liveLocalApi: {
    status: "ready",
    userFacingState: "Available",
    description: "Local API read endpoints are available.",
  },
  dbFoundation: {
    status: "ready_read_only",
    userFacingState: "Durable State foundation ready; DB writes disabled",
    description: "DB schema and read model exist. Runtime remains file-backed.",
  },
  dbWrites: {
    status: "not_enabled",
    userFacingState: "DB writes not enabled",
    description: "DB writes are intentionally disabled.",
  },
  workerRuntime: {
    status: "not_enabled",
    userFacingState: "Requires worker runtime",
    description: "Background execution is not enabled yet.",
  },
  providerDispatch: {
    status: "not_enabled",
    userFacingState: "Requires governed provider dispatch",
    description: "Provider/tool dispatch is not enabled yet.",
  },
  iosRunner: {
    status: "not_enabled",
    userFacingState: "Requires iOS/Xcode runner",
    description: "iOS validation runner is not enabled yet.",
  },
  releaseActionBridge: {
    status: "not_enabled",
    userFacingState: "Requires release action bridge",
    description: "Release/deploy actions are not enabled yet.",
  },
  runtimeLocks: {
    status: "not_enabled",
    userFacingState: "Requires runtime lock controls",
    description: "Freeze and lock controls are not enabled yet.",
  },
  commandPalette: {
    status: "ready",
    userFacingState: "Available",
    description: "Simple command palette summaries are available in Command Center.",
  },
  operatorActions: {
    status: "ready_limited",
    userFacingState: "Available as read-only summaries",
    description: "Operator actions can preview governed intent, but execution stays limited to existing safe routes.",
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
  return cap
    ? ["ready", "ready_read_only", "ready_scoped", "ready_limited"].includes(cap.status)
    : false;
}
