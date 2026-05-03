#!/usr/bin/env node
// scripts/check-openai-batch.js
// Non-network safety and correctness tests for the OpenAI Batch implementation.
// All provider calls use injected mock clients — zero real API calls.

import "dotenv/config";
import assert from "assert";
import {
  buildBatchJsonl,
  submitOpenAIBatch,
  pollOpenAIBatch,
  downloadOpenAIBatchResults,
} from "../providers/openaiBatch.js";
import { classifyReconcileOutcome } from "./batch-reconcile-openai.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${label}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

async function checkAsync(label, fn) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${label}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ITEM_A = {
  id:       "batch-relay-111-aaaa",
  agentId:  "relay",
  provider: "direct_openai",
  model:    "gpt-4o-mini",
  taskType: "report_summary",
  estimatedCostUsd: 0.001,
  estimatedTokens:  200,
  safeSerializedRequest: {
    model:     "gpt-4o-mini",
    maxTokens: 512,
    messages: [
      { role: "system", content: "You are RELAY, a reporting agent." },
      { role: "user",   content: "TASK: Write a weekly summary." },
    ],
  },
};

const ITEM_B = {
  id:       "batch-beacon-222-bbbb",
  agentId:  "beacon",
  provider: "direct_openai",
  model:    "gpt-4o-mini",
  taskType: "marketing_copy",
  estimatedCostUsd: 0.002,
  estimatedTokens:  400,
  safeSerializedRequest: {
    model:     "gpt-4o-mini",
    maxTokens: 1024,
    messages: [
      { role: "system", content: "You are BEACON, a growth agent." },
      { role: "user",   content: "TASK: Write marketing copy for CareLoop." },
    ],
  },
};

const ITEM_NO_MESSAGES = {
  id:       "batch-bad-333-cccc",
  provider: "direct_openai",
  model:    "gpt-4o-mini",
  safeSerializedRequest: { model: "gpt-4o-mini" },
};

function makeGateItem(agentId, taskType) {
  return {
    id:               `batch-${agentId}-gate-ffff`,
    agentId,
    provider:         "direct_openai",
    model:            "gpt-4o",
    taskType,
    estimatedCostUsd: 0.001,
    estimatedTokens:  100,
    safeSerializedRequest: {
      model:     "gpt-4o",
      maxTokens: 512,
      messages: [
        { role: "system", content: `You are ${agentId.toUpperCase()}.` },
        { role: "user",   content: "TASK: Run gate check." },
      ],
    },
  };
}

// ── Mock client ───────────────────────────────────────────────────────────────

