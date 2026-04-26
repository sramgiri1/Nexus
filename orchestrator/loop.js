// orchestrator/loop.js
// Main agentic loop. Runs continuously, pulls tasks from queue, dispatches agents.
// Supports parallel execution and dependsOn phase chaining.
// Start with: node orchestrator/loop.js

import "dotenv/config";
import fs       from "fs/promises";
import path     from "path";
import chalk    from "chalk";
import { runAgent } from "./runner.js";

const ROOT        = process.cwd();
const QUEUE_FILE  = path.join(ROOT, "memory", "task-queue.json");
const INTERVAL_MS = parseInt(process.env.LOOP_INTERVAL || "10") * 1000;

// Track which task IDs are currently running so we don't double-dispatch
const running = new Set();

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

    await Promise.all(runnable.map(task => dispatchOne(task)));

  } catch (e) {
    console.error(chalk.red(`Loop error: ${e.message}`));
  }
}

async function dispatchOne(task) {
  console.log(chalk.yellow(`  → [${task.priority.toUpperCase()}] ${task.agentId.toUpperCase()}: ${task.task.slice(0, 80)}...`));

  const result = await runAgent(task.agentId, task.task, {
    projectId: task.projectId,
    ...task.context,
  });

  // Re-read queue to avoid race conditions when multiple tasks finish
  const queue = await readQueue();
  const idx = queue.queue.findIndex(t => t.id === task.id);
  if (idx !== -1) queue.queue.splice(idx, 1);

  const finished = { ...task, ...result, finishedAt: new Date().toISOString() };

  if (result.success) {
    console.log(chalk.green(`  ✓ ${task.agentId.toUpperCase()} done (${result.toolCallCount} tool calls, ${result.iterations} iters)`));
    queue.completed.push({ ...finished, status: "completed" });
  } else {
    console.log(chalk.red(`  ✗ ${task.agentId.toUpperCase()} failed: ${result.error}`));
    queue.failed.push({ ...finished, status: "failed" });
  }

  running.delete(task.id);
  await writeQueue(queue);
}

// ─── File helpers ─────────────────────────────────────────────────────────────
async function readQueue() {
  const raw = await fs.readFile(QUEUE_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeQueue(data) {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(QUEUE_FILE, JSON.stringify(data, null, 2));
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
