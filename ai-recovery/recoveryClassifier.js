import { buildRecoveryPoint } from "./recoveryPointModel.js";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function classifyRecoveryPoint(input = {}) {
  const snapshot = input.snapshot || {};
  const blockedReasons = Array.isArray(input.blockedReasons) ? input.blockedReasons : [];
  const supersededBy = normalizeString(input.supersededBy);

  if (supersededBy) {
    return buildRecoveryPoint({
      ...input,
      snapshotId: snapshot.snapshotId || input.snapshotId,
      displayTitle: input.displayTitle || snapshot.displayTitle,
      state: "superseded",
      resumability: "inspect_only",
      supersedesRecoveryPointId: supersededBy,
      nextSafeActionLabel: "Inspect the newer recovery point.",
    });
  }

  if (input.stale === true) {
    return buildRecoveryPoint({
      ...input,
      snapshotId: snapshot.snapshotId || input.snapshotId,
      displayTitle: input.displayTitle || snapshot.displayTitle,
      state: "stale",
      resumability: "inspect_only",
      blockedReasons: blockedReasons.length ? blockedReasons : ["Snapshot context is stale."],
      nextSafeActionLabel: "Inspect stale context before planning any resume.",
    });
  }

  if (input.blocked === true || blockedReasons.length > 0) {
    return buildRecoveryPoint({
      ...input,
      snapshotId: snapshot.snapshotId || input.snapshotId,
      displayTitle: input.displayTitle || snapshot.displayTitle,
      state: "blocked",
      resumability: "inspect_only",
      blockedReasons: blockedReasons.length ? blockedReasons : ["Recovery is blocked by policy."],
      nextSafeActionLabel: "Review blocked reasons.",
    });
  }

  if (snapshot.recoveryEligibility === "resume_plan_available") {
    return buildRecoveryPoint({
      ...input,
      snapshotId: snapshot.snapshotId || input.snapshotId,
      displayTitle: input.displayTitle || snapshot.displayTitle,
      state: "resume_plan_available",
      resumability: "resume_plan_available",
      nextSafeActionLabel: "Review resume plan preview.",
    });
  }

  if (snapshot.recoveryEligibility === "not_recoverable") {
    return buildRecoveryPoint({
      ...input,
      snapshotId: snapshot.snapshotId || input.snapshotId,
      displayTitle: input.displayTitle || snapshot.displayTitle,
      state: "not_recoverable",
      resumability: "not_recoverable",
      blockedReasons: blockedReasons.length ? blockedReasons : ["Snapshot is not recoverable."],
      nextSafeActionLabel: "Inspect record and start a new governed task.",
    });
  }

  return buildRecoveryPoint({
    ...input,
    snapshotId: snapshot.snapshotId || input.snapshotId,
    displayTitle: input.displayTitle || snapshot.displayTitle,
    state: "inspect_only",
    resumability: "inspect_only",
    nextSafeActionLabel: "Inspect recovery point.",
  });
}

export function classifyRecoveryPoints(inputs = []) {
  return inputs.map((input) => classifyRecoveryPoint(input));
}
