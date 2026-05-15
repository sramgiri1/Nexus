import { evaluateHookLimits, evaluateRetryPolicy } from "./hookLimits.js";

export const HOOK_GUARD_DECISIONS = {
  ALLOW_DRY_RUN: "ALLOW_DRY_RUN",
  BLOCK_DISABLED: "BLOCK_DISABLED",
  BLOCK_RATE_LIMIT: "BLOCK_RATE_LIMIT",
  BLOCK_RETRY_LIMIT: "BLOCK_RETRY_LIMIT",
  REQUIRE_APPROVAL: "REQUIRE_APPROVAL",
  FAIL_CLOSED: "FAIL_CLOSED",
};

export function buildHookGuardDecision(hook, context = {}) {
  const reasons = [];

  if (!hook || typeof hook !== "object") {
    return {
      hookId: "unknown",
      decision: HOOK_GUARD_DECISIONS.FAIL_CLOSED,
      allowed: false,
      dryRunOnly: true,
      reasons: ["Missing hook definition."],
    };
  }

  if (hook.failClosed !== true) {
    return {
      hookId: hook.hookId,
      decision: HOOK_GUARD_DECISIONS.FAIL_CLOSED,
      allowed: false,
      dryRunOnly: true,
      reasons: ["Hook does not fail closed."],
    };
  }

  if (hook.enabled !== true) {
    return {
      hookId: hook.hookId,
      decision: HOOK_GUARD_DECISIONS.BLOCK_DISABLED,
      allowed: false,
      dryRunOnly: true,
      reasons: ["Hook is disabled. P51 supports registry readiness only."],
    };
  }

  const limitDecision = evaluateHookLimits(hook, context.historyPreview || {});
  if (!limitDecision.allowed) {
    return {
      hookId: hook.hookId,
      decision: HOOK_GUARD_DECISIONS.BLOCK_RATE_LIMIT,
      allowed: false,
      dryRunOnly: true,
      reasons: limitDecision.reasons,
      limitDecision,
    };
  }

  const retryDecision = evaluateRetryPolicy(hook, context.attemptPreview || {});
  if (retryDecision.requiresApproval) {
    reasons.push(...retryDecision.reasons);
    return {
      hookId: hook.hookId,
      decision: HOOK_GUARD_DECISIONS.REQUIRE_APPROVAL,
      allowed: false,
      dryRunOnly: true,
      reasons,
      retryDecision,
    };
  }
  if (!retryDecision.allowed) {
    return {
      hookId: hook.hookId,
      decision: HOOK_GUARD_DECISIONS.BLOCK_RETRY_LIMIT,
      allowed: false,
      dryRunOnly: true,
      reasons: retryDecision.reasons,
      retryDecision,
    };
  }

  return {
    hookId: hook.hookId,
    decision: HOOK_GUARD_DECISIONS.ALLOW_DRY_RUN,
    allowed: true,
    dryRunOnly: true,
    reasons: ["Dry-run preview is allowed by the guard model."],
  };
}
