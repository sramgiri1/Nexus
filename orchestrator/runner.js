// orchestrator/runner.js
// Runs a single agent: builds context, routes to correct provider, handles tool loops.
// Providers: direct_anthropic, direct_openai, openrouter, ollama.

import Anthropic from "@anthropic-ai/sdk";
import OpenAI    from "openai";
import { Ollama } from "ollama";
import fs          from "fs/promises";
import path        from "path";
import { toAnthropicTools, executeTool, updateAgentStatus } from "../tools/index.js";
import { authorizeAction, budgetGuard } from "../safety/governor.js";
import {
  resolveRouting,
  shouldBatch,
  shouldAttemptFallback,
  isHardBlock,
  isFallbackProviderAllowed,
  estimateCostForProvider,
  toOpenAITools,
  appendAssistantMessage,
  appendToolResults,
} from "./providerRouter.js";
import { buildOpenRouterRequest, loadOpenRouterPolicy } from "../providers/openRouterClient.js";
import { updateJsonFile } from "../utils/json-store.js";
import { secretGuard } from "../safety/governor.js";

const ROOT = process.cwd();

// ─── Provider clients ─────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

const openrouterClient = new OpenAI({
  apiKey:   process.env.OPENROUTER_API_KEY || "",
  baseURL:  "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/nexus-agentic-os",
    "X-Title": "NEXUS Agentic OS",
  },
});

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || "http://localhost:11434" });

// ─── Local model safety limits ────────────────────────────────────────────────
const LOCAL_MAX_ITER          = parseInt(process.env.LOCAL_MAX_ITER           || "3");
const LOCAL_MAX_PROMPT_TOKENS = parseInt(process.env.LOCAL_MAX_PROMPT_TOKENS  || "8000");
const LOCAL_TIMEOUT_MS        = parseInt(process.env.LOCAL_TIMEOUT_SECONDS    || "120") * 1000;

export const LOCAL_LIMITS = {
  maxIter:          LOCAL_MAX_ITER,
  maxPromptTokens:  LOCAL_MAX_PROMPT_TOKENS,
  timeoutMs:        LOCAL_TIMEOUT_MS,
};

/** Rough token estimate: 4 chars per token (English average). */
export function estimatePromptTokens(messages) {
  let chars = 0;
  for (const msg of messages) {
    if (typeof msg.content === "string") {
      chars += msg.content.length;
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (typeof block.text === "string")         chars += block.text.length;
        else if (typeof block.content === "string") chars += block.content.length;
        else chars += JSON.stringify(block).length;
      }
    } else {
      chars += JSON.stringify(msg.content ?? "").length;
    }
  }
  return Math.ceil(chars / 4);
}

const hasRealAnthropicKey = () => {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  return Boolean(key && key !== "your-api-key-here");
};

// ─── Agent tool registry ──────────────────────────────────────────────────────
const AGENT_TOOLS = {
  nexus:    ["read_memory","write_memory","update_agent_status","enqueue_task","read_project","update_project","log_event","run_skill"],
  atlas:    ["read_memory","write_memory","update_agent_status","read_project","update_project","update_gate","write_file","log_event"],
  radar:    ["read_memory","write_memory","update_agent_status","enqueue_task","log_event"],
  meridian: ["read_memory","write_memory","read_project","update_project","update_agent_status","log_event"],
  prism:    ["read_project","write_file","update_agent_status","log_event"],
  shepherd: ["read_memory","read_project","update_project","update_gate","update_agent_status","enqueue_task","log_event"],
  forge:    ["read_memory","update_agent_status","update_gate","log_event"],
  stream:   ["read_project","write_file","update_agent_status","log_event"],
  synapse:  ["read_project","write_file","update_agent_status","log_event"],
  core:     ["read_project","write_file","list_files","update_agent_status","log_event"],
  swift:    ["read_project","read_file","write_file","update_agent_status","log_event"],
  pixel:    ["read_project","write_file","update_agent_status","log_event"],
  canvas:   ["read_project","write_file","update_agent_status","log_event"],
  auditor:  ["read_project","read_file","write_file","update_agent_status","log_event","run_skill"],
  sentinel: ["read_project","read_file","list_files","update_agent_status","log_event","run_skill"],
  warden:   ["read_memory","read_project","write_file","update_agent_status","log_event","run_skill"],
  beacon:   ["read_project","write_file","update_agent_status","log_event"],
  compass:  ["read_project","write_file","update_agent_status","log_event"],
  oracle:   ["read_project","write_file","update_agent_status","log_event"],
  relay:    ["read_memory","write_memory","update_agent_status","enqueue_task","log_event"],
};

