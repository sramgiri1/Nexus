import { MEMORY_FRESHNESS_STATES } from "./memoryScopes.js";

export function assessMemoryFreshness(item = {}, context = {}) {
  const now = context.now ? new Date(context.now) : new Date();
  const expiresAt = item.expiresAt ? new Date(item.expiresAt) : null;
  const reasons = [];
  let state = item.freshness || "unknown";

  if (!MEMORY_FRESHNESS_STATES.includes(state)) state = "unknown";
  if (item.invalidatedAt) {
    state = "invalidated";
    reasons.push("Memory was explicitly invalidated");
  } else if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt < now) {
    state = "expired";
    reasons.push("Memory passed its expiration timestamp");
  } else if (context.changedProjectId && item.projectId === context.changedProjectId) {
    state = "stale_pending_validation";
    reasons.push("Project changed after memory was verified");
  } else if (context.changedTaskId && item.taskId === context.changedTaskId) {
    state = "stale_pending_validation";
    reasons.push("Task changed after memory was verified");
  } else if (state === "fresh") {
    reasons.push("Memory is marked fresh and no invalidating change matched");
  } else {
    reasons.push("Freshness is unknown or awaiting validation");
  }

  return {
    memoryId: item.memoryId,
    freshness: state,
    stale: ["stale_pending_validation", "expired", "invalidated"].includes(state),
    reasons,
    lastVerifiedAt: item.lastVerifiedAt || "",
    expiresAt: item.expiresAt || "",
  };
}

export function markMemoryStale(item = {}, reason = "Changed context requires validation") {
  return {
    ...item,
    freshness: "stale_pending_validation",
    staleReason: reason,
    staleAt: new Date().toISOString(),
  };
}
