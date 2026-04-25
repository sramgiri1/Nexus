// tools/index.js
// MCP-style tool abstraction layer
// Each tool: { name, description, inputSchema, execute }
// Agents declare which tools they need; runner injects them.

import fs   from "fs/promises";
import path from "path";

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
      const data = await fs.readFile(mem(`${file}.json`), "utf8");
      return { success: true, data: JSON.parse(data) };
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
      const filePath = mem(`${file}.json`);
      let existing = {};
      try { existing = JSON.parse(await fs.readFile(filePath, "utf8")); } catch {}
      const toWrite = merge ? deepMerge(existing, data) : data;
      toWrite.lastUpdated = new Date().toISOString();
      await fs.writeFile(filePath, JSON.stringify(toWrite, null, 2));
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
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
    if (!data.agents[agentId]) return { success: false, error: `Unknown agent: ${agentId}` };
    const agent = data.agents[agentId];
    if (status)             agent.status   = status;
    if (task !== undefined) agent.task     = task;
    if (progress !== undefined) agent.progress = progress;
    if (project !== undefined)  agent.project  = project;
    agent.lastRun = new Date().toISOString();
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return { success: true, agent: data.agents[agentId] };
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
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
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
    data.queue.push(newTask);
    data.queue.sort((a,b) => {
      const order = { critical:0, high:1, normal:2, low:3 };
      return (order[a.priority]||2) - (order[b.priority]||2);
    });
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
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
    const data = JSON.parse(await fs.readFile(mem("portfolio.json"), "utf8"));
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
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
    const idx = data.projects.findIndex(p => p.id === projectId);
    if (idx === -1) return { success: false, error: `Project not found: ${projectId}` };
    data.projects[idx] = deepMerge(data.projects[idx], updates);
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return { success: true, project: data.projects[idx] };
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
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
    const proj = data.projects.find(p => p.id === projectId);
    if (!proj) return { success: false, error: `Project not found: ${projectId}` };
    proj.gates[gate] = status;
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return { success: true, gates: proj.gates };
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
// TOOL REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_TOOLS = [
  readMemory, writeMemory, updateAgentStatus, enqueueTask,
  readProject, updateProject, updateGate,
  readFile, writeFile, listFiles,
  logEvent,
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

// Execute a tool call from an Anthropic response
export async function executeTool(toolName, toolInput) {
  const tool = TOOL_MAP[toolName];
  if (!tool) return { success: false, error: `Unknown tool: ${toolName}` };
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
