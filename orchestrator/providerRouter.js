// orchestrator/providerRouter.js
// Pure routing logic — no API calls. Decides which provider/model to use per agent/task.
// Loaded once per runAgent call; all functions are stateless.

import fs   from "fs/promises";
import path from "path";

const ROOT   = process.cwd();
const cfgDir = path.join(ROOT, "config");

const _configCache = {};
async function loadConfig(name) {
  if (_configCache[name]) return _configCache[name];
  try {
    const raw = await fs.readFile(path.join(cfgDir, `${name}.json`), "utf8");
    _configCache[name] = JSON.parse(raw);
    return _configCache[name];
  } catch {
    return null;
  }
}

/** Resolve a model alias like "gpt-codex-latest" → real model ID from env. */
export async function resolveModelAlias(provider, alias) {
  if (!alias) return null;
  const aliases = await loadConfig("model-aliases");
  if (!aliases) return alias; // config missing — pass through

  const providerMap = aliases[provider] || {};
  const template = providerMap[alias];
  if (!template) return alias; // not an alias — treat as direct model ID

  // Resolve ${ENV_VAR} template
  const match = template.match(/^\$\{(\w+)\}$/);
  if (match) {
    const envVal = process.env[match[1]];
    if (!envVal) return null; // env var not set
    return envVal;
  }
  return template; // static value (e.g. "openrouter/auto")
}

/** Load model-map entry for agent. Falls back gracefully if missing. */
export async function loadModelConfig(agentId) {
  const map = await loadConfig("model-map");
  return map?.[agentId] || null;
}

/**
 * Classify a task description into a task type string.
 * Explicit task.type in context takes priority over text matching.
 */
export async function classifyTask(taskText, context = {}) {
  if (context.taskType) return context.taskType;

  const cfg = await loadConfig("task-classification");
  if (!cfg) return "general";

  const lower = (taskText || "").toLowerCase();
  for (const rule of cfg.rules || []) {
    if (rule.match.some(kw => lower.includes(kw))) {
      return rule.taskType;
    }
  }
  return cfg.defaultTaskType || "general";
}

/**
 * Decide whether to use batch execution for this agent + task.
 * Returns true only if all conditions allow batching.
 */
export async function shouldBatch(agentId, taskType, hasToolsInLoop = false) {
  const batchPolicy = await loadConfig("batch-policy");
  if (!batchPolicy?.enabled) return false;
  if (process.env.ENABLE_DIRECT_BATCH === "false") return false;

  // Never-batch agent list
  if (batchPolicy.neverBatchAgents?.includes(agentId)) return false;

  // Never-batch task types
  if (batchPolicy.neverBatchTaskTypes?.includes(taskType)) return false;

  // Cannot batch when tools would be used in the response loop
  if (hasToolsInLoop && batchPolicy.forceRealtimeWhenToolsRequired) return false;

  // Agent model config
  const modelCfg = await loadModelConfig(agentId);
  if (!modelCfg?.batchEligible) return false;

  // Prefer-batch task types
  if (batchPolicy.batchPreferredTaskTypes?.includes(taskType)) return true;

  // Agent's default execution mode
  return modelCfg.executionMode === "batch";
}

/**
 * Check if OpenRouter is allowed for this task type.
 */
export async function isOpenRouterAllowed(taskType) {
  const policy = await loadConfig("openrouter-policy");
  if (!policy?.enabled) return false;
  if (process.env.ENABLE_OPENROUTER === "false") return false;
  return !(policy.neverUseFor?.includes(taskType));
}

/**
 * Check if a provider error should trigger fallback.
 */
export async function shouldAttemptFallback(errorMessage) {
  const policy = await loadConfig("fallback-policy");
  if (!policy?.enabled) return false;
  if (process.env.ENABLE_PROVIDER_FALLBACK === "false") return false;

  const lower = String(errorMessage || "").toLowerCase();
  const triggers = policy.fallbackOnlyOn || [];
  return triggers.some(t => lower.includes(t.replace(/_/g, " ")) || lower.includes(t));
}

/**
 * Check if this error is a hard block (no fallback).
 */
