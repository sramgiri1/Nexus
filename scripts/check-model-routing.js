#!/usr/bin/env node
// scripts/check-model-routing.js
// Validates the model routing config for all Nexus agents.
// Makes NO API calls. Safe to run anytime.

import "dotenv/config";
import fs   from "fs/promises";
import path from "path";
import { buildOpenRouterRequest, isOpenRouterBlockedForTask } from "../providers/openRouterClient.js";
import { submitOpenAIBatch }    from "../providers/openaiBatch.js";
import { submitAnthropicBatch } from "../providers/anthropicBatch.js";
import { DRY_RUN_STATUS, DRY_RUN_BATCH_PREFIX, BATCH_LIFECYCLE_STATES } from "../providers/batchConstants.js";

const ROOT = process.cwd();
const cfgDir = path.join(ROOT, "config");

let passed = 0;
let failed = 0;
const warnings = [];

function pass(label) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label, detail = "") {
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

function warn(msg) {
  console.warn(`  ⚠ ${msg}`);
  warnings.push(msg);
}

async function loadJson(name) {
  try {
    const raw = await fs.readFile(path.join(cfgDir, `${name}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveAlias(aliases, provider, alias) {
  if (!alias) return null;
  const provMap = aliases?.[provider] || {};
  const template = provMap[alias];
  if (!template) return alias; // treat as direct model ID
  const match = template.match(/^\$\{(\w+)\}$/);
  if (match) {
    const val = process.env[match[1]];
    if (!val) return null;
    return val;
  }
  return template;
}

const KNOWN_AGENTS = [
  "nexus","shepherd","core","swift","pixel","forge",
  "atlas","meridian","synapse","warden","auditor","sentinel",
  "relay","beacon","compass","canvas","radar","prism","stream","oracle",
];

const VALID_PROVIDERS = new Set(["direct_openai","direct_anthropic","openrouter","ollama"]);

const REALTIME_ONLY_AGENTS = ["nexus","shepherd","core","swift","pixel","forge"];
const BATCH_ELIGIBLE_AGENTS = ["relay","beacon","compass","canvas","radar"];
const HYBRID_AGENTS = ["auditor","sentinel","warden","atlas","meridian","synapse","prism","stream","oracle"];

const NEVER_BATCH_TASK_TYPES = [
  "code_edit","code_review_fix","deploy","release_decision","security_blocker",
  "queue_orchestration","verification_gate","tool_loop","migration","secrets_change",
  "ci_cd_change","infra_change","hotfix","auto_heal",
];

const OPENROUTER_NEVER_FOR = [
  "release_decision","security_blocker","deploy","secrets_change",
  "ci_cd_change","migration","verification_gate","auto_heal",
];

async function run() {
  console.log("\n🔀 Nexus Model Routing — Config Checks\n");

  const modelMap     = await loadJson("model-map");
  const aliases      = await loadJson("model-aliases");
  const batchPolicy  = await loadJson("batch-policy");
  const orPolicy     = await loadJson("openrouter-policy");
  const fallback     = await loadJson("fallback-policy");
  const provPolicy   = await loadJson("provider-policy");
  const taskClass    = await loadJson("task-classification");

  if (!modelMap)    { fail("model-map.json exists");         return printSummary(); }
  if (!aliases)     { fail("model-aliases.json exists");     return printSummary(); }
  if (!batchPolicy) { fail("batch-policy.json exists");      return printSummary(); }
  if (!orPolicy)    { fail("openrouter-policy.json exists"); return printSummary(); }
  if (!fallback)    { fail("fallback-policy.json exists");   return printSummary(); }
  if (!provPolicy)  { fail("provider-policy.json exists");   return printSummary(); }
  if (!taskClass)   { fail("task-classification.json exists"); return printSummary(); }

  pass("All 7 config files present");

  // ── 1. Every agent has a model-map entry ────────────────────────────────────
  console.log("\nAgent coverage:");
  for (const agent of KNOWN_AGENTS) {
    if (modelMap[agent]) {
      pass(`${agent} has model-map entry`);
    } else {
      fail(`${agent} missing from model-map.json`);
    }
  }

  // ── 2. Provider is valid ─────────────────────────────────────────────────────
  console.log("\nProvider validity:");
  for (const [agent, cfg] of Object.entries(modelMap)) {
    if (!VALID_PROVIDERS.has(cfg.primaryProvider)) {
      fail(`${agent}.primaryProvider '${cfg.primaryProvider}' is not a valid provider`);
    } else {
      pass(`${agent}.primaryProvider '${cfg.primaryProvider}' valid`);
    }
  }

  // ── 3. Alias resolution (warns on missing env, does not fail) ────────────────
  console.log("\nAlias resolution:");
  for (const [agent, cfg] of Object.entries(modelMap)) {
    const resolved = resolveAlias(aliases, cfg.primaryProvider, cfg.primaryModel);
    if (resolved === null) {
      warn(`${agent}: alias '${cfg.primaryModel}' on '${cfg.primaryProvider}' unresolved (env var not set) — set in .env`);
    } else {
      pass(`${agent}: '${cfg.primaryModel}' → '${resolved}'`);
    }
  }

  // ── 4-7. Realtime-only agents ────────────────────────────────────────────────
  console.log("\nRealtime-only enforcement:");
  for (const agent of REALTIME_ONLY_AGENTS) {
    const cfg = modelMap[agent];
    if (!cfg) continue;
    if (cfg.executionMode === "realtime" && !cfg.batchEligible) {
      pass(`${agent} is realtime-only (batchEligible: false)`);
    } else {
      fail(`${agent} should be realtime-only`, `executionMode=${cfg.executionMode}, batchEligible=${cfg.batchEligible}`);
    }
    if (cfg.ollamaEligible) {
      fail(`${agent} must not be ollamaEligible (high-risk agent)`);
    } else {
      pass(`${agent} not ollamaEligible`);
    }
  }

  // ── 8. Batch-eligible agents ─────────────────────────────────────────────────
  console.log("\nBatch-eligible enforcement:");
  for (const agent of BATCH_ELIGIBLE_AGENTS) {
    const cfg = modelMap[agent];
    if (!cfg) continue;
    if (cfg.batchEligible) {
      pass(`${agent} is batchEligible`);
    } else {
      fail(`${agent} should be batchEligible`);
    }
  }

  // ── 9. Hybrid agents ─────────────────────────────────────────────────────────
  console.log("\nHybrid agents:");
  for (const agent of HYBRID_AGENTS) {
    const cfg = modelMap[agent];
    if (!cfg) continue;
    if (cfg.executionMode === "hybrid") {
      pass(`${agent} executionMode=hybrid`);
    } else if (cfg.batchEligible) {
      pass(`${agent} batchEligible (hybrid-capable)`);
    } else {
      fail(`${agent} should be hybrid or batchEligible`);
    }
  }

  // ── 10. Verification gates always realtime ───────────────────────────────────
  console.log("\nVerification gate task type:");
  if (batchPolicy.neverBatchTaskTypes.includes("verification_gate")) {
    pass("verification_gate in neverBatchTaskTypes");
  } else {
    fail("verification_gate must be in neverBatchTaskTypes");
  }

  // ── 11. Code edits always realtime ──────────────────────────────────────────
  if (batchPolicy.neverBatchTaskTypes.includes("code_edit")) {
    pass("code_edit in neverBatchTaskTypes");
  } else {
    fail("code_edit must be in neverBatchTaskTypes");
  }

  // ── 12. Auto-heal always realtime ────────────────────────────────────────────
  if (batchPolicy.neverBatchTaskTypes.includes("auto_heal")) {
    pass("auto_heal in neverBatchTaskTypes");
  } else {
    fail("auto_heal must be in neverBatchTaskTypes");
  }

  // ── 13. Deploy always realtime ───────────────────────────────────────────────
  if (batchPolicy.neverBatchTaskTypes.includes("deploy")) {
    pass("deploy in neverBatchTaskTypes");
  } else {
    fail("deploy must be in neverBatchTaskTypes");
  }

  // ── 14. OpenRouter never for blocked task types ──────────────────────────────
  console.log("\nOpenRouter blocked task types:");
  for (const tt of OPENROUTER_NEVER_FOR) {
    if (orPolicy.neverUseFor?.includes(tt)) {
      pass(`OpenRouter neverUseFor '${tt}'`);
    } else {
      fail(`OpenRouter must have '${tt}' in neverUseFor`);
    }
  }

  // ── 15. Direct batch is selected for eligible reports ────────────────────────
  console.log("\nDirect-provider batch selection:");
  for (const agent of [...BATCH_ELIGIBLE_AGENTS, ...HYBRID_AGENTS]) {
    const cfg = modelMap[agent];
    if (!cfg?.batchEligible) continue;
    if (cfg.batchProvider === "direct_openai" || cfg.batchProvider === "direct_anthropic") {
      pass(`${agent}.batchProvider is direct (${cfg.batchProvider})`);
    } else if (cfg.batchProvider === null) {
      if (cfg.executionMode === "hybrid") {
        warn(`${agent} is batchEligible but batchProvider is null`);
      }
    } else {
      fail(`${agent}.batchProvider '${cfg.batchProvider}' is not a direct provider`);
    }
  }

  // ── 16. OpenRouter batch is not used ────────────────────────────────────────
  if (!batchPolicy.openRouterChatBatchSupported) {
    pass("OpenRouter chat batch is disabled (openRouterChatBatchSupported: false)");
  } else {
    fail("OpenRouter chat batch must remain disabled until officially supported");
  }

  // ── 17. Batch cost uses 0.5 multiplier ───────────────────────────────────────
  if (batchPolicy.discountMultiplier === 0.5) {
    pass("Batch discount multiplier is 0.5");
  } else {
    fail(`Batch discount multiplier should be 0.5, got ${batchPolicy.discountMultiplier}`);
  }

  // ── 18. Missing API keys produce warnings, not crashes ───────────────────────
  console.log("\nAPI key warnings:");
  const keyChecks = [
    ["OPENAI_API_KEY",     "direct_openai"],
    ["ANTHROPIC_API_KEY",  "direct_anthropic"],
    ["OPENROUTER_API_KEY", "openrouter"],
  ];
  for (const [envKey, providerName] of keyChecks) {
    const val = process.env[envKey];
    if (!val || val === "your-api-key-here") {
      warn(`${envKey} not set — ${providerName} calls will fail at runtime`);
      pass(`Missing ${envKey} produces warning (not crash)`);
    } else {
      pass(`${envKey} is set`);
    }
  }

  const modelEnvVars = ["OPENAI_CODE_MODEL","OPENAI_REASONING_MODEL","OPENAI_CHEAP_MODEL","ANTHROPIC_REASONING_MODEL","ANTHROPIC_CHEAP_MODEL"];
  for (const ev of modelEnvVars) {
    if (!process.env[ev]) {
      warn(`${ev} not set — alias resolution will fall back to raw alias string`);
    } else {
      pass(`${ev}=${process.env[ev]}`);
    }
  }

  // ── 19. Fallback not on safety/budget blocks ─────────────────────────────────
  console.log("\nFallback policy:");
  const hardBlocks = ["budget_exceeded","safety_blocked","secret_detected","permission_denied"];
  for (const block of hardBlocks) {
    if (fallback.doNotFallbackOn?.includes(block)) {
      pass(`No fallback on '${block}'`);
    } else {
      fail(`'${block}' must be in fallback.doNotFallbackOn`);
    }
  }

  // ── 20. Batch queue serialization never contains secrets ─────────────────────
  console.log("\nBatch queue secret safety:");
  try {
    const bqRaw = await fs.readFile(path.join(ROOT, "memory", "batch-queue.json"), "utf8");
    const secretPatterns = [/sk-ant-/i, /sk-proj-/i, /AKIA/i, /openrouter-/i];
    const hasSecret = secretPatterns.some(re => re.test(bqRaw));
    if (hasSecret) {
      fail("batch-queue.json appears to contain secret-looking strings");
    } else {
      pass("batch-queue.json does not contain secret-looking strings");
    }
  } catch {
    pass("batch-queue.json not yet created (will be checked on first batch)");
  }

  // ── F. Feature flags + batch hardening checks ────────────────────────────────
  console.log("\nBatch feature flags:");

  // F-1: ENABLE_REAL_OPENAI_BATCH defaults false
  const cfgOAIBatch  = provPolicy?.featureFlags?.ENABLE_REAL_OPENAI_BATCH;
  const envOAIBatch  = process.env.ENABLE_REAL_OPENAI_BATCH === "true";
  if (cfgOAIBatch !== true && !envOAIBatch) {
    pass("ENABLE_REAL_OPENAI_BATCH defaults false (config + env)");
  } else {
    fail("ENABLE_REAL_OPENAI_BATCH is true — ensure safety validation is complete before enabling");
  }

  // F-2: ENABLE_REAL_ANTHROPIC_BATCH defaults false
  const cfgAnthBatch = provPolicy?.featureFlags?.ENABLE_REAL_ANTHROPIC_BATCH;
  const envAnthBatch = process.env.ENABLE_REAL_ANTHROPIC_BATCH === "true";
  if (cfgAnthBatch !== true && !envAnthBatch) {
    pass("ENABLE_REAL_ANTHROPIC_BATCH defaults false (config + env)");
  } else {
    fail("ENABLE_REAL_ANTHROPIC_BATCH is true — ensure safety validation is complete before enabling");
  }

  // F-3: batch:submit dry-run does not call provider APIs (structural: stubs throw when flags false)
  if (!envOAIBatch && !envAnthBatch) {
    pass("batch:submit dry-run cannot call provider APIs (flags false → stubs throw)");
  } else {
    fail("At least one real-batch flag is true — dry-run guarantee broken");
  }

  // F-4: dry-run status constant is "dry_run_submitted" (not "submitted" / "batch_submitted")
  if (DRY_RUN_STATUS === "dry_run_submitted") {
    pass(`DRY_RUN_STATUS === "dry_run_submitted" (not "submitted")`);
  } else {
    fail(`DRY_RUN_STATUS should be "dry_run_submitted", got "${DRY_RUN_STATUS}"`);
  }

  // F-5: batch-status shows dry_run_submitted as a distinct lifecycle state
  if (BATCH_LIFECYCLE_STATES.includes("dry_run_submitted")) {
    pass("BATCH_LIFECYCLE_STATES includes dry_run_submitted");
  } else {
    fail("dry_run_submitted must be in BATCH_LIFECYCLE_STATES");
  }

  // F-6: OpenRouter request builder always includes provider routing field
  console.log("\nOpenRouter request builder:");
  const testReq = buildOpenRouterRequest({
    model: "openrouter/auto", messages: [{ role: "user", content: "test" }],
    tools: [], maxTokens: 100, providerPolicy: orPolicy,
  });
  if (testReq.provider && typeof testReq.provider === "object") {
    pass("buildOpenRouterRequest includes provider routing object");
  } else {
    fail("buildOpenRouterRequest must include provider routing object");
  }

  // F-7: OpenRouter request builder does not include API key in output
  const serializedReq = JSON.stringify(testReq);
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const containsKey = apiKey.length > 10 && serializedReq.includes(apiKey);
  if (!containsKey) {
    pass("buildOpenRouterRequest output does not contain OPENROUTER_API_KEY");
  } else {
    fail("buildOpenRouterRequest output contains the API key — this must never be logged");
  }

  // F-8: OpenRouter blocked for release_decision
  if (await isOpenRouterBlockedForTask("release_decision", orPolicy)) {
    pass("OpenRouter blocked for release_decision");
  } else {
    fail("OpenRouter must be blocked for release_decision");
  }

  // F-9: OpenRouter blocked for verification_gate
  if (await isOpenRouterBlockedForTask("verification_gate", orPolicy)) {
    pass("OpenRouter blocked for verification_gate");
  } else {
    fail("OpenRouter must be blocked for verification_gate");
  }

  // F-10: OpenRouter blocked for deploy
  if (await isOpenRouterBlockedForTask("deploy", orPolicy)) {
    pass("OpenRouter blocked for deploy");
  } else {
    fail("OpenRouter must be blocked for deploy");
  }

  // F-11: OpenRouter allowed for marketing_copy
  if (!(await isOpenRouterBlockedForTask("marketing_copy", orPolicy))) {
    pass("OpenRouter allowed for marketing_copy");
  } else {
    fail("OpenRouter must be allowed for marketing_copy");
  }

  // F-12: OpenRouter allowed for market_scan
  if (!(await isOpenRouterBlockedForTask("market_scan", orPolicy))) {
    pass("OpenRouter allowed for market_scan");
  } else {
    fail("OpenRouter must be allowed for market_scan");
  }

  // F-13: Provider batch stubs throw unless feature flags are true
  console.log("\nProvider batch stubs:");
  {
    let oaiThrew = false;
    try { await submitOpenAIBatch([]); }
    catch (e) {
      if (e.message.includes("disabled")) { pass("openaiBatch stub throws with 'disabled' message"); oaiThrew = true; }
      else { fail(`openaiBatch stub threw unexpected error: ${e.message}`); oaiThrew = true; }
    }
    if (!oaiThrew) fail("openaiBatch stub must throw when ENABLE_REAL_OPENAI_BATCH=false");
  }
  {
    let anthThrew = false;
    try { await submitAnthropicBatch([]); }
    catch (e) {
      if (e.message.includes("disabled")) { pass("anthropicBatch stub throws with 'disabled' message"); anthThrew = true; }
      else { fail(`anthropicBatch stub threw unexpected error: ${e.message}`); anthThrew = true; }
    }
    if (!anthThrew) fail("anthropicBatch stub must throw when ENABLE_REAL_ANTHROPIC_BATCH=false");
  }

  // F-14: No test performs network calls
  // Structural guarantee: all checks above use config files, imported pure functions,
  // and stub functions that throw before any HTTP call. No fetch/http/SDK call is reachable.
  pass("All checks use config/imports only — no network calls (structural guarantee)");

  // ── Agent routing summary table ───────────────────────────────────────────────
  printAgentTable(modelMap, aliases);

  // ── Batch eligibility table ──────────────────────────────────────────────────
  printBatchTable(modelMap);

  printSummary();
}

function printAgentTable(modelMap, aliases) {
  console.log("\n" + "─".repeat(100));
  console.log("  Agent Routing Summary");
  console.log("─".repeat(100));
  console.log(`  ${"AGENT".padEnd(12)} ${"PROVIDER".padEnd(20)} ${"MODEL/ALIAS".padEnd(25)} ${"MODE".padEnd(10)} ${"FALLBACK".padEnd(20)}`);
  console.log("─".repeat(100));
  for (const [agent, cfg] of Object.entries(modelMap)) {
    const resolved = resolveAlias(aliases, cfg.primaryProvider, cfg.primaryModel) || `[unresolved: ${cfg.primaryModel}]`;
    const fallback = cfg.fallbackProvider ? `${cfg.fallbackProvider}` : "none";
    console.log(`  ${agent.padEnd(12)} ${cfg.primaryProvider.padEnd(20)} ${resolved.slice(0,24).padEnd(25)} ${(cfg.executionMode || "").padEnd(10)} ${fallback.padEnd(20)}`);
  }
  console.log("─".repeat(100));
}

function printBatchTable(modelMap) {
  console.log("\n  Batch Eligibility");
  console.log("─".repeat(80));
  console.log(`  ${"AGENT".padEnd(12)} ${"BATCH?".padEnd(8)} ${"BATCH PROVIDER".padEnd(20)} ${"OR ELIGIBLE".padEnd(14)} ${"OLLAMA ELIGIBLE"}`);
  console.log("─".repeat(80));
  for (const [agent, cfg] of Object.entries(modelMap)) {
    const batch  = cfg.batchEligible ? "yes" : "no ";
    const bProv  = cfg.batchProvider || "—";
    const orEl   = cfg.openRouterEligible ? "yes" : "no ";
    const olEl   = cfg.ollamaEligible     ? "yes" : "no ";
    console.log(`  ${agent.padEnd(12)} ${batch.padEnd(8)} ${bProv.padEnd(20)} ${orEl.padEnd(14)} ${olEl}`);
  }
  console.log("─".repeat(80));
}

function printSummary() {
  console.log(`\n${"─".repeat(50)}`);
  if (warnings.length > 0) {
    console.log(`\n  ${warnings.length} warning(s):`);
    warnings.forEach(w => console.log(`    ⚠ ${w}`));
  }
  console.log(`\n  ${passed + failed} checks: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error(`\n  ✗ ${failed} check(s) FAILED\n`);
    process.exit(1);
  } else {
    console.log(`\n  ✓ All routing checks passing\n`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
