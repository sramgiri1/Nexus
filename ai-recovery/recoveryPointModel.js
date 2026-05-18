export const RECOVERY_POINT_STATES = Object.freeze([
  "inspect_only",
  "resume_plan_available",
  "blocked",
  "stale",
  "superseded",
  "not_recoverable",
]);

export const RECOVERY_RESUMABILITY = Object.freeze([
  "inspect_only",
  "resume_plan_available",
  "not_recoverable",
]);

export const RECOVERY_STATE_LABELS = Object.freeze({
  inspect_only: "Inspect only",
  resume_plan_available: "Resume plan available",
  blocked: "Blocked",
  stale: "Stale",
  superseded: "Superseded",
  not_recoverable: "Not recoverable",
});

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map(normalizeString).filter(Boolean) : [];
}

export function buildRecoveryPoint(input = {}) {
  const state = RECOVERY_POINT_STATES.includes(input.state) ? input.state : "inspect_only";
  const resumability = RECOVERY_RESUMABILITY.includes(input.resumability)
    ? input.resumability
    : state === "resume_plan_available"
      ? "resume_plan_available"
      : state === "not_recoverable"
        ? "not_recoverable"
        : "inspect_only";

  return {
    recoveryPointId:
      normalizeString(input.recoveryPointId)
      || `recovery_${normalizeString(input.snapshotId) || "snapshot_preview"}`,
    snapshotId: normalizeString(input.snapshotId),
    displayTitle: normalizeString(input.displayTitle) || "Recovery point",
    state,
    stateLabel: RECOVERY_STATE_LABELS[state],
    parentRecoveryPointId: normalizeString(input.parentRecoveryPointId),
    supersedesRecoveryPointId: normalizeString(input.supersedesRecoveryPointId),
    resumability,
    blockedReasons: normalizeArray(input.blockedReasons),
    nextSafeActionLabel:
      normalizeString(input.nextSafeActionLabel)
      || (state === "resume_plan_available" ? "Review resume plan preview." : "Inspect recovery point."),
    previewOnly: true,
    executionEnabled: false,
    restoreEnabled: false,
    replayEnabled: false,
    resumeEnabled: false,
    createdAt: normalizeString(input.createdAt) || new Date().toISOString(),
  };
}

export function validateRecoveryPoint(point = {}) {
  const errors = [];
  const warnings = [];

  for (const field of [
    "recoveryPointId",
    "snapshotId",
    "displayTitle",
    "state",
    "stateLabel",
    "resumability",
    "nextSafeActionLabel",
    "createdAt",
  ]) {
    if (!normalizeString(point[field])) errors.push(`missing_${field}`);
  }

  if (!RECOVERY_POINT_STATES.includes(point.state)) errors.push("invalid_state");
  if (!RECOVERY_RESUMABILITY.includes(point.resumability)) errors.push("invalid_resumability");
  if (point.stateLabel !== RECOVERY_STATE_LABELS[point.state]) errors.push("invalid_state_label");

  if (point.previewOnly !== true) errors.push("preview_only_required");
  if (point.executionEnabled !== false) errors.push("execution_must_remain_disabled");
  if (point.restoreEnabled !== false) errors.push("restore_must_remain_disabled");
  if (point.replayEnabled !== false) errors.push("replay_must_remain_disabled");
  if (point.resumeEnabled !== false) errors.push("resume_must_remain_disabled");

  if (["blocked", "stale", "not_recoverable"].includes(point.state) && point.blockedReasons.length === 0) {
    errors.push("blocked_reason_required");
  }

  if (point.state === "superseded" && !point.supersedesRecoveryPointId) {
    errors.push("supersession_link_required");
  }

  if (point.state === "resume_plan_available" && point.resumability !== "resume_plan_available") {
    errors.push("resume_state_requires_resume_plan");
  }

  if (!point.parentRecoveryPointId) warnings.push("missing_parent_recovery_point");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildRecoveryChain(points = []) {
  return points.map(buildRecoveryPoint).map((point, index, allPoints) => ({
    ...point,
    parentRecoveryPointId: point.parentRecoveryPointId || allPoints[index - 1]?.recoveryPointId || "",
  }));
}