/**
 * Run an agent for a specific task.
 * @param {string} agentId   - e.g. "core"
 * @param {string} task      - Task description
 * @param {object} context   - Extra context (projectId, taskType, taskId, ...)
 * @returns {Promise<{success, output, toolCallCount, iterations, provider, model, executionMode}>}
 */
export async function runAgent(agentId, task, context = {}, opts = {}) {
  const maxTokens = parseInt(process.env.MAX_TOKENS || "2048");

  // 1. Resolve routing (provider, model, task type, batch decision)
  const routing = await resolveRouting(agentId, task, context);
  const { taskType, executionMode: baseMode } = routing;

  // 2. Load prompts and tools
  const systemPrompt = await loadAgentPrompt(agentId, context);
  const userMessage  = buildTaskMessage(agentId, task, context);
  const anthropicTools = toAnthropicTools(AGENT_TOOLS[agentId] || AGENT_TOOLS.nexus);
  const openaiToolFmt  = toOpenAITools(anthropicTools);

  // 3. Check batch mode (batch agents with non-blocking tasks → defer, no tool loop)
  const useBatch = await shouldBatch(agentId, taskType, false);
  if (useBatch && routing.batchProvider && routing.batchModel) {
    return await queueBatchTask(agentId, task, context, routing, userMessage, systemPrompt);
  }

  // 4. Mark agent working
  await updateAgentStatus.execute({ agentId, status: "working", task, progress: 10, project: context.projectId || null });

  // 5. Agentic loop — provider is locked for the entire run
  let currentProvider = routing.provider;
  let currentModel    = routing.model;
  let fallbackUsed    = false;

  const messages   = [{ role: "user", content: userMessage }];
  let toolCallCount = 0;
  let finalOutput   = "";
  let iterations    = 0;
  const MAX_ITER    = (currentProvider === "ollama") ? LOCAL_MAX_ITER : 10;

  try {
    while (iterations < MAX_ITER) {
      iterations++;

      // ── Ollama: token limit check before call ──────────────────────────
      if (currentProvider === "ollama") {
        const ollamaMsgs   = [{ role: "system", content: systemPrompt }, ...messages];
        const promptTokens = estimatePromptTokens(ollamaMsgs);
        if (promptTokens > LOCAL_MAX_PROMPT_TOKENS) {
          finalOutput = `[SAFETY] Local model prompt token limit exceeded (estimated ${promptTokens} > ${LOCAL_MAX_PROMPT_TOKENS})`;
          break;
        }
      }

      // ── Budget + governor check (skip for Ollama — $0 cost) ───────────
      if (currentProvider !== "ollama") {
        const estInput  = Math.floor(maxTokens * 0.6);
        const estOutput = Math.floor(maxTokens * 0.4);
        const estCost   = estimateCostForProvider(currentProvider, currentModel, "realtime", estInput, estOutput);

        const budgetCheck = await authorizeAction({
          agentId,
          actionType:      "llm_call",
          provider:        currentProvider,
          model:           currentModel,
          executionMode:   "realtime",
          taskType,
          estimatedTokens: maxTokens,
          estimatedCost:   estCost,
        });
        if (!budgetCheck.allowed) {
          await updateAgentStatus.execute({ agentId, status: "blocked", task: `Budget: ${budgetCheck.reason}` });
          return { success: false, error: `[BUDGET] ${budgetCheck.reason}`, toolCallCount, iterations };
        }
      }

      // ── Make the provider call ─────────────────────────────────────────
      let callResult;
      let callError = null;

      try {
        callResult = await routeRealtimeCall({
          provider: currentProvider,
          model:    currentModel,
          messages,
          anthropicTools,
          openaiToolFmt,
          systemPrompt,
          maxTokens,
          agentId,
        });
      } catch (err) {
        callError = err;

        // Attempt fallback once on the first iteration only
        if (iterations === 1 && !(await isHardBlock(err.message)) && await shouldAttemptFallback(err.message)) {
          const canFallback = routing.fallbackProvider && routing.fallbackModel
            && await isFallbackProviderAllowed(taskType, routing.fallbackProvider);

          if (canFallback) {
            console.warn(`[ROUTING] ${agentId}: ${currentProvider} failed (${err.message.slice(0, 80)}), falling back to ${routing.fallbackProvider}`);
            currentProvider = routing.fallbackProvider;
            currentModel    = routing.fallbackModel;
            fallbackUsed    = true;

            try {
              callResult = await routeRealtimeCall({
                provider: currentProvider,
                model:    currentModel,
                messages,
                anthropicTools,
                openaiToolFmt,
                systemPrompt,
                maxTokens,
                agentId,
              });
              callError = null;
            } catch (fbErr) {
              callError = fbErr;
            }
          }
        }

        if (callError) throw callError;
      }

      // ── Record usage ───────────────────────────────────────────────────
      if (callResult.usage) {
        budgetGuard.recordUsage(
          agentId,
          callResult.usage.inputTokens,
          callResult.usage.outputTokens,
          currentModel,
          { provider: currentProvider, executionMode: "realtime", taskType, fallbackUsed },
        ).catch(() => {});
      }

      const { responseText, toolCalls, stopReason } = callResult;

      if (stopReason === "end_turn") {
        finalOutput = responseText;
        break;
      }
      if (stopReason !== "tool_use") break;

      // ── Append assistant message in provider-specific format ───────────
      appendAssistantMessage(messages, currentProvider, callResult.rawAnthropicContent, responseText, callResult.rawOpenAIToolCalls);

      // ── Execute tool calls ─────────────────────────────────────────────
      const toolResults = [];
      for (const tc of toolCalls) {
        toolCallCount++;
        const name = tc.function.name;
        const args = typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;

        console.log(`  🔧 ${agentId.toUpperCase()} → ${name}(${JSON.stringify(args).slice(0, 80)}...)`);
        const result = await executeTool(name, args, { agentId, taskId: context.taskId });
        toolResults.push({ id: tc.id, name, result: JSON.stringify(result) });
      }

      // ── Append tool results in provider-specific format ────────────────
      appendToolResults(messages, currentProvider, toolResults);
    }

    await updateAgentStatus.execute({ agentId, status: "done", progress: 100 });
    await saveSnapshot(agentId, task, finalOutput, toolCallCount, { provider: currentProvider, model: currentModel, taskType });

    return { success: true, output: finalOutput, toolCallCount, iterations, provider: currentProvider, model: currentModel, executionMode: "realtime" };

  } catch (error) {
    await updateAgentStatus.execute({ agentId, status: "blocked", task: `Error: ${error.message}` });
    return { success: false, error: error.message, toolCallCount };
  }
}

