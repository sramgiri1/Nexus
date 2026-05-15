import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildProjectRegistryReadinessSummary,
  discoverProjectProfiles,
  loadProjectProfile,
  loadProjectProfileFromObject,
  summarizeProjectProfileDiscovery,
  validateProjectProfile,
} from "../project-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "project-profile-loader-report.md");

const sections = {
  modules: true,
  exports: true,
  policy: true,
  exampleProfiles: true,
  loader: true,
  validator: true,
  discovery: true,
  boundarySafety: true,
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

function changedFiles() {
  const output = execFileSync("git", ["status", "--short"], { cwd: ROOT, encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

function lineTooLong(relativePath) {
  return read(relativePath)
    .split("\n")
    .some((line) => line.length > 1000);
}

console.log("NEXUS Project Profile Loader Check");
console.log("==================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const policy = parseJson("policy/project-profile-loader-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const p421Report = read("reports/project-registry-schema-report.md");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");

for (const modulePath of [
  "project-registry/projectProfileLoader.js",
  "project-registry/projectProfileValidator.js",
  "project-registry/projectProfileDiscovery.js",
  "project-registry/projectProfileSummary.js",
]) {
  check(existsSync(fullPath(modulePath)), "modules", `Missing module: ${modulePath}`);
}

const indexSource = read("project-registry/index.js");
for (const exportName of [
  "loadProjectProfile",
  "loadProjectProfileFromObject",
  "normalizeProjectProfile",
  "summarizeLoadedProjectProfile",
  "validateProjectProfile",
  "validateProjectProfileBoundaries",
  "validateProjectProfileStacks",
  "validateProjectProfileTestSuites",
  "validateProjectProfileSafety",
  "discoverProjectProfiles",
  "discoverProfileCandidates",
  "filterAllowedProfileCandidates",
  "summarizeProjectProfileDiscovery",
  "buildProjectProfileSummary",
  "buildProjectRegistryReadinessSummary",
  "buildProjectProfileCapabilitySummary",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P42.2", "policy", "Policy phase must be P42.2");
check(policy.readOnly === true, "policy", "Project profile loader policy must be read-only");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled");
check(policy.adapterRuntimeEnabled === false, "policy", "Adapter runtime must be disabled");
check(policy.projectSelectorEnabled === false, "policy", "Project selector must be disabled");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must be disabled");
check(policy.externalNetworkCallsAllowed === false, "policy", "External network calls must be disabled");
check(policy.dbAccessAllowed === false, "policy", "DB access must be disabled");
check(policy.commandExecutionAllowed === false, "policy", "Command execution must be disabled");
check(policy.demoFallbackAllowed === false, "policy", "Demo fallback must be disabled");

const examplePaths = [
  "project-registry/examples/private-project.nexus.project.json",
  "project-registry/examples/demoapp.nexus.project.json",
  "project-registry/examples/nexus-os.nexus.project.json",
];
const loadedExamples = examplePaths.map((profilePath) => loadProjectProfile(profilePath));
for (const [index, result] of loadedExamples.entries()) {
  check(existsSync(fullPath(examplePaths[index])), "exampleProfiles", `Missing example profile: ${examplePaths[index]}`);
  check(result.ok === true, "exampleProfiles", `Example profile failed validation: ${examplePaths[index]} ${result.errors.join("; ")}`);
}

const privateProfile = loadedExamples.find((profile) => profile.projectId === "private-project-01");
const demoProfile = loadedExamples.find((profile) => profile.projectId === "demoapp");
check(privateProfile?.visibility === "local-private", "boundarySafety", "Private example must be local-private");
check(privateProfile?.normalized?.projectMutationAllowed === false, "boundarySafety", "Private example must disable mutation");
check(demoProfile?.visibility === "demo", "boundarySafety", "Demo example must be demo visibility");
check(demoProfile?.normalized?.demoOnly === true, "boundarySafety", "Demo example must be demoOnly");
check(!JSON.stringify(demoProfile?.normalized || {}).includes("projects/"), "boundarySafety", "Demo example must not reference private roots");

const validLoader = loadProjectProfile("project-registry/examples/private-project.nexus.project.json");
const invalidTraversal = loadProjectProfile("../project-registry/examples/private-project.nexus.project.json");
const invalidAbsolute = loadProjectProfile(fullPath("project-registry/examples/private-project.nexus.project.json"));
const invalidSecret = loadProjectProfile("project-registry/examples/.env.project.json");
check(validLoader.ok === true, "loader", "Loader must load valid example profile");
check(invalidTraversal.ok === false, "loader", "Loader must block path traversal");
check(invalidAbsolute.ok === false, "loader", "Loader must block absolute paths");
check(invalidSecret.ok === false, "loader", "Loader must block secret-like paths");

const missingIdValidation = validateProjectProfile({
  projectLabel: "Missing ID",
  visibility: "local-private",
  projectType: "saas-mobile",
  root: "project-registry/fixtures",
  stacks: {},
  testSuites: [],
  forbiddenPatterns: [".env", "*.pem", "*.key", "*.p12", "secrets/**"],
});
const invalidVisibility = validateProjectProfile({
  projectId: "invalid-visibility",
  projectLabel: "Invalid Visibility",
  visibility: "private",
  projectType: "saas-mobile",
  root: "project-registry/fixtures",
  stacks: {},
  testSuites: [],
  forbiddenPatterns: [".env", "*.pem", "*.key", "*.p12", "secrets/**"],
});
check(missingIdValidation.valid === false, "validator", "Validator must catch missing projectId");
check(missingIdValidation.errors.some((error) => error.includes("projectId")), "validator", "Missing projectId error not found");
check(invalidVisibility.valid === false, "validator", "Validator must catch invalid visibility");
check(invalidVisibility.errors.some((error) => error.includes("visibility")), "validator", "Invalid visibility error not found");

const discovery = discoverProjectProfiles();
const discoverySummary = summarizeProjectProfileDiscovery(discovery);
check(discoverySummary.boundedDiscovery === true, "discovery", "Discovery must be bounded");
check(discoverySummary.readOnly === true, "discovery", "Discovery must be read-only");
check(discoverySummary.profilesDiscovered >= 3, "discovery", "Discovery must find example profiles");
check(discoverySummary.profilesValid >= 3, "discovery", "Discovery must validate example profiles");
check(discoverySummary.plannedProfileRoots >= 1, "discovery", "Discovery must include future profile root placeholder");

const readiness = buildProjectRegistryReadinessSummary({ profiles: loadedExamples });
check(readiness.projectProfileLoader === "ready", "commandCenterUx", "Readiness summary must mark loader ready");
check(readiness.projectSelectorEnabled === false, "boundarySafety", "Readiness summary must keep selector disabled");
check(readiness.adapterRuntimeEnabled === false, "boundarySafety", "Readiness summary must keep adapter runtime disabled");
check(readiness.projectMutationAllowed === false, "boundarySafety", "Readiness summary must keep project mutation disabled");

for (const expected of [
  "Active Project Operating Surface",
  "Project Health Strip",
  "Profile",
  "Stack Profile",
  "Adapter Runtime",
  "Project Mutation",
  "Project Capability Matrix",
]) {
  check(commandCenterSource.includes(expected) || viewModelSource.includes(expected), "commandCenterUx", `Projects page missing copy: ${expected}`);
}

const statusById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
const laterHandoffPhases = [
  "P42.7",
  "P43",
  "P43.1",
  "P43.2",
  "P43.3",
  "P43.4",
  "P43.5",
  "P43.6",
  "P44",
  "P44.1",
  "P44.2",
  "P44.3",
  "P44.4",
  "P44.5",
  "P44.6",
  "P44.7",
  "P45",
  "P45.1",
  "P45.2",
  "P45.3",
  "P45.4",
  "P45.5",
  "P45.6",
  "P46",
  "P47",
  "P47.7",
  "P48",
  "P48.7",
  "P48.8",
  "P49.1",
];
check(
  ["P42.1", "P42.6", ...laterHandoffPhases].includes(phaseStatus.previousPhase),
  "osPhaseStatus",
  "previousPhase must be P42.1, P42.6, or a later handoff phase",
);
check(
  ["P42.2", ...laterHandoffPhases].includes(phaseStatus.currentPhase),
  "osPhaseStatus",
  "currentPhase must be P42.2 or a later handoff phase",
);
check(
  ["P42.3", ...laterHandoffPhases].includes(phaseStatus.nextPhase),
  "osPhaseStatus",
  "nextPhase must be P42.3 or a later handoff phase",
);
check(statusById.get("P42.1")?.status === "complete", "osPhaseStatus", "P42.1 must be complete");
check(statusById.get("P42.1")?.commit === "4c1d11d", "osPhaseStatus", "P42.1 commit must be 4c1d11d");
check(statusById.get("P42.2")?.status === "complete", "osPhaseStatus", "P42.2 must be complete");
check(statusById.get("P42.2")?.branch === "arch/project-profile-loader-validator", "osPhaseStatus", "P42.2 branch mismatch");
check(["complete", "planned"].includes(statusById.get("P42.3")?.status), "osPhaseStatus", "P42.3 must exist");
check(p421Report.includes("Validation branch:"), "osPhaseStatus", "P42.1 report must include validation branch metadata");
check(p421Report.includes("Validation HEAD:"), "osPhaseStatus", "P42.1 report must include validation HEAD metadata");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `Forbidden local API behavior change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agents change: ${file}`);
  check(!file.startsWith("orchestrator/"), "noForbiddenChanges", `Forbidden orchestrator change: ${file}`);
}

for (const file of [
  "project-registry/projectProfileLoader.js",
  "project-registry/projectProfileValidator.js",
  "project-registry/projectProfileDiscovery.js",
  "project-registry/projectProfileSummary.js",
  "policy/project-profile-loader-policy.json",
  "scripts/check-project-profile-loader.js",
]) {
  check(!lineTooLong(file), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Project Profile Loader Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.2 - Project Profile Loader + Validator

## Summary

- Profiles discovered: ${discoverySummary.profilesDiscovered}
- Profiles valid: ${discoverySummary.profilesValid}
- Planned profile roots: ${discoverySummary.plannedProfileRoots}
- Project selector enabled: ${readiness.projectSelectorEnabled ? "yes" : "no"}
- Adapter runtime enabled: ${readiness.adapterRuntimeEnabled ? "yes" : "no"}
- Project mutation allowed: ${readiness.projectMutationAllowed ? "yes" : "no"}

## Example Profiles

| Profile | Project | Visibility | Valid |
| --- | --- | --- | --- |
${loadedExamples.map((profile) => `| ${profile.profilePath} | ${profile.projectLabel} | ${profile.visibility} | ${profile.ok ? "yes" : "no"} |`).join("\n")}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Example profiles: ${sections.exampleProfiles ? "PASS" : "FAIL"}
- Loader: ${sections.loader ? "PASS" : "FAIL"}
- Validator: ${sections.validator ? "PASS" : "FAIL"}
- Discovery: ${sections.discovery ? "PASS" : "FAIL"}
- Boundary safety: ${sections.boundarySafety ? "PASS" : "FAIL"}
- Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Explicit Non-Goals

- No project selector behavior was added.
- No adapter runtime execution was added.
- No project mutation was added.
- No provider calls, external network calls, DB writes, worker runtime, or MCP/tool execution were added.

## Next Phase

P42.3 - Stack Profile Model

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Example profiles: ${sections.exampleProfiles ? "PASS" : "FAIL"}`);
console.log(`Loader: ${sections.loader ? "PASS" : "FAIL"}`);
console.log(`Validator: ${sections.validator ? "PASS" : "FAIL"}`);
console.log(`Discovery: ${sections.discovery ? "PASS" : "FAIL"}`);
console.log(`Boundary safety: ${sections.boundarySafety ? "PASS" : "FAIL"}`);
console.log(`Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
