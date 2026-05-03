// providers/openaiBatch.js
// OpenAI Batch API — disabled by default (ENABLE_REAL_OPENAI_BATCH=false).
// Docs: https://platform.openai.com/docs/guides/batch

import OpenAI, { toFile } from "openai";
import fs   from "fs/promises";
import path from "path";
import { authorizeAction, secretGuard } from "../safety/governor.js";

const BATCH_POLICY_FILE = path.join(process.cwd(), "config", "batch-policy.json");

let _batchPolicyCache = null;
async function loadBatchPolicy() {
  if (_batchPolicyCache) return _batchPolicyCache;
  try {
    const raw = await fs.readFile(BATCH_POLICY_FILE, "utf8");
    _batchPolicyCache = JSON.parse(raw);
    return _batchPolicyCache;
  } catch { return null; }
}

const DISABLED_MSG =
  "Real OpenAI Batch is disabled. Set ENABLE_REAL_OPENAI_BATCH=true after safety validation.";

function assertEnabled() {
  if (process.env.ENABLE_REAL_OPENAI_BATCH !== "true") {
    throw new Error(DISABLED_MSG);
  }
}

function getClient(injected) {
  if (injected) return injected;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

/**
 * Build a JSONL string from batch queue items.
 * Each item must have safeSerializedRequest.messages and a model field.
 * @param {object[]} items
 * @returns {string}
 */
export function buildBatchJsonl(items) {
  const lines = [];
  for (const item of items) {
    const req = item.safeSerializedRequest;
    if (!req?.messages?.length) {
      throw new Error(`Item ${item.id} missing safeSerializedRequest.messages`);
    }
    lines.push(JSON.stringify({
      custom_id: item.id,
      method:    "POST",
      url:       "/v1/chat/completions",
      body: {
        model:      req.model || item.model,
        messages:   req.messages,
        max_tokens: req.maxTokens || 2048,
      },
    }));
  }
  return lines.join("\n");
}

/**
 * Submit a group of items to the OpenAI Batch API.
 * @param {object[]} items — validated batch-queue items (provider=direct_openai)
 * @param {{ client?: object }} opts
 * @returns {Promise<{ providerBatchId: string, inputFileId: string }>}
 */
export async function submitOpenAIBatch(items, { client } = {}) {
  assertEnabled();

  if (!items?.length) throw new Error("submitOpenAIBatch: no items provided");

  // ── Cost guard (re-checked here so the function is safe regardless of caller) ──
  const batchPolicy = await loadBatchPolicy();
  const maxCost  = batchPolicy?.maxBatchCostUsd    ?? 1.0;
  const discount = batchPolicy?.discountMultiplier ?? 0.5;
  const totalEstimated = items.reduce((s, i) => s + (i.estimatedCostUsd || 0), 0) * discount;
  if (totalEstimated > maxCost) {
    throw new Error(
      `[SAFETY] Batch estimated cost $${totalEstimated.toFixed(4)} exceeds MAX_BATCH_COST_USD ($${maxCost})`
    );
  }

  // ── Governor check (re-checked here so the function is safe regardless of caller) ──
  const govCheck = await authorizeAction({
    agentId:         items[0].agentId || "loop",
    actionType:      "llm_call",
    provider:        "direct_openai",
    model:           items[0].model,
    executionMode:   "batch",
    taskType:        items[0].taskType,
    estimatedTokens: items.reduce((s, i) => s + (i.estimatedTokens || 0), 0),
    estimatedCost:   totalEstimated,
  });
  if (!govCheck.allowed) {
    throw new Error(`[SAFETY] Governor blocked batch submission: ${govCheck.reason}`);
  }

  const jsonl = buildBatchJsonl(items);

  // Secret scan before upload — no API keys or tokens in the JSONL payload
  const scan = secretGuard.check(jsonl, "openai-batch-upload");
  if (!scan.allowed) {
    throw new Error(`[SAFETY] Batch JSONL blocked by secret scan: ${scan.reason}`);
  }

  const oa = getClient(client);

  const fileBlob = await toFile(Buffer.from(jsonl, "utf8"), "batch.jsonl", {
    type: "application/jsonl",
  });

  const uploadedFile = await oa.files.create({
    file:    fileBlob,
    purpose: "batch",
  });

  const batch = await oa.batches.create({
    input_file_id:     uploadedFile.id,
    endpoint:          "/v1/chat/completions",
    completion_window: "24h",
  });

  return { providerBatchId: batch.id, inputFileId: uploadedFile.id };
}

/**
 * Poll the status of a previously submitted OpenAI batch.
 * @param {string} providerBatchId
 * @param {{ client?: object }} opts
 * @returns {Promise<{ providerStatus, outputFileId, errorFileId, requestCounts }>}
 */
export async function pollOpenAIBatch(providerBatchId, { client } = {}) {
  assertEnabled();

  const oa    = getClient(client);
  const batch = await oa.batches.retrieve(providerBatchId);

  return {
    providerStatus: batch.status,
    outputFileId:   batch.output_file_id || null,
    errorFileId:    batch.error_file_id  || null,
    requestCounts:  batch.request_counts || null,
  };
}

/**
 * Download and parse completed output from an OpenAI batch.
 * @param {string} providerBatchId
 * @param {{ client?: object }} opts
 * @returns {Promise<object[]>} — parsed JSONL result objects
 */
export async function downloadOpenAIBatchResults(providerBatchId, { client } = {}) {
  assertEnabled();

  const oa    = getClient(client);
  const batch = await oa.batches.retrieve(providerBatchId);

  if (!batch.output_file_id) {
    throw new Error(
      `Batch ${providerBatchId} has no output_file_id yet (status: ${batch.status})`
    );
  }

  const fileContent = await oa.files.content(batch.output_file_id);
  const text        = await fileContent.text();

  return text.trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
}
