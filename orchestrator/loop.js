// orchestrator/loop.js
// Main agentic loop. Runs continuously, pulls tasks from queue, dispatches agents.
// Supports parallel execution and dependsOn phase chaining.
// Start with: node orchestrator/loop.js

import "dotenv/config";
import path     from "path";
import chalk    from "chalk";
import { runAgent }  from "./runner.js";
import { fireHook }  from "../hooks/index.js";
import { executeSkill } from "../skills/index.js";
import { readJsonFileWithRetry, updateJsonFile, writeJsonFileAtomic } from "../utils/json-store.js";
import { loopGuard }       from "../safety/governor.js";
import { safeEnqueueTask } from "../safety/safeQueue.js";

const ROOT        = process.cwd();
const QUEUE_FILE  = path.join(ROOT, "memory", "task-queue.json");
const INTERVAL_MS = parseInt(process.env.LOOP_INTERVAL || "10") * 1000;
const DEFAULT_RETRY_DELAY_MS = parseInt(process.env.TASK_RETRY_DELAY_MS || "15000") * 1;
const MAX_AUTO_HEAL_ATTEMPTS = parseInt(process.env.MAX_AUTO_HEAL_ATTEMPTS || "2");

// Track which task IDs are currently running so we don't double-dispatch
const running = new Set();
let ticking = false;

