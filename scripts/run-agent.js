#!/usr/bin/env node
// scripts/run-agent.js — run an agent directly (bypasses queue)
// Usage: node scripts/run-agent.js <agentId> "<task>" [projectId]
import "dotenv/config";
import chalk from "chalk";
import { runAgent } from "../orchestrator/runner.js";

const [,, agentId, task, projectId] = process.argv;
if (!agentId || !task) {
  console.error("Usage: node scripts/run-agent.js <agentId> \"<task>\" [projectId]");
  process.exit(1);
}

console.log(chalk.cyan(`\n⚡ Running ${agentId.toUpperCase()} directly...`));
console.log(chalk.dim(`   Task: ${task}\n`));

const result = await runAgent(agentId, task, { projectId: projectId || null });

if (result.success) {
  console.log(chalk.green(`\n✓ Complete (${result.toolCallCount} tool calls)`));
  if (result.output) { console.log(chalk.bold("\nOutput:")); console.log(result.output); }
} else {
  console.log(chalk.red(`\n✗ Failed: ${result.error}`));
}
