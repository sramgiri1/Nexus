import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createCommandRecord, validateCommandRecord, buildCommandTimeline } from "./commandTimeline.js";

const DEFAULT_COMMANDS_PATH = join(process.cwd(), "local-state/runtime/commands.jsonl");

function parseJsonl(source = "") {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function appendCommandRecord(record, filePath = DEFAULT_COMMANDS_PATH) {
  const safeRecord = createCommandRecord(record);
  const validation = validateCommandRecord(safeRecord);
  if (!validation.valid) throw new Error(`Invalid command record: ${validation.errors.join("; ")}`);
  mkdirSync(dirname(filePath), { recursive: true });
  const existing = existsSync(filePath) ? readFileSync(filePath, "utf8").trim() : "";
  const next = `${existing ? `${existing}\n` : ""}${JSON.stringify(safeRecord)}\n`;
  writeFileSync(filePath, next, "utf8");
  return safeRecord;
}

export function listCommandRecords(options = {}) {
  const filePath = options.filePath || DEFAULT_COMMANDS_PATH;
  if (!existsSync(filePath)) return [];
  const records = parseJsonl(readFileSync(filePath, "utf8"));
  return records
    .filter((record) => !options.scope || record.scope === options.scope)
    .slice(-(options.limit || records.length));
}

export function getCommandRecord(commandId, filePath = DEFAULT_COMMANDS_PATH) {
  return listCommandRecords({ filePath }).find((record) => record.commandId === commandId) || null;
}

export { createCommandRecord, validateCommandRecord, buildCommandTimeline };
