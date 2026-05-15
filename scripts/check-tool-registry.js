import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getToolRegistry,
  summarizeRegisteredTools,
  validateRegisteredTools,
} from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/tool-registry-report.md");
const sections = {
  schema: true,
  seedRegistry: true,
  policy: true,
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

console.log("NEXUS Tool Registry Check");
console.log("=========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "schema");
const policy = parseJson("policy/tool-registry-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const tools = getToolRegistry();
const validation = validateRegisteredTools(tools);
const summary = summarizeRegisteredTools(tools);

for (const file of [
  "tool-governance/toolRegistrySchema.js",
  "tool-governance/toolRegistry.js",
  "tool-governance/toolTypes.js",
  "tool-governance/index.js",
  "tool-governance/seeds/tool-registry.seed.json",
]) {
  check(existsSync(join(ROOT, file)), "schema", `Missing file: ${file}`);
}

check(packageJson.scripts?.["check:tool-registry"] === "node scripts/check-tool-registry.js", "schema", "Missing package script check:tool-registry");
check(validation.valid, "seedRegistry", `Tool registry validation failed: ${validation.errors.join("; ")}`);

for (const toolId of [
  "git-status",
  "git-diff",
  "test-runner",
  "filesystem-boundary",
  "playwright-browser",
  "github-pr",
  "db-readonly",
  "docs-diagram",
  "api-adapter",
  "batch-adapter",
]) {
  check(Boolean(tools.find((tool) => tool.toolId === toolId)), "seedRegistry", `Missing seed tool: ${toolId}`);
}

check(summary.runtimeEnabledCount === 0, "seedRegistry", "No tool runtime may be enabled");
check(summary.executionEnabledCount === 0, "seedRegistry", "No tool execution may be enabled");
check(summary.providerAllowedCount === 0, "seedRegistry", "No provider calls may be allowed");
check(summary.externalNetworkAllowedCount === 0, "seedRegistry", "No external network may be allowed");
check(summary.projectMutationAllowedCount === 0, "seedRegistry", "No project mutation may be allowed");

for (const field of [
  "runtimeEnabled",
  "toolExecutionAllowed",
  "mcpExecutionAllowed",
  "shellExecutionAllowed",
  "providerCallsAllowed",
  "externalNetworkCallsAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "workerRuntimeAllowed",
]) {
  check(policy[field] === false, "policy", `Policy must set ${field} false`);
}
check(policy.registryReadinessOnly === true, "policy", "Policy must be registry-readiness only");
check(policy.lazyContractLoadingRequired === true, "policy", "Policy must require lazy contract loading");

const docs = read("docs/architecture/TOOL_MCP_REGISTRY_AND_GOVERNANCE.md");
check(docs.includes("P52.1 - Tool Registry Schema"), "docs", "Architecture doc missing P52.1");
check(docs.includes("Right tool. Right time. Small context. Governed execution."), "docs", "Architecture doc missing principle");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P51")?.status === "complete", "osPhaseStatus", "P51 must remain complete");
check(["in_progress", "complete"].includes(statusById.get("P52")?.status), "osPhaseStatus", "P52 must be in progress or complete");
check(statusById.get("P52.1")?.status === "complete", "osPhaseStatus", "P52.1 must be complete");
check(statusById.get("P52.1")?.commit === "ba116f1", "osPhaseStatus", "P52.1 commit must be ba116f1");
check(statusById.get("P52.1")?.nextPhase === "P52.2", "osPhaseStatus", "P52.1 next phase must be P52.2");
check(["planned", "complete"].includes(statusById.get("P52.2")?.status), "osPhaseStatus", "P52.2 must be planned or complete");
check(Boolean(statusById.get(phaseStatus.currentPhase)), "osPhaseStatus", "Current phase entry must exist");
check(Boolean(statusById.get(phaseStatus.nextPhase)), "osPhaseStatus", "Next phase entry must exist");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Tool Registry Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.1 - Tool Registry Schema

## Summary

- Tools: ${summary.toolCount}
- Runtime-enabled tools: ${summary.runtimeEnabledCount}
- Execution-enabled tools: ${summary.executionEnabledCount}
- Provider-enabled tools: ${summary.providerAllowedCount}
- External-network-enabled tools: ${summary.externalNetworkAllowedCount}
- Project-mutation-enabled tools: ${summary.projectMutationAllowedCount}

## Checks

- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Seed registry: ${sections.seedRegistry ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

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
console.log(`Schema: ${sections.schema ? "PASS" : "FAIL"}`);
console.log(`Seed registry: ${sections.seedRegistry ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
