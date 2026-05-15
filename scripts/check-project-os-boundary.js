import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  CHANGE_TYPES,
  buildProjectOsBoundaryReport,
  classifyChangedPaths,
  classifyPathScope,
  createMutationBoundaryDecision,
  getBoundaryPathRules,
  validateBoundaryRules,
  validateMutationBoundaryDecision,
  writeProjectOsBoundaryReport,
} from "../scope-boundary/index.js";

const ROOT = process.cwd();
const sections = {
  modules: true,
  exports: true,
  policy: true,
  pathClassification: true,
  mutationBoundary: true,
  report: true,
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

function lineTooLong(relativePath) {
  return read(relativePath)
    .split("\n")
    .some((line) => line.length > 1000);
}

console.log("NEXUS Project / OS Boundary Check");
console.log("=================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("scope-boundary/index.js");
const policy = parseJson("policy/project-os-boundary-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");

for (const modulePath of [
  "scope-boundary/pathBoundary.js",
  "scope-boundary/mutationBoundary.js",
  "scope-boundary/boundaryReport.js",
  "scope-boundary/index.js",
]) {
  check(existsSync(fullPath(modulePath)), "modules", `Missing module: ${modulePath}`);
}

for (const exportName of [
  "getBoundaryPathRules",
  "classifyPathScope",
  "classifyChangedPaths",
  "summarizeBoundaryClassification",
  "validateBoundaryRules",
  "createMutationBoundaryDecision",
  "validateMutationBoundaryDecision",
  "isProjectMutationAllowed",
  "isOsMutationAllowed",
  "requiresCrossCuttingReview",
  "buildProjectOsBoundaryReport",
  "writeProjectOsBoundaryReport",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P43.2", "policy", "Policy phase must be P43.2");
check(policy.mutationEnforcementEnabled === false, "policy", "Mutation enforcement must be disabled");
check(policy.classificationRequired === true, "policy", "Classification must be required");
check(policy.crossCuttingReviewRequired === true, "policy", "Cross-cutting review must be required");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must remain disabled");
check(policy.osMutationAllowed === false, "policy", "OS mutation must remain disabled");
check(policy.projectPackagingAllowed === false, "policy", "Project packaging must remain disabled");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must remain disabled");
check(policy.dbWritesAllowed === false, "policy", "DB writes must remain disabled");
check(validateBoundaryRules(getBoundaryPathRules()).valid === true, "policy", "Boundary path rules must validate");

const pathSamples = {
  os: classifyPathScope("scope-boundary/pathBoundary.js"),
  dashboard: classifyPathScope("dashboard/src/pages/CommandCenterV2.jsx"),
  policy: classifyPathScope("policy/project-os-boundary-policy.json"),
  project: classifyPathScope("projects/private-project/package.json"),
  projectIos: classifyPathScope("projects/careloop-ios/Package.swift"),
  docs: classifyPathScope("docs/architecture/SCOPE_BOUNDARY_AND_PROJECT_PACKAGING.md"),
  reports: classifyPathScope("reports/project-os-boundary-report.md"),
  demo: classifyPathScope("demo/scenarios/demoapp-sprint.json"),
  unknown: classifyPathScope("unmapped/path.txt"),
};
check(pathSamples.os.category === "nexus_os", "pathClassification", "OS path classification mismatch");
check(pathSamples.dashboard.category === "dashboard", "pathClassification", "Dashboard classification mismatch");
check(pathSamples.policy.category === "policy", "pathClassification", "Policy classification mismatch");
check(pathSamples.project.category === "project", "pathClassification", "Project classification mismatch");
check(pathSamples.projectIos.category === "project_ios", "pathClassification", "iOS project classification mismatch");
check(pathSamples.docs.category === "docs", "pathClassification", "Docs classification mismatch");
check(pathSamples.reports.category === "generated_report", "pathClassification", "Report classification mismatch");
check(pathSamples.demo.category === "demo", "pathClassification", "Demo classification mismatch");
check(pathSamples.unknown.category === "unknown", "pathClassification", "Unknown classification mismatch");

const decisions = {
  os: createMutationBoundaryDecision({ paths: ["scope-boundary/pathBoundary.js"] }),
  project: createMutationBoundaryDecision({ paths: ["projects/private-project/package.json"] }),
  projectIos: createMutationBoundaryDecision({ paths: ["projects/careloop-ios/Package.swift"] }),
  docs: createMutationBoundaryDecision({ paths: ["docs/architecture/SCOPE_BOUNDARY_AND_PROJECT_PACKAGING.md"] }),
  reports: createMutationBoundaryDecision({ paths: ["reports/project-os-boundary-report.md"] }),
  crossCutting: createMutationBoundaryDecision({ paths: ["scope-boundary/pathBoundary.js", "projects/private-project/package.json"] }),
  unknown: createMutationBoundaryDecision({ paths: ["unmapped/path.txt"] }),
};
check(decisions.os.changeScope === CHANGE_TYPES.NEXUS_OS_CHANGE, "mutationBoundary", "OS decision mismatch");
check(decisions.project.changeScope === CHANGE_TYPES.PROJECT_CHANGE, "mutationBoundary", "Project decision mismatch");
check(decisions.projectIos.changeScope === CHANGE_TYPES.PROJECT_CHANGE, "mutationBoundary", "iOS project decision mismatch");
check(decisions.docs.changeScope === CHANGE_TYPES.NEXUS_OS_CHANGE, "mutationBoundary", "Docs decision mismatch");
check(decisions.reports.changeScope === CHANGE_TYPES.NEXUS_OS_CHANGE, "mutationBoundary", "Reports decision mismatch");
check(decisions.crossCutting.changeScope === CHANGE_TYPES.CROSS_CUTTING_CHANGE, "mutationBoundary", "Cross-cutting decision mismatch");
check(decisions.crossCutting.requiresReview === true, "mutationBoundary", "Cross-cutting must require review");
check(decisions.unknown.changeScope === CHANGE_TYPES.UNKNOWN_CHANGE, "mutationBoundary", "Unknown decision mismatch");
check(decisions.unknown.requiresReview === true, "mutationBoundary", "Unknown must require review");
for (const [label, decision] of Object.entries(decisions)) {
  check(decision.mutationAllowed === false, "mutationBoundary", `${label} mutation must remain disabled`);
  const validation = validateMutationBoundaryDecision(decision);
  check(validation.valid === true, "mutationBoundary", `${label} decision invalid: ${validation.errors.join("; ")}`);
}
check(classifyChangedPaths(["scope-boundary/pathBoundary.js", "projects/private-project/package.json"]).changeScope === CHANGE_TYPES.CROSS_CUTTING_CHANGE, "pathClassification", "Changed paths must detect cross-cutting");

const report = buildProjectOsBoundaryReport({ decisions }, { branch, head });
const writeResult = writeProjectOsBoundaryReport(report, { root: ROOT });
check(writeResult.bytes > 0, "report", "Boundary report must be written");
check(read("reports/project-os-boundary-report.md").includes("Validation HEAD"), "report", "Boundary report missing metadata");
check(read("reports/project-os-boundary-report.md").includes("P43.3"), "report", "Boundary report missing next phase");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P43", "P43.1", "P43.2", "P43.3", "P43.4", "P43.5", "P43.6"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P43.2", "P43.3", "P43.4", "P43.5"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P43.2, P43.3, P43.4, or P43.5");
check(["P43.1", "P43.2", "P43.3", "P43.4"].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be P43.1, P43.2, P43.3, or P43.4");
check(["P43.3", "P43.4", "P43.5", "P43.6"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be P43.3, P43.4, P43.5, or P43.6");
check(statusById.get("P43.1")?.status === "complete", "osPhaseStatus", "P43.1 must be complete");
check(statusById.get("P43.2")?.status === "complete", "osPhaseStatus", "P43.2 must be complete");
check(statusById.get("P43.2")?.branch === "arch/scope-boundary-packaging-safety", "osPhaseStatus", "P43.2 branch mismatch");
check(["planned", "complete"].includes(statusById.get("P43.3")?.status), "osPhaseStatus", "P43.3 must exist");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("orchestrator/"), "noForbiddenChanges", `Forbidden orchestrator change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tool change: ${file}`);
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `Forbidden local API change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB change: ${file}`);
}

for (const file of [
  "scope-boundary/pathBoundary.js",
  "scope-boundary/mutationBoundary.js",
  "scope-boundary/boundaryReport.js",
  "policy/project-os-boundary-policy.json",
  "scripts/check-project-os-boundary.js",
]) {
  check(!lineTooLong(file), "formatting", `Line over 1000 chars in ${file}`);
}

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Path classification: ${sections.pathClassification ? "PASS" : "FAIL"}`);
console.log(`Mutation boundary: ${sections.mutationBoundary ? "PASS" : "FAIL"}`);
console.log(`Report: ${sections.report ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
if (failures.length) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(`- ${failure}`);
}
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
