import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { createMemoryItem, validateMemoryItem, containsForbiddenMemoryContent } from "./memorySchema.js";

export const MEMORY_RUNTIME_DIR = "memory/runtime";
export const MEMORY_STORE_FILES = {
  nexus_os: "os-memory.jsonl",
  project: "project-memory.jsonl",
  mission: "project-memory.jsonl",
  task: "task-memory.jsonl",
  session: "session-memory.jsonl",
  global_agent: "os-memory.jsonl",
  evidence_linked: "task-memory.jsonl",
  promotion_candidate: "task-memory.jsonl",
};

function resolveStorePath(scope, options = {}) {
  const root = options.root || process.cwd();
  const runtimeDir = options.runtimeDir || MEMORY_RUNTIME_DIR;
  const filename = MEMORY_STORE_FILES[scope] || "session-memory.jsonl";
  const fullPath = normalize(join(root, runtimeDir, filename));
  const allowedPrefix = normalize(join(root, runtimeDir));
  if (!fullPath.startsWith(allowedPrefix)) {
    throw new Error("Memory store path escapes runtime directory");
  }
  return fullPath;
}

export function redactMemorySummary(value) {
  const text = String(value || "");
  return text
    .replace(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi, "[redacted-email]")
    .replace(/(api[_-]?key|secret|token|password)\\s*[:=]\\s*\\S+/gi, "$1=[redacted]");
}

export function sanitizeMemoryItem(input = {}) {
  const item = createMemoryItem({
    ...input,
    summary: redactMemorySummary(input.summary),
    redacted: true,
  });

  if (containsForbiddenMemoryContent(item.summary)) {
    throw new Error("Memory item contains forbidden content class");
  }

  const validation = validateMemoryItem(item);
  if (!validation.ok) {
    throw new Error(`Invalid memory item: ${validation.errors.join("; ")}`);
  }

  return item;
}

export function appendMemoryItem(input, options = {}) {
  const item = sanitizeMemoryItem(input);
  const path = resolveStorePath(item.scope, options);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(item)}\n`, "utf8");
  return item;
}

export function listMemoryItems(options = {}) {
  const root = options.root || process.cwd();
  const runtimeDir = options.runtimeDir || MEMORY_RUNTIME_DIR;
  const files = Object.values(MEMORY_STORE_FILES);
  const items = [];

  for (const filename of [...new Set(files)]) {
    const path = normalize(join(root, runtimeDir, filename));
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        items.push(JSON.parse(line));
      } catch {
        items.push({ memoryId: `invalid-${items.length}`, invalid: true, source: filename });
      }
    }
  }

  return items;
}

export function getMemoryItem(memoryId, options = {}) {
  return listMemoryItems(options).find((item) => item.memoryId === memoryId) || null;
}

export function listMemoryByScope(scope, options = {}) {
  return listMemoryItems(options).filter((item) => item.scope === scope);
}

export function listMemoryForProject(projectId, options = {}) {
  return listMemoryItems(options).filter((item) => item.projectId === projectId);
}

export function listMemoryForTask(taskId, options = {}) {
  return listMemoryItems(options).filter((item) => item.taskId === taskId);
}

export function listMemoryForAgent(agentId, options = {}) {
  return listMemoryItems(options).filter((item) => Array.isArray(item.allowedAgents) && item.allowedAgents.includes(agentId));
}

export function writeMemoryStore(items = [], options = {}) {
  const grouped = new Map();
  for (const input of items) {
    const item = sanitizeMemoryItem(input);
    const path = resolveStorePath(item.scope, options);
    grouped.set(path, [...(grouped.get(path) || []), item]);
  }

  for (const [path, group] of grouped.entries()) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, group.map((item) => JSON.stringify(item)).join("\n") + "\n", "utf8");
  }

  return { filesWritten: grouped.size, itemsWritten: items.length };
}
