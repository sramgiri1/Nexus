#!/usr/bin/env node
// scripts/batch-reconcile-openai.js
// Downloads completed OpenAI batch output, validates content, and moves items to
// queue.completed (reconciled / reconciled_requires_review) or queue.failed.

import "dotenv/config";
import fs   from "fs/promises";
import path from "path";
import { writeJsonFileAtomic, updateJsonFile } from "../utils/json-store.js";
import { downloadOpenAIBatchResults } from "../providers/openaiBatch.js";

const ROOT             = process.cwd();
const BATCH_QUEUE_FILE = path.join(ROOT, "memory", "batch-queue.json");
const TASK_QUEUE_FILE  = path.join(ROOT, "memory", "task-queue.json");

// Agents that run verification gates — their results must never pass via batch.
const GATE_AGENTS = new Set(["auditor", "sentinel", "warden"]);

// Task types that are hard-blocked from batch by policy.
const BLOCKED_TASK_TYPES = new Set([
  "verification_gate", "auto_heal", "code_edit", "code_review_fix",
  "deploy", "release_decision", "security_blocker", "tool_loop",
  "migration", "secrets_change", "ci_cd_change", "infra_change", "hotfix",
]);

// Phrases that indicate a safety refusal.
const REFUSAL_PHRASES = [
  "i cannot", "i'm not able to", "i am not able to",
  "as an ai", "i can't assist", "i won't", "i refuse",
  "i'm unable to",
];

// Git-diff markers that reliably identify code-edit output.
const DIFF_MARKERS = ["```diff", "--- a/", "+++ b/", "@@ -", "@@ +"];

/**
 * Classify a single reconcile result into a final status.
 *
 * Rules (checked in order):
 *   1. No result in output → requires_review
 *   2. status_code != 200  → failed
 *   3. Gate agent or blocked task type → requires_review
 *   4. Empty/null content  → requires_review
 *   5. Response is a refusal → requires_review
 *   6. Response contains code-diff markers → requires_review
 *   7. Otherwise → reconciled (ok)
 *
 * @param {{ agentId?: string, taskType?: string }} item
 * @param {object|null} result — parsed JSONL result object from OpenAI output file
 * @returns {{ status: string, note: string }}
 */
export function classifyReconcileOutcome(item, result) {
  if (!result) {
    return { status: "reconciled_requires_review", note: "no result found in output file" };
  }

  const statusCode = result?.response?.status_code ?? result?.status_code ?? null;
  if (statusCode !== 200) {
    return { status: "reconciled_failed", note: `status_code=${statusCode}` };
  }

  // Gate tasks can only pass through deterministic skill results — never via batch LLM output.
  if (GATE_AGENTS.has(item.agentId) || BLOCKED_TASK_TYPES.has(item.taskType)) {
    return {
      status: "reconciled_requires_review",
      note:   "gate/blocked task — result cannot pass a gate; must go through realtime verification",
    };
  }

  const content = result?.response?.body?.choices?.[0]?.message?.content ?? "";

  if (!content || content.trim().length === 0) {
    return { status: "reconciled_requires_review", note: "empty response content" };
  }

  const lower = content.toLowerCase();
  if (REFUSAL_PHRASES.some(p => lower.includes(p))) {
    return { status: "reconciled_requires_review", note: "response contains refusal" };
  }

  // Two or more git-diff markers is a strong signal that the output contains code edits,
  // which must route through realtime (not batch).
  const diffCount = DIFF_MARKERS.filter(m => content.includes(m)).length;
  if (diffCount >= 2) {
    return {
      status: "reconciled_requires_review",
      note:   "response appears to contain code diffs — code edits must go through realtime routing",
    };
  }

  return { status: "reconciled", note: "ok" };
}

