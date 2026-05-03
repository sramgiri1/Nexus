#!/usr/bin/env node
// scripts/task.js
// Add a task to the NEXUS queue from the command line.
//
// Usage:
//   node scripts/task.js <agentId> "<task>" [projectId] [priority]
//
// Examples:
//   node scripts/task.js atlas "Write the ShiftPay PRD Section 7 API Contract" shiftpay high
//   node scripts/task.js nexus "Give me a full portfolio status report" null normal
//   node scripts/task.js core "Generate Prisma schema for ShiftPay" shiftpay critical

import "dotenv/config";
import path from "path";
import { updateJsonFile } from "../utils/json-store.js";

const ROOT      = process.cwd();
const QUEUE     = path.join(ROOT, "memory", "task-queue.json");
const [,, agentId, task, projectId, priority = "normal"] = process.argv;

const VALID_AGENTS = ["nexus","atlas","prism","forge","core","swift","sentinel","beacon","compass","oracle","canvas","stream","synapse","radar","meridian","pixel"];
const VALID_PRIO   = ["critical","high","normal","low"];

if (!agentId || !task) {
  console.error(`Usage: node scripts/task.js <agentId> "<task>" [projectId] [priority]`);
  console.error(`Agents: ${VALID_AGENTS.join(", ")}`);
  process.exit(1);
}

if (!VALID_AGENTS.includes(agentId)) {
  console.error(`Unknown agent: ${agentId}. Valid: ${VALID_AGENTS.join(", ")}`);
  process.exit(1);
}

const prio = VALID_PRIO.includes(priority) ? priority : "normal";
const newTask = {
  id:        `task-${Date.now()}`,
  agentId,
  task,
  projectId: projectId && projectId !== "null" ? projectId : null,
  priority:  prio,
  context:   {},
  createdAt: new Date().toISOString(),
  status:    "pending",
};

await updateJsonFile(QUEUE, async (data) => {
  data.queue.push(newTask);
  data.queue.sort((a,b) => {
    const order = { critical:0, high:1, normal:2, low:3 };
    return (order[a.priority]||2) - (order[b.priority]||2);
  });
  data.lastUpdated = new Date().toISOString();
  return data;
});

console.log(`✓ Task queued [${prio.toUpperCase()}]`);
console.log(`  Agent:   ${agentId.toUpperCase()}`);
console.log(`  Task:    ${task}`);
if (newTask.projectId) console.log(`  Project: ${newTask.projectId}`);
console.log(`  ID:      ${newTask.id}`);
console.log(`\n  The orchestrator loop will pick this up within ${process.env.LOOP_INTERVAL || 10}s.`);
