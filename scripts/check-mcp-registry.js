import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getMcpRegistry,
  summarizeRegisteredMcpServers,
  validateRegisteredMcpServers,
} from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/mcp-registry-report.md");

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

console.log("NEXUS MCP Registry Check");
console.log("========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "schema");
const policy = parseJson("policy/mcp-registry-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const servers = getMcpRegistry();
const validation = validateRegisteredMcpServers(servers);
const summary = summarizeRegisteredMcpServers(servers);

for (const file of [
  "tool-governance/mcpRegistrySchema.js",
  "tool-governance/mcpRegistry.js",
  "tool-governance/index.js",
  "tool-governance/seeds/mcp-registry.seed.json",
]) {
  check(existsSync(join(ROOT, file)), "schema", `Missing file: ${file}`);
}

check(
  packageJson.scripts?.["check:mcp-registry"] === "node scripts/check-mcp-registry.js",
  "schema",
  "Missing package script check:mcp-registry",
);
check(validation.valid, "seedRegistry", `MCP registry validation failed: ${validation.errors.join("; ")}`);

for (const serverId of [
  "mcp-filesystem-placeholder",
  "mcp-github-placeholder",
  "mcp-playwright-placeholder",
  "mcp-db-readonly-placeholder",
  "mcp-xcode-placeholder",
  "mcp-android-gradle-placeholder",
]) {
  check(Boolean(servers.find((server) => server.mcpServerId === serverId)), "seedRegistry", `Missing MCP seed: ${serverId}`);
}

check(summary.serverEnabledCount === 0, "seedRegistry", "No MCP server runtime may be enabled");
check(summary.schemasLoadedByDefaultCount === 0, "seedRegistry", "No MCP schemas may load by default");
check(summary.lazySchemaRequiredCount === summary.serverCount, "seedRegistry", "All MCP placeholders must require lazy schema loading");
check(summary.secretsRequiredCount === 0, "seedRegistry", "No MCP placeholder may require secrets in P52");
check(summary.networkEgressCount === 0, "seedRegistry", "No MCP placeholder may allow network egress");

for (const field of [
  "serverRuntimeAllowed",
  "mcpExecutionAllowed",
  "externalNetworkCallsAllowed",
  "secretsExposureAllowed",
  "providerCallsAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "workerRuntimeAllowed",
]) {
  check(policy[field] === false, "policy", `Policy must set ${field} false`);
}
check(policy.schemasLoadedByDefault === false, "policy", "Policy must keep schemasLoadedByDefault false");
check(policy.lazySchemaLoadingRequired === true, "policy", "Policy must require lazy schema loading");
check(policy.metadataOnly === true, "policy", "Policy must be metadata-only");

const docs = read("docs/architecture/TOOL_MCP_REGISTRY_AND_GOVERNANCE.md");
check(docs.includes("P52.2 - MCP Registry Schema"), "docs", "Architecture doc missing P52.2");
check(docs.includes("disabled MCP placeholders"), "docs", "Architecture doc missing disabled MCP placeholder wording");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(["in_progress", "complete"].includes(statusById.get("P52")?.status), "osPhaseStatus", "P52 must be in progress or complete");
check(statusById.get("P52.1")?.status === "complete", "osPhaseStatus", "P52.1 must be complete");
check(statusById.get("P52.1")?.commit === "ba116f1", "osPhaseStatus", "P52.1 commit must be ba116f1");
check(statusById.get("P52.2")?.status === "complete", "osPhaseStatus", "P52.2 must be complete");
check(statusById.get("P52.2")?.nextPhase === "P52.3", "osPhaseStatus", "P52.2 next phase must be P52.3");
check(["planned", "complete"].includes(statusById.get("P52.3")?.status), "osPhaseStatus", "P52.3 must be planned or complete");
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
const report = `# NEXUS MCP Registry Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.2 - MCP Registry Schema

## Summary

- MCP placeholders: ${summary.serverCount}
- Runtime-enabled MCP servers: ${summary.serverEnabledCount}
- Schemas loaded by default: ${summary.schemasLoadedByDefaultCount}
- Lazy schema loading required: ${summary.lazySchemaRequiredCount}
- Secrets-required placeholders: ${summary.secretsRequiredCount}
- Network-egress-enabled placeholders: ${summary.networkEgressCount}

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
