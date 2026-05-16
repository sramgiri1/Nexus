import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  addBatchRequest,
  createBatchJob,
  estimateBatchJobSize,
  summarizeBatchJob,
  validateBatchJob,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/batch-job-builder-report.md");
const sections = {
  modules: true,
  builder: true,
  validation: true,
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

console.log("NEXUS Batch Job Builder Check");
console.log("=============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
let job = createBatchJob({ workloadType: "test_gap_analysis" });
job = addBatchRequest(job, { custom_id: "test-gap-001", inputSummary: "Redacted test gap request." });
job = addBatchRequest(job, { custom_id: "test-gap-002", inputSummary: "Redacted docs request." });
const validation = validateBatchJob(job);
const summary = summarizeBatchJob(job);
const size = estimateBatchJobSize(job);

for (const file of ["api-batch/batchJobBuilder.js", "api-batch/batchJobTypes.js"]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}
check(packageJson.scripts?.["check:batch-job-builder"], "modules", "Missing check:batch-job-builder script");

check(job.mode === "preview_only", "builder", "Batch job must be preview-only");
check(job.externalUploadAllowed === false, "builder", "Batch job must not allow external upload");
check(job.executionAllowed === false, "builder", "Batch job must not allow execution");
check(job.requestCount === 2, "builder", "Batch job must track request count");
check(job.requests.every((request) => request.rawInputStored === false), "builder", "Requests must not store raw input");
check(job.requests.every((request) => request.externalCallAllowed === false), "builder", "Requests must not allow external calls");

check(validation.valid, "validation", `Batch job invalid: ${validation.errors.join("; ")}`);
check(summary.costEstimateRequired === true, "validation", "Summary must require cost estimate");
check(summary.resultReconciliationRequired === true, "validation", "Summary must require reconciliation");
check(size.estimatedLines === 2, "validation", "Size estimate must count JSONL lines");

const docs = read("docs/architecture/API_BATCH_EXECUTION_ADAPTER.md");
check(docs.includes("P54.3 - Batch Job Builder"), "docs", "Architecture doc missing P54.3");
check(docs.includes("No upload"), "docs", "Architecture doc must state no upload");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P54.2")?.status === "complete", "osPhaseStatus", "P54.2 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P54.3")?.status), "osPhaseStatus", "P54.3 must be tracked");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Batch Job Builder Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.3 - Batch Job Builder

## Summary

- Batch job ID: ${summary.batchJobId}
- Workload: ${summary.workloadType}
- Request count: ${summary.requestCount}
- Estimated lines: ${size.estimatedLines}
- Estimated bytes: ${size.estimatedBytes}
- External upload allowed: ${summary.externalUploadAllowed}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Builder: ${sections.builder ? "PASS" : "FAIL"}
- Validation: ${sections.validation ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No provider upload.
- No external network.
- No raw private source dumps.
- No execution path.

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
  ["Modules", "modules"],
  ["Builder", "builder"],
  ["Validation", "validation"],
  ["Docs", "docs"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Report written", "reportWritten"],
]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
