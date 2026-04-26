// orchestrator/runner.js
// Runs a single agent: builds minimal context from files, calls Claude,
// handles tool use in an agentic loop, writes results back to memory.

import Anthropic from "@anthropic-ai/sdk";
import { Ollama }  from "ollama";
import fs          from "fs/promises";
import path        from "path";
import { toAnthropicTools, executeTool, updateAgentStatus } from "../tools/index.js";

const ROOT      = process.cwd();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ollama    = new Ollama({ host: process.env.OLLAMA_HOST || "http://localhost:11434" });

const isLocal = model => !model.startsWith("claude-");

// Agent definitions — each agent's system prompt is loaded from agents/<id>.md
// Only relevant memory slices are loaded (not the whole conversation)
const AGENT_TOOLS = {
  // ── Orchestration ──────────────────────────────────────────────────────────
  nexus:    ["read_memory","write_memory","update_agent_status","enqueue_task","read_project","update_project","log_event","run_skill"],
  // ── Strategy ───────────────────────────────────────────────────────────────
  atlas:    ["read_memory","write_memory","update_agent_status","read_project","update_project","update_gate","write_file","log_event"],
  radar:    ["read_memory","write_memory","update_agent_status","enqueue_task","log_event"],
  meridian: ["read_memory","write_memory","read_project","update_project","update_agent_status","log_event"],
  // ── Product ────────────────────────────────────────────────────────────────
  prism:    ["read_project","write_file","update_agent_status","log_event"],
  shepherd: ["read_memory","read_project","update_project","update_gate","update_agent_status","enqueue_task","log_event"],
  // ── Platform ───────────────────────────────────────────────────────────────
  forge:    ["read_memory","update_agent_status","update_gate","log_event"],
  stream:   ["read_project","write_file","update_agent_status","log_event"],
  synapse:  ["read_project","write_file","update_agent_status","log_event"],
  // ── Engineering ────────────────────────────────────────────────────────────
  core:     ["read_project","write_file","list_files","update_agent_status","log_event"],
  swift:    ["read_project","read_file","write_file","update_agent_status","log_event"],
  pixel:    ["read_project","write_file","update_agent_status","log_event"],
  canvas:   ["read_project","write_file","update_agent_status","log_event"],
  // ── Verification (Global Guards) ───────────────────────────────────────────
  auditor:  ["read_project","read_file","write_file","update_agent_status","log_event","run_skill"],
  sentinel: ["read_project","read_file","list_files","update_agent_status","log_event","run_skill"],
  warden:   ["read_memory","read_project","write_file","update_agent_status","log_event","run_skill"],
  // ── Growth ─────────────────────────────────────────────────────────────────
  beacon:   ["read_project","write_file","update_agent_status","log_event"],
  compass:  ["read_project","write_file","update_agent_status","log_event"],
  oracle:   ["read_project","write_file","update_agent_status","log_event"],
  // ── Observability ──────────────────────────────────────────────────────────
  relay:    ["read_memory","write_memory","update_agent_status","enqueue_task","log_event"],
};

/**
 * Run an agent for a specific task.
 * @param {string} agentId   - e.g. "atlas"
 * @param {string} task      - The task description
 * @param {object} context   - Extra context (projectId, etc)
 * @param {object} [opts]
 * @returns {Promise<{success, output, toolCallCount}>}
 */
// Sonnet for code-generating agents, Haiku for everything else.
// Set AGENT_MODEL env var to override all, or NEXUS_MODEL for NEXUS only.
const SONNET  = "claude-sonnet-4-6";
const HAIKU   = "claude-haiku-4-5-20251001";

const AGENT_MODELS = {
  // Orchestration
  nexus:    process.env.NEXUS_MODEL || HAIKU,
  // Strategy
  atlas:    HAIKU,
  shepherd: HAIKU,
  radar:    HAIKU,
  meridian: HAIKU,
  // Platform
  forge:    HAIKU,
  stream:   HAIKU,
  // Verification / Observability
  auditor:  HAIKU,   // skill-driven — model just orchestrates run_skill calls
  sentinel: HAIKU,
  warden:   HAIKU,
  relay:    HAIKU,
  // Growth
  prism:    HAIKU,
  beacon:   HAIKU,
  compass:  HAIKU,
  oracle:   HAIKU,
  // Code-generating agents — Sonnet required for production-quality output
  core:     SONNET,
  swift:    SONNET,
  pixel:    SONNET,
  canvas:   SONNET,
  synapse:  SONNET,
};

