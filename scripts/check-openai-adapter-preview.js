import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  blockOpenAIExecution,
  createOpenAIRequestPreview,
  getProviderAdapter,
  summarizeOpenAIRequestPreview,
  validateOpenAIRequestPreview,
} from "../api-batch/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/openai-adapter-preview-report.md");
const sections = {
  module: true,
  requestShape: true,
  executionBlocked: true,
  registry: true,
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

console.log("NEXUS OpenAI Adapter Preview Check");
console.log("==================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "module");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const source = read("api-batch/openaiAdapter.js");
const preview = createOpenAIRequestPreview({
  endpoint: "responses",
  modelPolicy: "balanced",
  inputSummary: "Redacted test-gap-analysis request summary.",
});
const summary = summarizeOpenAIRequestPreview(preview);
const blocked = blockOpenAIExecution();

check(existsSync(join(ROOT, "api-batch/openaiAdapter.js")), "module", "Missing api-batch/openaiAdapter.js");
check(packageJson.scripts?.["check:openai-adapter-preview"], "module", "Missing check:openai-adapter-preview script");
check(!source.includes("@openai"), "module", "OpenAI SDK must not be imported");
check(!source.includes("process.env"), "module", "OpenAI adapter must not read API keys from env");
check(!source.includes("fetch("), "module", "OpenAI adapter must not call fetch");

const validation = validateOpenAIRequestPreview(preview);
check(validation.valid, "requestShape", `OpenAI preview invalid: ${validation.errors.join("; ")}`);
check(summary.providerId === "openai-preview", "requestShape", "Summary providerId must be openai-preview");
check(summary.mode === "preview_only", "requestShape", "Summary mode must be preview_only");
check(summary.externalCallAllowed === false, "requestShape", "External calls must be disabled");
check(summary.rawInputStored === false, "requestShape", "Raw input storage must be disabled");

check(blocked.blocked === true, "executionBlocked", "OpenAI execution must be blocked");
check(blocked.executionAllowed === false, "executionBlocked", "OpenAI executionAllowed must be false");
check(blocked.externalCallAllowed === false, "executionBlocked", "OpenAI externalCallAllowed must be false");

const registryEntry = getProviderAdapter("openai-preview");
check(Boolean(registryEntry), "registry", "Provider registry must include openai-preview");
check(registryEntry?.externalCallsEnabled === false, "registry", "openai-preview external calls must be disabled");

const docs = read("docs/architecture/API_BATCH_EXECUTION_ADAPTER.md");
check(docs.includes("P54.2 - OpenAI API Adapter Skeleton"), "docs", "Architecture doc missing P54.2");
check(docs.includes("No actual OpenAI client"), "docs", "Architecture doc must state no actual OpenAI client");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P54.1")?.status === "complete", "osPhaseStatus", "P54.1 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P54.2")?.status), "osPhaseStatus", "P54.2 must be tracked");
check(phaseStatus.currentPhase?.startsWith("P54"), "osPhaseStatus", "Current phase must be P54");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider runtime change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS OpenAI Adapter Preview Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P54.2 - OpenAI API Adapter Skeleton

## Summary

- Provider: ${summary.providerId}
- Endpoint: ${summary.endpoint}
- Model policy: ${summary.modelPolicy}
- Mode: ${summary.mode}
- External calls allowed: ${summary.externalCallAllowed}
- Raw input stored: ${summary.rawInputStored}
- Execution blocked: ${blocked.blocked}

## Checks

- Module: ${sections.module ? "PASS" : "FAIL"}
- Request shape: ${sections.requestShape ? "PASS" : "FAIL"}
- Execution blocked: ${sections.executionBlocked ? "PASS" : "FAIL"}
- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No actual OpenAI client.
- No API key reads.
- No provider calls or network calls.
- No raw prompt storage.

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
  ["Request shape", "requestShape"],
  ["Execution blocked", "executionBlocked"],
  ["Registry", "registry"],
  ["Docs", "docs"],
  ["OS phase status", "osPhaseStatus"],
  ["No forbidden changes", "noForbiddenChanges"],
  ["Report written", "reportWritten"],
]) {
  console.log(`${label}: ${sections[section] ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
