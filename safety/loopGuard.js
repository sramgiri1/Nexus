// safety/loopGuard.js
// Prevents self-enqueue and circular agent handoffs.
// Uses an in-memory call chain map (per-process, resets on restart).

const callChains = new Map(); // taskId → Set<agentId>

export const loopGuard = {
  checkEnqueue(sourceAgentId, targetAgentId, taskId) {
    if (sourceAgentId === targetAgentId) {
      return { allowed: false, reason: `Self-enqueue blocked: '${sourceAgentId}' cannot queue tasks for itself` };
    }

    if (taskId && callChains.has(taskId)) {
      const chain = callChains.get(taskId);
      if (chain.has(targetAgentId)) {
        return {
          allowed: false,
          reason: `Circular handoff blocked: '${targetAgentId}' is already in the call chain for task ${taskId}`,
        };
      }
    }

    return { allowed: true };
  },

  recordDispatch(taskId, agentId) {
    if (!taskId) return;
    if (!callChains.has(taskId)) callChains.set(taskId, new Set());
    callChains.get(taskId).add(agentId);

    // GC when map grows large
    if (callChains.size > 1000) {
      const keys = Array.from(callChains.keys());
      keys.slice(0, 500).forEach(k => callChains.delete(k));
    }
  },

  hasAgent(taskId, agentId) {
    return callChains.has(taskId) && callChains.get(taskId).has(agentId);
  },
};
