import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { validateAgentMeshMessage } from "./messageContract.js";

const ROOT = process.cwd();
const DEFAULT_STORE = "local-state/runtime/agent-messages.jsonl";

function resolveStorePath(options = {}) {
  return join(ROOT, options.storePath || DEFAULT_STORE);
}

function safeParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export function appendMeshMessage(message, options = {}) {
  const validation = validateAgentMeshMessage(message);
  if (!validation.ok) {
    return { ok: false, written: false, errors: validation.errors };
  }
  const record = {
    ...message,
    status: message.status || "recorded",
    rawPayloadStored: false,
    redacted: true,
  };
  const storePath = resolveStorePath(options);
  mkdirSync(dirname(storePath), { recursive: true });
  appendFileSync(storePath, `${JSON.stringify(record)}\n`, "utf8");
  return { ok: true, written: true, message: record, storePath: options.storePath || DEFAULT_STORE, errors: [] };
}

export function listMeshMessages(filters = {}, options = {}) {
  const storePath = resolveStorePath(options);
  if (!existsSync(storePath)) return [];
  return readFileSync(storePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(safeParse)
    .filter(Boolean)
    .filter((message) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === "") continue;
        if (message[key] !== value) return false;
      }
      return true;
    });
}

export function getMeshMessage(messageId, options = {}) {
  return listMeshMessages({}, options).find((message) => message.messageId === messageId) || null;
}

export function listMessagesForRoom(roomId, options = {}) {
  return listMeshMessages({ roomId }, options);
}

export function listMessagesForTask(taskId, options = {}) {
  return listMeshMessages({ taskId }, options);
}

export function listMessagesForAgent(agentId, options = {}) {
  return listMeshMessages({}, options).filter(
    (message) => message.fromAgent === agentId || message.toAgent === agentId,
  );
}

export function ensureMeshMessageStore(options = {}) {
  const storePath = resolveStorePath(options);
  mkdirSync(dirname(storePath), { recursive: true });
  if (!existsSync(storePath)) writeFileSync(storePath, "", "utf8");
  return options.storePath || DEFAULT_STORE;
}
