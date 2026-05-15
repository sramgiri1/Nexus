export const HOOK_LIMIT_DEFAULTS = {
  maxRunsPerDay: 0,
  cooldownSeconds: 3600,
  maxRetries: 0,
  maxRuntimeSeconds: 0,
  maxConsecutiveFailures: 0,
  disableAfterFailureThreshold: 1,
  requiresHumanApprovalAfterRetries: true,
  failClosed: true,
};

export function buildHookLimitProfile(hook) {
  return {
    hookId: hook?.hookId || "unknown",
    maxRunsPerDay: hook?.maxRunsPerDay ?? HOOK_LIMIT_DEFAULTS.maxRunsPerDay,
    cooldownSeconds: hook?.cooldownSeconds ?? HOOK_LIMIT_DEFAULTS.cooldownSeconds,
    maxRetries: hook?.maxRetries ?? HOOK_LIMIT_DEFAULTS.maxRetries,
    maxRuntimeSeconds: hook?.maxRuntimeSeconds ?? HOOK_LIMIT_DEFAULTS.maxRuntimeSeconds,
    maxConsecutiveFailures: hook?.maxConsecutiveFailures ?? HOOK_LIMIT_DEFAULTS.maxConsecutiveFailures,
    disableAfterFailureThreshold:
      hook?.disableAfterFailureThreshold ?? HOOK_LIMIT_DEFAULTS.disableAfterFailureThreshold,
    requiresHumanApprovalAfterRetries:
      hook?.requiresHumanApprovalAfterRetries ?? HOOK_LIMIT_DEFAULTS.requiresHumanApprovalAfterRetries,
    costPolicy: {
      maxUsdPerRun: hook?.costPolicy?.maxUsdPerRun ?? 0,
      maxUsdPerDay: hook?.costPolicy?.maxUsdPerDay ?? 0,
      requiresApprovalAboveUsd: hook?.costPolicy?.requiresApprovalAboveUsd ?? 0,
    },
    failClosed: hook?.failClosed === true,
  };
}

export function evaluateHookLimits(hook, historyPreview = {}) {
  const profile = buildHookLimitProfile(hook);
  const runsToday = historyPreview.runsToday || 0;
  const secondsSinceLastRun = historyPreview.secondsSinceLastRun ?? Number.POSITIVE_INFINITY;
  const estimatedRuntimeSeconds = historyPreview.estimatedRuntimeSeconds || 0;
  const estimatedUsd = historyPreview.estimatedUsd || 0;
  const reasons = [];

  if (profile.maxRunsPerDay === 0 || runsToday >= profile.maxRunsPerDay) {
    reasons.push("Daily run limit reached or disabled.");
  }
  if (secondsSinceLastRun < profile.cooldownSeconds) {
    reasons.push("Cooldown window has not elapsed.");
  }
  if (profile.maxRuntimeSeconds === 0 || estimatedRuntimeSeconds > profile.maxRuntimeSeconds) {
    reasons.push("Runtime limit reached or disabled.");
  }
  if (profile.costPolicy.maxUsdPerRun === 0 || estimatedUsd > profile.costPolicy.maxUsdPerRun) {
    reasons.push("Cost limit reached or disabled.");
  }

  return {
    hookId: profile.hookId,
    allowed: reasons.length === 0,
    decision: reasons.length === 0 ? "ALLOW_DRY_RUN" : "BLOCK_RATE_LIMIT",
    reasons,
    profile,
  };
}

export function evaluateRetryPolicy(hook, attemptPreview = {}) {
  const profile = buildHookLimitProfile(hook);
  const attempt = attemptPreview.attempt || 0;
  const consecutiveFailures = attemptPreview.consecutiveFailures || 0;
  const reasons = [];

  if (profile.maxRetries === 0 || attempt > profile.maxRetries) {
    reasons.push("Retry limit reached or disabled.");
  }
  if (consecutiveFailures >= profile.disableAfterFailureThreshold) {
    reasons.push("Failure threshold reached; hook must remain disabled pending review.");
  }
  if (profile.requiresHumanApprovalAfterRetries && attempt > 0) {
    reasons.push("Human approval is required before retry preview.");
  }

  return {
    hookId: profile.hookId,
    allowed: reasons.length === 0,
    decision: reasons.length === 0 ? "ALLOW_DRY_RUN" : "BLOCK_RETRY_LIMIT",
    requiresApproval: reasons.some((reason) => reason.includes("Human approval")),
    reasons,
    profile,
  };
}

export function validateHookLimitProfile(profile) {
  const errors = [];

  for (const field of [
    "maxRunsPerDay",
    "cooldownSeconds",
    "maxRetries",
    "maxRuntimeSeconds",
    "maxConsecutiveFailures",
    "disableAfterFailureThreshold",
  ]) {
    if (!Number.isInteger(profile?.[field]) || profile[field] < 0) {
      errors.push(`${field} must be a non-negative integer`);
    }
  }

  if (profile?.requiresHumanApprovalAfterRetries !== true) {
    errors.push("requiresHumanApprovalAfterRetries must be true in P51");
  }
  if (profile?.failClosed !== true) errors.push("failClosed must be true");

  return { valid: errors.length === 0, errors };
}