async function run() {
  console.log("\n📦 Nexus Batch Reconcile — OpenAI\n");

  let queue;
  try {
    const raw = await fs.readFile(BATCH_QUEUE_FILE, "utf8");
    queue = JSON.parse(raw);
  } catch {
    console.log("  memory/batch-queue.json not found or empty. Nothing to reconcile.\n");
    return;
  }

  const completedItems = (queue.submitted || []).filter(
    i => i.provider === "direct_openai"
      && i.status === "provider_completed"
      && i.providerBatchId
  );

  if (completedItems.length === 0) {
    console.log("  No provider_completed OpenAI items to reconcile.\n");
    return;
  }

  // Group by providerBatchId — one download per unique batch
  const byBatch = {};
  for (const item of completedItems) {
    if (!byBatch[item.providerBatchId]) byBatch[item.providerBatchId] = [];
    byBatch[item.providerBatchId].push(item);
  }

  const toComplete = [];  // reconciled + reconciled_requires_review
  const toFail     = [];  // reconciled_failed

  for (const [providerBatchId, items] of Object.entries(byBatch)) {
    console.log(`  Reconciling ${providerBatchId} (${items.length} item(s))...`);

    let results;
    try {
      results = await downloadOpenAIBatchResults(providerBatchId);
    } catch (err) {
      console.error(`    ✗ Download failed: ${err.message}`);
      continue;
    }

    const resultMap = {};
    for (const r of results) resultMap[r.custom_id] = r;

    for (const item of items) {
      const result  = resultMap[item.id] || null;
      const outcome = classifyReconcileOutcome(item, result);

      item.status         = outcome.status;
      item.reconcileNote  = outcome.note;
      item.reconciledAt   = new Date().toISOString();
      item.providerResult = result;

      if (outcome.status === "reconciled_failed") {
        console.log(`    ✗ ${item.id} → failed (${outcome.note})`);
        toFail.push(item);
      } else if (outcome.status === "reconciled_requires_review") {
        console.log(`    ⚠ ${item.id} → requires_review (${outcome.note})`);
        toComplete.push(item);
      } else {
        console.log(`    ✓ ${item.id} → reconciled`);
        toComplete.push(item);
      }
    }
  }

  if (toComplete.length === 0 && toFail.length === 0) {
    console.log("\n  Nothing reconciled.\n");
    return;
  }

  const reconciledIds = new Set([...toComplete, ...toFail].map(i => i.id));
  queue.submitted = (queue.submitted || []).filter(i => !reconciledIds.has(i.id));
  if (!queue.completed) queue.completed = [];
  if (!queue.failed)    queue.failed    = [];
  queue.completed.push(...toComplete);
  queue.failed.push(...toFail);
  queue.lastUpdated = new Date().toISOString();

  await writeJsonFileAtomic(BATCH_QUEUE_FILE, queue);

  // ── Update original task-queue entries (deferred tasks become completed/failed) ──
  const taskQueueItems = [...toComplete, ...toFail].filter(i => i.originalTaskId);
  if (taskQueueItems.length > 0) {
    try {
      await updateJsonFile(TASK_QUEUE_FILE, async (tq) => {
        for (const item of taskQueueItems) {
          const idx = tq.queue.findIndex(t => t.id === item.originalTaskId);
          if (idx === -1) continue;
          const original = tq.queue[idx];
          if (item.status === "reconciled") {
            tq.queue.splice(idx, 1);
            tq.completed.push({ ...original, status: "completed", batchReconciledAt: item.reconciledAt, batchItemId: item.id });
          } else if (item.status === "reconciled_failed") {
            tq.queue.splice(idx, 1);
            tq.failed.push({ ...original, status: "failed", batchReconciledAt: item.reconciledAt, batchItemId: item.id, reconcileNote: item.reconcileNote });
          }
          // reconciled_requires_review → leave task as deferred for human review
        }
        tq.lastUpdated = new Date().toISOString();
        return tq;
      });
    } catch {
      // task-queue.json may not exist or have no matching tasks — non-fatal
    }
  }

  const reviewCount = toComplete.filter(i => i.status === "reconciled_requires_review").length;
  const okCount     = toComplete.filter(i => i.status === "reconciled").length;
  console.log(`\n  ✓ reconciled: ${okCount}  requires_review: ${reviewCount}  failed: ${toFail.length}\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
