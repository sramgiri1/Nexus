import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  evaluateToolPermission,
  getToolPermissionMatrix,
  summarizeToolPermissionMatrix,
  validateToolPermissionMatrix,
} from "../tool-governance/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/tool-permission-matrix-report.md");
const sections = {
  modules: true,
  policy: true,
  matrix: true,
  decisions: true,
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

console.log("NEXUS Tool Permission Matrix Check");
console.log("==================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const policy = parseJson("policy/tool-permission-matrix-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");

for (const file of [
  "tool-governance/toolPermissionMatrix.js",
  "tool-governance/toolPermissionPolicy.js",
  "tool-governance/seeds/tool-permissions.seed.json",
  "policy/tool-permission-matrix-policy.json",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}
check(
  packageJson.scripts?.["check:tool-permission-matrix"] === "node scripts/check-tool-permission-matrix.js",
  "modules",
  "Missing package script check:tool-permission-matrix",
);

for (const field of [
  "executionAllowed",
  "privateToolsInDemoAllowed",
  "providerCallsAllowed",
  "externalNetworkAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "workerRuntimeAllowed",
  "mcpExecutionAllowed",
]) {
  check(policy[field] === false, "policy", `Policy must set ${field} false`);
}
check(policy.defaultDeny === true, "policy", "Permission policy must default deny");
check(policy.metadataOnly === true, "policy", "Permission policy must be metadata-only");

const matrix = getToolPermissionMatrix();
const validation = validateToolPermissionMatrix(matrix);
const summary = summarizeToolPermissionMatrix(matrix);
check(validation.valid, "matrix", `Matrix validation failed: ${validation.errors.join("; ")}`);
for (const permissionId of [
  "auditor-git-diff-metadata",
  "sentinel-test-runner-metadata",
  "core-filesystem-boundary-metadata",
  "warden-policy-boundary-metadata",
  "swift-xcode-placeholder-blocked",
  "droid-gradle-placeholder-blocked",
  "demo-private-tools-blocked",
]) {
  check(Boolean(matrix.find((entry) => entry.permissionId === permissionId)), "matrix", `Missing permission: ${permissionId}`);
}

const auditor = evaluateToolPermission({
  toolId: "git-diff",
  agentId: "AUDITOR",
  projectId: "private-project",
  scope: "NEXUS_OS_CHANGE",
  method: "diff",
  dataClassification: "internal",
});
check(auditor.allowed === true && auditor.permission === "allowed_metadata", "decisions", "AUDITOR git-diff metadata should be allowed");
const swift = evaluateToolPermission({
  toolId: "mcp-xcode-placeholder",
  agentId: "SWIFT",
  projectId: "private-project",
  scope: "PROJECT_CHANGE",
  method: "describe-ios-runner-preview",
  dataClassification: "private",
});
check(swift.allowed === false && swift.permission === "blocked_not_enabled", "decisions", "SWIFT Xcode placeholder should be blocked");
const demo = evaluateToolPermission({
  toolId: "git-diff",
  agentId: "DEMO",
  projectId: "demo-project",
  scope: "DEMO",
  method: "describe",
  dataClassification: "public",
});
check(demo.allowed === false && demo.permission === "blocked_scope", "decisions", "Demo private tool access should be blocked");

const docs = read("docs/architecture/TOOL_MCP_REGISTRY_AND_GOVERNANCE.md");
check(docs.includes("P52.6 - Tool Permission Matrix"), "docs", "Architecture doc missing P52.6");
check(docs.includes("default-deny"), "docs", "Architecture doc missing default-deny wording");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P52.5")?.status === "complete", "osPhaseStatus", "P52.5 must be complete");
check(statusById.get("P52.5")?.commit === "aca9fbe", "osPhaseStatus", "P52.5 commit must be aca9fbe");
check(statusById.get("P52.6")?.status === "complete", "osPhaseStatus", "P52.6 must be complete");
check(["planned", "complete"].includes(statusById.get("P52.7")?.status), "osPhaseStatus", "P52.7 must be planned or complete");
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
const report = `# NEXUS Tool Permission Matrix Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P52.6 - Tool Permission Matrix

## Summary

- Permission entries: ${summary.permissionCount}
- Approval-required entries: ${summary.approvalRequiredCount}
- Agents represented: ${summary.agents.join(", ")}
- Permission states: ${Object.entries(summary.permissionCounts).map(([key, count]) => `${key}: ${count}`).join(", ")}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Matrix: ${sections.matrix ? "PASS" : "FAIL"}
- Decisions: ${sections.decisions ? "PASS" : "FAIL"}
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
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Matrix: ${sections.matrix ? "PASS" : "FAIL"}`);
console.log(`Decisions: ${sections.decisions ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
