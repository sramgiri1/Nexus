#!/usr/bin/env node
// scripts/batch-poll-openai.js
// Polls provider_submitted direct_openai batches and updates lifecycle state.
// Safe to run repeatedly — no-ops if nothing needs polling.

import "dotenv/config";
import fs   from "fs/promises";
import path from "path";
import { writeJsonFileAtomic } from "../utils/json-store.js";
import { pollOpenAIBatch }     from "../providers/openaiBatch.js";

const ROOT             = process.cwd();
const BATCH_QUEUE_FILE = path.join(ROOT, "memory", "batch-queue.json");

// Map OpenAI provider statuses to Nexus lifecycle states
const STATUS_MAP = {
  completed:   "provider_completed",
  failed:      "provider_failed",
  expired:     "provider_failed",
  cancelled:   "provider_failed",
  cancelling:  "provider_processing",
  validating:  "provider_processing",
  in_progress: "provider_processing",
  finalizing:  "provider_processing",
};

async function run() {
  console.log("\n📦 Nexus Batch Poll — OpenAI\n");

  let queue;
  try {
    const raw = await fs.readFile(BATCH_QUEUE_FILE, "utf8");
    queue = JSON.parse(raw);
  } catch {
    console.log("  memory/batch-queue.json not found or empty. Nothing to poll.\n");
    return;
  }

  const submitted = (queue.submitted || []).filter(
    i => i.provider === "direct_openai"
      && i.status === "provider_submitted"
      && i.providerBatchId
  );

  if (submitted.length === 0) {
    console.log("  No provider_submitted OpenAI items to poll.\n");
    return;
  }

  // Group by providerBatchId — one API call per unique batch
  const byBatch = {};
  for (const item of submitted) {
    if (!byBatch[item.providerBatchId]) byBatch[item.providerBatchId] = [];
    byBatch[item.providerBatchId].push(item);
  }

  let anyUpdated = false;

  for (const [providerBatchId, items] of Object.entries(byBatch)) {
    console.log(`  Polling ${providerBatchId} (${items.length} item(s))...`);
    try {
      const poll      = await pollOpenAIBatch(providerBatchId);
      const newStatus = STATUS_MAP[poll.providerStatus] || "provider_processing";

      console.log(`    status: ${poll.providerStatus} → ${newStatus}`);
      if (poll.requestCounts) {
        const c = poll.requestCounts;
        console.log(`    counts: total=${c.total} completed=${c.completed} failed=${c.failed}`);
      }

      for (const item of items) {
        if (item.status !== newStatus) {
          item.status         = newStatus;
          item.providerStatus = poll.providerStatus;
          item.outputFileId   = poll.outputFileId || item.outputFileId || null;
          item.errorFileId    = poll.errorFileId  || item.errorFileId  || null;
          item.lastPolledAt   = new Date().toISOString();
          anyUpdated = true;
        }
      }
    } catch (err) {
      console.error(`    ✗ Poll failed: ${err.message}`);
    }
  }

  if (!anyUpdated) {
    console.log("\n  No status changes.\n");
    return;
  }

  queue.lastUpdated = new Date().toISOString();
  await writeJsonFileAtomic(BATCH_QUEUE_FILE, queue);
  console.log("\n  ✓ Batch queue updated.\n");
}

run().catch(e => { console.error(e); process.exit(1); });
