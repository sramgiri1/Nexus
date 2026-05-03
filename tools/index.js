// tools/index.js
// MCP-style tool abstraction layer
// Each tool: { name, description, inputSchema, execute }
// Agents declare which tools they need; runner injects them.

import fs   from "fs/promises";
import path from "path";
import { readJsonFile, updateJsonFile, writeJsonFileAtomic } from "../utils/json-store.js";
import { authorizeAction } from "../safety/governor.js";

const ROOT = process.cwd();
const mem  = (f) => path.join(ROOT, "memory", f);

// ─────────────────────────────────────────────────────────────────────────────
// MEMORY TOOLS — read/write the file-based memory system
// ─────────────────────────────────────────────────────────────────────────────

export const readMemory = {
  name: "read_memory",
  description: "Read a memory file. Valid files: portfolio, agent-status, task-queue, founder-actions, traction, economics. Returns parsed JSON.",
  inputSchema: {
    type: "object",
    required: ["file"],
    properties: {
      file: { type: "string", description: "Memory file name without .json extension" }
    }
  },
  execute: async ({ file }) => {
    try {
      return { success: true, data: await readJsonFile(mem(`${file}.json`)) };
    } catch (e) {
      return { success: false, error: `Memory file '${file}' not found: ${e.message}` };
    }
  }
};

