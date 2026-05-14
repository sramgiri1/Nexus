import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve } from "node:path";

export const ACTIVITY_STORE_RELATIVE_PATH = "local-state/runtime/activity.jsonl";

function rootDir(options = {}) {
  return options.root || process.cwd();
}

function assertSafeStorePath(relativePath) {
  if (isAbsolute(relativePath)) {
    throw new Error("Activity store path must be repo-relative");
  }
  const normalized = normalize(relativePath);
  if (normalized.startsWith("..") || normalized.includes("../")) {
    throw new Error("Activity store path cannot traverse outside local-state/runtime");
  }
  if (normalized !== ACTIVITY_STORE_RELATIVE_PATH) {
    throw new Error(`Activity store path must be ${ACTIVITY_STORE_RELATIVE_PATH}`);
  }
  return normalized;
}

export function getActivityStorePath(options = {}) {
  const relativePath = assertSafeStorePath(options.storePath || ACTIVITY_STORE_RELATIVE_PATH);
  const fullPath = resolve(rootDir(options), relativePath);
  const runtimeRoot = resolve(rootDir(options), "local-state/runtime");
  if (!relative(runtimeRoot, fullPath) || relative(runtimeRoot, fullPath).startsWith("..")) {
    throw new Error("Activity store path must stay inside local-state/runtime");
  }
  return fullPath;
}

function ensureStoreFile(options = {}) {
  const storePath = getActivityStorePath(options);
  if (!existsSync(storePath)) {
    if (options.createIfMissing === false) {
      return storePath;
    }
    mkdirSync(dirname(storePath), { recursive: true });
    writeFileSync(storePath, "", "utf8");
  }
  return storePath;
}

export function appendActivityEvent(event, options = {}) {
  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      written: false,
      event,
      storePath: ACTIVITY_STORE_RELATIVE_PATH,
      warnings: [],
    };
  }

  const storePath = ensureStoreFile(options);
  appendFileSync(storePath, `${JSON.stringify(event)}\n`, "utf8");
  return {
    ok: true,
    dryRun: false,
    written: true,
    event,
    storePath: ACTIVITY_STORE_RELATIVE_PATH,
    warnings: [],
  };
}

export function readActivityEvents(options = {}) {
  const storePath = ensureStoreFile({ ...options, createIfMissing: options.createIfMissing !== false });
  if (!existsSync(storePath)) {
    return { events: [], warnings: [`Activity store not found: ${ACTIVITY_STORE_RELATIVE_PATH}`] };
  }

  const maxEvents = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 500;
  const warnings = [];
  const events = [];
  const lines = readFileSync(storePath, "utf8").split("\n");

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      events.push(JSON.parse(line));
    } catch (error) {
      warnings.push(`Malformed activity JSONL line ${index + 1}: ${error.message}`);
    }
  });

  return {
    events: events.slice(-maxEvents),
    warnings,
    storePath: ACTIVITY_STORE_RELATIVE_PATH,
  };
}

export function readRecentActivityEvents(limit = 25, options = {}) {
  return readActivityEvents({ ...options, limit });
}

export function findActivityById(activityId, options = {}) {
  const { events, warnings } = readActivityEvents(options);
  return {
    event: events.find((candidate) => candidate.activityId === activityId) || null,
    warnings,
  };
}

export function findActivityByCorrelationId(correlationId, options = {}) {
  const { events, warnings } = readActivityEvents(options);
  return {
    events: events.filter((candidate) => candidate.correlationId === correlationId),
    warnings,
  };
}

export function summarizeActivityStore(options = {}) {
  const { events, warnings } = readActivityEvents(options);
  const categories = {};
  for (const event of events) {
    categories[event.category || "unknown"] = (categories[event.category || "unknown"] || 0) + 1;
  }
  return {
    storePath: ACTIVITY_STORE_RELATIVE_PATH,
    eventCount: events.length,
    warningCount: warnings.length,
    warnings,
    categories,
    latestActivityId: events.at(-1)?.activityId || null,
    latestCorrelationId: events.at(-1)?.correlationId || null,
  };
}
