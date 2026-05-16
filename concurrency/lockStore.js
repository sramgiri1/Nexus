import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { validateLockRecord } from "./lockModel.js";

const DEFAULT_LOCK_PATH = join(process.cwd(), "local-state/runtime/concurrency-locks.jsonl");

export function parseJsonl(source = "") {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function listLockPreviewRecords(filePath = DEFAULT_LOCK_PATH) {
  if (!existsSync(filePath)) return [];
  return parseJsonl(readFileSync(filePath, "utf8")).filter((record) => {
    const validation = validateLockRecord(record);
    return validation.valid;
  });
}

export function writeLockPreviewRecords(records = [], filePath = DEFAULT_LOCK_PATH) {
  mkdirSync(dirname(filePath), { recursive: true });
  const safeRecords = records.map((record) => ({ ...record, previewOnly: true, redacted: true }));
  writeFileSync(filePath, safeRecords.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
  return safeRecords;
}
