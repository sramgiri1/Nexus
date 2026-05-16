import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createWorkerQueueItem, normalizeWorkerQueueItem, validateWorkerQueueItem } from "./queueSchema.js";

const ROOT = process.cwd();
const DEFAULT_QUEUE_PATH = join(ROOT, "local-state/runtime/worker-queue.jsonl");

function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function listWorkerQueueItems(options = {}) {
  const items = Array.isArray(options.items) ? options.items : readJsonl(options.filePath || DEFAULT_QUEUE_PATH);
  return items.map(normalizeWorkerQueueItem);
}

export function summarizeWorkerQueue(items = []) {
  const normalized = items.map(normalizeWorkerQueueItem);
  const byState = normalized.reduce((acc, item) => {
    acc[item.state] = (acc[item.state] || 0) + 1;
    return acc;
  }, {});
  return {
    modeled: true,
    executionEnabled: false,
    totalItems: normalized.length,
    queued: byState.queued || 0,
    blocked: byState.blocked || 0,
    leased: byState.leased || 0,
    running: byState.running || 0,
    completed: byState.completed || 0,
    failed: byState.failed || 0,
    deadLetter: byState.dead_letter || 0,
    warning: "Worker queue preview is modeled. Runtime execution is not enabled.",
  };
}

export { createWorkerQueueItem, normalizeWorkerQueueItem, validateWorkerQueueItem };
