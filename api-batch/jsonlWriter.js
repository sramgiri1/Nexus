import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { validateBatchJob } from "./batchJobBuilder.js";

const ROOT = process.cwd();
const SAFE_REPORT_DIR = resolve(ROOT, "reports/api-batch");

function assertSafeOutputPath(relativePath) {
  const outputPath = resolve(ROOT, relativePath);
  if (!outputPath.startsWith(`${SAFE_REPORT_DIR}/`) && outputPath !== SAFE_REPORT_DIR) {
    throw new Error("Batch JSONL previews may only be written under reports/api-batch/");
  }
  return outputPath;
}

export function redactBatchJsonlRecord(record = {}) {
  return {
    custom_id: record.custom_id,
    method: record.method || "POST",
    endpoint: record.endpoint || "/v1/responses",
    inputSummary: record.inputSummary || "Redacted batch request summary only.",
    rawInputStored: false,
    externalCallAllowed: false,
    metadata: record.metadata || {},
  };
}

export function writeBatchJsonlPreview(batchJob, options = {}) {
  const validation = validateBatchJob(batchJob);
  if (!validation.valid) {
    throw new Error(`Cannot write invalid batch job preview: ${validation.errors.join("; ")}`);
  }
  const relativePath = options.relativePath || `reports/api-batch/${batchJob.batchJobId}.jsonl`;
  const outputPath = assertSafeOutputPath(relativePath);
  mkdirSync(dirname(outputPath), { recursive: true });
  const records = batchJob.requests.map((request) => redactBatchJsonlRecord(request));
  const content = records.map((record) => JSON.stringify(record)).join("\n") + (records.length ? "\n" : "");
  writeFileSync(outputPath, content, "utf8");
  const summary = {
    batchJobId: batchJob.batchJobId,
    relativePath,
    requestCount: records.length,
    customIdsPresent: records.every((record) => Boolean(record.custom_id)),
    externalUploadAllowed: false,
    safeForReview: true,
  };
  writeFileSync(outputPath.replace(/\.jsonl$/, ".json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
  return summary;
}

export function validateBatchJsonlPreview(relativePath) {
  const outputPath = assertSafeOutputPath(relativePath);
  const errors = [];
  const content = readFileSync(outputPath, "utf8");
  const lines = content.split("\n").filter(Boolean);
  const seen = new Set();
  for (const [index, line] of lines.entries()) {
    try {
      const record = JSON.parse(line);
      if (!record.custom_id) errors.push(`Line ${index + 1} missing custom_id`);
      if (seen.has(record.custom_id)) errors.push(`Duplicate custom_id: ${record.custom_id}`);
      seen.add(record.custom_id);
      if (record.rawInputStored !== false) errors.push(`${record.custom_id} stores raw input`);
      if (record.externalCallAllowed !== false) errors.push(`${record.custom_id} allows external calls`);
    } catch (error) {
      errors.push(`Line ${index + 1} is invalid JSON: ${error.message}`);
    }
  }
  return { valid: errors.length === 0, errors, lineCount: lines.length };
}

export function readBatchJsonlPreviewSummary(relativePath) {
  const outputPath = assertSafeOutputPath(relativePath);
  const validation = validateBatchJsonlPreview(relativePath);
  return {
    relativePath,
    lineCount: validation.lineCount,
    valid: validation.valid,
    errors: validation.errors,
    externalUploadAllowed: false,
  };
}
