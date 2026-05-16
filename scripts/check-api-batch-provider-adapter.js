import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createProviderAdapter,
  createProviderRequestPreview,
  listProviderAdapters,
  summarizeProviderRegistry,
  validateApiBatchAdapterPolicy,
  validateProviderAdapter,
  validateProviderRegistry,
  validateProviderRequestPreview,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/api-batch-provider-adapter-report.md");
const sections = {
  modules: true,
  exports: true,
  registry: true,
  policy: true,
  requestPreview: true,
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

console.log("NEXUS API Batch Provider Adapter Check");
console.log("======================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const policyJson = parseJson("policy/api-batch-adapter-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const adapter = createProviderAdapter();
const adapters = listProviderAdapters();
const registrySummary = summarizeProviderRegistry(adapters);
const preview = createProviderRequestPreview({ providerId: "openai-preview", workloadType: "docs_generation" });

for (const file of [
  "api-batch/providerAdapter.js",
  "api-batch/providerRegistry.js",
  "api-batch/providerPolicy.js",
  "api-batch/index.js",
  "policy/api-batch-adapter-policy.json",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}
check(
  packageJson.scripts?.["check:api-batch-provider-adapter"] === "node scripts/check-api-batch-provider-adapter.js",
  "modules",
  "Missing package script check:api-batch-provider-adapter",
);

check(typeof createProviderAdapter === "function", "exports", "Missing createProviderAdapter export");
check(typeof validateProviderAdapter === "function", "exports", "Missing validateProviderAdapter export");
check(typeof listProviderAdapters === "function", "exports", "Missing listProviderAdapters export");
check(typeof validateProviderRequestPreview === "function", "exports", "Missing validateProviderRequestPreview export");

check(validateProviderAdapter(adapter).valid, "registry", "Default provider adapter must validate");
check(validateProviderRegistry(adapters).valid, "registry", "Provider registry must validate");
check(registrySummary.providerCount >= 3, "registry", "Provider registry must include preview adapters");
check(registrySummary.externalCallsEnabledCount === 0, "registry", "External calls must be disabled for all adapters");

const policyValidation = validateApiBatchAdapterPolicy(policyJson);
check(policyValidation.valid, "policy", `Policy invalid: ${policyValidation.errors.join("; ")}`);
check(policyJson.providerCallsAllowed === false, "policy", "Provider calls must be disabled");
check(policyJson.externalNetworkCallsAllowed === false, "policy", "External network calls must be disabled");
check(policyJson.apiKeysAllowed === false, "policy", "API keys must be disabled");

const previewValidation = validateProviderRequestPreview(preview);
check(previewValidation.valid, "requestPreview", `Request preview invalid: ${previewValidation.errors.join("; ")}`);
check(preview.externalCallAllowed === false, "requestPreview", "Request preview must not allow external calls");
check(preview.rawInputStored === false, "requestPreview", "Request preview must not store raw input");

const docs = read("docs/architecture/API_BATCH_EXECUTION_ADAPTER.md");
check(docs.includes("P54.1 - Provider Adapter Interface"), "docs", "Architecture doc missing P54.1");
check(docs.includes("No provider calls"), "docs", "Architecture doc must state no provider calls");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P53")?.status === "complete", "osPhaseStatus", "P53 must remain complete");
check(["in_progress", "complete"].includes(statusById.get("P54")?.status), "osPhaseStatus", "P54 must be tracked");
check(["in_progress", "complete"].includes(statusById.get("P54.1")?.status), "osPhaseStatus", "P54.1 must be tracked");
check(phaseStatus.currentPhase?.startsWith("P54"), "osPhaseStatus", "Current phase must be a P54 phase");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS API Batch Provider Adapter Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.1 - Provider Adapter Interface

## Summary

- Provider adapters: ${registrySummary.providerCount}
- Preview-only adapters: ${registrySummary.previewOnlyCount}
- Planned adapters: ${registrySummary.plannedCount}
- External calls enabled: ${registrySummary.externalCallsEnabledCount}
- Request preview execution allowed: ${preview.executionAllowed}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Request preview: ${sections.requestPreview ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No provider SDK imports.
- No API key reads or credential usage.
- No provider calls, external network calls, DB writes, workers, or project mutation.

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
  ["Exports", "exports"],
  ["Registry", "registry"],
  ["Policy", "policy"],
  ["Request preview", "requestPreview"],
  ["Docs", "docs"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Report written", "reportWritten"],
]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
