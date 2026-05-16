import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  sanitizeCostLedgerRecord,
  summarizeCostLedger,
  validateCostLedgerRecord,
} from "./costLedgerSchema.js";

const DEFAULT_PREVIEW_PATH = "reports/cost-ledger-preview.json";

export function getCostLedgerPath(options = {}) {
  return options.path || join(process.cwd(), DEFAULT_PREVIEW_PATH);
}

export function readCostLedgerRecords(options = {}) {
  const ledgerPath = getCostLedgerPath(options);
  if (!existsSync(ledgerPath)) return [];
  const parsed = JSON.parse(readFileSync(ledgerPath, "utf8"));
  return Array.isArray(parsed.records) ? parsed.records : [];
}

export function appendCostLedgerRecord(record, options = {}) {
  const records = readCostLedgerRecords(options);
  const sanitized = sanitizeCostLedgerRecord(record);
  const validation = validateCostLedgerRecord(sanitized);
  if (!validation.valid) {
    throw new Error(`Invalid cost ledger record: ${validation.errors.join(", ")}`);
  }
  records.push(sanitized);
  return writeCostLedgerPreview(records, options);
}

export function writeCostLedgerPreview(records = [], options = {}) {
  const ledgerPath = getCostLedgerPath(options);
  const sanitized = records.map((record) => sanitizeCostLedgerRecord(record));
  const payload = {
    version: "1.0",
    phase: options.phase || "P57.1",
    generatedAt: new Date().toISOString(),
    previewOnly: true,
    providerDispatchAllowed: false,
    externalNetworkCallsAllowed: false,
    dbWritesAllowed: false,
    records: sanitized,
    summary: summarizeCostLedger(sanitized),
  };
  writeFileSync(ledgerPath, JSON.stringify(payload, null, 2) + "\n");
  return payload;
}

export function summarizeCostLedgerStore(options = {}) {
  return summarizeCostLedger(readCostLedgerRecords(options));
}
