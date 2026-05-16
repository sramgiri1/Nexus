import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  addBatchRequest,
  buildCostApprovalSummary,
  createBatchJob,
  estimateBatchCost,
  estimateRequestCost,
  estimateRequestTokens,
  validateCostEstimate,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/api-batch-cost-estimator-report.md");
const sections = {
  modules: true,
  tokenEstimate: true,
  costEstimate: true,
  batchEstimate: true,
  approvalSummary: true,
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

console.log("NEXUS API Batch Cost Estimator Check");
console.log("====================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const tokens = estimateRequestTokens("Redacted request summary for test gap analysis.");
const requestEstimate = estimateRequestCost(
  { inputSummary: "Redacted request summary for test gap analysis.", modelPolicy: "balanced" },
  { modelPolicy: "balanced", approvalThresholdUsd: 0.01 },
);
const unknownEstimate = estimateRequestCost({ inputSummary: "Redacted high quality request.", modelPolicy: "high_quality" });
let job = createBatchJob({ batchJobId: "cost-preview", workloadType: "test_gap_analysis" });
job = addBatchRequest(job, { custom_id: "cost-001", inputSummary: "Redacted batch request one." });
job = addBatchRequest(job, { custom_id: "cost-002", inputSummary: "Redacted batch request two." });
const batchEstimate = estimateBatchCost(job, { modelPolicy: "low_cost", approvalThresholdUsd: 0.01 });
const approvalSummary = buildCostApprovalSummary(unknownEstimate);

for (const file of ["api-batch/costEstimator.js", "api-batch/modelPolicy.js"]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}
check(packageJson.scripts?.["check:api-batch-cost-estimator"], "modules", "Missing cost estimator package script");

check(tokens.estimatedInputTokens > 0, "tokenEstimate", "Token estimate must include input tokens");
check(tokens.estimatedOutputTokens > 0, "tokenEstimate", "Token estimate must include output tokens");

check(validateCostEstimate(requestEstimate).valid, "costEstimate", "Known cost estimate must validate");
check(requestEstimate.estimatedUsd !== null, "costEstimate", "Known pricing estimate must include USD");
check(requestEstimate.executionAllowed === false, "costEstimate", "Known estimate must keep execution disabled");
check(validateCostEstimate(unknownEstimate).valid, "costEstimate", "Unknown pricing estimate must validate");
check(Boolean(unknownEstimate.unknownCostWarning), "costEstimate", "Unknown pricing must include warning");

check(validateCostEstimate(batchEstimate).valid, "batchEstimate", "Batch cost estimate must validate");
check(batchEstimate.requestCount === 2, "batchEstimate", "Batch estimate must include request count");
check(batchEstimate.executionAllowed === false, "batchEstimate", "Batch estimate must keep execution disabled");

check(approvalSummary.approvalRequired === true, "approvalSummary", "Approval summary must require approval");
check(approvalSummary.executionAllowed === false, "approvalSummary", "Approval summary must keep execution disabled");
check(approvalSummary.decision === "preview_only_blocked", "approvalSummary", "Approval summary must block execution");

const docs = read("docs/architecture/API_BATCH_EXECUTION_ADAPTER.md");
check(docs.includes("P54.7 - Cost Estimator"), "docs", "Architecture doc missing P54.7");
check(docs.includes("No real provider pricing fetch"), "docs", "Architecture doc must state no pricing fetch");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P54.6")?.status === "complete", "osPhaseStatus", "P54.6 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P54.7")?.status), "osPhaseStatus", "P54.7 must be tracked");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS API Batch Cost Estimator Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.7 - Cost Estimator

## Summary

- Request input tokens: ${requestEstimate.estimatedInputTokens}
- Request output tokens: ${requestEstimate.estimatedOutputTokens}
- Request estimated USD: ${requestEstimate.estimatedUsd}
- Unknown pricing warning: ${unknownEstimate.unknownCostWarning || "None"}
- Batch request count: ${batchEstimate.requestCount}
- Batch estimated USD: ${batchEstimate.estimatedUsd}
- Execution allowed: ${batchEstimate.executionAllowed}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Token estimate: ${sections.tokenEstimate ? "PASS" : "FAIL"}
- Cost estimate: ${sections.costEstimate ? "PASS" : "FAIL"}
- Batch estimate: ${sections.batchEstimate ? "PASS" : "FAIL"}
- Approval summary: ${sections.approvalSummary ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No real provider pricing fetch.
- No network.
- No execution approval bypass.

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
  ["Token estimate", "tokenEstimate"],
  ["Cost estimate", "costEstimate"],
  ["Batch estimate", "batchEstimate"],
  ["Approval summary", "approvalSummary"],
  ["Docs", "docs"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Report written", "reportWritten"],
]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
