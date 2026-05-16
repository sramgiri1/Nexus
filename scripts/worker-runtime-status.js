import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createWorkerQueueItem, listWorkerQueueItems, summarizeWorkerQueue } from "../worker-runtime/index.js";

const ROOT = process.cwd();
const STATUS_PATH = join(ROOT, "reports/worker-runtime-status.json");

const sample = createWorkerQueueItem({
  taskId: "worker-runtime-status-preview",
  capabilityId: "worker-runtime-preview",
  ownerAgent: "NEXUS",
});

const status = {
  generatedAt: new Date().toISOString(),
  phase: "P60",
  workerRuntimeEnabled: "preview_only",
  executionEnabled: false,
  queue: summarizeWorkerQueue(listWorkerQueueItems({ items: [sample] })),
  warning: "P60 defines worker runtime primitives only. It does not execute agents, tools, providers, or project mutations.",
};

writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2) + "\n");
console.log("NEXUS Worker Runtime Status");
console.log("===========================");
console.log("Worker runtime: preview_only");
console.log("Runtime execution: disabled");
console.log(`Status artifact: ${STATUS_PATH}`);
