// safety/approvalGate.js
// In headless mode: logs approval-required actions and auto-approves them (configurable).
// A human reviewer can audit memory/safety-events.json for all approval events.

import { loadConfig }      from "./config.js";
import { logSafetyEvent }  from "./safetyLogger.js";

export const approvalGate = {
  async check(agentId, actionType, details = {}) {
    const config = await loadConfig("approval-policy");

    const requiresExplicit = config.require_explicit_approval_for?.includes(actionType);
    const costOver = details.estimatedCost != null &&
                     details.estimatedCost > (config.cost_approval_threshold_usd || 1.0);

    if (requiresExplicit || costOver) {
      const reason = requiresExplicit
        ? `Action '${actionType}' requires explicit approval`
        : `Estimated cost $${details.estimatedCost?.toFixed(2)} exceeds approval threshold`;

      await logSafetyEvent({
        type:         "approval_required",
        agentId,
        actionType,
        reason,
        details,
        autoApproved: config.auto_approve_in_headless,
      });

      if (!config.auto_approve_in_headless) {
        return { allowed: false, reason, requiresApproval: true };
      }
    }

    return { allowed: true, requiresApproval: false };
  },
};
