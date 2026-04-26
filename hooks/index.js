// hooks/index.js
// Event hook system for the orchestrator.
// Hooks fire at key lifecycle moments: goal received, step completed, failure.
// Hooks are NON-BLOCKING — failures are logged, never crash the loop.

import fs   from "fs/promises";
import path from "path";

const ROOT    = process.cwd();
const LOG     = path.join(ROOT, "memory", "conversations", "orchestrator.log");

async function appendLog(line) {
  try { await fs.appendFile(LOG, `[${new Date().toISOString()}] ${line}\n`); } catch {}
}

// ─── Built-in hook implementations ───────────────────────────────────────────

async function logGoalReceived({ agentId, task, projectId }) {
  await appendLog(`GOAL_RECEIVED  ${agentId?.toUpperCase() ?? "?"}  project=${projectId ?? "none"}  task=${task?.slice(0, 80)}`);
}

async function logStepCompleted({ agentId, taskId, success, toolCallCount, iterations, projectId }) {
  const tag = success ? "STEP_COMPLETED" : "STEP_FAILED   ";
  await appendLog(`${tag}  ${agentId?.toUpperCase() ?? "?"}  task=${taskId}  tools=${toolCallCount ?? 0}  iters=${iterations ?? 0}  project=${projectId ?? "none"}`);
}

async function logFailure({ agentId, taskId, error, projectId }) {
  await appendLog(`FAILURE        ${agentId?.toUpperCase() ?? "?"}  task=${taskId}  project=${projectId ?? "none"}  error=${error?.slice(0, 120)}`);
}

// ─── Hook registry ────────────────────────────────────────────────────────────

const HOOKS = {
  on_goal_received:  [logGoalReceived],
  on_step_completed: [logStepCompleted],
  on_failure:        [logFailure],
};

export function registerHook(event, fn) {
  if (!HOOKS[event]) HOOKS[event] = [];
  HOOKS[event].push(fn);
}

export async function fireHook(event, data = {}) {
  const fns = HOOKS[event] || [];
  for (const fn of fns) {
    try { await fn(data); } catch (e) {
      await appendLog(`HOOK_ERROR  event=${event}  ${e.message}`);
    }
  }
}