// ─── Startup banner ───────────────────────────────────────────────────────────
function banner() {
  console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════╗
  ║          NEXUS ORCHESTRATOR v2.0                 ║
  ║    Parallel · Dependency-Aware · Claude-Powered  ║
  ╚══════════════════════════════════════════════════╝`));
  console.log(chalk.dim(`  Memory:   ${ROOT}/memory/`));
  console.log(chalk.dim(`  Agents:   ${ROOT}/agents/`));
  console.log(chalk.dim(`  Interval: ${INTERVAL_MS / 1000}s`));
  console.log(chalk.cyan(`  ─────────────────────────────────────────────────`));
  console.log(chalk.green(`  ✓ Loop started. Add tasks:  npm run task`));
  console.log(chalk.green(`  ✓ Run a sprint:             node scripts/sprint.js <N>`));
  console.log();
}

// ─── Main tick ───────────────────────────────────────────────────────────────
async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const queue = await readQueue();

    const completedIds = new Set(queue.completed.map(t => t.id));

    // A task is runnable when:
    //  - status is "pending"
    //  - not already running in this process
    //  - all dependsOn IDs are in completed
    const runnable = queue.queue.filter(t => {
      if (t.status !== "pending")    return false;
      if (running.has(t.id))         return false;
      if (t.nextAttemptAt && Date.now() < Date.parse(t.nextAttemptAt)) return false;
      if (t.dependsOn && t.dependsOn.length > 0) {
        return t.dependsOn.every(dep => completedIds.has(dep));
      }
      return true;
    });

    if (runnable.length === 0) return;

    // Mark all runnable tasks as running at once, then dispatch in parallel
    for (const task of runnable) {
      task.status    = "running";
      task.startedAt = new Date().toISOString();
      running.add(task.id);
    }
    await writeQueue(queue);

    console.log(chalk.cyan(`\n⚡ Dispatching ${runnable.length} task(s) in parallel`));

    // Fire hook: goals received; record in loop guard for circular-dep detection
    for (const task of runnable) {
      await fireHook("on_goal_received", { agentId: task.agentId, task: task.task, projectId: task.projectId });
      loopGuard.recordDispatch(task.id, task.agentId);
    }

    await Promise.all(runnable.map(task => dispatchOne(task)));

  } catch (e) {
    console.error(chalk.red(`Loop error: ${e.message}`));
  } finally {
    ticking = false;
  }
}

async function dispatchOne(task) {
  // ── Skill tasks: execute directly without Claude ───────────────────────────
  if (task.type === "skill") {
    const label = `${task.agentId.toUpperCase()}.${task.skill}`;
    console.log(chalk.magenta(`  ⚙ [SKILL] ${label}  input=${JSON.stringify(task.input || {}).slice(0, 60)}`));

    const skillResult = await executeSkill(task.agentId, task.skill, task.input || {});
    const success = skillResult.result !== "FAIL";

    console.log(
      success
        ? chalk.green(`  ✓ ${label} → ${skillResult.result}: ${skillResult.summary?.slice(0, 80)}`)
        : chalk.red(  `  ✗ ${label} → FAIL: ${skillResult.summary?.slice(0, 80)}`)
    );

    if (skillResult.issues?.length) {
      skillResult.issues.slice(0, 3).forEach(i => console.log(chalk.dim(`    [${i.severity}] ${i.message?.slice(0, 100)}`)));
    }

    const finished = { ...task, skillResult, success, finishedAt: new Date().toISOString() };
    running.delete(task.id);
    if (success) {
      await markTaskCompleted(task.id, { ...finished, status: "completed" });
    } else {
      const recovered = await tryRecoverTask(task, {
        error: skillResult.summary || "Skill returned FAIL",
        details: skillResult,
        kind: "skill",
      });
      if (!recovered) {
        await markTaskFailed(task.id, { ...finished, status: "failed" });
      }
    }

    const hookData = { agentId: task.agentId, taskId: task.id, success, projectId: task.projectId };
    await (success
      ? fireHook("on_step_completed", { ...hookData, toolCallCount: 0, iterations: 0 })
      : fireHook("on_failure",        { ...hookData, error: skillResult.summary }));
    return;
  }

  // ── LLM agent tasks: run through Claude ───────────────────────────────────
  console.log(chalk.yellow(`  → [${task.priority.toUpperCase()}] ${task.agentId.toUpperCase()}: ${task.task.slice(0, 80)}...`));

  const result = await runAgent(task.agentId, task.task, {
    projectId: task.projectId,
    ...task.context,
    taskId: task.id,  // required by governor loopGuard for circular-handoff detection
  });

  // Re-read queue to avoid race conditions when multiple tasks finish
  const finished = { ...task, ...result, finishedAt: new Date().toISOString() };

  if (result.success) {
    console.log(chalk.green(`  ✓ ${task.agentId.toUpperCase()} done (${result.toolCallCount} tool calls, ${result.iterations} iters)`));
    await markTaskCompleted(task.id, { ...finished, status: "completed" });
  } else {
    console.log(chalk.red(`  ✗ ${task.agentId.toUpperCase()} failed: ${result.error}`));
    const recovered = await tryRecoverTask(task, {
      error: result.error || "Agent run failed",
      details: result,
      kind: "agent",
    });
    if (!recovered) {
      await markTaskFailed(task.id, { ...finished, status: "failed" });
    }
  }

  running.delete(task.id);

  const hookData = { agentId: task.agentId, taskId: task.id, success: result.success, projectId: task.projectId, toolCallCount: result.toolCallCount, iterations: result.iterations };
  await (result.success
    ? fireHook("on_step_completed", hookData)
    : fireHook("on_failure",        { ...hookData, error: result.error }));
}

// ─── File helpers ─────────────────────────────────────────────────────────────
async function readQueue() {
  return readJsonFileWithRetry(QUEUE_FILE);
}

async function writeQueue(data) {
  data.lastUpdated = new Date().toISOString();
  await writeJsonFileAtomic(QUEUE_FILE, data);
}

async function markTaskCompleted(taskId, finishedTask) {
  await updateJsonFile(QUEUE_FILE, async (queue) => {
    const idx = queue.queue.findIndex((t) => t.id === taskId);
    if (idx !== -1) queue.queue.splice(idx, 1);
    queue.completed.push(finishedTask);
    queue.lastUpdated = new Date().toISOString();
    return queue;
  });
}

async function markTaskFailed(taskId, finishedTask) {
  await updateJsonFile(QUEUE_FILE, async (queue) => {
    const idx = queue.queue.findIndex((t) => t.id === taskId);
    if (idx !== -1) queue.queue.splice(idx, 1);
    queue.failed.push(finishedTask);
    queue.lastUpdated = new Date().toISOString();
    return queue;
  });
}

async function tryRecoverTask(task, failure) {
  if (shouldRetryTask(task, failure.error)) {
    await rescheduleTask(task.id, failure.error);
    console.log(chalk.yellow(`  ↺ ${task.agentId.toUpperCase()} retry scheduled for ${task.id}`));
    return true;
  }

  if (shouldAutoHealTask(task, failure)) {
    const remediationTask = buildRemediationTask(task, failure);
    await enqueueRemediationAndRetry(task.id, remediationTask, failure.error);
    console.log(chalk.yellow(`  ↺ ${task.agentId.toUpperCase()} remediation queued via ${remediationTask.agentId.toUpperCase()}`));
    return true;
  }

  return false;
}

function shouldRetryTask(task, error = "") {
  const retryCount = task.retryCount || 0;
  const maxRetries = task.maxRetries ?? (task.type === "skill" ? 1 : 2);
  if (retryCount >= maxRetries) return false;
  return isTransientError(error);
}

function isTransientError(error = "") {
  const text = String(error).toLowerCase();
  return [
    "fetch failed",
    "econnreset",
    "timed out",
    "timeout",
    "connection refused",
    "socket hang up",
    "temporarily unavailable",
    "503",
    "502",
    "500",
  ].some((needle) => text.includes(needle));
}

async function rescheduleTask(taskId, error) {
  await updateJsonFile(QUEUE_FILE, async (queue) => {
    const task = queue.queue.find((t) => t.id === taskId);
    if (!task) return queue;
    const retryCount = (task.retryCount || 0) + 1;
    task.retryCount = retryCount;
    task.status = "pending";
    task.startedAt = null;
    task.nextAttemptAt = new Date(Date.now() + retryDelayMs(retryCount)).toISOString();
    task.lastError = error;
    queue.lastUpdated = new Date().toISOString();
    return queue;
  });
}

function shouldAutoHealTask(task, failure) {
  if (task.type !== "skill") return false;
  if (!task.projectId) return false;
  if ((task.autoHealCount || 0) >= MAX_AUTO_HEAL_ATTEMPTS) return false;
  const skill = task.skill || "";
  return skill.startsWith("code.") || skill.startsWith("qa.") || skill.startsWith("compliance.");
}

function buildRemediationTask(task, failure) {
  const skill = task.skill || "unknown";
  const agentId = remediationAgentForSkill(skill);
  const issueSummary = summarizeIssues(failure.details?.issues || [], failure.error);
  const taskText = [
    `Investigate and fix the failed gate ${skill} for ${task.projectId}.`,
    `Original gate task id: ${task.id}.`,
    `Failure summary: ${failure.error}.`,
    issueSummary ? `Reported issues: ${issueSummary}.` : null,
    `Edit the relevant project files, then leave the code ready for the original gate to retry.`,
  ].filter(Boolean).join(" ");

  return {
    id: `autoheal-${task.agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    agentId,
    task: taskText,
    projectId: task.projectId,
    priority: "critical",
    context: {
      trigger: "auto-heal",
      failedTaskId: task.id,
      failedSkill: skill,
      failure: failure.error,
      issues: failure.details?.issues || [],
    },
    createdAt: new Date().toISOString(),
    status: "pending",
    dependsOn: [],
  };
}

