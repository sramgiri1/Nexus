#!/usr/bin/env node
// scripts/batch-submit.js
// Groups pending batch tasks by provider/model, validates them, and processes them.
// Currently operates in DRY-RUN mode only — no real provider batch API is called.
// Real submission is gated behind ENABLE_REAL_OPENAI_BATCH / ENABLE_REAL_ANTHROPIC_BATCH.

import "dotenv/config";
import fs   from "fs/promises";
import path from "path";
import { authorizeAction, secretGuard } from "../safety/governor.js";
import { DRY_RUN_STATUS, DRY_RUN_BATCH_PREFIX } from "../providers/batchConstants.js";
import { submitOpenAIBatch } from "../providers/openaiBatch.js";

export { DRY_RUN_STATUS, DRY_RUN_BATCH_PREFIX };

const ROOT              = process.cwd();
const BATCH_QUEUE_FILE  = path.join(ROOT, "memory", "batch-queue.json");
const BATCH_POLICY_FILE = path.join(ROOT, "config", "batch-policy.json");
const PROV_POLICY_FILE  = path.join(ROOT, "config", "provider-policy.json");

async function readJson(file) {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function writeJson(file, data) {
  data.lastUpdated = new Date().toISOString();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function isRealBatchEnabled(provider) {
  if (provider === "direct_openai")   return process.env.ENABLE_REAL_OPENAI_BATCH    === "true";
  if (provider === "direct_anthropic") return process.env.ENABLE_REAL_ANTHROPIC_BATCH === "true";
  return false;
}

async function run() {
  console.log("\n📦 Nexus Batch Submit\n");

  const batchPolicy = await readJson(BATCH_POLICY_FILE).catch(() => null);
  if (!batchPolicy?.enabled) {
    console.log("  Batch processing is disabled (config/batch-policy.json → enabled: false)");
    return;
  }

  let queue;
  try {
    queue = await readJson(BATCH_QUEUE_FILE);
  } catch {
    console.log("  No batch queue found at memory/batch-queue.json");
    return;
  }

  const pending = (queue.queue || []).filter(item => item.status === "batch_pending");
  if (pending.length === 0) {
    console.log("  No pending batch items.");
    return;
  }

  console.log(`  Found ${pending.length} pending batch item(s)\n`);

  // Group by provider/model
  const groups = {};
  for (const item of pending) {
    const key = `${item.provider}/${item.model}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  const allowedProviders = new Set(["direct_openai", "direct_anthropic"]);
  const processedIds = new Set();
  let totalCost = 0;
  let realSubmittedCount = 0;

  for (const [key, items] of Object.entries(groups)) {
    const provider = items[0].provider;

    console.log(`  Group: ${key} (${items.length} items)`);

    // Only direct providers
    if (!allowedProviders.has(provider)) {
      console.log(`    ✗ Skipped — '${provider}' is not a supported batch provider`);
      if (provider === "openrouter") {
        console.log(`      OpenRouter chat batch is not supported (openRouterChatBatchSupported: false)`);
      }
      continue;
    }

    // Cost check — estimatedDiscountedCostUsd is already the batch-discounted cost; no further multiply
    const groupCost = items.reduce((sum, i) => sum + (i.estimatedDiscountedCostUsd ?? i.estimatedCostUsd ?? 0), 0);
    if (totalCost + groupCost > batchPolicy.maxBatchCostUsd) {
      console.log(`    ✗ Skipped — would exceed maxBatchCostUsd ($${batchPolicy.maxBatchCostUsd})`);
      continue;
    }

    // Size check
    if (items.length > batchPolicy.maxBatchItems) {
      console.log(`    ✗ Skipped — ${items.length} items exceeds maxBatchItems (${batchPolicy.maxBatchItems})`);
      continue;
    }

    // Secret scan each item before any processing
    let clean = true;
    for (const item of items) {
      const serialized = JSON.stringify(item.safeSerializedRequest || {});
      const scan = secretGuard.check(serialized, `batch-item-${item.id}`);
      if (!scan.allowed) {
        console.log(`    ✗ Item ${item.id} blocked by secret scan: ${scan.reason}`);
        clean = false;
      }
    }
    if (!clean) continue;

    // Governor check
    const check = await authorizeAction({
      agentId:         "loop",
      actionType:      "llm_call",
      provider,
      model:           items[0].model,
      executionMode:   "batch",
      taskType:        items[0].taskType,
      estimatedTokens: items.reduce((s, i) => s + (i.estimatedTokens || 0), 0),
      estimatedCost:   groupCost,
    });
    if (!check.allowed) {
      console.log(`    ✗ Governor blocked: ${check.reason}`);
      continue;
    }

    totalCost += groupCost;

    // ── Real provider submission ──────────────────────────────────────────────
    if (isRealBatchEnabled(provider)) {
      if (provider === "direct_openai") {
        try {
          const { providerBatchId, inputFileId } = await submitOpenAIBatch(items);
          console.log(`    ✓ Real batch: ${items.length} item(s) → ${providerBatchId}`);
          for (const item of items) {
            item.status          = "provider_submitted";
            item.providerBatchId = providerBatchId;
            item.inputFileId     = inputFileId;
            item.submittedAt     = new Date().toISOString();
            processedIds.add(item.id);
          }
          realSubmittedCount += items.length;
        } catch (err) {
          console.error(`    ✗ submitOpenAIBatch failed: ${err.message}`);
          // items stay batch_pending — eligible for retry on next batch:submit run
        }
      } else {
        console.log(`    ⚠ Real batch for ${provider} not yet implemented`);
      }
      continue;
    }

    // ── DRY-RUN path ──────────────────────────────────────────────────────────
    const dryRunBatchId = `${DRY_RUN_BATCH_PREFIX}${Date.now()}`;
    console.log(`    ✓ DRY-RUN: ${items.length} item(s) → ${dryRunBatchId}`);
    console.log(`      Estimated cost (with ${batchPolicy.discountMultiplier * 100}% discount): $${groupCost.toFixed(4)}`);

    for (const item of items) {
      item.status      = DRY_RUN_STATUS;
      item.batchId     = dryRunBatchId;
      item.submittedAt = new Date().toISOString();
      processedIds.add(item.id);
    }
  }

  if (processedIds.size === 0) {
    console.log("\n  No items processed.\n");
    return;
  }

  // Move processed items from queue.queue → queue.submitted
  const processed = (queue.queue || []).filter(i => processedIds.has(i.id));
  queue.queue = (queue.queue || []).filter(i => !processedIds.has(i.id));
  if (!queue.submitted) queue.submitted = [];
  queue.submitted.push(...processed);

  await writeJson(BATCH_QUEUE_FILE, queue);

  console.log(`\n  ✓ Moved ${processed.length} item(s) to submitted list`);
  for (const line of formatBatchFooter(realSubmittedCount)) {
    console.log(`  ${line}`);
  }
  console.log();
}

export function formatBatchFooter(realSubmittedCount) {
  if (realSubmittedCount > 0) {
    return [`Real provider batch submission completed for ${realSubmittedCount} item(s).`];
  }
  return [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "DRY-RUN batch submission only. No provider batch API was called.",
    `Status set to: ${DRY_RUN_STATUS}`,
    "To enable real submission: set ENABLE_REAL_OPENAI_BATCH=true or",
    "ENABLE_REAL_ANTHROPIC_BATCH=true after safety validation.",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ];
}

run().catch(e => { console.error(e); process.exit(1); });
