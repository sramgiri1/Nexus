import {
  LOCK_SCOPES,
  LOCK_STATUSES,
  requirePreviewOnly,
  stablePreviewId,
  toIsoString,
  validateEnum,
} from "./concurrencySchema.js";

export function createLockProposal(input = {}) {
  const scope = input.scope || "path";
  const lock = {
    lockId: input.lockId || stablePreviewId("lock_preview", [
      scope,
      input.projectId,
      input.repoId,
      input.pathPattern,
      input.taskId,
      input.agentId,
      input.capabilityId,
    ]),
    scope,
    projectId: input.projectId || "private-project",
    repoId: input.repoId || "local-repo",
    pathPattern: input.pathPattern || "",
    taskId: input.taskId || "",
    agentId: input.agentId || "",
    capabilityId: input.capabilityId || "",
    status: input.status || "proposed",
    reason: input.reason || "Preview lock proposal for future concurrent execution governance.",
    createdAt: toIsoString(input.createdAt),
    expiresAt: toIsoString(input.expiresAt || Date.now() + 15 * 60 * 1000),
    previewOnly: true,
    redacted: true,
  };
  return lock;
}

export function validateLockRecord(lock = {}) {
  const errors = [];
  if (!lock.lockId) errors.push("lockId is required");
  validateEnum(lock.scope, LOCK_SCOPES, "scope", errors);
  validateEnum(lock.status, LOCK_STATUSES, "status", errors);
  if (!lock.projectId && ["project", "repo", "path"].includes(lock.scope)) {
    errors.push("projectId is required for project/repo/path locks");
  }
  if (lock.scope === "path" && !lock.pathPattern) errors.push("pathPattern is required for path locks");
  if (lock.scope === "agent" && !lock.agentId) errors.push("agentId is required for agent locks");
  if (lock.scope === "capability" && !lock.capabilityId) errors.push("capabilityId is required for capability locks");
  if (lock.redacted !== true) errors.push("lock record must be redacted");
  requirePreviewOnly(lock, errors, "lock record");
  return { valid: errors.length === 0, errors };
}

function conflictsByScope(nextLock, existingLock) {
  if (existingLock.status === "released_preview") return false;
  if (nextLock.scope !== existingLock.scope) return false;
  if (nextLock.scope === "project") return nextLock.projectId === existingLock.projectId;
  if (nextLock.scope === "repo") return nextLock.repoId === existingLock.repoId;
  if (nextLock.scope === "path") {
    return (
      nextLock.projectId === existingLock.projectId
      && nextLock.repoId === existingLock.repoId
      && nextLock.pathPattern === existingLock.pathPattern
    );
  }
  if (nextLock.scope === "agent") return nextLock.agentId === existingLock.agentId;
  if (nextLock.scope === "capability") return nextLock.capabilityId === existingLock.capabilityId;
  return false;
}

export function findConflictingLocks(lock, existingLocks = []) {
  return existingLocks
    .filter((candidate) => candidate.lockId !== lock.lockId)
    .filter((candidate) => conflictsByScope(lock, candidate))
    .map((candidate) => ({
      lockId: candidate.lockId,
      scope: candidate.scope,
      status: candidate.status,
      reason: `Preview conflict on ${candidate.scope} scope.`,
      previewOnly: true,
      redacted: true,
    }));
}

export function buildLockSummary(records = []) {
  const summary = {
    totalLocks: records.length,
    proposed: 0,
    activePreview: 0,
    releasedPreview: 0,
    blockedPreview: 0,
    previewOnly: true,
    redacted: true,
    executionEnabled: false,
  };
  for (const record of records) {
    if (record.status === "proposed") summary.proposed += 1;
    if (record.status === "active_preview") summary.activePreview += 1;
    if (record.status === "released_preview") summary.releasedPreview += 1;
    if (record.status === "blocked_preview") summary.blockedPreview += 1;
  }
  return summary;
}