// ─── Provider dispatch ────────────────────────────────────────────────────────

/**
 * Call the appropriate provider and return normalized result.
 * Returns: { responseText, toolCalls, stopReason, usage, rawAnthropicContent, rawOpenAIToolCalls }
 */
async function routeRealtimeCall({ provider, model, messages, anthropicTools, openaiToolFmt, systemPrompt, maxTokens, agentId }) {
  if (provider === "direct_anthropic") {
    return callAnthropic({ model, messages, tools: anthropicTools, systemPrompt, maxTokens });
  }
  if (provider === "ollama") {
    return callOllama({ model, messages, tools: openaiToolFmt, systemPrompt, maxTokens, agentId });
  }
  if (provider === "direct_openai") {
    return callOpenAI({ client: openaiClient, model, messages, tools: openaiToolFmt, systemPrompt, maxTokens });
  }
  if (provider === "openrouter") {
    return callOpenRouter({ model, messages, tools: openaiToolFmt, systemPrompt, maxTokens });
  }
  throw new Error(`Unknown provider: ${provider}`);
}

async function callAnthropic({ model, messages, tools, systemPrompt, maxTokens }) {
  const res = await anthropic.messages.create({
    model, max_tokens: maxTokens, system: systemPrompt, tools, messages,
  });

  const responseText = res.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const toolCalls    = res.content.filter(b => b.type === "tool_use").map(b => ({
    id:       b.id,
    function: { name: b.name, arguments: b.input },
  }));
  const stopReason = res.stop_reason === "tool_use" ? "tool_use" : "end_turn";
  const usage      = res.usage
    ? { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens }
    : null;

  return { responseText, toolCalls, stopReason, usage, rawAnthropicContent: res.content, rawOpenAIToolCalls: null };
}

