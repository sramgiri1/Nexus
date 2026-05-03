// providers/anthropicBatch.js
// Anthropic Message Batches API implementation — DISABLED until ENABLE_REAL_ANTHROPIC_BATCH=true.
// Do not enable until check:model-routing passes and a full safety review is complete.
// Docs: https://docs.anthropic.com/en/docs/build-with-claude/message-batches

const DISABLED_MSG =
  "Real Anthropic Batch is disabled. Set ENABLE_REAL_ANTHROPIC_BATCH=true after safety validation.";

function assertEnabled() {
  if (process.env.ENABLE_REAL_ANTHROPIC_BATCH !== "true") {
    throw new Error(DISABLED_MSG);
  }
}

/**
 * Submit a group of items to the Anthropic Message Batches API.
 * @param {object[]} items — validated batch-queue items
 * @returns {Promise<{ batchId: string }>}
 */
export async function submitAnthropicBatch(items) {
  assertEnabled();
  // TODO: build requests array, call anthropic.messages.batches.create({ requests })
  throw new Error("submitAnthropicBatch: not yet implemented");
}

/**
 * Poll the status of a previously submitted Anthropic batch.
 * @param {string} batchId — provider-assigned batch ID (msgbatch_*)
 * @returns {Promise<{ processingStatus: string, endedAt?: string }>}
 */
export async function pollAnthropicBatch(batchId) {
  assertEnabled();
  // TODO: call anthropic.messages.batches.retrieve(batchId)
  throw new Error("pollAnthropicBatch: not yet implemented");
}

/**
 * Stream and parse results from a completed Anthropic batch.
 * @param {string} batchId — provider-assigned batch ID
 * @returns {Promise<object[]>}
 */
export async function downloadAnthropicBatchResults(batchId) {
  assertEnabled();
  // TODO: call anthropic.messages.batches.results(batchId) and collect stream
  throw new Error("downloadAnthropicBatchResults: not yet implemented");
}
