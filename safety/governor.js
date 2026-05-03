// safety/governor.js
// Central safety/governor layer for the Nexus 20-agent OS.
// All sensitive actions pass through authorizeAction() before executing.
//
// Usage:
//   import { authorizeAction } from "../safety/governor.js";
//   const check = await authorizeAction({ agentId, actionType, toolName, ... });
//   if (!check.allowed) return { success: false, error: `[SAFETY] ${check.reason}` };

import fs   from "fs/promises";
import path from "path";
import { budgetGuard }      from "./budgetGuard.js";
import { loopGuard }        from "./loopGuard.js";
import { permissionGuard }  from "./permissionGuard.js";
import { commandGuard }     from "./commandGuard.js";
import { fileScopeGuard }   from "./fileScopeGuard.js";
import { secretGuard }      from "./secretGuard.js";
import { approvalGate }     from "./approvalGate.js";
import { logSafetyEvent }   from "./safetyLogger.js";

const CFG_DIR = path.join(process.cwd(), "config");
const _policyCache = {};
async function loadPolicy(name) {
  if (_policyCache[name]) return _policyCache[name];
  try {
    const raw = await fs.readFile(path.join(CFG_DIR, `${name}.json`), "utf8");
    _policyCache[name] = JSON.parse(raw);
    return _policyCache[name];
  } catch { return null; }
}

const ROOT       = process.cwd();
const QUEUE_FILE = path.join(ROOT, "memory", "task-queue.json");

async function checkQueueSize() {
  try {
    const maxSize = await permissionGuard.getMaxQueueSize();
    const raw     = await fs.readFile(QUEUE_FILE, "utf8");
    const queue   = JSON.parse(raw);
    const size    = queue.queue?.length || 0;
    if (size >= maxSize) {
      return { allowed: false, reason: `Queue size limit reached (${size}/${maxSize}) — enqueue rejected` };
    }
  } catch {
    // If queue file unreadable, fail open (don't block legitimate first tasks)
  }
  return { allowed: true };
}

/**
 * Authorize any action before it executes.
 *
 * @param {object} request
 * @param {string} request.agentId           - Agent attempting the action
 * @param {string} request.actionType        - "tool_call" | "skill_call" | "llm_call" | "command"
 * @param {string} [request.toolName]        - Tool name for tool_call actions
 * @param {string} [request.skillName]       - Fully-qualified skill key (e.g. "auditor.code.lint")
 * @param {string} [request.command]         - Shell command string for command actions
 * @param {string} [request.filePath]        - File path for write_file checks
 * @param {string} [request.content]         - File content for secret scanning
 * @param {string} [request.targetAgentId]   - Target agent for enqueue_task checks
 * @param {string} [request.taskId]          - Current task ID (for loop detection)
 * @param {number} [request.estimatedTokens] - Token estimate for llm_call budget checks
 * @param {number} [request.estimatedCost]   - USD cost estimate for llm_call budget checks
 * @param {object} [request.context]         - Extra context passed through to logger
 *
 * @returns {Promise<{ allowed: boolean, reason: string, requiresApproval: boolean, riskLevel: string }>}
 */
