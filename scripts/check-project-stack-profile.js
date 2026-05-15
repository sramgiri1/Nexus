import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getStackCapabilities,
  getStackDbPolicy,
  getStackTestSuites,
  getSupportedStackTypes,
  normalizeStackProfile,
  summarizeStackProfile,
  validateStackProfile,
  STACK_PROFILE_LIBRARY,
} from "../project-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "project-stack-profile-report.md");
const sections = {
  modules: true,
  exports: true,
  policy: true,
  normalization: true,
  capabilities: true,
  boundarySafety: true,
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

console.log("NEXUS Project Stack Profile Check");
console.log("=================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const policy = parseJson("policy/project-stack-profile-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const indexSource = read("project-registry/index.js");

for (const modulePath of [
  "project-registry/stackProfileModel.js",
  "project-registry/stackProfileValidator.js",
  "project-registry/stackProfileSummary.js",
  "project-registry/stackProfiles.js",
]) {
  check(existsSync(join(ROOT, modulePath)), "modules", `Missing module: ${modulePath}`);
}

for (const exportName of [
  "normalizeStackProfile",
  "validateStackProfile",
  "summarizeStackProfile",
  "getSupportedStackTypes",
  "getStackCapabilities",
  "getStackTestSuites",
  "getStackDbPolicy",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P42.3", "policy", "Policy phase must be P42.3");
check(policy.readOnly === true, "policy", "Stack profile policy must be read-only");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled");
check(policy.commandExecutionAllowed === false, "policy", "Command execution must be disabled");
check(policy.dbAccessAllowed === false, "policy", "DB access must be disabled");

const supported = getSupportedStackTypes();
for (const stackArea of ["backend", "web", "ios", "android", "database", "infrastructure", "docs", "tests"]) {
  check(supported.includes(stackArea), "normalization", `Missing supported stack area: ${stackArea}`);
}

const sample = STACK_PROFILE_LIBRARY.find((profile) => profile.stackId === "node-fastify-prisma-ios");
const normalized = normalizeStackProfile(sample);
const validation = validateStackProfile(sample);
const summary = summarizeStackProfile(sample);
check(normalized.stackId === "node-fastify-prisma-ios", "normalization", "Sample stack did not normalize");
check(validation.valid === true, "normalization", `Sample stack invalid: ${validation.errors.join("; ")}`);
check(getStackCapabilities(sample).includes("backend-validation"), "capabilities", "Backend validation capability missing");
check(getStackTestSuites(sample).includes("backend-validation"), "capabilities", "Backend validation test suite missing");
check(getStackDbPolicy(sample).defaultAccess === "disabled", "boundarySafety", "DB default access must be disabled");
check(summary.commandExecutionAllowed === false, "boundarySafety", "Summary must keep command execution disabled");
check(summary.dbAccessAllowed === false, "boundarySafety", "Summary must keep DB access disabled");

const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
check(statusById.get("P42.2")?.commit === "276bfb4", "osPhaseStatus", "P42.2 commit must be 276bfb4");
check(statusById.get("P42.3")?.status === "complete", "osPhaseStatus", "P42.3 must be complete");
check(statusById.get("P42.3")?.branch === "arch/project-registry-adapter-overnight", "osPhaseStatus", "P42.3 branch mismatch");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `Forbidden local API behavior change: ${file}`);
}

for (const file of [
  "project-registry/stackProfileModel.js",
  "project-registry/stackProfileValidator.js",
  "project-registry/stackProfileSummary.js",
  "project-registry/stackProfiles.js",
  "scripts/check-project-stack-profile.js",
]) {
  check(!read(file).split("\n").some((line) => line.length > 1000), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Project Stack Profile Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.3 - Stack Profile Model

## Summary

- Supported stack areas: ${supported.join(", ")}
- Stack profiles: ${STACK_PROFILE_LIBRARY.length}
- Sample stack: ${summary.stackId}
- Sample capabilities: ${summary.capabilities.join(", ")}
- DB default access: ${summary.dbPolicy.defaultAccess}
- Runtime execution: disabled

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Normalization: ${sections.normalization ? "PASS" : "FAIL"}
- Capabilities: ${sections.capabilities ? "PASS" : "FAIL"}
- Boundary safety: ${sections.boundarySafety ? "PASS" : "FAIL"}
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
console.log(`Normalization: ${sections.normalization ? "PASS" : "FAIL"}`);
console.log(`Capabilities: ${sections.capabilities ? "PASS" : "FAIL"}`);
console.log(`Boundary safety: ${sections.boundarySafety ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
