#!/usr/bin/env node
// scripts/status.js — print NEXUS system status
import "dotenv/config";
import fs    from "fs/promises";
import path  from "path";
import chalk from "chalk";

const ROOT = process.cwd();
const mem  = f => path.join(ROOT, "memory", f);

const agents  = JSON.parse(await fs.readFile(mem("agent-status.json"), "utf8"));
const queue   = JSON.parse(await fs.readFile(mem("task-queue.json"),   "utf8"));
const port    = JSON.parse(await fs.readFile(mem("portfolio.json"),    "utf8"));
const actions = JSON.parse(await fs.readFile(mem("founder-actions.json"), "utf8"));

const STATUS_ICON = { active:"🟢", idle:"⚪", blocked:"🔴", done:"✅", working:"🟡" };
const PRIO_COLOR  = { CRITICAL: chalk.red, HIGH: chalk.yellow, MEDIUM: chalk.blue, LOW: chalk.dim };

console.log(chalk.cyan(`\n╔══════════════════════════════════════════╗`));
console.log(chalk.cyan(`║         NEXUS STATUS REPORT              ║`));
console.log(chalk.cyan(`╚══════════════════════════════════════════╝`));
console.log(chalk.dim(`  ${new Date().toLocaleString()}\n`));

// Portfolio
console.log(chalk.bold.cyan("  PORTFOLIO"));
for (const proj of port.projects) {
  const gatesDone  = Object.values(proj.gates).filter(v=>v==="done").length;
  const gatesTotal = Object.keys(proj.gates).length;
  console.log(`  ${proj.name.padEnd(12)} ${proj.stage.padEnd(12)} Gate ${proj.gate}  ${gatesDone}/${gatesTotal} gates  Score ${proj.score}/50  TAM ${proj.tam}`);
}

// Agent network
console.log(chalk.bold.cyan("\n  AGENT NETWORK"));
for (const [id, a] of Object.entries(agents.agents)) {
  const icon = STATUS_ICON[a.status] || "⚪";
  const status = a.status.padEnd(8).toUpperCase();
  const proj = a.project ? chalk.dim(` [${a.project}]`) : "";
  console.log(`  ${icon} ${id.toUpperCase().padEnd(10)} ${chalk.dim(status)} ${a.task.slice(0,55)}${proj}`);
}

// Task queue
console.log(chalk.bold.cyan("\n  TASK QUEUE"));
const pending = queue.queue.filter(t=>t.status==="pending");
if (pending.length === 0) {
  console.log(chalk.dim("  No pending tasks."));
} else {
  for (const t of pending) {
    const pColor = PRIO_COLOR[t.priority?.toUpperCase()] || chalk.white;
    console.log(`  ${pColor(`[${(t.priority||"normal").toUpperCase()}]`)} ${t.agentId.toUpperCase().padEnd(10)} ${t.task.slice(0,50)}`);
  }
}

// Founder actions
const pending_actions = actions.actions.filter(a=>!a.done);
console.log(chalk.bold.cyan("\n  FOUNDER DIRECTIVES") + chalk.dim(` (${pending_actions.length} pending)`));
for (const a of pending_actions.slice(0,5)) {
  const pColor = PRIO_COLOR[a.priority] || chalk.white;
  console.log(`  ${pColor(`[${a.priority}]`.padEnd(10))} ${a.text}`);
}
if (pending_actions.length > 5) console.log(chalk.dim(`  ... and ${pending_actions.length-5} more`));

console.log(chalk.dim(`\n  Completed tasks: ${queue.completed.length}  Failed: ${queue.failed.length}\n`));
