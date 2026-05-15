import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createAgentRoom, validateAgentRoom } from "./agentRooms.js";

const ROOT = process.cwd();
const DEFAULT_STORE = "local-state/runtime/agent-rooms.jsonl";

function resolveStorePath(options = {}) {
  return join(ROOT, options.storePath || DEFAULT_STORE);
}

function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export function ensureAgentRoomStore(options = {}) {
  const storePath = resolveStorePath(options);
  mkdirSync(dirname(storePath), { recursive: true });
  if (!existsSync(storePath)) writeFileSync(storePath, "", "utf8");
  return options.storePath || DEFAULT_STORE;
}

function appendRoom(room, options = {}) {
  const validation = validateAgentRoom(room, options);
  if (!validation.ok) return { ok: false, written: false, errors: validation.errors };
  const storePath = resolveStorePath(options);
  mkdirSync(dirname(storePath), { recursive: true });
  appendFileSync(storePath, `${JSON.stringify({ ...room, redacted: true })}\n`, "utf8");
  return { ok: true, written: true, room: { ...room, redacted: true }, errors: [], storePath: options.storePath || DEFAULT_STORE };
}

export function listAgentRooms(filters = {}, options = {}) {
  const storePath = resolveStorePath(options);
  if (!existsSync(storePath)) return [];
  const latest = new Map();
  readFileSync(storePath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(parseLine)
    .filter(Boolean)
    .forEach((room) => latest.set(room.roomId, room));
  return [...latest.values()].filter((room) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === "") continue;
      if (room[key] !== value) return false;
    }
    return true;
  });
}

export function getAgentRoom(roomId, options = {}) {
  return listAgentRooms({}, options).find((room) => room.roomId === roomId) || null;
}

export function saveAgentRoom(input = {}, options = {}) {
  return appendRoom(createAgentRoom(input), options);
}

export function addRoomParticipant(roomId, agentId, options = {}) {
  const room = getAgentRoom(roomId, options);
  if (!room) return { ok: false, written: false, errors: [`Room not found: ${roomId}`] };
  const participants = [...new Set([...room.participants, agentId])];
  return appendRoom({ ...room, participants }, options);
}

export function closeAgentRoom(roomId, options = {}) {
  const room = getAgentRoom(roomId, options);
  if (!room) return { ok: false, written: false, errors: [`Room not found: ${roomId}`] };
  return appendRoom({ ...room, status: "closed", closedAt: new Date().toISOString() }, options);
}