export async function authorizeAction(request) {
  const { agentId = "unknown", actionType } = request;

  try {
    switch (actionType) {

      case "tool_call": {
        const { toolName, filePath, content, targetAgentId, skillName, taskId } = request;

        // ── write_file ────────────────────────────────────────────────────────
        if (toolName === "write_file") {
          const scope = await fileScopeGuard.check(agentId, filePath);
          if (!scope.allowed) return deny(scope.reason, "high", agentId, request);

          if (content) {
            const secrets = secretGuard.check(content, filePath);
            if (!secrets.allowed) return deny(secrets.reason, "critical", agentId, request);
          }
        }

        // ── enqueue_task ──────────────────────────────────────────────────────
        if (toolName === "enqueue_task") {
          const perm = await permissionGuard.checkEnqueue(agentId, targetAgentId);
          if (!perm.allowed) return deny(perm.reason, "high", agentId, request);

          const loop = loopGuard.checkEnqueue(agentId, targetAgentId, taskId);
          if (!loop.allowed) return deny(loop.reason, "high", agentId, request);

          const queueSize = await checkQueueSize();
          if (!queueSize.allowed) return deny(queueSize.reason, "high", agentId, request);
        }

        // ── run_skill ─────────────────────────────────────────────────────────
        if (toolName === "run_skill" && skillName) {
          const perm = await permissionGuard.checkSkill(agentId, skillName);
          if (!perm.allowed) return deny(perm.reason, "medium", agentId, request);
        }

        break;
      }

      case "skill_call": {
        const { skillName } = request;
        if (skillName) {
          const perm = await permissionGuard.checkSkill(agentId, skillName);
          if (!perm.allowed) return deny(perm.reason, "medium", agentId, request);
        }
        break;
      }

      case "llm_call": {
        const { estimatedTokens = 500, estimatedCost, model, provider, executionMode, taskType } = request;
        const cost = estimatedCost ?? budgetGuard.estimateCost(model || "claude-sonnet-4-6", estimatedTokens);

        // OpenRouter: block for high-risk task types
        if (provider === "openrouter" && taskType) {
          const orPolicy = await loadPolicy("openrouter-policy");
          if (orPolicy?.neverUseFor?.includes(taskType)) {
            return deny(`OpenRouter blocked for task type '${taskType}'`, "high", agentId, request);
          }
        }

        // Ollama: block for high-risk task types
        if (provider === "ollama" && taskType) {
          const batchPolicy = await loadPolicy("batch-policy");
          const highRisk = batchPolicy?.neverBatchTaskTypes || [];
          if (highRisk.includes(taskType)) {
            return deny(`Ollama blocked for high-risk task type '${taskType}'`, "high", agentId, request);
          }
        }

        // Batch: block for never-batch agent + task type combos
        if (executionMode === "batch" && taskType) {
          const batchPolicy = await loadPolicy("batch-policy");
          if (batchPolicy?.neverBatchAgents?.includes(agentId)) {
            return deny(`Batch blocked for agent '${agentId}' (neverBatchAgents)`, "high", agentId, request);
          }
          if (batchPolicy?.neverBatchTaskTypes?.includes(taskType)) {
            return deny(`Batch blocked for task type '${taskType}'`, "high", agentId, request);
          }
        }

        const budget = await budgetGuard.check(agentId, estimatedTokens, cost);
        if (!budget.allowed) return deny(budget.reason, "high", agentId, request);

        const approval = await approvalGate.check(agentId, "llm_call", { estimatedCost: cost });
        if (!approval.allowed) return deny(approval.reason, "high", agentId, request);
        break;
      }

      case "command": {
        const { command } = request;
        const cmd = await commandGuard.check(agentId, command);
        if (!cmd.allowed) return deny(cmd.reason, "high", agentId, request);
        break;
      }
    }

    return { allowed: true, reason: "ok", requiresApproval: false, riskLevel: "low" };

  } catch (e) {
    // Governor must never silently crash — fail closed and log
    await logSafetyEvent({ type: "governor_error", agentId, actionType, error: e.message });
    return { allowed: false, reason: `Governor error: ${e.message}`, requiresApproval: false, riskLevel: "critical" };
  }
}

// Re-export guards so consumers can use them directly (e.g. budgetGuard.recordUsage)
export { budgetGuard, loopGuard, permissionGuard, commandGuard, fileScopeGuard, secretGuard };

function deny(reason, riskLevel, agentId, request) {
  logSafetyEvent({ type: "blocked", agentId, reason, riskLevel, actionType: request.actionType, toolName: request.toolName, skillName: request.skillName }).catch(() => {});
  return { allowed: false, reason, requiresApproval: false, riskLevel };
}
