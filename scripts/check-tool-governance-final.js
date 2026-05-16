import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getMcpRegistry,
  getToolRegistry,
  summarizeToolGatewayPosture,
  summarizeToolPermissionMatrix,
  validateRegisteredMcpServers,
  validateRegisteredTools,
  validateToolPermissionMatrix,
} from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/tool-governance-final-report.md");
const sections = {
  registries: true,
  gateway: true,
  lazyLoading: true,
  permissions: true,
  adapters: true,
  commandCenter: true,
  reports: true,
  osPhaseStatus: true,
  safetyBoundaries: true,
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

console.log("NEXUS Tool Governance Final Check");
console.log("=================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "reports");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const toolPolicy = parseJson("policy/tool-registry-policy.json", "safetyBoundaries");
const mcpPolicy = parseJson("policy/mcp-registry-policy.json", "safetyBoundaries");
const gatewayPolicy = parseJson("policy/tool-gateway-policy.json", "safetyBoundaries");
const lazyPolicy = parseJson("policy/lazy-tool-context-policy.json", "lazyLoading");
const permissionPolicy = parseJson("policy/tool-permission-matrix-policy.json", "permissions");

const toolValidation = validateRegisteredTools(getToolRegistry());
const mcpValidation = validateRegisteredMcpServers(getMcpRegistry());
const gatewayPosture = summarizeToolGatewayPosture();
const permissionSummary = summarizeToolPermissionMatrix();
const permissionValidation = validateToolPermissionMatrix();

check(toolValidation.valid, "registries", `Tool registry invalid: ${toolValidation.errors.join("; ")}`);
check(mcpValidation.valid, "registries", `MCP registry invalid: ${mcpValidation.errors.join("; ")}`);
check(gatewayPosture.executionEnabledTools === 0, "gateway", "Gateway must have zero execution-enabled tools");
check(gatewayPosture.runtimeEnabledTools === 0, "gateway", "Gateway must have zero runtime-enabled tools");
check(lazyPolicy.allToolSchemasAllowed === false, "lazyLoading", "All tool schemas must be blocked");
check(lazyPolicy.allMcpSchemasAllowed === false, "lazyLoading", "All MCP schemas must be blocked");
check(lazyPolicy.maxContractsPerTask === 3, "lazyLoading", "Lazy context policy must cap contracts at 3");
check(permissionValidation.valid, "permissions", `Permission matrix invalid: ${permissionValidation.errors.join("; ")}`);
check(permissionSummary.permissionCount >= 7, "permissions", "Permission matrix must include seed permissions");

for (const adapterFile of [
  "tool-governance/adapters/gitAdapter.js",
  "tool-governance/adapters/testRunnerAdapter.js",
  "tool-governance/adapters/filesystemBoundaryAdapter.js",
  "tool-governance/adapters/playwrightAdapter.js",
]) {
  const source = read(adapterFile);
  check(existsSync(join(ROOT, adapterFile)), "adapters", `Missing adapter: ${adapterFile}`);
  check(!source.includes("child_process"), "adapters", `${adapterFile} must not import child_process`);
  check(!source.includes("fetch("), "adapters", `${adapterFile} must not call fetch`);
  check(!source.includes("writeFile"), "adapters", `${adapterFile} must not write files`);
}

const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const commandTabsSource = read("dashboard/src/data/commandCenterTabs.js");
check(routeSource.includes("/command-center/tools"), "commandCenter", "Command Center route missing /command-center/tools");
check(commandTabsSource.includes("TOOL_GATEWAY_TABS"), "commandCenter", "Tool Gateway tabs missing");
check(commandCenterSource.includes("ToolGatewayPage"), "commandCenter", "ToolGatewayPage missing");
check(commandCenterSource.includes("Execution disabled"), "commandCenter", "Tool Gateway execution-disabled copy missing");

for (const scriptName of [
  "check:tool-registry",
  "check:mcp-registry",
  "check:tool-gateway",
  "check:tool-search-contracts",
  "check:lazy-tool-context",
  "check:tool-permission-matrix",
  "check:tool-adapters",
  "check:tool-governance-final",
]) {
  check(Boolean(packageJson.scripts?.[scriptName]), "reports", `Missing package script ${scriptName}`);
}
for (const report of [
  "reports/tool-registry-report.md",
  "reports/mcp-registry-report.md",
  "reports/tool-gateway-report.md",
  "reports/tool-search-contracts-report.md",
  "reports/lazy-tool-context-report.md",
  "reports/tool-permission-matrix-report.md",
  "reports/tool-adapters-report.md",
]) {
  check(existsSync(join(ROOT, report)), "reports", `Missing report: ${report}`);
  check(read(report).includes("Validation HEAD"), "reports", `${report} missing Validation HEAD wording`);
}

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const expectedCommits = {
  "P52.1": "ba116f1",
  "P52.2": "cc98b04",
  "P52.3": "607210b",
  "P52.4": "ec9bb5c",
  "P52.5": "aca9fbe",
  "P52.6": "f70e5ce",
  "P52.7": "a5bb012",
  "P52.8": "4a09cab",
};
for (const [phaseId, commit] of Object.entries(expectedCommits)) {
  check(statusById.get(phaseId)?.status === "complete", "osPhaseStatus", `${phaseId} must be complete`);
  check(statusById.get(phaseId)?.commit === commit, "osPhaseStatus", `${phaseId} commit must be ${commit}`);
}
check(statusById.get("P52")?.status === "complete", "osPhaseStatus", "P52 parent must be complete");
check(statusById.get("P52.9")?.status === "complete", "osPhaseStatus", "P52.9 must be complete");
check(
  phaseStatus.currentPhase === "P52.9" ||
    phaseStatus.currentPhase?.startsWith("P53") ||
    phaseStatus.currentPhase?.startsWith("P54"),
  "osPhaseStatus",
  "Current phase must be P52.9 or a later handoff phase",
);
check(Boolean(statusById.get(phaseStatus.nextPhase)), "osPhaseStatus", "Next phase must exist in phase status");

for (const policy of [toolPolicy, mcpPolicy, gatewayPolicy, lazyPolicy, permissionPolicy]) {
  check(policy.providerCallsAllowed === false, "safetyBoundaries", "Provider calls must remain disabled");
  check(
    policy.externalNetworkAllowed === false || policy.externalNetworkCallsAllowed === false,
    "safetyBoundaries",
    "External network must remain disabled",
  );
  check(policy.dbWritesAllowed === false, "safetyBoundaries", "DB writes must remain disabled");
  check(policy.projectMutationAllowed === false, "safetyBoundaries", "Project mutation must remain disabled");
}
check(gatewayPolicy.toolExecutionAllowed === false, "safetyBoundaries", "Tool execution must remain disabled");
check(mcpPolicy.mcpExecutionAllowed === false, "safetyBoundaries", "MCP execution must remain disabled");
check(permissionPolicy.workerRuntimeAllowed === false, "safetyBoundaries", "Worker runtime must remain disabled");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Tool Governance Final Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.9 - Tool MCP Registry Governance Final Validation

## Summary

- Tools registered: ${getToolRegistry().length}
- MCP placeholders registered: ${getMcpRegistry().length}
- Permission entries: ${permissionSummary.permissionCount}
- Runtime-enabled tools: ${gatewayPosture.runtimeEnabledTools}
- Execution-enabled tools: ${gatewayPosture.executionEnabledTools}
- Command Center route: /command-center/tools

## Checks

- Registries: ${sections.registries ? "PASS" : "FAIL"}
- Gateway: ${sections.gateway ? "PASS" : "FAIL"}
- Lazy loading: ${sections.lazyLoading ? "PASS" : "FAIL"}
- Permissions: ${sections.permissions ? "PASS" : "FAIL"}
- Adapters: ${sections.adapters ? "PASS" : "FAIL"}
- Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}
- Reports: ${sections.reports ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Explicit Non-Goals Preserved

- No real tool execution.
- No MCP server runtime.
- No provider calls or external network calls.
- No DB writes.
- No worker runtime.
- No shell execution through the gateway.
- No project mutation.

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
console.log(`Registries: ${sections.registries ? "PASS" : "FAIL"}`);
console.log(`Gateway: ${sections.gateway ? "PASS" : "FAIL"}`);
console.log(`Lazy loading: ${sections.lazyLoading ? "PASS" : "FAIL"}`);
console.log(`Permissions: ${sections.permissions ? "PASS" : "FAIL"}`);
console.log(`Adapters: ${sections.adapters ? "PASS" : "FAIL"}`);
console.log(`Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}`);
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
