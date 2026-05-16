import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createBatchStatusRecord,
  getBatchStatusPreview,
  listBatchStatusPreviews,
  summarizeBatchStatuses,
  updateBatchStatusPreview,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/batch-status-tracker-report.md");
const STATUS_PATH = "reports/api-batch/batch-status.json";
const sections = {
  module: true,
  statusRecords: true,
  safety: true,
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

console.log("NEXUS Batch Status Tracker Check");
console.log("================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "module");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const first = updateBatchStatusPreview(
  createBatchStatusRecord({ batchJobId: "sample-batch-preview", status: "ready_for_review" }),
  { relativePath: STATUS_PATH },
);
const second = updateBatchStatusPreview(
  createBatchStatusRecord({
    batchJobId: "sample-batch-upload-blocked",
    status: "upload_not_enabled",
    message: "Provider upload is disabled in P54.",
  }),
  { relativePath: STATUS_PATH },
);
const records = listBatchStatusPreviews({ relativePath: STATUS_PATH });
const summary = summarizeBatchStatuses(records);
const fetched = getBatchStatusPreview(first.batchJobId, { relativePath: STATUS_PATH });

check(existsSync(join(ROOT, "api-batch/batchStatusTracker.js")), "module", "Missing batchStatusTracker module");
check(packageJson.scripts?.["check:batch-status-tracker"], "module", "Missing check:batch-status-tracker script");
check(existsSync(join(ROOT, STATUS_PATH)), "statusRecords", "Batch status preview file must exist");
check(Boolean(fetched), "statusRecords", "Must fetch status preview by batchJobId");
check(first.status === "ready_for_review", "statusRecords", "First status must be ready_for_review");
check(second.status === "upload_not_enabled", "statusRecords", "Second status must be upload_not_enabled");
check(summary.recordCount >= 2, "statusRecords", "Summary must include status records");
check(summary.statusCounts.upload_not_enabled >= 1, "statusRecords", "Summary must count upload_not_enabled");

check(summary.providerPollingAllowedCount === 0, "safety", "Provider polling must be disabled");
check(summary.externalStatusCallsAllowedCount === 0, "safety", "External status calls must be disabled");
check(records.every((record) => record.rawProviderPayloadStored === false), "safety", "Raw provider payloads must not be stored");

const docs = read("docs/architecture/API_BATCH_EXECUTION_ADAPTER.md");
check(docs.includes("P54.5 - Batch Status Tracker Preview"), "docs", "Architecture doc missing P54.5");
check(docs.includes("No provider polling"), "docs", "Architecture doc must state no provider polling");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P54.4")?.status === "complete", "osPhaseStatus", "P54.4 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P54.5")?.status), "osPhaseStatus", "P54.5 must be tracked");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Batch Status Tracker Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.5 - Batch Status Tracker Preview

## Summary

- Status records: ${summary.recordCount}
- Ready for review: ${summary.statusCounts.ready_for_review}
- Upload not enabled: ${summary.statusCounts.upload_not_enabled}
- Provider polling allowed count: ${summary.providerPollingAllowedCount}
- External status calls allowed count: ${summary.externalStatusCallsAllowedCount}

## Checks

- Module: ${sections.module ? "PASS" : "FAIL"}
- Status records: ${sections.statusRecords ? "PASS" : "FAIL"}
- Safety: ${sections.safety ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No provider polling.
- No external status calls.
- No provider payload download.

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
  ["Status records", "statusRecords"],
  ["Safety", "safety"],
  ["Docs", "docs"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Report written", "reportWritten"],
]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