export const writeMemory = {
  name: "write_memory",
  description: "Write/update a memory file. Merges with existing data by default.",
  inputSchema: {
    type: "object",
    required: ["file", "data"],
    properties: {
      file:  { type: "string", description: "Memory file name without .json extension" },
      data:  { type: "object", description: "Data to merge into the file" },
      merge: { type: "boolean", description: "If true (default), deep merge. If false, replace entirely." }
    }
  },
  execute: async ({ file, data, merge = true }) => {
    try {
      if (typeof data !== "object" || Array.isArray(data) || data === null)
        return { success: false, error: "data must be a JSON object, not a string or array" };
      const filePath = mem(`${file}.json`);
      let written;
      await updateJsonFile(filePath, async (existing) => {
        const toWrite = merge ? deepMerge(existing || {}, data) : data;
        toWrite.lastUpdated = new Date().toISOString();
        written = toWrite;
        return toWrite;
      });
      return { success: true, written: filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

export const updateAgentStatus = {
  name: "update_agent_status",
  description: "Update an agent's status, task, and progress in memory.",
  inputSchema: {
    type: "object",
    required: ["agentId", "status"],
    properties: {
      agentId:  { type: "string" },
      status:   { type: "string", enum: ["idle","active","working","blocked","done"] },
      task:     { type: "string" },
      progress: { type: "number", minimum: 0, maximum: 100 },
      project:  { type: "string" }
    }
  },
  execute: async ({ agentId, status, task, progress, project }) => {
    const filePath = mem("agent-status.json");
    let updatedAgent;
    await updateJsonFile(filePath, async (data) => {
      if (!data.agents[agentId]) throw new Error(`Unknown agent: ${agentId}`);
      const agent = data.agents[agentId];
      if (status) agent.status = status;
      if (task !== undefined) agent.task = task;
      if (progress !== undefined) agent.progress = progress;
      if (project !== undefined) agent.project = project;
      agent.lastRun = new Date().toISOString();
      data.lastUpdated = new Date().toISOString();
      updatedAgent = { ...agent };
      return data;
    });
    return { success: true, agent: updatedAgent };
  }
};

export const enqueueTask = {
  name: "enqueue_task",
  description: "Add a new task to the agent task queue.",
  inputSchema: {
    type: "object",
    required: ["agentId", "task"],
    properties: {
      agentId:   { type: "string", description: "Which agent should handle this task" },
      task:      { type: "string", description: "Task description" },
      projectId: { type: "string", description: "Project this task belongs to" },
      priority:  { type: "string", enum: ["critical","high","normal","low"], default: "normal" },
      context:   { type: "object", description: "Extra context passed to the agent" }
    }
  },
  execute: async ({ agentId, task, projectId, priority = "normal", context = {} }) => {
    const filePath = mem("task-queue.json");
    const newTask = {
      id:        `task-${Date.now()}`,
      agentId,
      task,
      projectId: projectId || null,
      priority,
      context,
      createdAt: new Date().toISOString(),
      status:    "pending"
    };
    await updateJsonFile(filePath, async (data) => {
      data.queue.push(newTask);
      data.queue.sort((a,b) => {
        const order = { critical:0, high:1, normal:2, low:3 };
        return (order[a.priority]||2) - (order[b.priority]||2);
      });
      data.lastUpdated = new Date().toISOString();
      return data;
    });
    return { success: true, taskId: newTask.id };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT TOOLS
// ─────────────────────────────────────────────────────────────────────────────

export const readProject = {
  name: "read_project",
  description: "Read a specific project's data from the portfolio.",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: { projectId: { type: "string" } }
  },
  execute: async ({ projectId }) => {
    const data = await readJsonFile(mem("portfolio.json"));
    const proj = data.projects.find(p => p.id === projectId);
    return proj ? { success: true, project: proj } : { success: false, error: `Project not found: ${projectId}` };
  }
};

export const updateProject = {
  name: "update_project",
  description: "Update a project's fields in the portfolio (stage, gate, score, mrr, etc).",
  inputSchema: {
    type: "object",
    required: ["projectId", "updates"],
    properties: {
      projectId: { type: "string" },
      updates:   { type: "object" }
    }
  },
  execute: async ({ projectId, updates }) => {
    const filePath = mem("portfolio.json");
    let project;
    await updateJsonFile(filePath, async (data) => {
      const idx = data.projects.findIndex(p => p.id === projectId);
      if (idx === -1) throw new Error(`Project not found: ${projectId}`);
      data.projects[idx] = deepMerge(data.projects[idx], updates);
      data.lastUpdated = new Date().toISOString();
      project = data.projects[idx];
      return data;
    });
    return { success: true, project };
  }
};

export const updateGate = {
  name: "update_gate",
  description: "Update a project gate status.",
  inputSchema: {
    type: "object",
    required: ["projectId", "gate", "status"],
    properties: {
      projectId: { type: "string" },
      gate:      { type: "string", description: "e.g. g0, g1, g2..." },
      status:    { type: "string", enum: ["pending","partial","done","blocked"] }
    }
  },
  execute: async ({ projectId, gate, status }) => {
    const filePath = mem("portfolio.json");
    let gates;
    await updateJsonFile(filePath, async (data) => {
      const proj = data.projects.find(p => p.id === projectId);
      if (!proj) throw new Error(`Project not found: ${projectId}`);
      proj.gates[gate] = status;
      data.lastUpdated = new Date().toISOString();
      gates = { ...proj.gates };
      return data;
    });
    return { success: true, gates };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FILE TOOLS — safe read/write within project directories
// ─────────────────────────────────────────────────────────────────────────────

export const readFile = {
  name: "read_file",
  description: "Read a file from a project directory.",
  inputSchema: {
    type: "object",
    required: ["filePath"],
    properties: { filePath: { type: "string", description: "Relative path from project root" } }
  },
  execute: async ({ filePath }) => {
    try {
      const safe = path.join(ROOT, "projects", filePath.replace(/\.\./g, ""));
      const content = await fs.readFile(safe, "utf8");
      return { success: true, content };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

export const writeFile = {
  name: "write_file",
  description: "Write a file to a project directory. Creates parent directories if needed.",
  inputSchema: {
    type: "object",
    required: ["filePath", "content"],
    properties: {
      filePath: { type: "string", description: "Relative path within projects/" },
      content:  { type: "string", description: "File content" }
    }
  },
  execute: async ({ filePath, content }) => {
    try {
      const safe = path.join(ROOT, "projects", filePath.replace(/\.\./g, ""));
      await fs.mkdir(path.dirname(safe), { recursive: true });
      await fs.writeFile(safe, content);
      return { success: true, written: safe };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

export const listFiles = {
  name: "list_files",
  description: "List files in a project directory.",
  inputSchema: {
    type: "object",
    required: ["dirPath"],
    properties: { dirPath: { type: "string" } }
  },
  execute: async ({ dirPath }) => {
    try {
      const safe = path.join(ROOT, "projects", dirPath.replace(/\.\./g, ""));
      const entries = await fs.readdir(safe, { withFileTypes: true });
      return { success: true, files: entries.map(e => ({ name: e.name, isDir: e.isDirectory() })) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOG TOOL
// ─────────────────────────────────────────────────────────────────────────────

export const logEvent = {
  name: "log_event",
  description: "Log an event to the agent's activity log.",
  inputSchema: {
    type: "object",
    required: ["agentId", "event", "details"],
    properties: {
      agentId: { type: "string" },
      event:   { type: "string" },
      details: { type: "string" },
      level:   { type: "string", enum: ["info","warn","error"], default: "info" }
    }
  },
  execute: async ({ agentId, event, details, level = "info" }) => {
    const logPath = path.join(ROOT, "memory", "conversations", `${agentId}.log`);
    const entry   = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${event}: ${details}\n`;
    await fs.appendFile(logPath, entry);
    return { success: true };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SKILL TOOL — lets Claude agents invoke real executable skills
// ─────────────────────────────────────────────────────────────────────────────

export const runSkill = {
  name: "run_skill",
  description: "Execute a real skill function (linting, QA, compliance, etc). Returns { result: PASS|FAIL|INFO, issues, summary }. Use this instead of guessing outcomes.",
  inputSchema: {
    type: "object",
    required: ["agent", "skill"],
    properties: {
      agent:   { type: "string", description: "Agent that owns the skill: auditor, sentinel, warden, nexus, orchestrator" },
      skill:   { type: "string", description: "Skill name, e.g. code.lint, qa.tests.execute, compliance.privacy.check" },
      input:   { type: "object", description: "Skill-specific input parameters (optional)" },
    }
  },
  execute: async ({ agent, skill, input = {} }) => {
    try {
      const { executeSkill } = await import("../skills/index.js");
      return await executeSkill(agent, skill, input);
    } catch (e) {
      return { result: "FAIL", issues: [{ severity: "error", message: e.message }], summary: `Skill execution failed: ${e.message}` };
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// TOOL REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_TOOLS = [
  readMemory, writeMemory, updateAgentStatus, enqueueTask,
  readProject, updateProject, updateGate,
  readFile, writeFile, listFiles,
  logEvent, runSkill,
];

export const TOOL_MAP = Object.fromEntries(ALL_TOOLS.map(t => [t.name, t]));

// Convert to Anthropic tool format
export function toAnthropicTools(toolNames) {
  const tools = toolNames ? toolNames.map(n => TOOL_MAP[n]).filter(Boolean) : ALL_TOOLS;
  return tools.map(t => ({
    name:         t.name,
    description:  t.description,
    input_schema: t.inputSchema,
  }));
}

// Execute a tool call from an Anthropic response.
// ctx = { agentId, taskId } — injected by runner.js so the governor knows who is calling.
export async function executeTool(toolName, toolInput, ctx = {}) {
  const tool = TOOL_MAP[toolName];
  if (!tool) return { success: false, error: `Unknown tool: ${toolName}` };

  const agentId = ctx.agentId || "unknown";

  // ── write_memory: block writes to the two protected audit/usage files ────────
  if (toolName === "write_memory") {
    const PROTECTED_MEM = ["safety-events", "system-usage"];
    if (PROTECTED_MEM.includes(toolInput.file)) {
      const reason = `Write to protected memory file '${toolInput.file}' blocked — it is managed by the safety system`;
      authorizeAction({ agentId, actionType: "tool_call", toolName, filePath: `memory/${toolInput.file}.json` })
        .catch(() => {}); // fire-and-forget for logging
      return { success: false, error: `[SAFETY] ${reason}` };
    }
  }

  // ── Governor intercept for write_file / enqueue_task / run_skill ─────────────
  if (toolName === "write_file" || toolName === "enqueue_task" || toolName === "run_skill") {
    const skillName = toolName === "run_skill" && toolInput.agent && toolInput.skill
      ? `${toolInput.agent}.${toolInput.skill}`
      : undefined;

    const check = await authorizeAction({
      agentId,
      actionType:    "tool_call",
      toolName,
      filePath:      toolInput.filePath,
      content:       toolInput.content,
      targetAgentId: toolInput.agentId,  // for enqueue_task
      skillName,
      taskId:        ctx.taskId,
    });
    if (!check.allowed) return { success: false, error: `[SAFETY] ${check.reason}` };
  }

  try {
    return await tool.execute(toolInput);
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