async function callOpenAI({ client, model, messages, tools, systemPrompt, maxTokens }) {
  const reqMessages = [{ role: "system", content: systemPrompt }, ...messages];
  const body = { model, max_tokens: maxTokens, messages: reqMessages };

  if (tools?.length) {
    body.tools       = tools;
    body.tool_choice = "auto";
  }

  const res = await client.chat.completions.create(body);
  const choice = res.choices[0];

  const responseText      = choice.message.content || "";
  const rawOpenAIToolCalls = choice.message.tool_calls || [];
  const toolCalls          = rawOpenAIToolCalls.map(tc => ({
    id:       tc.id,
    function: {
      name:      tc.function.name,
      arguments: typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments,
    },
  }));

  const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : "end_turn";
  const usage      = res.usage
    ? { inputTokens: res.usage.prompt_tokens || 0, outputTokens: res.usage.completion_tokens || 0 }
    : null;

  return { responseText, toolCalls, stopReason, usage, rawAnthropicContent: null, rawOpenAIToolCalls };
}

async function callOpenRouter({ model, messages, tools, systemPrompt, maxTokens }) {
  const orPolicy    = await loadOpenRouterPolicy();
  const reqMessages = [{ role: "system", content: systemPrompt }, ...messages];
  const body        = buildOpenRouterRequest({ model, messages: reqMessages, tools, maxTokens, providerPolicy: orPolicy });

  const res    = await openrouterClient.chat.completions.create(body);
  const choice = res.choices[0];

  const responseText       = choice.message.content || "";
  const rawOpenAIToolCalls = choice.message.tool_calls || [];
  const toolCalls          = rawOpenAIToolCalls.map(tc => ({
    id:       tc.id,
    function: {
      name:      tc.function.name,
      arguments: typeof tc.function.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : tc.function.arguments,
    },
  }));

  const stopReason = choice.finish_reason === "tool_calls" ? "tool_use" : "end_turn";
  const usage      = res.usage
    ? { inputTokens: res.usage.prompt_tokens || 0, outputTokens: res.usage.completion_tokens || 0 }
    : null;

  return { responseText, toolCalls, stopReason, usage, rawAnthropicContent: null, rawOpenAIToolCalls };
}

async function callOllama({ model, messages, tools, systemPrompt, maxTokens, agentId }) {
  const ollamaMsgs = [{ role: "system", content: systemPrompt }, ...messages];

  const res = await Promise.race([
    ollama.chat({ model, messages: ollamaMsgs, tools, options: { num_predict: maxTokens } }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Local model timeout after ${LOCAL_TIMEOUT_MS / 1000}s`)), LOCAL_TIMEOUT_MS)
    ),
  ]);

  const responseText = res.message.content || "";
  const rawCalls     = res.message.tool_calls || [];
  const toolCalls    = rawCalls.map(tc => ({
    id:       `ollama-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    function: {
      name:      tc.function?.name,
      arguments: typeof tc.function?.arguments === "string"
        ? JSON.parse(tc.function.arguments)
        : (tc.function?.arguments || {}),
    },
  }));

  const stopReason   = rawCalls.length ? "tool_use" : "end_turn";
  const promptTokens = estimatePromptTokens(ollamaMsgs);
  const outTokens    = Math.ceil(responseText.length / 4);

  // Log $0 usage for local models
  budgetGuard.recordUsage(agentId, promptTokens, outTokens, model, { provider: "ollama", executionMode: "realtime" }).catch(() => {});

  return { responseText, toolCalls, stopReason, usage: null, rawAnthropicContent: null, rawOpenAIToolCalls: null };
}

