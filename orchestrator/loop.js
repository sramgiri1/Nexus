// orchestrator/loop.js
// Main agentic loop. Runs continuously, pulls tasks from queue, dispatches agents.
// Start with: node orchestrator/loop.js

import "dotenv/config";
import fs       from "fs/promises";
import path     from "path";
import chalk    from "chalk";
import { runAgent } from "./runner.js";

const ROOT          = process.cwd();
const QUEUE_FILE    = path.join(ROOT, "memory", "task-queue.json");
const INTERVAL_MS   = parseInt(process.env.LOOP_INTERVAL || "10") * 1000;
let   isProcessing  = false;

// ─── Startup banner ───────────────────────────────────────────────────────────
function banner() {
  console.log(chalk.cyan(`
  ╔══════════════════════════════════════════════════╗
  ║          NEXUS ORCHESTRATOR v1.0                 ║
  ║      Agentic Venture Studio Loop Active          ║
  ╚══════════════════════════════════════════════════╝`));
  console.log(chalk.dim(`  Memory:  ${ROOT}/memory/`));
  console.log(chalk.dim(`  Agents:  ${ROOT}/agents/`));
  console.log(chalk.dim(`  Interval: ${INTERVAL_MS / 1000}s`));
  console.log(chalk.dim(`  Model:    ${process.env.AGENT_MODEL || "claude-haiku-4-5-20251001"}`));
  console.log(chalk.cyan(`  ─────────────────────────────────────────────────`));
  console.log(chalk.green(`  ✓ Loop started. Add tasks with: npm run task`));
  console.log();
}

// ─── Main tick ───────────────────────────────────────────────────────────────
async function tick() {
  if (isProcessing) return;

  try {
    const queue = await readQueue();
    const pending = queue.queue.filter(t => t.status === "pending");

    if (pending.length === 0) return;

    isProcessing = true;

    // Process highest priority task
    const task = pending[0];
    console.log(chalk.yellow(`\n⚡ Dispatching [${task.priority.toUpperCase()}] → ${task.agentId.toUpperCase()}`));
    console.log(chalk.dim(`   Task: ${task.task}`));
    if (task.projectId) console.log(chalk.dim(`   Project: ${task.projectId}`));

    // Mark as running
    task.status    = "running";
    task.startedAt = new Date().toISOString();
    await writeQueue(queue);

    // Run the agent
    const result = await runAgent(task.agentId, task.task, {
      projectId: task.projectId,
      ...task.context,
    });

    // Move to completed or failed
    const finishedTask = { ...task, ...result, finishedAt: new Date().toISOString() };

    if (result.success) {
      console.log(chalk.green(`   ✓ Done (${result.toolCallCount} tool calls, ${result.iterations} iterations)`));
      if (result.output) console.log(chalk.dim(`   Output: ${result.output.slice(0, 120)}...`));
      queue.completed.push({ ...finishedTask, status: "completed" });
    } else {
      console.log(chalk.red(`   ✗ Failed: ${result.error}`));
      queue.failed.push({ ...finishedTask, status: "failed" });
    }

    queue.queue = queue.queue.filter(t => t.id !== task.id);
    await writeQueue(queue);

  } catch (e) {
    console.error(chalk.red(`Loop error: ${e.message}`));
  } finally {
    isProcessing = false;
  }
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

// ─── File watcher — react to task-queue.json changes instantly ────────────────
async function watchQueue() {
  const { watch } = await import("chokidar");
  const watcher   = watch(QUEUE_FILE, { persistent: true, ignoreInitial: true });
  watcher.on("change", () => {
    if (!isProcessing) tick();
  });
}

// ─── Start ────────────────────────────────────────────────────────────────────
banner();
watchQueue();
setInterval(tick, INTERVAL_MS);
tick(); // run immediately on start
