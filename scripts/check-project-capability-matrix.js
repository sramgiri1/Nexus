import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildProjectCapabilityMatrix,
  getCapabilityStatusCounts,
  summarizeProjectCapabilityMatrix,
  validateProjectCapabilityMatrix,
} from "../project-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "project-capability-matrix-report.md");
const sections = {
  modules: true,
  exports: true,
  policy: true,
  matrix: true,
  ui: true,
  tests: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formatting: true,
};
const failures = [];

function read(relativePath) {
  const path = join(ROOT, relativePath);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
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
  return execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Project Capability Matrix Check");
console.log("=====================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const policy = parseJson("policy/project-capability-matrix-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const indexSource = read("project-registry/index.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = read("dashboard/tests/routes.spec.js");

for (const modulePath of [
  "project-registry/projectCapabilityMatrix.js",
  "project-registry/projectCapabilitySummary.js",
]) {
  check(existsSync(join(ROOT, modulePath)), "modules", `Missing module: ${modulePath}`);
}

for (const exportName of [
  "buildProjectCapabilityMatrix",
  "validateProjectCapabilityMatrix",
  "summarizeProjectCapabilityMatrix",
  "getCapabilityStatusCounts",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P42.6", "policy", "Policy phase must be P42.6");
check(policy.readOnly === true, "policy", "Capability matrix must be read-only");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled");
check(policy.adapterRuntimeEnabled === false, "policy", "Adapter runtime must be disabled");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must be disabled");
check(policy.dbWritesAllowed === false, "policy", "DB writes must be disabled");

const matrix = buildProjectCapabilityMatrix({ projectId: "private-project-01" });
const summary = summarizeProjectCapabilityMatrix(matrix);
const validation = validateProjectCapabilityMatrix(matrix);
const counts = getCapabilityStatusCounts(matrix);
check(validation.valid === true, "matrix", `Matrix invalid: ${validation.errors.join("; ")}`);
for (const capabilityId of [
  "mission-planning",
  "task-activation",
  "agent-workbench",
  "controlled-implementation",
  "backend-validation",
  "ios-validation",
  "provider-dispatch",
  "worker-runtime",
  "mcp-tools",
  "adapter-runtime",
]) {
  check(matrix.capabilities.some((capability) => capability.capabilityId === capabilityId), "matrix", `Missing capability: ${capabilityId}`);
}
check(matrix.adapterRuntimeEnabled === false, "matrix", "Adapter runtime must remain disabled in matrix");
check(matrix.providerDispatchEnabled === false, "matrix", "Provider dispatch must remain disabled in matrix");
check(matrix.workerRuntimeEnabled === false, "matrix", "Worker runtime must remain disabled in matrix");
check(matrix.dbWritesAllowed === false, "matrix", "DB writes must remain disabled in matrix");
check((counts.available || 0) >= 3, "matrix", "Expected available capabilities");
check(summary.safetyPosture.adapterRuntime === "disabled", "matrix", "Summary must show adapter runtime disabled");

for (const expected of [
  "Project Capability Matrix",
  "Mission planning",
  "Task activation",
  "Agent Workbench",
  "Controlled implementation",
  "Backend validation",
  "Requires iOS/Xcode runner",
  "Provider dispatch is not enabled",
  "Worker runtime is not enabled",
  "MCP/tool execution is not enabled",
  "Adapter Runtime disabled",
]) {
  check(commandCenterSource.includes(expected), "ui", `Projects UI missing: ${expected}`);
}

for (const expected of [
  "projects page shows project capability matrix without enabling adapters",
  "Project Capability Matrix",
]) {
  check(routeTests.includes(expected), "tests", `Route tests missing coverage: ${expected}`);
}

const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
check(statusById.get("P42.6")?.status === "complete", "osPhaseStatus", "P42.6 must be complete");
check(statusById.get("P42.6")?.branch === "arch/project-registry-adapter-overnight", "osPhaseStatus", "P42.6 branch mismatch");
check(statusById.get("P42.6")?.nextPhase === "P42.7-lite", "osPhaseStatus", "P42.6 nextPhase must be P42.7-lite");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `Forbidden local API behavior change: ${file}`);
}

for (const file of [
  "project-registry/projectCapabilityMatrix.js",
  "project-registry/projectCapabilitySummary.js",
  "scripts/check-project-capability-matrix.js",
  "policy/project-capability-matrix-policy.json",
]) {
  check(!read(file).split("\n").some((line) => line.length > 1000), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Project Capability Matrix Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.6 - Project Capability Matrix

## Summary

- Project: ${summary.projectLabel}
- Stack profile: ${summary.stackProfileId}
- Capabilities: ${summary.capabilityCount}
- Enabled or limited capabilities: ${summary.enabledCapabilityCount}
- Disabled or gated capabilities: ${summary.disabledCapabilityCount}
- Adapter runtime: ${summary.safetyPosture.adapterRuntime}
- Provider dispatch: ${summary.safetyPosture.providerDispatch}
- Worker runtime: ${summary.safetyPosture.workerRuntime}
- DB writes: ${summary.safetyPosture.dbWrites}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Matrix: ${sections.matrix ? "PASS" : "FAIL"}
- UI: ${sections.ui ? "PASS" : "FAIL"}
- Tests: ${sections.tests ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Matrix: ${sections.matrix ? "PASS" : "FAIL"}`);
console.log(`UI: ${sections.ui ? "PASS" : "FAIL"}`);
console.log(`Tests: ${sections.tests ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