function makeMockClient({
  fileCreateResult    = { id: "file-mock-upload-001" },
  batchCreateResult   = { id: "batch-mock-001", status: "validating" },
  batchRetrieveStatus = "completed",
  outputFileId        = "file-mock-out-002",
  outputJsonl         = null,
} = {}) {
  return {
    files: {
      create:  async () => fileCreateResult,
      content: async () => ({
        text: async () => outputJsonl ?? [
          JSON.stringify({ custom_id: ITEM_A.id, response: { status_code: 200, body: { choices: [{ message: { content: "summary text" } }] } } }),
          JSON.stringify({ custom_id: ITEM_B.id, response: { status_code: 200, body: { choices: [{ message: { content: "marketing copy" } }] } } }),
        ].join("\n"),
      }),
    },
    batches: {
      create:   async () => batchCreateResult,
      retrieve: async (id) => ({
        id,
        status:         batchRetrieveStatus,
        output_file_id: batchRetrieveStatus === "completed" ? outputFileId : null,
        error_file_id:  null,
        request_counts: { total: 2, completed: batchRetrieveStatus === "completed" ? 2 : 0, failed: 0 },
      }),
    },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("\n📦 check-openai-batch\n");

  const origFlag = process.env.ENABLE_REAL_OPENAI_BATCH;

  // ══════════════════════════════════════════════════════════════════════════
  // A. Feature flag — default off
  // ══════════════════════════════════════════════════════════════════════════

  delete process.env.ENABLE_REAL_OPENAI_BATCH;

  await checkAsync("A-1  submitOpenAIBatch throws when ENABLE_REAL_OPENAI_BATCH is unset", async () => {
    try {
      await submitOpenAIBatch([ITEM_A], { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(
        err.message.includes("disabled") || err.message.includes("ENABLE_REAL_OPENAI_BATCH"),
        `unexpected error: ${err.message}`
      );
    }
  });

  await checkAsync("A-2  pollOpenAIBatch throws when flag is unset", async () => {
    try {
      await pollOpenAIBatch("batch-test", { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err.message.includes("disabled") || err.message.includes("ENABLE_REAL_OPENAI_BATCH"));
    }
  });

  await checkAsync("A-3  downloadOpenAIBatchResults throws when flag is unset", async () => {
    try {
      await downloadOpenAIBatchResults("batch-test", { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err.message.includes("disabled") || err.message.includes("ENABLE_REAL_OPENAI_BATCH"));
    }
  });

  check("A-4  ENABLE_REAL_OPENAI_BATCH defaults to false (not 'true')", () => {
    assert.notStrictEqual(process.env.ENABLE_REAL_OPENAI_BATCH, "true",
      "flag must not be true in the default environment");
  });

  // Enable flag for all remaining tests
  process.env.ENABLE_REAL_OPENAI_BATCH = "true";

  // ══════════════════════════════════════════════════════════════════════════
  // B. buildBatchJsonl — pure function
  // ══════════════════════════════════════════════════════════════════════════

  check("B-1  produces valid JSONL for two items", () => {
    const jsonl  = buildBatchJsonl([ITEM_A, ITEM_B]);
    const lines  = jsonl.trim().split("\n");
    assert.strictEqual(lines.length, 2);
    const a = JSON.parse(lines[0]);
    const b = JSON.parse(lines[1]);
    assert.strictEqual(a.custom_id, ITEM_A.id);
    assert.strictEqual(b.custom_id, ITEM_B.id);
    assert.strictEqual(a.method, "POST");
    assert.strictEqual(a.url, "/v1/chat/completions");
  });

  check("B-2  embeds model and max_tokens from safeSerializedRequest", () => {
    const entry = JSON.parse(buildBatchJsonl([ITEM_A]));
    assert.strictEqual(entry.body.model, "gpt-4o-mini");
    assert.strictEqual(entry.body.max_tokens, 512);
  });

  check("B-3  includes both system and user messages", () => {
    const entry = JSON.parse(buildBatchJsonl([ITEM_A]));
    assert.strictEqual(entry.body.messages.length, 2);
    assert.strictEqual(entry.body.messages[0].role, "system");
    assert.strictEqual(entry.body.messages[1].role, "user");
  });

  check("B-4  throws when messages array is missing", () => {
    assert.throws(
      () => buildBatchJsonl([ITEM_NO_MESSAGES]),
      /missing safeSerializedRequest\.messages/
    );
  });

  check("B-5  JSONL contains no API key patterns", () => {
    const jsonl = buildBatchJsonl([ITEM_A, ITEM_B]);
    assert.ok(!jsonl.includes("sk-"),           "JSONL must not contain 'sk-'");
    assert.ok(!jsonl.includes("OPENAI_API_KEY"), "JSONL must not reference env var names");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // C. submitOpenAIBatch — mock client, happy path
  // ══════════════════════════════════════════════════════════════════════════

  await checkAsync("C-1  returns providerBatchId and inputFileId", async () => {
    const mock = makeMockClient({
      fileCreateResult:  { id: "file-upload-001" },
      batchCreateResult: { id: "batch-prov-001", status: "validating" },
    });
    const result = await submitOpenAIBatch([ITEM_A, ITEM_B], { client: mock });
    assert.strictEqual(result.providerBatchId, "batch-prov-001");
    assert.strictEqual(result.inputFileId,     "file-upload-001");
  });

  await checkAsync("C-2  calls files.create with purpose=batch", async () => {
    let capturedPurpose;
    const mock = makeMockClient();
    mock.files.create = async ({ purpose }) => { capturedPurpose = purpose; return { id: "f" }; };
    await submitOpenAIBatch([ITEM_A], { client: mock });
    assert.strictEqual(capturedPurpose, "batch");
  });

  await checkAsync("C-3  calls batches.create with endpoint=/v1/chat/completions", async () => {
    let capturedEndpoint;
    const mock = makeMockClient();
    mock.batches.create = async ({ endpoint }) => { capturedEndpoint = endpoint; return { id: "b", status: "validating" }; };
    await submitOpenAIBatch([ITEM_A], { client: mock });
    assert.strictEqual(capturedEndpoint, "/v1/chat/completions");
  });

  await checkAsync("C-4  calls batches.create with completion_window=24h", async () => {
    let capturedWindow;
    const mock = makeMockClient();
    mock.batches.create = async ({ completion_window }) => { capturedWindow = completion_window; return { id: "b", status: "validating" }; };
    await submitOpenAIBatch([ITEM_A], { client: mock });
    assert.strictEqual(capturedWindow, "24h");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // D. Secret scan — blocked in userMessage, systemPrompt, messages array
  // ══════════════════════════════════════════════════════════════════════════

  await checkAsync("D-1  blocks OpenAI key in user message", async () => {
    const item = {
      ...ITEM_A,
      safeSerializedRequest: {
        ...ITEM_A.safeSerializedRequest,
        messages: [
          { role: "system", content: "You are RELAY." },
          { role: "user",   content: "key: sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz" },
        ],
      },
    };
    try {
      await submitOpenAIBatch([item], { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(
        err.message.includes("[SAFETY]") || err.message.includes("secret") || err.message.includes("blocked"),
        `unexpected: ${err.message}`
      );
    }
  });

  await checkAsync("D-2  blocks Anthropic key in system prompt", async () => {
    const item = {
      ...ITEM_A,
      safeSerializedRequest: {
        ...ITEM_A.safeSerializedRequest,
        messages: [
          { role: "system", content: "ANTHROPIC_API_KEY=sk-ant-api03-AAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSST" },
          { role: "user",   content: "TASK: Write a summary." },
        ],
      },
    };
    try {
      await submitOpenAIBatch([item], { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(
        err.message.includes("[SAFETY]") || err.message.includes("secret") || err.message.includes("blocked"),
        `unexpected: ${err.message}`
      );
    }
  });

  await checkAsync("D-3  blocks database URL with credentials in user task", async () => {
    const item = {
      ...ITEM_A,
      safeSerializedRequest: {
        ...ITEM_A.safeSerializedRequest,
        messages: [
          { role: "system", content: "You are RELAY." },
          { role: "user",   content: "Connect to postgresql://admin:hunter2@db.internal:5432/careloop and summarize." },
        ],
      },
    };
    try {
      await submitOpenAIBatch([item], { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(
        err.message.includes("[SAFETY]") || err.message.includes("secret") || err.message.includes("blocked"),
        `unexpected: ${err.message}`
      );
    }
  });

  await checkAsync("D-4  blocks JWT (Supabase service key) in messages array", async () => {
    const item = {
      ...ITEM_A,
      safeSerializedRequest: {
        ...ITEM_A.safeSerializedRequest,
        messages: [
          { role: "system", content: "You are RELAY." },
          { role: "user",   content: "Use token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2MDAwMDAwMDB9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" },
        ],
      },
    };
    try {
      await submitOpenAIBatch([item], { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(
        err.message.includes("[SAFETY]") || err.message.includes("secret") || err.message.includes("blocked"),
        `unexpected: ${err.message}`
      );
    }
  });

  await checkAsync("D-5  blocks GitHub token in messages array", async () => {
    const item = {
      ...ITEM_A,
      safeSerializedRequest: {
        ...ITEM_A.safeSerializedRequest,
        messages: [
          { role: "system", content: "You are RELAY." },
          { role: "user",   content: "GitHub PAT: ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789" },
        ],
      },
    };
    try {
      await submitOpenAIBatch([item], { client: makeMockClient() });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(
        err.message.includes("[SAFETY]") || err.message.includes("secret") || err.message.includes("blocked"),
        `unexpected: ${err.message}`
      );
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E. pollOpenAIBatch
  // ══════════════════════════════════════════════════════════════════════════

  await checkAsync("E-1  maps completed status and returns outputFileId", async () => {
    const result = await pollOpenAIBatch("batch-x", { client: makeMockClient({ batchRetrieveStatus: "completed", outputFileId: "file-out-123" }) });
    assert.strictEqual(result.providerStatus, "completed");
    assert.strictEqual(result.outputFileId,   "file-out-123");
    assert.ok(result.requestCounts);
  });

  await checkAsync("E-2  in_progress has null outputFileId", async () => {
    const result = await pollOpenAIBatch("batch-x", { client: makeMockClient({ batchRetrieveStatus: "in_progress" }) });
    assert.strictEqual(result.providerStatus, "in_progress");
    assert.strictEqual(result.outputFileId, null);
  });

  await checkAsync("E-3  requestCounts is an object with total field", async () => {
    const result = await pollOpenAIBatch("batch-x", { client: makeMockClient() });
    assert.strictEqual(typeof result.requestCounts, "object");
    assert.ok("total" in result.requestCounts);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // F. downloadOpenAIBatchResults
  // ══════════════════════════════════════════════════════════════════════════

  await checkAsync("F-1  returns parsed array of two results", async () => {
    const results = await downloadOpenAIBatchResults("batch-x", { client: makeMockClient() });
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 2);
  });

  await checkAsync("F-2  custom_ids match item ids", async () => {
    const results = await downloadOpenAIBatchResults("batch-x", { client: makeMockClient() });
    const ids = results.map(r => r.custom_id);
    assert.ok(ids.includes(ITEM_A.id));
    assert.ok(ids.includes(ITEM_B.id));
  });

  await checkAsync("F-3  throws when output_file_id is missing", async () => {
    try {
      await downloadOpenAIBatchResults("batch-x", { client: makeMockClient({ batchRetrieveStatus: "in_progress" }) });
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err.message.includes("output_file_id") || err.message.includes("no output"),
        `unexpected: ${err.message}`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G. Budget guard — MAX_BATCH_COST_USD enforced inside submitOpenAIBatch
  // ══════════════════════════════════════════════════════════════════════════

  await checkAsync("G-1  blocks submission when estimated cost exceeds MAX_BATCH_COST_USD", async () => {
    const expensiveItems = [
      { ...ITEM_A, estimatedCostUsd: 50 },
      { ...ITEM_B, estimatedCostUsd: 50 },
    ];
    try {
      await submitOpenAIBatch(expensiveItems, { client: makeMockClient() });
      assert.fail("should have thrown for cost exceeded");
    } catch (err) {
      assert.ok(
        err.message.includes("[SAFETY]") || err.message.includes("cost") || err.message.includes("MAX_BATCH_COST"),
        `unexpected: ${err.message}`
      );
    }
  });

  await checkAsync("G-2  allows submission when cost is within limit", async () => {
    // ITEM_A estimatedCostUsd=0.001 * discount 0.5 = 0.0005 < 1.0 — should pass
    const result = await submitOpenAIBatch([ITEM_A], { client: makeMockClient() });
    assert.ok(result.providerBatchId, "should return a batchId");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // H. Task-type blocking — blocked task types must throw via governor
  // ══════════════════════════════════════════════════════════════════════════

  const BLOCKED_TASK_TYPES = [
    "tool_loop", "verification_gate", "auto_heal", "code_edit",
    "deploy", "release_decision", "secrets_change", "ci_cd_change", "migration",
  ];

  for (const taskType of BLOCKED_TASK_TYPES) {
    await checkAsync(`H  task_type=${taskType} is blocked from batch submission`, async () => {
      const item = makeGateItem("relay", taskType);
      try {
        await submitOpenAIBatch([item], { client: makeMockClient() });
        assert.fail(`should have thrown for task_type=${taskType}`);
      } catch (err) {
        assert.ok(
          err.message.includes("[SAFETY]") || err.message.includes("blocked") || err.message.includes("Governor"),
          `unexpected error for task_type=${taskType}: ${err.message}`
        );
      }
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // I. classifyReconcileOutcome — content validation
  // ══════════════════════════════════════════════════════════════════════════

  const okResult = (customId, content) => ({
    custom_id: customId,
    response: { status_code: 200, body: { choices: [{ message: { content } }] } },
  });

  check("I-1  status_code=200 with good content → reconciled", () => {
    const { status } = classifyReconcileOutcome(ITEM_A, okResult(ITEM_A.id, "This week's summary: all systems nominal."));
    assert.strictEqual(status, "reconciled");
  });

  check("I-2  status_code=200 with empty content → requires_review", () => {
    const { status, note } = classifyReconcileOutcome(ITEM_A, okResult(ITEM_A.id, ""));
    assert.strictEqual(status, "reconciled_requires_review");
    assert.ok(note.includes("empty"), `note was: ${note}`);
  });

  check("I-3  status_code=200 with whitespace-only content → requires_review", () => {
    const { status } = classifyReconcileOutcome(ITEM_A, okResult(ITEM_A.id, "   \n  "));
    assert.strictEqual(status, "reconciled_requires_review");
  });

  check("I-4  status_code=200 with refusal phrase → requires_review", () => {
    const { status, note } = classifyReconcileOutcome(ITEM_A, okResult(ITEM_A.id, "I cannot assist with that request."));
    assert.strictEqual(status, "reconciled_requires_review");
    assert.ok(note.includes("refusal"), `note was: ${note}`);
  });

  check("I-5  status_code=200 with code diff markers → requires_review", () => {
    const diffContent = "Here are changes:\n```diff\n--- a/src/App.jsx\n+++ b/src/App.jsx\n@@ -1 +1 @@";
    const { status, note } = classifyReconcileOutcome(ITEM_A, okResult(ITEM_A.id, diffContent));
    assert.strictEqual(status, "reconciled_requires_review");
    assert.ok(note.includes("code") || note.includes("diff"), `note was: ${note}`);
  });

  check("I-6  status_code=400 → reconciled_failed", () => {
    const { status, note } = classifyReconcileOutcome(ITEM_A, { custom_id: ITEM_A.id, response: { status_code: 400 } });
    assert.strictEqual(status, "reconciled_failed");
    assert.ok(note.includes("400"), `note was: ${note}`);
  });

  check("I-7  null result → requires_review", () => {
    const { status } = classifyReconcileOutcome(ITEM_A, null);
    assert.strictEqual(status, "reconciled_requires_review");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // J. Gate safety — gate agent/task items cannot pass via batch
  // ══════════════════════════════════════════════════════════════════════════

  const gateAgents    = ["auditor", "sentinel", "warden"];
  const gateTaskTypes = ["verification_gate", "auto_heal", "code_edit", "deploy", "release_decision"];

  for (const agentId of gateAgents) {
    check(`J  agentId=${agentId} → requires_review even with status_code=200`, () => {
      const item = makeGateItem(agentId, "report_summary");
      const { status } = classifyReconcileOutcome(item, okResult(item.id, "Gate passed!"));
      assert.strictEqual(status, "reconciled_requires_review",
        `expected requires_review for gate agent ${agentId}`);
    });
  }

  for (const taskType of gateTaskTypes) {
    check(`J  taskType=${taskType} → requires_review even with status_code=200`, () => {
      const item = makeGateItem("relay", taskType);
      const { status } = classifyReconcileOutcome(item, okResult(item.id, "Gate passed!"));
      assert.strictEqual(status, "reconciled_requires_review",
        `expected requires_review for blocked task type ${taskType}`);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // K. Idempotency — already-reconciled items are not reprocessed
  // ══════════════════════════════════════════════════════════════════════════

  check("K-1  reconciled item is not selected by provider_completed filter", () => {
    const alreadyDone = { ...ITEM_A, status: "reconciled", providerBatchId: "batch-old-999" };
    const selected = [alreadyDone].filter(
      i => i.provider === "direct_openai"
        && i.status === "provider_completed"
        && i.providerBatchId
    );
    assert.strictEqual(selected.length, 0, "already reconciled item must not be reselected");
  });

  check("K-2  requires_review item is not selected by provider_completed filter", () => {
    const reviewItem = { ...ITEM_A, status: "reconciled_requires_review", providerBatchId: "batch-old-999" };
    const selected = [reviewItem].filter(
      i => i.provider === "direct_openai"
        && i.status === "provider_completed"
        && i.providerBatchId
    );
    assert.strictEqual(selected.length, 0, "requires_review item must not be reselected");
  });

  check("K-3  reconciled_failed item is not selected by provider_completed filter", () => {
    const failedItem = { ...ITEM_A, status: "reconciled_failed", providerBatchId: "batch-old-999" };
    const selected = [failedItem].filter(
      i => i.provider === "direct_openai"
        && i.status === "provider_completed"
        && i.providerBatchId
    );
    assert.strictEqual(selected.length, 0);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L. File write safety — batch output proposes code changes → requires_review
  // ══════════════════════════════════════════════════════════════════════════

  check("L-1  diff-heavy output (3+ markers) → requires_review, not completed", () => {
    const diffOutput = "Updating file:\n--- a/src/index.js\n+++ b/src/index.js\n@@ -1,3 +1,4 @@\n+const x = 1;";
    const { status } = classifyReconcileOutcome(ITEM_A, okResult(ITEM_A.id, diffOutput));
    assert.strictEqual(status, "reconciled_requires_review");
  });

  check("L-2  single diff marker in otherwise clean content → reconciled (threshold is 2)", () => {
    const almostDiff = "The changes include @@ formatting and some updates.";
    const { status } = classifyReconcileOutcome(ITEM_A, okResult(ITEM_A.id, almostDiff));
    assert.strictEqual(status, "reconciled");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // M. reconciled_requires_review is a valid lifecycle state
  // ══════════════════════════════════════════════════════════════════════════

  check("M-1  reconciled_requires_review is in BATCH_LIFECYCLE_STATES", async () => {
    const { BATCH_LIFECYCLE_STATES } = await import("../providers/batchConstants.js");
    assert.ok(
      BATCH_LIFECYCLE_STATES.includes("reconciled_requires_review"),
      "reconciled_requires_review must be a declared lifecycle state"
    );
  });

  // ── Restore env ───────────────────────────────────────────────────────────

  if (origFlag === undefined) {
    delete process.env.ENABLE_REAL_OPENAI_BATCH;
  } else {
    process.env.ENABLE_REAL_OPENAI_BATCH = origFlag;
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  const total = passed + failed;
  console.log(`\n  ${total} checks — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(e => { console.error(e); process.exit(1); });