export async function isHardBlock(errorMessage) {
  const policy = await loadConfig("fallback-policy");
  const lower = String(errorMessage || "").toLowerCase();
  const noFallback = policy?.doNotFallbackOn || [];
  return noFallback.some(t => lower.includes(t.replace(/_/g, " ")) || lower.includes(t));
}

/**
 * Check if fallback is allowed for the given provider + task type.
 * Ollama and OpenRouter are blocked for high-risk tasks.
 */
export async function isFallbackProviderAllowed(taskType, fallbackProvider) {
  const orPolicy = await loadConfig("openrouter-policy");

  if (fallbackProvider === "openrouter") {
    if (orPolicy?.neverUseFor?.includes(taskType)) return false;
  }
  if (fallbackProvider === "ollama") {
    const highRisk = await getHighRiskTaskTypes();
    if (highRisk.includes(taskType)) return false;
  }
  return true;
}

/**
 * Returns the list of task types that must not use Ollama/OpenRouter.
 */
export async function getHighRiskTaskTypes() {
  const batchPolicy = await loadConfig("batch-policy");
  return batchPolicy?.neverBatchTaskTypes || [];
}

/**
 * Resolve the full routing decision for an agent + task.
 * Applies env overrides: <AGENT>_PROVIDER, <AGENT>_MODEL, AGENT_MODEL, AGENT_PROVIDER.
 *
 * Returns: { provider, model, fallbackProvider, fallbackModel, taskType, executionMode, batchProvider, batchModel }
 */
export async function resolveRouting(agentId, taskText, context = {}) {
  const taskType = await classifyTask(taskText, context);
  const modelCfg = await loadModelConfig(agentId);

  // Base values from model-map
  let primaryProvider  = modelCfg?.primaryProvider  || "direct_anthropic";
  let primaryModel     = modelCfg?.primaryModel      || "claude-haiku-latest";
  let fallbackProvider = modelCfg?.fallbackProvider  || null;
  let fallbackModel    = modelCfg?.fallbackModel     || null;
  let executionMode    = modelCfg?.executionMode     || "realtime";
  let batchProvider    = modelCfg?.batchProvider     || null;
  let batchModel       = modelCfg?.batchModel        || null;

  // Agent-level env overrides
  const agentUpper    = agentId.toUpperCase();
  const envProvider   = process.env[`${agentUpper}_PROVIDER`] || process.env.AGENT_PROVIDER || null;
  const envModel      = process.env[`${agentUpper}_MODEL`]    || process.env.AGENT_MODEL     || null;

  if (envProvider) primaryProvider = envProvider;
  if (envModel)    primaryModel    = envModel;

  // If AGENT_MODEL is set globally and AGENT_PROVIDER is not, infer provider from model name
  if (!envProvider && envModel) {
    primaryProvider = inferProviderFromModel(envModel);
  }

  // Resolve model aliases
  const resolvedModel         = await resolveModelAlias(primaryProvider, primaryModel);
  const resolvedFallbackModel = fallbackProvider && fallbackModel
    ? await resolveModelAlias(fallbackProvider, fallbackModel)
    : null;
  const resolvedBatchModel    = batchProvider && batchModel
    ? await resolveModelAlias(batchProvider, batchModel)
    : null;

  // Warn on unresolved alias
  if (resolvedModel === null) {
    console.warn(`[ROUTING] Model alias unresolved for ${agentId}: ${primaryModel} on ${primaryProvider}. Update config/model-aliases.json or env override.`);
  }
  if (resolvedFallbackModel === null && fallbackProvider) {
    console.warn(`[ROUTING] Fallback model alias unresolved for ${agentId}: ${fallbackModel} on ${fallbackProvider}.`);
  }

  return {
    provider:        primaryProvider,
    model:           resolvedModel || primaryModel,
    fallbackProvider,
    fallbackModel:   resolvedFallbackModel || fallbackModel,
    batchProvider,
    batchModel:      resolvedBatchModel || batchModel,
    taskType,
    executionMode,
    maxTaskCostUsd:  modelCfg?.maxTaskCostUsd || 0.10,
    openRouterEligible: modelCfg?.openRouterEligible || false,
    ollamaEligible:     modelCfg?.ollamaEligible     || false,
    batchEligible:      modelCfg?.batchEligible       || false,
  };
}

