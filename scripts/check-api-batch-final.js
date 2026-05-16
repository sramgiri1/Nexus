import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  blockOpenAIExecution,
  createBatchJob,
  createOpenAIRequestPreview,
  createProviderAdapter,
  createProviderRequestPreview,
  estimateBatchCost,
  validateBatchJob,
  validateOpenAIRequestPreview,
  validateProviderAdapter,
  validateProviderRequestPreview,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/api-batch-final-report.md");
const sections = {
  providerAdapter: true,
  openaiAdapter: true,
  batchBuilder: true,
  jsonlWriter: true,
  statusTracker: true,
  resultReconciler: true,
  costEstimator: true,
  commandCenter: true,
  safetyBoundaries: true,
  reports: true,
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

console.log("NEXUS API Batch Final Check");
console.log("===========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "reports");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const policy = parseJson("policy/api-batch-adapter-policy.json", "safetyBoundaries");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const routeTests = read("dashboard/tests/routes.spec.js");

check(validateProviderAdapter(createProviderAdapter()).valid, "providerAdapter", "Provider adapter must validate");
check(validateProviderRequestPreview(createProviderRequestPreview()).valid, "providerAdapter", "Provider request preview must validate");
check(validateOpenAIRequestPreview(createOpenAIRequestPreview()).valid, "openaiAdapter", "OpenAI preview must validate");
check(blockOpenAIExecution().blocked === true, "openaiAdapter", "OpenAI execution must be blocked");
check(validateBatchJob(createBatchJob()).valid, "batchBuilder", "Batch builder must create valid job");
check(existsSync(join(ROOT, "api-batch/jsonlWriter.js")), "jsonlWriter", "JSONL writer module missing");
check(existsSync(join(ROOT, "reports/api-batch/sample-batch-preview.jsonl")), "jsonlWriter", "JSONL preview artifact missing");
check(existsSync(join(ROOT, "api-batch/batchStatusTracker.js")), "statusTracker", "Status tracker module missing");
check(existsSync(join(ROOT, "reports/api-batch/batch-status.json")), "statusTracker", "Batch status artifact missing");
check(existsSync(join(ROOT, "api-batch/resultReconciler.js")), "resultReconciler", "Result reconciler module missing");
check(existsSync(join(ROOT, "reports/api-batch/reconciliation-preview.json")), "resultReconciler", "Reconciliation artifact missing");
check(estimateBatchCost(createBatchJob()).executionAllowed === false, "costEstimator", "Batch cost estimate must block execution");
check(existsSync(join(ROOT, "api-batch/costEstimator.js")), "costEstimator", "Cost estimator module missing");

check(routeSource.includes("/command-center/api-batch"), "commandCenter", "Command Center route missing /command-center/api-batch");
check(commandCenterSource.includes("ApiBatchAdapterPage"), "commandCenter", "ApiBatchAdapterPage missing");
check(commandCenterSource.includes("Provider calls disabled"), "commandCenter", "API Batch page missing disabled provider copy");
check(routeTests.includes("API Batch route renders preview-only provider and batch metadata"), "commandCenter", "API Batch route test missing");

for (const field of [
  "providerCallsAllowed",
  "externalNetworkCallsAllowed",
  "apiKeysAllowed",
  "credentialReadsAllowed",
  "dbWritesAllowed",
  "workerRuntimeAllowed",
  "projectMutationAllowed",
  "batchUploadAllowed",
  "providerPollingAllowed",
  "rawPromptStorageAllowed",
]) {
  check(policy[field] === false, "safetyBoundaries", `Policy must set ${field} false`);
}
for (const sourceFile of [
  "api-batch/providerAdapter.js",
  "api-batch/openaiAdapter.js",
  "api-batch/batchJobBuilder.js",
  "api-batch/jsonlWriter.js",
  "api-batch/batchStatusTracker.js",
  "api-batch/resultReconciler.js",
  "api-batch/costEstimator.js",
]) {
  const source = read(sourceFile);
  check(!source.includes("fetch("), "safetyBoundaries", `${sourceFile} must not call fetch`);
  check(!source.includes("process.env"), "safetyBoundaries", `${sourceFile} must not read secrets from env`);
  check(!source.includes("@openai"), "safetyBoundaries", `${sourceFile} must not import provider SDKs`);
}

for (const scriptName of [
  "check:api-batch-final",
  "check:api-batch-provider-adapter",
  "check:openai-adapter-preview",
  "check:batch-job-builder",
  "check:batch-jsonl-writer",
  "check:batch-status-tracker",
  "check:batch-result-reconciler",
  "check:api-batch-cost-estimator",
]) {
  check(Boolean(packageJson.scripts?.[scriptName]), "reports", `Missing package script ${scriptName}`);
}
for (const report of [
  "reports/api-batch-provider-adapter-report.md",
  "reports/openai-adapter-preview-report.md",
  "reports/batch-job-builder-report.md",
  "reports/batch-jsonl-writer-report.md",
  "reports/batch-status-tracker-report.md",
  "reports/batch-result-reconciler-report.md",
  "reports/api-batch-cost-estimator-report.md",
  "reports/command-center-ux-report.md",
]) {
  check(existsSync(join(ROOT, report)), "reports", `Missing report: ${report}`);
  check(read(report).includes("Validation HEAD"), "reports", `${report} missing Validation HEAD wording`);
}

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P54.1", "P54.2", "P54.3", "P54.4", "P54.5", "P54.6", "P54.7", "P54.8", "P54.9"]) {
  check(statusById.get(phaseId)?.status === "complete", "osPhaseStatus", `${phaseId} must be complete`);
}
check(statusById.get("P54")?.status === "complete", "osPhaseStatus", "P54 parent must be complete");
check(phaseStatus.currentPhase === "P54.9", "osPhaseStatus", "Current phase must be P54.9");
check(phaseStatus.nextPhase === "P55", "osPhaseStatus", "Next phase must be P55");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB runtime change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS API Batch Final Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.9 - API + Batch Adapter Final Validation

## Summary

- Provider adapter: ${sections.providerAdapter ? "PASS" : "FAIL"}
- OpenAI adapter skeleton: ${sections.openaiAdapter ? "PASS" : "FAIL"}
- Batch builder: ${sections.batchBuilder ? "PASS" : "FAIL"}
- JSONL writer: ${sections.jsonlWriter ? "PASS" : "FAIL"}
- Status tracker: ${sections.statusTracker ? "PASS" : "FAIL"}
- Result reconciler: ${sections.resultReconciler ? "PASS" : "FAIL"}
- Cost estimator: ${sections.costEstimator ? "PASS" : "FAIL"}
- Command Center API / Batch UX: ${sections.commandCenter ? "PASS" : "FAIL"}

## Safety Boundary

- Provider calls disabled.
- External network disabled.
- API key and credential reads disabled.
- DB writes disabled.
- Worker runtime disabled.
- Project mutation disabled.
- Batch upload and provider polling disabled.

## Checks

${Object.entries(sections)
  .map(([section, passed]) => `- ${section}: ${passed ? "PASS" : "FAIL"}`)
  .join("\n")}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Next Phase

P55 - Test Suite Manager: Project + OS

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
  ["Provider adapter", "providerAdapter"],
  ["OpenAI adapter", "openaiAdapter"],
  ["Batch builder", "batchBuilder"],
  ["JSONL writer", "jsonlWriter"],
  ["Status tracker", "statusTracker"],
  ["Result reconciler", "resultReconciler"],
  ["Cost estimator", "costEstimator"],
  ["Command Center", "commandCenter"],
  ["Safety boundaries", "safetyBoundaries"],
  ["Reports", "reports"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Report written", "reportWritten"],
]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
