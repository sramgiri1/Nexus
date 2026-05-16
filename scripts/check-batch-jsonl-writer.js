import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  addBatchRequest,
  createBatchJob,
  readBatchJsonlPreviewSummary,
  redactBatchJsonlRecord,
  validateBatchJsonlPreview,
  writeBatchJsonlPreview,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/batch-jsonl-writer-report.md");
const PREVIEW_PATH = "reports/api-batch/sample-batch-preview.jsonl";
const sections = {
  module: true,
  writer: true,
  redaction: true,
  safePath: true,
  docs: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  reportWritten: true,
};
const failures = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function parseJson(relativePath, section) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(section, `${relativePath} did not parse: ${error.message}`);
    return {};
  }
}

function fail(section, message) {
  sections[section] = false;
  failures.push(message);
}

function check(condition, section, message) {
  if (!condition) fail(section, message);
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function changedFiles() {
  return gitOutput(["status", "--short"])
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Batch JSONL Writer Check");
console.log("==============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "module");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
let job = createBatchJob({ batchJobId: "sample-batch-preview", workloadType: "docs_generation" });
job = addBatchRequest(job, { custom_id: "docs-001", inputSummary: "Redacted docs generation request." });
job = addBatchRequest(job, { custom_id: "docs-002", inputSummary: "Redacted module registry request." });
const writeSummary = writeBatchJsonlPreview(job, { relativePath: PREVIEW_PATH });
const validation = validateBatchJsonlPreview(PREVIEW_PATH);
const readSummary = readBatchJsonlPreviewSummary(PREVIEW_PATH);
const redacted = redactBatchJsonlRecord({ custom_id: "redact-001", rawInput: "private", externalCallAllowed: true });

check(existsSync(join(ROOT, "api-batch/jsonlWriter.js")), "module", "Missing api-batch/jsonlWriter.js");
check(packageJson.scripts?.["check:batch-jsonl-writer"], "module", "Missing check:batch-jsonl-writer script");

check(writeSummary.relativePath === PREVIEW_PATH, "writer", "Writer summary must use safe preview path");
check(writeSummary.requestCount === 2, "writer", "Writer must write two preview records");
check(existsSync(join(ROOT, PREVIEW_PATH)), "writer", "JSONL preview file must exist");
check(existsSync(join(ROOT, "reports/api-batch/sample-batch-preview.json")), "writer", "JSON summary file must exist");
check(validation.valid, "writer", `JSONL preview invalid: ${validation.errors.join("; ")}`);
check(readSummary.lineCount === 2, "writer", "Read summary must count two JSONL records");

check(redacted.rawInputStored === false, "redaction", "Redacted record must disable raw input storage");
check(redacted.externalCallAllowed === false, "redaction", "Redacted record must disable external calls");
check(!JSON.stringify(redacted).includes("private"), "redaction", "Redacted record must not include raw input");

try {
  writeBatchJsonlPreview(job, { relativePath: "reports/not-api-batch/bad.jsonl" });
  fail("safePath", "Writer allowed path outside reports/api-batch/");
} catch {
  check(true, "safePath", "Unsafe path rejected");
}

const docs = read("docs/architecture/API_BATCH_EXECUTION_ADAPTER.md");
check(docs.includes("P54.4 - JSONL Job Writer"), "docs", "Architecture doc missing P54.4");
check(docs.includes("reports/api-batch/"), "docs", "Architecture doc must mention reports/api-batch/");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P54.3")?.status === "complete", "osPhaseStatus", "P54.3 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P54.4")?.status), "osPhaseStatus", "P54.4 must be tracked");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Batch JSONL Writer Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.4 - JSONL Job Writer

## Summary

- Preview path: ${writeSummary.relativePath}
- Request count: ${writeSummary.requestCount}
- JSONL line count: ${readSummary.lineCount}
- External upload allowed: ${writeSummary.externalUploadAllowed}
- Safe for review: ${writeSummary.safeForReview}

## Checks

- Module: ${sections.module ? "PASS" : "FAIL"}
- Writer: ${sections.writer ? "PASS" : "FAIL"}
- Redaction: ${sections.redaction ? "PASS" : "FAIL"}
- Safe path: ${sections.safePath ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No provider upload.
- No external network.
- No raw prompt or private source dumps.

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Result

${result}
`;

try {
  writeFileSync(REPORT_PATH, report, "utf8");
} catch (error) {
  fail("reportWritten", `Could not write report: ${error.message}`);
}

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
for (const [label, section] of [
  ["Module", "module"],
  ["Writer", "writer"],
  ["Redaction", "redaction"],
  ["Safe path", "safePath"],
  ["Docs", "docs"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Report written", "reportWritten"],
]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