/** Infer provider from model name prefix. */
function inferProviderFromModel(model) {
  if (!model) return "direct_anthropic";
  if (model.startsWith("claude-")) return "direct_anthropic";
  if (model.startsWith("gpt-") || model.startsWith("o1") || model.startsWith("o3")) return "direct_openai";
  if (model.startsWith("openrouter/") || model.includes("/")) return "openrouter";
  // Local/Ollama model (e.g. qwen3:4b, llama3.2:3b)
  if (model.includes(":") || ["qwen", "llama", "mistral", "deepseek"].some(p => model.startsWith(p))) return "ollama";
  return "direct_anthropic"; // default
}

/**
 * Estimate cost in USD for a given provider + model + execution mode.
 * Conservative estimate; actual cost recorded after the call.
 */
export function estimateCostForProvider(provider, model, executionMode, inputTokens, outputTokens) {
  if (provider === "ollama") return 0;

  // Per-1k-token prices (USD) — conservative fallback estimates
  const PRICE_TABLE = {
    // Direct Anthropic
    "claude-sonnet-4-6":              { in: 0.003, out: 0.015 },
    "claude-haiku-4-5-20251001":      { in: 0.00025, out: 0.00125 },
    "claude-opus-4-7":                { in: 0.015, out: 0.075 },
    // Direct OpenAI (approximate — actual set via OPENAI_CODE_MODEL etc.)
    "gpt-4o":                         { in: 0.0025, out: 0.01 },
    "gpt-4o-mini":                    { in: 0.00015, out: 0.0006 },
    "gpt-4.1":                        { in: 0.002, out: 0.008 },
    "gpt-4.1-mini":                   { in: 0.0004, out: 0.0016 },
    "o3":                             { in: 0.01, out: 0.04 },
    "o4-mini":                        { in: 0.0011, out: 0.0044 },
    // OpenRouter (uses variable pricing — assume gpt-4o-mini equivalent as conservative low)
    "openrouter/auto":                { in: 0.00015, out: 0.0006 },
  };

  const prices = PRICE_TABLE[model] || { in: 0.003, out: 0.015 }; // default sonnet estimate
  const costMultiplier = executionMode === "batch" ? 0.5 : 1.0;

  return ((inputTokens / 1000) * prices.in + (outputTokens / 1000) * prices.out) * costMultiplier;
}

/**
 * Convert Anthropic tool format [{name, description, input_schema}]
 * to OpenAI format [{type:"function", function:{name, description, parameters}}].
 */
export function toOpenAITools(anthropicTools) {
  if (!anthropicTools?.length) return [];
  return anthropicTools.map(t => ({
    type: "function",
    function: {
      name:        t.name,
      description: t.description,
      parameters:  t.input_schema,
    },
  }));
}

/**
 * Append the assistant's response to the messages array in provider-specific format.
 * Mutates the messages array.
 */
export function appendAssistantMessage(messages, provider, rawAnthropicContent, responseText, rawOpenAIToolCalls) {
  if (provider === "direct_anthropic") {
    messages.push({ role: "assistant", content: rawAnthropicContent });
  } else if (provider === "ollama") {
    messages.push({ role: "assistant", content: responseText });
  } else {
    // OpenAI / OpenRouter
    const msg = { role: "assistant", content: responseText || null };
    if (rawOpenAIToolCalls?.length) msg.tool_calls = rawOpenAIToolCalls;
    messages.push(msg);
  }
}

/**
 * Append tool results to the messages array in provider-specific format.
 * toolResults: [{id, name, result: string}]
 * Mutates the messages array.
 */
export function appendToolResults(messages, provider, toolResults) {
  if (provider === "direct_anthropic") {
    messages.push({
      role: "user",
      content: toolResults.map(tr => ({
        type: "tool_result",
        tool_use_id: tr.id,
        content: tr.result,
      })),
    });
  } else if (provider === "ollama") {
    messages.push(...toolResults.map(tr => ({ role: "tool", content: tr.result })));
  } else {
    // OpenAI / OpenRouter — one message per tool result
    messages.push(...toolResults.map(tr => ({
      role: "tool",
      tool_call_id: tr.id,
      content: tr.result,
    })));
  }
}
