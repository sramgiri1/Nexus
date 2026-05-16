import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  addBatchRequest,
  createBatchJob,
  mapResultByCustomId,
  reconcileBatchResultsPreview,
  summarizeReconciliation,
  validateBatchResultRecord,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/batch-result-reconciler-report.md");
const PREVIEW_PATH = join(ROOT, "reports/api-batch/reconciliation-preview.json");
const sections = {
  module: true,
  validation: true,
  reconciliation: true,
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

console.log("NEXUS Batch Result Reconciler Check");
console.log("===================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "module");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
let job = createBatchJob({ batchJobId: "sample-batch-preview", workloadType: "module_classification" });
job = addBatchRequest(job, { custom_id: "module-001", inputSummary: "Redacted module classification request." });
job = addBatchRequest(job, { custom_id: "module-002", inputSummary: "Redacted docs classification request." });
const results = [
  { custom_id: "module-001", outputSummary: "Preview classification summary.", rawProviderPayloadStored: false },
  { custom_id: "module-003", outputSummary: "Unmatched preview result.", rawProviderPayloadStored: false },
];
const mapResult = mapResultByCustomId(results);
const reconciliation = reconcileBatchResultsPreview(job, results);
const summary = summarizeReconciliation(reconciliation);
writeFileSync(PREVIEW_PATH, JSON.stringify({ summary, reconciliation }, null, 2) + "\n", "utf8");

check(existsSync(join(ROOT, "api-batch/resultReconciler.js")), "module", "Missing resultReconciler module");
check(packageJson.scripts?.["check:batch-result-reconciler"], "module", "Missing check:batch-result-reconciler script");

check(validateBatchResultRecord(results[0]).valid, "validation", "Valid preview result must pass validation");
check(!validateBatchResultRecord({ custom_id: "bad", outputSummary: "sk-test", rawProviderPayloadStored: true }).valid, "validation", "Unsafe result must fail validation");
check(mapResult.errors.length === 0, "validation", `Safe result map should not error: ${mapResult.errors.join("; ")}`);

check(summary.matchedCount === 1, "reconciliation", "Reconciliation must match one result");
check(summary.missingCount === 1, "reconciliation", "Reconciliation must detect one missing result");
check(summary.unmatchedCount === 1, "reconciliation", "Reconciliation must detect one unmatched result");
check(existsSync(PREVIEW_PATH), "reconciliation", "Reconciliation preview artifact must exist");

check(summary.providerDownloadAllowed === false, "safety", "Provider download must be disabled");
check(reconciliation.rawProviderPayloadStored === false, "safety", "Raw provider payload storage must be disabled");

const docs = read("docs/architecture/API_BATCH_EXECUTION_ADAPTER.md");
check(docs.includes("P54.6 - Batch Result Reconciler Preview"), "docs", "Architecture doc missing P54.6");
check(docs.includes("No provider output download"), "docs", "Architecture doc must state no provider output download");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P54.5")?.status === "complete", "osPhaseStatus", "P54.5 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P54.6")?.status), "osPhaseStatus", "P54.6 must be tracked");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Batch Result Reconciler Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.6 - Batch Result Reconciler Preview

## Summary

- Matched results: ${summary.matchedCount}
- Missing results: ${summary.missingCount}
- Unmatched results: ${summary.unmatchedCount}
- Errors: ${summary.errorCount}
- Warnings: ${summary.warningCount}
- Provider download allowed: ${summary.providerDownloadAllowed}

## Checks

- Module: ${sections.module ? "PASS" : "FAIL"}
- Validation: ${sections.validation ? "PASS" : "FAIL"}
- Reconciliation: ${sections.reconciliation ? "PASS" : "FAIL"}
- Safety: ${sections.safety ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No provider output download.
- No raw provider payload storage.
- Preview/mock-safe records only.

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
  ["Validation", "validation"],
  ["Reconciliation", "reconciliation"],
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
