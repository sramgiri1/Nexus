import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildProjectCapabilityMatrix,
  buildProjectOnboardingPlan,
  generateProjectProfile,
  getDefaultProjectId,
  getPrivateProjectPlaceholder,
  listRegistryProjects,
  listStackProfiles,
  loadProjectRegistry,
  validateProjectCapabilityMatrix,
  validateProjectRegistry,
} from "../project-registry/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "project-registry-final-validation-report.md");

const sections = {
  p421: true,
  p422: true,
  p423: true,
  p424: true,
  p425: true,
  p426: true,
  osPhaseStatus: true,
  projectRegistryJson: true,
  commandCenterProjectContext: true,
  safetyBoundaries: true,
  reportsCurrent: true,
  publicSafety: true,
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

function hasExport(source, exportName) {
  return source.includes(exportName);
}

console.log("NEXUS Project Registry Final Validation Check");
console.log("=============================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("project-registry/index.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const selectorSource = read("dashboard/src/data/projectSelection.js");
const testsSource = read("dashboard/tests/routes.spec.js");
const packageJson = parseJson("package.json", "p421");
const projectsJson = parseJson("project-registry/projects.json", "projectRegistryJson");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const publicSafetyReport = read("reports/public-safety-report.md");

for (const artifact of [
  "project-registry/project-registry.schema.json",
  "project-registry/nexus-project.schema.json",
  "project-registry/project-types.json",
  "policy/project-registry-policy.json",
  "scripts/check-project-registry-schema.js",
]) {
  check(existsSync(join(ROOT, artifact)), "p421", `Missing P42.1 artifact: ${artifact}`);
}

for (const exportName of [
  "loadProjectProfile",
  "loadProjectProfileFromObject",
  "normalizeProjectProfile",
  "validateProjectProfile",
  "discoverProjectProfiles",
  "summarizeProjectProfileDiscovery",
]) {
  check(hasExport(indexSource, exportName), "p422", `Missing P42.2 export: ${exportName}`);
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
  check(hasExport(indexSource, exportName), "p423", `Missing P42.3 export: ${exportName}`);
}
check(listStackProfiles().length >= 3, "p423", "Expected stack profiles");

for (const exportName of [
  "generateProjectProfile",
  "buildProjectOnboardingPlan",
  "createProjectOnboardingDryRun",
  "validateProjectOnboardingRequest",
]) {
  check(hasExport(indexSource, exportName), "p424", `Missing P42.4 export: ${exportName}`);
}
const onboardingPlan = buildProjectOnboardingPlan({ name: "Example SaaS", type: "saas-mobile" });
check(onboardingPlan.dryRun === true, "p424", "Onboarding plan must be dry-run");
check(onboardingPlan.projectFileWritesAllowed === false, "p424", "Onboarding must keep project file writes disabled");
check(generateProjectProfile({ name: "Example SaaS" }).projectId === "example-saas", "p424", "Project profile generator mismatch");

check(selectorSource.includes("PROJECT_SELECTION_STORAGE_KEY"), "p425", "Missing selector storage key");
check(selectorSource.includes("private-project-01"), "p425", "Missing private project selector option");
check(selectorSource.includes("demoOnly: true"), "p425", "Missing demo-only selector option");
check(commandCenterSource.includes("Project selector"), "p425", "Command Center project selector UI missing");

for (const exportName of [
  "buildProjectCapabilityMatrix",
  "validateProjectCapabilityMatrix",
  "summarizeProjectCapabilityMatrix",
]) {
  check(hasExport(indexSource, exportName), "p426", `Missing P42.6 export: ${exportName}`);
}
const matrix = buildProjectCapabilityMatrix({ projectId: "private-project-01" });
check(validateProjectCapabilityMatrix(matrix).valid === true, "p426", "Capability matrix must validate");
check(commandCenterSource.includes("Project Capability Matrix"), "p426", "Capability matrix UI missing");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P42", "P42.1", "P42.2", "P42.3", "P42.4", "P42.5", "P42.6", "P42.7", "P43", "P43.1", "P43.2", "P43.3", "P43.4", "P43.5", "P43.6"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P43", "P43.1", "P43.2", "P43.3", "P43.4", "P43.5"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P43.1, P43.2, P43.3, P43.4, or P43.5");
check(["P42.7", "P43.1", "P43.2", "P43.3", "P43.4", "P43.6"].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be P42.7, P43.1, P43.2, P43.3, or P43.4");
check(["P43.2", "P43.3", "P43.4", "P43.5", "P43.6", "P44"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be P43.2, P43.3, P43.4, P43.5, or P43.6");
for (const phaseId of ["P42", "P42.1", "P42.2", "P42.3", "P42.4", "P42.5", "P42.6", "P42.7"]) {
  const entry = statusById.get(phaseId) || {};
  check(entry.status === "complete", "osPhaseStatus", `${phaseId} must be complete`);
  check(Boolean(entry.branch), "osPhaseStatus", `${phaseId} must include branch`);
  check(Boolean(entry.commit), "osPhaseStatus", `${phaseId} must include commit`);
  check(Boolean(entry.summary), "osPhaseStatus", `${phaseId} must include summary`);
  check(Array.isArray(entry.checksRun), "osPhaseStatus", `${phaseId} must include checksRun`);
  check(Array.isArray(entry.knownLimitations), "osPhaseStatus", `${phaseId} must include knownLimitations`);
  check(entry.commandCenterVisible === true, "osPhaseStatus", `${phaseId} must be Command Center visible`);
}
check(["in_progress", "complete"].includes(statusById.get("P43")?.status), "osPhaseStatus", "P43 must be active");
check(statusById.get("P43.1")?.status === "complete", "osPhaseStatus", "P43.1 must be complete");
check(["planned", "complete"].includes(statusById.get("P43.2")?.status), "osPhaseStatus", "P43.2 must exist");
check(["planned", "complete"].includes(statusById.get("P43.3")?.status), "osPhaseStatus", "P43.3 must exist");
check(["planned", "complete"].includes(statusById.get("P43.4")?.status), "osPhaseStatus", "P43.4 must exist");
check(["planned", "complete"].includes(statusById.get("P43.5")?.status), "osPhaseStatus", "P43.5 must exist");

const registryValidation = validateProjectRegistry(loadProjectRegistry());
check(registryValidation.valid === true, "projectRegistryJson", `Registry invalid: ${registryValidation.errors.join("; ")}`);
check(projectsJson.registryVersion === "1.0", "projectRegistryJson", "projects.json registryVersion mismatch");
check(Array.isArray(projectsJson.projects) && projectsJson.projects.length >= 3, "projectRegistryJson", "projects.json must include baseline projects");
check(getDefaultProjectId() === "private-project-01", "projectRegistryJson", "Default project must be private-project-01");
check(getPrivateProjectPlaceholder()?.label === "Private Project", "projectRegistryJson", "Private placeholder label mismatch");
check(listRegistryProjects().some((project) => project.projectId === "demoapp" && project.demoOnly), "projectRegistryJson", "DemoApp must remain demo-only");
check(!JSON.stringify(projectsJson).includes("projects/careloop"), "projectRegistryJson", "projects.json must not expose private project paths");

for (const expected of [
  "No project selected",
  "Create or import a project",
  "Add a project profile",
  "Define stack and test commands",
  "Project selector",
  "Private Project",
]) {
  check(commandCenterSource.includes(expected), "commandCenterProjectContext", `Missing project context copy: ${expected}`);
}
for (const expectedTest of [
  "project selector persists selected project context",
  "projects page shows project capability matrix without enabling adapters",
  "DemoApp appears on demo route only",
]) {
  check(testsSource.includes(expectedTest), "commandCenterProjectContext", `Missing Playwright coverage: ${expectedTest}`);
}

check(matrix.adapterRuntimeEnabled === false, "safetyBoundaries", "Adapter runtime must remain disabled");
check(matrix.projectMutationAllowed === false, "safetyBoundaries", "Project mutation must remain disabled");
check(matrix.providerDispatchEnabled === false, "safetyBoundaries", "Provider dispatch must remain disabled");
check(matrix.workerRuntimeEnabled === false, "safetyBoundaries", "Worker runtime must remain disabled");
check(matrix.mcpToolsEnabled === false, "safetyBoundaries", "MCP/tools must remain disabled");
check(matrix.dbWritesAllowed === false, "safetyBoundaries", "DB writes must remain disabled");

const requiredScripts = [
  "check:project-registry-final-validation",
  "check:project-capability-matrix",
  "check:command-center-project-selector",
  "check:project-onboarding",
  "check:project-stack-profile",
  "check:project-profile-loader",
  "check:project-registry-schema",
];
for (const scriptName of requiredScripts) {
  check(Boolean(packageJson.scripts?.[scriptName]), "reportsCurrent", `Missing package script: ${scriptName}`);
}

for (const reportPath of [
  "reports/project-registry-schema-report.md",
  "reports/project-profile-loader-report.md",
  "reports/project-stack-profile-report.md",
  "reports/project-onboarding-report.md",
  "reports/command-center-project-selector-report.md",
  "reports/project-capability-matrix-report.md",
  "reports/os-phase-status-report.md",
  "reports/command-center-ux-report.md",
  "reports/docs-coverage-report.md",
  "reports/format-readability-report.md",
]) {
  const report = read(reportPath);
  check(report.includes("Generated at:"), "reportsCurrent", `${reportPath} missing Generated at`);
  check(report.includes("Validation branch:"), "reportsCurrent", `${reportPath} missing Validation branch`);
  check(report.includes("Validation HEAD:"), "reportsCurrent", `${reportPath} missing Validation HEAD`);
  check(report.includes("Note: Validation HEAD is the commit checked out"), "reportsCurrent", `${reportPath} missing validation note`);
}

check(publicSafetyReport.includes("Result: PASS"), "publicSafety", "Public safety report must pass after false-positive wording cleanup");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("projects/shiftpay/"), "noForbiddenChanges", `Forbidden project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agents change: ${file}`);
  check(!file.startsWith("orchestrator/"), "noForbiddenChanges", `Forbidden orchestrator change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden providers change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools change: ${file}`);
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `Forbidden local API behavior change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of [
  "scripts/check-project-registry-final-validation.js",
  "project-registry/projectCapabilityMatrix.js",
  "project-registry/projectOnboardingPlan.js",
  "dashboard/src/data/projectSelection.js",
]) {
  check(!read(file).split("\n").some((line) => line.length > 1000), "formatting", `Line over 1000 chars in ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Project Registry Final Validation Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P42.7 - Project Registry Adapter Final Validation + Roadmap Closure

## Summary

- P42.1-P42.7 status: complete
- Next phase: P43 - Scope Boundary + Project Packaging Safety
- Project selector: local UI-only
- Adapter runtime: disabled
- Project mutation: disabled
- Provider/tool/worker execution: disabled
- DB writes: disabled
- DemoApp: demo-only

## Checks

- P42.1 schema/policy: ${sections.p421 ? "PASS" : "FAIL"}
- P42.2 profile loader: ${sections.p422 ? "PASS" : "FAIL"}
- P42.3 stack profiles: ${sections.p423 ? "PASS" : "FAIL"}
- P42.4 onboarding dry-run: ${sections.p424 ? "PASS" : "FAIL"}
- P42.5 project selector: ${sections.p425 ? "PASS" : "FAIL"}
- P42.6 capability matrix: ${sections.p426 ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- Project registry JSON: ${sections.projectRegistryJson ? "PASS" : "FAIL"}
- Command Center project context: ${sections.commandCenterProjectContext ? "PASS" : "FAIL"}
- Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}
- Reports current: ${sections.reportsCurrent ? "PASS" : "FAIL"}
- Public safety: ${sections.publicSafety ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`P42.1 schema/policy: ${sections.p421 ? "PASS" : "FAIL"}`);
console.log(`P42.2 profile loader: ${sections.p422 ? "PASS" : "FAIL"}`);
console.log(`P42.3 stack profiles: ${sections.p423 ? "PASS" : "FAIL"}`);
console.log(`P42.4 onboarding dry-run: ${sections.p424 ? "PASS" : "FAIL"}`);
console.log(`P42.5 project selector: ${sections.p425 ? "PASS" : "FAIL"}`);
console.log(`P42.6 capability matrix: ${sections.p426 ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Project registry JSON: ${sections.projectRegistryJson ? "PASS" : "FAIL"}`);
console.log(`Command Center project context: ${sections.commandCenterProjectContext ? "PASS" : "FAIL"}`);
console.log(`Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}`);
console.log(`Reports current: ${sections.reportsCurrent ? "PASS" : "FAIL"}`);
console.log(`Public safety: ${sections.publicSafety ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
