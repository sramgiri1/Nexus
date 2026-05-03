#!/usr/bin/env node
// scripts/batch-status.js
// Prints lifecycle state counts from memory/batch-queue.json.
// Makes no API calls.

import "dotenv/config";
import fs   from "fs/promises";
import path from "path";
import { BATCH_LIFECYCLE_STATES } from "../providers/batchConstants.js";

const ROOT             = process.cwd();
const BATCH_QUEUE_FILE = path.join(ROOT, "memory", "batch-queue.json");

// All items live in one of four top-level arrays (queue, submitted, completed, failed).
// Within each, the item.status field tracks the fine-grained lifecycle state.
function collectAllItems(queue) {
  return [
    ...(queue.queue     || []),
    ...(queue.submitted || []),
    ...(queue.completed || []),
    ...(queue.failed    || []),
  ];
}

async function run() {
  console.log("\n📦 Nexus Batch Status\n");

  let queue;
  try {
    const raw = await fs.readFile(BATCH_QUEUE_FILE, "utf8");
    queue = JSON.parse(raw);
  } catch {
    console.log("  memory/batch-queue.json not found or empty.");
    return;
  }

  const all = collectAllItems(queue);

  // Count by lifecycle state
  const counts = {};
  for (const state of BATCH_LIFECYCLE_STATES) counts[state] = 0;
  for (const item of all) {
    const s = item.status || "batch_pending";
    counts[s] = (counts[s] || 0) + 1;
  }

  console.log("  Lifecycle state counts:");
  for (const state of BATCH_LIFECYCLE_STATES) {
    const n = counts[state] || 0;
    const marker = n > 0 ? "●" : "○";
    console.log(`    ${marker} ${state.padEnd(24)} ${n}`);
  }

  // Legacy top-level array totals (for backward compat display)
  console.log(`\n  Queue arrays:`);
  console.log(`    queue.queue:      ${(queue.queue     || []).length}`);
  console.log(`    queue.submitted:  ${(queue.submitted || []).length}`);
  console.log(`    queue.completed:  ${(queue.completed || []).length}`);
  console.log(`    queue.failed:     ${(queue.failed    || []).length}`);
  console.log(`    Last updated:     ${queue.lastUpdated || "never"}\n`);

  // Detail pending items
  const pending = (queue.queue || []).filter(i => i.status === "batch_pending");
  if (pending.length > 0) {
    console.log("  Pending items:");
    for (const item of pending) {
      console.log(`    [${item.id}] ${item.agentId} / ${item.provider} / ${item.model} — ${item.taskType}`);
    }
    console.log();
  }

  // Detail submitted items grouped by batchId
  const submitted = (queue.submitted || []);
  if (submitted.length > 0) {
    console.log("  Submitted batches:");
    const byBatch = {};
    for (const item of submitted) {
      const bid = item.batchId || "unknown";
      if (!byBatch[bid]) byBatch[bid] = [];
      byBatch[bid].push(item);
    }
    for (const [batchId, items] of Object.entries(byBatch)) {
      const est   = items.reduce((s, i) => s + (i.estimatedCostUsd || 0), 0);
      const state = items[0].status || "?";
      const isDry = batchId.startsWith("dryrun-batch-");
      console.log(`    ${batchId}`);
      console.log(`      items: ${items.length}  state: ${state}  est: $${est.toFixed(4)}  dry-run: ${isDry}`);
    }
    console.log();
  }

  // Provider flag status
  console.log("  Feature flags:");
  console.log(`    ENABLE_REAL_OPENAI_BATCH:     ${process.env.ENABLE_REAL_OPENAI_BATCH     || "false (default)"}`);
  console.log(`    ENABLE_REAL_ANTHROPIC_BATCH:  ${process.env.ENABLE_REAL_ANTHROPIC_BATCH  || "false (default)"}`);
  console.log(`    ENABLE_OPENROUTER_LIVE_SMOKE: ${process.env.ENABLE_OPENROUTER_LIVE_SMOKE || "false (default)"}`);
  console.log();
  console.log("  NOTE: Real provider batch polling not yet implemented.");
  console.log("        Enable with ENABLE_REAL_OPENAI_BATCH=true after safety validation.\n");
}

run().catch(e => { console.error(e); process.exit(1); });
