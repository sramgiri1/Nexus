// safety/permissionGuard.js
// Enforces agent permission tiers: who can enqueue for whom, which skills belong to which agent.

import { loadConfig } from "./config.js";

function getTier(config, agentId) {
  for (const [tierName, tier] of Object.entries(config.tiers)) {
    if (tier.agents.includes(agentId)) return { tierName, ...tier };
  }
  return null;
}

export const permissionGuard = {
  async checkEnqueue(sourceAgentId, targetAgentId) {
    const config = await loadConfig("agent-permissions");
    const tier   = getTier(config, sourceAgentId);

    if (!tier) {
      return { allowed: false, reason: `Agent '${sourceAgentId}' has no permission tier defined` };
    }
    if (tier.max_children_per_task === 0) {
      return { allowed: false, reason: `Agent '${sourceAgentId}' (${tier.tierName}) is not permitted to enqueue tasks` };
    }

    const canFor = tier.can_enqueue_for;
    if (!canFor.includes("*") && !canFor.includes(targetAgentId)) {
      return { allowed: false, reason: `Agent '${sourceAgentId}' cannot enqueue tasks for '${targetAgentId}' — not in allowed list` };
    }

    return { allowed: true };
  },

  async checkSkill(callerAgentId, skillKey) {
    if (!skillKey) return { allowed: true };
    const config     = await loadConfig("agent-permissions");
    const [skillAgent] = skillKey.split(".");

    const ownership = config.skill_ownership || {};
    if (skillAgent && ownership[skillAgent] && callerAgentId !== skillAgent) {
      return { allowed: false, reason: `Agent '${callerAgentId}' cannot invoke skill '${skillKey}' (owned by '${skillAgent}')` };
    }

    return { allowed: true };
  },

  async getMaxQueueSize() {
    const config = await loadConfig("agent-permissions");
    return config.max_queue_size || 50;
  },
};
