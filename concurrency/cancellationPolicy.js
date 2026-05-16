export const CANCELLATION_BLOCKED_STATES = Object.freeze([
  "committing",
  "provider_call",
  "tool_execution",
  "db_write",
  "project_mutation",
]);

export const CANCELLATION_SAFE_STATES = Object.freeze([
  "planned",
  "queued",
  "blocked",
  "awaiting_approval",
  "awaiting_verification",
]);

export function getCancellationPolicy() {
  return {
    phase: "P61.5",
    previewOnly: true,
    actualCancellationEnabled: false,
    workerTerminationAllowed: false,
    providerAbortAllowed: false,
    toolAbortAllowed: false,
    dbCleanupAllowed: false,
    projectMutationAllowed: false,
    safeStates: [...CANCELLATION_SAFE_STATES],
    blockedStates: [...CANCELLATION_BLOCKED_STATES],
  };
}
