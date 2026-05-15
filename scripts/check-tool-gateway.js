import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildToolGatewayDecision,
  createToolGatewayContext,
  summarizeToolGatewayPosture,
  TOOL_GATEWAY_DECISIONS,
  validateToolGatewayRequest,
} from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/tool-gateway-report.md");

const sections = {
  modules: true,
  exports: true,
  policy: true,
  decisions: true,
  safetyBoundaries: true,
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

function expectDecision(name, request, expected) {
  const decision = buildToolGatewayDecision(request);
  check(decision.decision === expected, "decisions", `${name} expected ${expected}, got ${decision.decision}`);
  return decision;
}

console.log("NEXUS Tool Gateway Check");
console.log("========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const policy = parseJson("policy/tool-gateway-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");

for (const file of [
  "tool-governance/toolDecision.js",
  "tool-governance/toolGatewayPolicy.js",
  "tool-governance/toolGateway.js",
  "policy/tool-gateway-policy.json",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}

check(packageJson.scripts?.["check:tool-gateway"] === "node scripts/check-tool-gateway.js", "modules", "Missing package script check:tool-gateway");
check(typeof createToolGatewayContext === "function", "exports", "createToolGatewayContext export missing");
check(typeof validateToolGatewayRequest === "function", "exports", "validateToolGatewayRequest export missing");
check(typeof buildToolGatewayDecision === "function", "exports", "buildToolGatewayDecision export missing");
check(typeof summarizeToolGatewayPosture === "function", "exports", "summarizeToolGatewayPosture export missing");

for (const field of [
  "toolExecutionAllowed",
  "mcpExecutionAllowed",
  "shellExecutionAllowed",
  "providerCallsAllowed",
  "externalNetworkAllowed",
  "projectMutationAllowed",
  "dbWritesAllowed",
  "workerRuntimeAllowed",
  "arbitraryCommandAllowed",
]) {
  check(policy[field] === false, "policy", `Policy must set ${field} false`);
}
check(policy.metadataOnly === true, "policy", "Policy must be metadata-only");
check(policy.rawPayloadsAllowed === false, "policy", "Policy must disallow raw payloads");

const baseContext = createToolGatewayContext({
  agentId: "AUDITOR",
  projectId: "private-project",
  scope: "NEXUS_OS_CHANGE",
  dataClassification: "internal",
});
expectDecision(
  "metadata lookup",
  { requestType: "tool.lookup", toolId: "git-diff", method: "diff", context: baseContext },
  TOOL_GATEWAY_DECISIONS.ALLOW_METADATA_ONLY,
);
expectDecision(
  "contract preview",
  { requestType: "tool.contract", toolId: "git-diff", method: "diff-stat", context: baseContext },
  TOOL_GATEWAY_DECISIONS.ALLOW_METADATA_ONLY,
);
expectDecision(
  "execution preview blocked",
  { requestType: "tool.execute.preview", toolId: "git-diff", method: "diff", context: baseContext },
  TOOL_GATEWAY_DECISIONS.BLOCKED_RUNTIME_DISABLED,
);
expectDecision(
  "unknown tool blocked",
  { requestType: "tool.lookup", toolId: "unknown-tool", method: "describe", context: baseContext },
  TOOL_GATEWAY_DECISIONS.BLOCKED_NOT_ENABLED,
);
expectDecision(
  "scope blocked",
  {
    requestType: "tool.lookup",
    toolId: "db-readonly",
    method: "schema-preview",
    context: { ...baseContext, scope: "PROJECT_CHANGE" },
  },
  TOOL_GATEWAY_DECISIONS.BLOCKED_SCOPE,
);
expectDecision(
  "agent blocked",
  { requestType: "tool.lookup", toolId: "git-diff", method: "diff", context: { ...baseContext, agentId: "SWIFT" } },
  TOOL_GATEWAY_DECISIONS.BLOCKED_AGENT,
);
expectDecision(
  "project blocked",
  {
    requestType: "tool.lookup",
    toolId: "git-diff",
    method: "diff",
    context: { ...baseContext, projectId: "demo-project" },
  },
  TOOL_GATEWAY_DECISIONS.BLOCKED_PROJECT,
);
expectDecision(
  "classification blocked",
  {
    requestType: "tool.lookup",
    toolId: "docs-diagram",
    method: "list-diagrams",
    context: { ...baseContext, agentId: "SHEPHERD", dataClassification: "restricted" },
  },
  TOOL_GATEWAY_DECISIONS.BLOCKED_DATA_CLASSIFICATION,
);
expectDecision(
  "cost blocked",
  {
    requestType: "tool.lookup",
    toolId: "git-diff",
    method: "diff",
    context: { ...baseContext, costEstimateUsd: 0.01 },
  },
  TOOL_GATEWAY_DECISIONS.BLOCKED_COST,
);
expectDecision(
  "method blocked",
  { requestType: "tool.lookup", toolId: "git-diff", method: "commit", context: baseContext },
  TOOL_GATEWAY_DECISIONS.BLOCKED_METHOD,
);

const posture = summarizeToolGatewayPosture();
check(posture.executionEnabledTools === 0, "safetyBoundaries", "No execution-enabled tools are allowed");
check(posture.runtimeEnabledTools === 0, "safetyBoundaries", "No runtime-enabled tools are allowed");
check(posture.policy.toolExecutionAllowed === false, "safetyBoundaries", "Gateway posture must block tool execution");
check(posture.policy.externalNetworkAllowed === false, "safetyBoundaries", "Gateway posture must block external network");

const docs = read("docs/architecture/TOOL_MCP_REGISTRY_AND_GOVERNANCE.md");
check(docs.includes("P52.3 - Governed Tool Gateway"), "docs", "Architecture doc missing P52.3");
check(docs.includes("decision-only"), "docs", "Architecture doc must describe decision-only behavior");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P52.2")?.status === "complete", "osPhaseStatus", "P52.2 must be complete");
check(statusById.get("P52.2")?.commit === "cc98b04", "osPhaseStatus", "P52.2 commit must be cc98b04");
check(statusById.get("P52.3")?.status === "complete", "osPhaseStatus", "P52.3 must be complete");
check(["planned", "complete"].includes(statusById.get("P52.4")?.status), "osPhaseStatus", "P52.4 must be planned or complete");
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
const report = `# NEXUS Tool Gateway Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.3 - Governed Tool Gateway

## Summary

- Gateway: ${posture.gateway}
- Registered tools: ${posture.registeredTools}
- Metadata-only tools: ${posture.metadataOnlyTools}
- Runtime-enabled tools: ${posture.runtimeEnabledTools}
- Execution-enabled tools: ${posture.executionEnabledTools}
- Supported request types: ${posture.supportedRequestTypes.join(", ")}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Decisions: ${sections.decisions ? "PASS" : "FAIL"}
- Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}
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
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Decisions: ${sections.decisions ? "PASS" : "FAIL"}`);
console.log(`Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
