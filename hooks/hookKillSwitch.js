export const KILL_SWITCH_LEVELS = ["global", "project", "hook"];

export function buildHookKillSwitchState(hook, overrides = {}) {
  return {
    hookId: hook?.hookId || "unknown",
    hookKillSwitchId: hook?.killSwitchId || `kill-hook-${hook?.hookId || "unknown"}`,
    globalKillSwitchId: "kill-hooks-global",
    projectKillSwitchId: `kill-hooks-project-${hook?.projectId || "private-project"}`,
    globalDisabled: overrides.globalDisabled === true,
    projectDisabled: overrides.projectDisabled === true,
    hookDisabled: overrides.hookDisabled === true || hook?.enabled !== true,
    disabledReason: overrides.disabledReason || "Hook execution is not enabled in P51.",
    disabledAt: overrides.disabledAt || "",
    disabledBy: overrides.disabledBy || "NEXUS",
    requiresReviewToReenable: true,
    ownerAgent: hook?.ownerAgent || "NEXUS",
  };
}

export function evaluateKillSwitch(hook, context = {}) {
  const state = buildHookKillSwitchState(hook, context);
  const disabledLevels = [];

  if (state.globalDisabled) disabledLevels.push("global");
  if (state.projectDisabled) disabledLevels.push("project");
  if (state.hookDisabled) disabledLevels.push("hook");

  return {
    hookId: state.hookId,
    disabled: disabledLevels.length > 0,
    decision: disabledLevels.length > 0 ? "KILL_SWITCH_BLOCK" : "KILL_SWITCH_CLEAR",
    disabledLevels,
    reason: state.disabledReason,
    requiresReviewToReenable: state.requiresReviewToReenable,
    state,
  };
}

export function disableHookPreview(hook, reason = "Operator requested disable preview.") {
  const state = buildHookKillSwitchState(hook, {
    hookDisabled: true,
    disabledReason: reason,
    disabledAt: new Date().toISOString(),
    disabledBy: "human-operator",
  });

  return {
    hookId: state.hookId,
    dryRun: true,
    wouldWrite: false,
    decision: "DISABLE_PREVIEW_ONLY",
    reason,
    state,
  };
}

export function reenableHookPreview(hook, approvalContext = {}) {
  const approved = approvalContext.approved === true && approvalContext.approver;

  return {
    hookId: hook?.hookId || "unknown",
    dryRun: true,
    wouldWrite: false,
    decision: approved ? "REENABLE_REVIEW_READY" : "REENABLE_BLOCKED_REVIEW_REQUIRED",
    requiresReviewToReenable: true,
    approved: Boolean(approved),
    approver: approvalContext.approver || "",
    reason: approved
      ? "Re-enable preview has approval metadata, but no state is changed in P51."
      : "Re-enable preview requires explicit approval metadata.",
  };
}

export function validateKillSwitchState(state) {
  const errors = [];

  for (const field of ["hookId", "hookKillSwitchId", "globalKillSwitchId", "projectKillSwitchId", "ownerAgent"]) {
    if (!state?.[field] || typeof state[field] !== "string") errors.push(`Missing string field: ${field}`);
  }

  for (const field of ["globalDisabled", "projectDisabled", "hookDisabled", "requiresReviewToReenable"]) {
    if (typeof state?.[field] !== "boolean") errors.push(`${field} must be boolean`);
  }

  if (state?.requiresReviewToReenable !== true) {
    errors.push("requiresReviewToReenable must be true");
  }

  return { valid: errors.length === 0, errors };
}
