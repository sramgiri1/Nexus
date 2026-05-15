import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "command-center-project-selector-report.md");
const sections = {
  dataModel: true,
  policy: true,
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

console.log("NEXUS Command Center Project Selector Check");
console.log("===========================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const policy = parseJson("policy/command-center-project-selector-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const selectorSource = read("dashboard/src/data/projectSelection.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = read("dashboard/tests/routes.spec.js");

check(selectorSource.includes("PROJECT_SELECTION_STORAGE_KEY"), "dataModel", "Missing project selector storage key");
check(selectorSource.includes("nexus-selected-project"), "dataModel", "Missing expected localStorage key");
check(selectorSource.includes("private-project-01"), "dataModel", "Missing Private Project option");
check(selectorSource.includes("nexus-os"), "dataModel", "Missing NEXUS OS option");
check(selectorSource.includes("demoOnly: true"), "dataModel", "Missing demo-only option flag");

check(policy.phase === "P42.5", "policy", "Policy phase must be P42.5");
check(policy.uiOnly === true, "policy", "Project selector must be UI-only");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled");
check(policy.adapterRuntimeEnabled === false, "policy", "Adapter runtime must be disabled");
check(policy.demoFallbackAllowed === false, "policy", "Demo fallback must be disabled");

check(commandCenterSource.includes("Project selector"), "ui", "Project selector label missing");
check(commandCenterSource.includes("PROJECT_SELECTION_STORAGE_KEY"), "ui", "Project selector localStorage integration missing");
check(commandCenterSource.includes("setSelectedProjectId"), "ui", "Project selector state setter missing");
check(!commandCenterSource.includes('activeProject: studio.activeProject?.name || "DemoApp"'), "ui", "Command Center must not fall back to DemoApp");

for (const expectedTest of [
  "project selector persists selected project context",
  "DemoApp appears on demo route only",
]) {
  check(routeTests.includes(expectedTest), "tests", `Missing Playwright coverage: ${expectedTest}`);
}

const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
check(statusById.get("P42.5")?.status === "complete", "osPhaseStatus", "P42.5 must be complete");
check(statusById.get("P42.5")?.branch === "arch/project-registry-adapter-overnight", "osPhaseStatus", "P42.5 branch mismatch");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of ["dashboard/src/data/projectSelection.js", "scripts/check-command-center-project-selector.js"]) {
  check(!read(file).split("\n").some((line) => line.length > 1000), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Command Center Project Selector Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.5 - Command Center Project Selector

## Summary

- Selector mode: local UI state
- Persistence: localStorage["nexus-selected-project"]
- Project mutation: disabled
- Adapter runtime: disabled
- Demo fallback: disabled

## Checks

- Data model: ${sections.dataModel ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
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
console.log(`Data model: ${sections.dataModel ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`UI: ${sections.ui ? "PASS" : "FAIL"}`);
console.log(`Tests: ${sections.tests ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