export async function runAgent(agentId, task, context = {}, opts = {}) {
  const model     = AGENT_MODELS[agentId] || process.env.AGENT_MODEL || "llama3.2:3b";
  const maxTokens = parseInt(process.env.MAX_TOKENS || "2048");

  // 1. Load agent system prompt from file
  const systemPrompt = await loadAgentPrompt(agentId, context);

  // 2. Build lean initial message — only what this agent needs
  const userMessage  = buildTaskMessage(agentId, task, context);

  // 3. Get tools for this agent
  const tools = toAnthropicTools(AGENT_TOOLS[agentId] || AGENT_TOOLS.nexus);

  // 4. Mark agent as working
  await updateAgentStatus.execute({ agentId, status: "working", task, progress: 10, project: context.projectId || null });

  // 5. Agentic loop
  const messages = [{ role: "user", content: userMessage }];
  let toolCallCount = 0;
  let finalOutput   = "";
  let iterations    = 0;
  const MAX_ITER    = 10; // safety limit

  try {
    while (iterations < MAX_ITER) {
      iterations++;

      let toolCalls, responseText, stopReason;

      if (isLocal(model)) {
        // ── Ollama path ──────────────────────────────────────────────
        const ollamaTools = tools.map(t => ({
          type: "function",
          function: { name: t.name, description: t.description, parameters: t.input_schema },
        }));
        const ollamaMsgs = [{ role: "system", content: systemPrompt }, ...messages];
        const res = await ollama.chat({
          model,
          messages: ollamaMsgs,
          tools:    ollamaTools,
          options:  { num_predict: maxTokens },
        });
        responseText = res.message.content || "";
        toolCalls    = res.message.tool_calls || [];
        stopReason   = toolCalls.length ? "tool_use" : "end_turn";
        messages.push({ role: "assistant", content: responseText });
      } else {
        // ── Anthropic path ───────────────────────────────────────────
        const res = await anthropic.messages.create({
          model, max_tokens: maxTokens, system: systemPrompt, tools, messages,
        });
        responseText = res.content.filter(b => b.type === "text").map(b => b.text).join("\n");
        toolCalls    = res.content.filter(b => b.type === "tool_use").map(b => ({
          id: b.id, function: { name: b.name, arguments: b.input },
        }));
        stopReason   = res.stop_reason;
        messages.push({ role: "assistant", content: res.content });
      }

      if (stopReason === "end_turn") {
        finalOutput = responseText;
        break;
      }
      if (stopReason !== "tool_use") break;

      // 6. Handle tool calls
      const toolResults = [];
      for (const tc of toolCalls) {
        toolCallCount++;
        const name  = tc.function.name;
        const input = typeof tc.function.arguments === "string"
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments;

        console.log(`  🔧 ${agentId.toUpperCase()} → ${name}(${JSON.stringify(input).slice(0,80)}...)`);
        const result = await executeTool(name, input);

        if (isLocal(model)) {
          toolResults.push({ role: "tool", content: JSON.stringify(result) });
        } else {
          toolResults.push({ type: "tool_result", tool_use_id: tc.id, content: JSON.stringify(result) });
        }
      }

      if (isLocal(model)) {
        messages.push(...toolResults);
      } else {
        messages.push({ role: "user", content: toolResults });
      }
    }

    // 7. Mark agent done
    await updateAgentStatus.execute({ agentId, status: "done", progress: 100 });

    // 8. Save conversation snapshot (trimmed — not full history)
    await saveSnapshot(agentId, task, finalOutput, toolCallCount);

    return { success: true, output: finalOutput, toolCallCount, iterations };

  } catch (error) {
    await updateAgentStatus.execute({ agentId, status: "blocked", task: `Error: ${error.message}` });
    return { success: false, error: error.message, toolCallCount };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loadAgentPrompt(agentId, context) {
  try {
    const agentFile = path.join(ROOT, "agents", `${agentId}.md`);
    const base      = await fs.readFile(agentFile, "utf8");

    // Inject current timestamp and context
    return `${base}

---
CURRENT TIME: ${new Date().toISOString()}
PROJECT CONTEXT: ${context.projectId || "none"}
FILE-BASED MEMORY: All state lives in memory/*.json files. Use tools to read/write.
TOKEN BUDGET: Be concise. Do the task. Write results to files, not to chat.`;

  } catch {
    // Fallback generic prompt
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

async function saveSnapshot(agentId, task, output, toolCalls) {
  const dir  = path.join(ROOT, "memory", "snapshots");
  const file = path.join(dir, `${agentId}-latest.json`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify({
    agentId, task, output, toolCalls,
    timestamp: new Date().toISOString(),
  }, null, 2));
}