function remediationAgentForSkill(skill) {
  if (skill === "compliance.privacy.check") return "canvas";
  if (skill === "compliance.permissions.validate") return "swift";
  if (skill === "qa.simulator.run" || skill === "qa.tests.execute") return "swift";
  if (skill.startsWith("qa.") || skill.startsWith("code.")) return "core";
  return "core";
}

function summarizeIssues(issues, fallback) {
  if (!issues?.length) return fallback || "";
  return issues.slice(0, 3).map((issue) => issue.message).filter(Boolean).join(" | ");
}

async function enqueueRemediationAndRetry(taskId, remediationTask, error) {
  // Push remediation task through governor (checks queue size, permissions, loop guard)
  const enqueued = await safeEnqueueTask({
    agentId:      remediationTask.agentId,
    task:         remediationTask,
    parentTaskId: taskId,
    reason:       `auto-heal for failed task ${taskId}: ${error}`,
  });

  if (!enqueued.success) {
    console.log(chalk.yellow(`  ↺ auto-heal enqueue blocked by governor: ${enqueued.reason}`));
    return;
  }

  // Update the original task: add remediation dep, schedule retry
  await updateJsonFile(QUEUE_FILE, async (queue) => {
    const task = queue.queue.find((t) => t.id === taskId);
    if (!task) return queue;
    const dependsOn = new Set(task.dependsOn || []);
    dependsOn.add(remediationTask.id);
    task.dependsOn    = Array.from(dependsOn);
    task.autoHealCount = (task.autoHealCount || 0) + 1;
    task.status       = "pending";
    task.startedAt    = null;
    task.lastError    = error;
    task.nextAttemptAt = new Date(Date.now() + retryDelayMs(task.autoHealCount)).toISOString();
    queue.lastUpdated = new Date().toISOString();
    return queue;
  });
}

function retryDelayMs(attempt) {
  return DEFAULT_RETRY_DELAY_MS * Math.max(attempt, 1);
}

// ─── File watcher — react instantly on queue changes ─────────────────────────
async function watchQueue() {
  const { watch } = await import("chokidar");
  const watcher   = watch(QUEUE_FILE, { persistent: true, ignoreInitial: true });
  watcher.on("change", () => tick());
}

// ─── Start ────────────────────────────────────────────────────────────────────
banner();
watchQueue();
setInterval(tick, INTERVAL_MS);
tick();
