import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { BATCH_JOB_STATUSES } from "./batchJobTypes.js";

const ROOT = process.cwd();
const DEFAULT_STATUS_PATH = "reports/api-batch/batch-status.json";
const SAFE_REPORT_DIR = resolve(ROOT, "reports/api-batch");

function safeStatusPath(relativePath = DEFAULT_STATUS_PATH) {
  const fullPath = resolve(ROOT, relativePath);
  if (!fullPath.startsWith(`${SAFE_REPORT_DIR}/`)) {
    throw new Error("Batch status previews may only be written under reports/api-batch/");
  }
  return fullPath;
}

function readStatusFile(relativePath) {
  const fullPath = safeStatusPath(relativePath);
  if (!existsSync(fullPath)) return [];
  const parsed = JSON.parse(readFileSync(fullPath, "utf8"));
  return Array.isArray(parsed.records) ? parsed.records : [];
}

function writeStatusFile(records, relativePath) {
  const fullPath = safeStatusPath(relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, JSON.stringify({ records }, null, 2) + "\n", "utf8");
}

export function createBatchStatusRecord(options = {}) {
  return {
    batchJobId: options.batchJobId || `batch_preview_${Date.now()}`,
    providerId: options.providerId || "openai-preview",
    status: options.status || "preview_created",
    mode: "preview_only",
    externalStatusCallsAllowed: false,
    providerPollingAllowed: false,
    externalUploadAllowed: false,
    rawProviderPayloadStored: false,
    message: options.message || "Batch preview created locally.",
    updatedAt: options.updatedAt || new Date().toISOString(),
  };
}

export function updateBatchStatusPreview(record, options = {}) {
  if (!BATCH_JOB_STATUSES.includes(record.status)) {
    throw new Error(`Unsupported batch status: ${record.status}`);
  }
  const relativePath = options.relativePath || DEFAULT_STATUS_PATH;
  const records = readStatusFile(relativePath);
  const next = { ...record, updatedAt: record.updatedAt || new Date().toISOString() };
  const index = records.findIndex((entry) => entry.batchJobId === next.batchJobId);
  if (index >= 0) records[index] = next;
  else records.push(next);
  writeStatusFile(records, relativePath);
  return next;
}

export function getBatchStatusPreview(batchJobId, options = {}) {
  return readStatusFile(options.relativePath || DEFAULT_STATUS_PATH).find((record) => record.batchJobId === batchJobId) || null;
}

export function listBatchStatusPreviews(options = {}) {
  return readStatusFile(options.relativePath || DEFAULT_STATUS_PATH);
}

export function summarizeBatchStatuses(records = []) {
  const statusCounts = Object.fromEntries(BATCH_JOB_STATUSES.map((status) => [status, 0]));
  for (const record of records) {
    if (statusCounts[record.status] !== undefined) statusCounts[record.status] += 1;
  }
  return {
    recordCount: records.length,
    statusCounts,
    providerPollingAllowedCount: records.filter((record) => record.providerPollingAllowed).length,
    externalStatusCallsAllowedCount: records.filter((record) => record.externalStatusCallsAllowed).length,
  };
}
