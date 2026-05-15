import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "project-registry-schema-report.md");

const sections = {
  schemas: true,
  registry: true,
  projectTypes: true,
  exports: true,
  policy: true,
  demoBoundary: true,
  privateProjectPlaceholder: true,
  commandCenterUx: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formatting: true,
};
const failures = [];

function fullPath(relativePath) {
  return join(ROOT, relativePath);
}

function read(relativePath) {
  return existsSync(fullPath(relativePath)) ? readFileSync(fullPath(relativePath), "utf8") : "";
}

function parseJson(relativePath, section) {
  const source = read(relativePath);
  if (!source.trim()) {
    fail(section, `${relativePath} is missing or empty`);
    return {};
  }
  try {
    return JSON.parse(source);
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

function lineTooLong(relativePath) {
  return read(relativePath)
    .split("\n")
    .some((line) => line.length > 1000);
}

function changedFiles() {
  const output = execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Project Registry Schema Check");
console.log("===================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const registrySchema = parseJson("project-registry/project-registry.schema.json", "schemas");
const projectSchema = parseJson("project-registry/nexus-project.schema.json", "schemas");
const registry = parseJson("project-registry/projects.json", "registry");
const projectTypes = parseJson("project-registry/project-types.json", "projectTypes");
const policy = parseJson("policy/project-registry-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");

check(registrySchema.title === "NEXUS Project Registry", "schemas", "Project registry schema title mismatch");
check(projectSchema.title === "NEXUS Project Profile", "schemas", "Project profile schema title mismatch");
check(projectSchema.properties?.stacks?.description?.includes("Swift/iOS/Xcode"), "schemas", "Project schema missing future stack support");

const projects = Array.isArray(registry.projects) ? registry.projects : [];
const byId = new Map(projects.map((project) => [project.projectId, project]));
check(registry.registryVersion === "1.0", "registry", "Registry version must be 1.0");
check(registry.source === "nexus-project-registry", "registry", "Registry source mismatch");
check(registry.defaultProjectId === "private-project-01", "registry", "Default project must be private-project-01");
check(byId.has("nexus-os"), "registry", "Registry missing nexus-os");
check(byId.has("private-project-01"), "registry", "Registry missing private-project-01");
check(byId.has("demoapp"), "registry", "Registry missing demoapp");

check(Array.isArray(projectTypes.types), "projectTypes", "project-types.json must include types array");
for (const typeId of ["os-module", "saas-mobile", "backend-service", "web-app", "ios-app", "android-app", "library", "automation-tool", "data-pipeline", "unknown"]) {
  check(projectTypes.types?.some((type) => type.id === typeId), "projectTypes", `Missing project type: ${typeId}`);
}

const indexSource = read("project-registry/index.js");
for (const exportName of [
  "loadProjectRegistry",
  "validateProjectRegistry",
  "listRegistryProjects",
  "getRegistryProject",
  "getDefaultProjectId",
  "getDemoProject",
  "getPrivateProjectPlaceholder",
  "summarizeProjectRegistry",
]) {
  check(indexSource.includes(`export function ${exportName}`), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P42.1", "policy", "Policy phase must be P42.1");
check(policy.registryEnabled === true, "policy", "Registry must be enabled");
check(policy.projectSelectorEnabled === false, "policy", "Project selector must remain disabled");
check(policy.adapterRuntimeEnabled === false, "policy", "Adapter runtime must remain disabled");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must remain disabled");
check(policy.dbWritesAllowed === false, "policy", "DB writes must remain disabled");
check(policy.demoFallbackAllowed === false, "policy", "Demo fallback must remain disabled");

const demo = byId.get("demoapp") || {};
check(demo.demoOnly === true, "demoBoundary", "DemoApp must be demoOnly");
check(registry.defaultProjectId !== "demoapp", "demoBoundary", "DemoApp cannot be default");
check((demo.modeAllowed || []).every((mode) => mode === "demo"), "demoBoundary", "DemoApp must only allow demo mode");

const privateProject = byId.get("private-project-01") || {};
check(privateProject.publicSafeLabel === "Private Project", "privateProjectPlaceholder", "Private project must use public-safe label");
check(privateProject.localPrivateOnly === true, "privateProjectPlaceholder", "Private project placeholder must be localPrivateOnly");
check(!JSON.stringify(privateProject).includes("projects/careloop"), "privateProjectPlaceholder", "Private placeholder must not expose private paths");

for (const expected of [
  "Project Registry Foundation",
  "Registry entries",
  "Project Profile Loader",
  "Project Selector",
  "Adapter Runtime",
  "Project Mutation",
]) {
  check(commandCenterSource.includes(expected), "commandCenterUx", `Projects page missing copy: ${expected}`);
}

const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
check(
  ["P41.9.2", "P42.1", "P42.6", "P42.7"].includes(phaseStatus.previousPhase),
  "osPhaseStatus",
  "previousPhase must be P41.9.2, P42.1, P42.6, or P42.7",
);
check(
  ["P42.1", "P42.2", "P42.7", "P43.1"].includes(phaseStatus.currentPhase),
  "osPhaseStatus",
  "currentPhase must be P42.1, P42.2, P42.7, or P43.1",
);
check(
  ["P42.2", "P42.3", "P43", "P43.2"].includes(phaseStatus.nextPhase),
  "osPhaseStatus",
  "nextPhase must be P42.2, P42.3, P43, or P43.2",
);
check(statusById.get("P41.9.2")?.status === "complete", "osPhaseStatus", "P41.9.2 must be complete");
check(statusById.get("P41.9.2")?.commit === "8ec2a4c", "osPhaseStatus", "P41.9.2 commit must be 8ec2a4c");
check(["in_progress", "complete"].includes(statusById.get("P42")?.status), "osPhaseStatus", "P42 parent must be in_progress or complete");
check(statusById.get("P42.1")?.status === "complete", "osPhaseStatus", "P42.1 must be complete");
check(statusById.get("P42.1")?.commit === "4c1d11d", "osPhaseStatus", "P42.1 commit must be 4c1d11d");
check(["planned", "complete", "in_progress"].includes(statusById.get("P42.2")?.status), "osPhaseStatus", "P42.2 must exist as planned, current, or complete");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `Forbidden local API behavior change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of [
  "project-registry/project-registry.schema.json",
  "project-registry/nexus-project.schema.json",
  "project-registry/projects.json",
  "project-registry/project-types.json",
  "project-registry/index.js",
  "policy/project-registry-policy.json",
  "scripts/check-project-registry-schema.js",
]) {
  check(!lineTooLong(file), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Project Registry Schema Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.1 - Project Registry Schema + Policy

## Summary

- Registry projects: ${projects.length}
- Default project: ${registry.defaultProjectId || "unknown"}
- Project selector enabled: ${policy.projectSelectorEnabled === true ? "yes" : "no"}
- Adapter runtime enabled: ${policy.adapterRuntimeEnabled === true ? "yes" : "no"}
- Demo fallback allowed: ${policy.demoFallbackAllowed === true ? "yes" : "no"}

## Baseline Entries

| Project | Scope | Visibility | Status | Boundary |
| --- | --- | --- | --- | --- |
${projects.map((project) => `| ${project.publicSafeLabel || project.label} | ${project.scope} | ${project.visibility} | ${project.status} | ${project.demoOnly ? "demo-only" : project.localPrivateOnly ? "local-private only" : "platform"} |`).join("\n")}

## Checks

- Schemas: ${sections.schemas ? "PASS" : "FAIL"}
- Registry: ${sections.registry ? "PASS" : "FAIL"}
- Project types: ${sections.projectTypes ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}
- Private project placeholder: ${sections.privateProjectPlaceholder ? "PASS" : "FAIL"}
- Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Schemas: ${sections.schemas ? "PASS" : "FAIL"}`);
console.log(`Registry: ${sections.registry ? "PASS" : "FAIL"}`);
console.log(`Project types: ${sections.projectTypes ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Demo boundary: ${sections.demoBoundary ? "PASS" : "FAIL"}`);
console.log(`Private project placeholder: ${sections.privateProjectPlaceholder ? "PASS" : "FAIL"}`);
console.log(`Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