// ─── Batch queue ──────────────────────────────────────────────────────────────

async function queueBatchTask(agentId, task, context, routing, userMessage, systemPrompt) {
  const BATCH_QUEUE = path.join(ROOT, "memory", "batch-queue.json");

  // Secret-scan both userMessage and systemPrompt before writing.
  // systemPrompt may contain injected context (project notes, API references).
  for (const [label, text] of [["userMessage", userMessage], ["systemPrompt", systemPrompt || ""]]) {
    const scanResult = secretGuard.check(text, "batch-queue.json");
    if (!scanResult.allowed) {
      return { success: false, error: `[SAFETY] Batch ${label} blocked: ${scanResult.reason}` };
    }
  }

  const maxTokens = parseInt(process.env.MAX_TOKENS || "2048");

  const item = {
    id:               `batch-${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    originalTaskId:   context.taskId || null,
    agentId,
    provider:         routing.batchProvider,
    model:            routing.batchModel,
    taskType:         routing.taskType,
    safeSerializedRequest: {
      agentId,
      task,
      projectId: context.projectId || null,
      model:     routing.batchModel,
      maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  },
      ],
    },
    projectId:        context.projectId || null,
    status:           "batch_pending",
    estimatedTokens:  maxTokens,
    estimatedBaseCostUsd:       estimateCostForProvider(routing.batchProvider, routing.batchModel, "realtime", 1500, 500),
    estimatedDiscountedCostUsd: estimateCostForProvider(routing.batchProvider, routing.batchModel, "batch",    1500, 500),
    estimatedCostUsd:           estimateCostForProvider(routing.batchProvider, routing.batchModel, "batch",    1500, 500),
    createdAt:        new Date().toISOString(),
    maxLatency:       "24h",
  };

  try {
    await updateJsonFile(BATCH_QUEUE, async (data) => {
      data.queue.push(item);
      data.lastUpdated = new Date().toISOString();
      return data;
    });
  } catch {
    // batch-queue.json doesn't exist yet — initialize it
    await fs.writeFile(BATCH_QUEUE, JSON.stringify({
      queue: [item], submitted: [], completed: [], failed: [],
      lastUpdated: new Date().toISOString(),
    }, null, 2));
  }

  console.log(`  📦 ${agentId.toUpperCase()} → batched (${routing.batchProvider}/${routing.batchModel}, taskType=${routing.taskType})`);

  return {
    success:       true,
    deferred:      true,
    executionMode: "batch",
    batchQueued:   true,
    batchId:       item.id,
    provider:      routing.batchProvider,
    model:         routing.batchModel,
    taskType:      routing.taskType,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadAgentPrompt(agentId, context) {
  try {
    const agentFile = path.join(ROOT, "agents", `${agentId}.md`);
    const base      = await fs.readFile(agentFile, "utf8");
    return `${base}

---
CURRENT TIME: ${new Date().toISOString()}
PROJECT CONTEXT: ${context.projectId || "none"}
FILE-BASED MEMORY: All state lives in memory/*.json files. Use tools to read/write.
TOKEN BUDGET: Be concise. Do the task. Write results to files, not to chat.`;
  } catch {
    return `You are ${agentId.toUpperCase()}, a specialist agent in the NEXUS venture studio.
Use your tools to complete the task. Write results to memory files.
Be concise. Do not explain what you are about to do — just do it.`;
  }
}

function buildTaskMessage(agentId, task, context) {
  const parts = [`TASK: ${task}`];
  if (context.projectId) parts.push(`PROJECT: ${context.projectId}`);
  if (context.notes)     parts.push(`NOTES: ${context.notes}`);
  parts.push(`\nUse your tools. Write results to memory. Report completion concisely.`);
  return parts.join("\n");
}

async function saveSnapshot(agentId, task, output, toolCalls, meta = {}) {
  const dir  = path.join(ROOT, "memory", "snapshots");
  const file = path.join(dir, `${agentId}-latest.json`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify({
    agentId, task, output, toolCalls,
    provider:      meta.provider,
    model:         meta.model,
    taskType:      meta.taskType,
    timestamp:     new Date().toISOString(),
  }, null, 2));
}
