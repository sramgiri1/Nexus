import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  CHANGE_TYPES,
  SCOPE_TYPES,
  buildScopeClassificationReport,
  classifyActionScope,
  classifyFileSet,
  classifyPath,
  classifyTaskScope,
  evaluateScopePolicy,
  loadScopePolicy,
  validateScopeClassification,
  validateScopePolicy,
  writeScopeClassificationReport,
} from "../scope-boundary/index.js";

const ROOT = process.cwd();

const sections = {
  modules: true,
  exports: true,
  policy: true,
  pathClassification: true,
  fileSetClassification: true,
  taskActionClassification: true,
  policyEvaluation: true,
  report: true,
  osPhaseStatus: true,
  commandCenterUx: true,
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

console.log("NEXUS Scope Classification Check");
console.log("================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const packageJson = parseJson("package.json", "modules");

for (const modulePath of [
  "scope-boundary/scopeTypes.js",
  "scope-boundary/scopeClassifier.js",
  "scope-boundary/scopePolicy.js",
  "scope-boundary/scopeReport.js",
  "scope-boundary/index.js",
]) {
  check(existsSync(fullPath(modulePath)), "modules", `Missing module: ${modulePath}`);
}

const indexSource = read("scope-boundary/index.js");
for (const exportName of [
  "SCOPE_TYPES",
  "CHANGE_TYPES",
  "SCOPE_STATUS",
  "SCOPE_RISK_LEVELS",
  "SCOPE_DATA_CLASSIFICATIONS",
  "isValidScopeType",
  "isValidChangeType",
  "classifyPath",
  "classifyFileSet",
  "classifyTaskScope",
  "classifyActionScope",
  "summarizeScopeClassification",
  "validateScopeClassification",
  "loadScopePolicy",
  "validateScopePolicy",
  "getAllowedRootsForScope",
  "getForbiddenRootsForScope",
  "evaluateScopePolicy",
  "buildScopeClassificationReport",
  "writeScopeClassificationReport",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

const policyResult = loadScopePolicy({ root: ROOT });
check(policyResult.ok === true, "policy", `Policy load failed: ${policyResult.errors.join("; ")}`);
const policy = policyResult.policy || {};
const policyValidation = validateScopePolicy(policy);
check(policyValidation.valid === true, "policy", `Policy invalid: ${policyValidation.errors.join("; ")}`);
check(policy.classificationOnly === true, "policy", "classificationOnly must be true");
check(policy.enforcementEnabled === false, "policy", "enforcementEnabled must be false");
check(policy.projectMutationAllowed === false, "policy", "projectMutationAllowed must be false");
check(policy.packagingSafetyChecksEnabled === false, "policy", "packagingSafetyChecksEnabled must be false");
check(policy.exportPipelineEnabled === false, "policy", "exportPipelineEnabled must be false");
check(policy.providerCallsAllowed === false, "policy", "providerCallsAllowed must be false");
check(policy.toolDispatchAllowed === false, "policy", "toolDispatchAllowed must be false");
check(policy.workerRuntimeAllowed === false, "policy", "workerRuntimeAllowed must be false");
check(policy.dbWritesAllowed === false, "policy", "dbWritesAllowed must be false");

const samples = {
  nexusOs: classifyPath("README.md"),
  dashboard: classifyPath("dashboard/src/pages/CommandCenterV2.jsx"),
  registry: classifyPath("project-registry/projects.json"),
  project: classifyPath("projects/private-project/package.json"),
  demo: classifyPath("demo/scenarios/demoapp-sprint.json"),
  crossCutting: classifyFileSet([
    "dashboard/src/pages/CommandCenterV2.jsx",
    "projects/private-project/package.json",
  ]),
  unknown: classifyPath("unmapped-area/example.txt"),
};

check(samples.nexusOs.changeType === CHANGE_TYPES.NEXUS_OS_CHANGE, "pathClassification", "README must be OS scoped");
check(samples.dashboard.changeType === CHANGE_TYPES.NEXUS_OS_CHANGE, "pathClassification", "Dashboard must be OS scoped");
check(samples.registry.changeType === CHANGE_TYPES.NEXUS_OS_CHANGE, "pathClassification", "Registry must be OS scoped");
check(samples.project.changeType === CHANGE_TYPES.PROJECT_CHANGE, "pathClassification", "Project path must classify as project");
check(samples.demo.changeType === CHANGE_TYPES.DEMO_CHANGE, "pathClassification", "Demo path must classify as demo");
check(samples.unknown.changeType === CHANGE_TYPES.UNKNOWN_CHANGE, "pathClassification", "Unknown path must classify as unknown");
for (const [label, classification] of Object.entries(samples)) {
  const validation = validateScopeClassification(classification);
  check(validation.valid === true, "pathClassification", `${label} classification invalid: ${validation.errors.join("; ")}`);
}

check(
  samples.crossCutting.scopeType === SCOPE_TYPES.CROSS_CUTTING,
  "fileSetClassification",
  "Mixed OS + project paths must classify as cross-cutting",
);
check(samples.crossCutting.requiresReview === true, "fileSetClassification", "Cross-cutting file set must require review");

const taskClassification = classifyTaskScope({
  taskId: "scope-task",
  targetPaths: ["scope-boundary/scopeClassifier.js"],
});
const actionClassification = classifyActionScope({
  actionId: "scope-action",
  allowedPaths: ["projects/private-project/package.json"],
});
check(taskClassification.changeType === CHANGE_TYPES.NEXUS_OS_CHANGE, "taskActionClassification", "Task scope mismatch");
check(actionClassification.changeType === CHANGE_TYPES.PROJECT_CHANGE, "taskActionClassification", "Action scope mismatch");

const evaluatedCrossCutting = evaluateScopePolicy(samples.crossCutting, policy);
const evaluatedUnknown = evaluateScopePolicy(samples.unknown, policy);
const evaluatedProject = evaluateScopePolicy(samples.project, policy);
check(evaluatedCrossCutting.requiresReview === true, "policyEvaluation", "Cross-cutting must require review");
check(evaluatedUnknown.requiresReview === true, "policyEvaluation", "Unknown must require review");
check(evaluatedProject.policyEvaluation.projectMutationAllowed === false, "policyEvaluation", "Project mutation must stay disabled");
check(evaluatedProject.policyEvaluation.packagingSafetyChecksEnabled === false, "policyEvaluation", "Packaging safety must stay disabled");

const report = buildScopeClassificationReport({
  samples,
  policy,
}, {
  branch,
  head,
});
const writeResult = writeScopeClassificationReport(report, { root: ROOT });
check(writeResult.bytes > 0, "report", "Report must be written");
check(read("reports/scope-classification-report.md").includes("Validation HEAD"), "report", "Report metadata missing");
check(read("reports/scope-classification-report.md").includes("P43.2"), "report", "Report next phase missing");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P42.7", "P43", "P43.1", "P43.2", "P43.3", "P43.4", "P43.5", "P43.6"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(statusById.get("P42.7")?.status === "complete", "osPhaseStatus", "P42.7 must be complete");
check(statusById.get("P42.7")?.branch === "test/project-registry-final-validation", "osPhaseStatus", "P42.7 branch mismatch");
check(statusById.get("P42.7")?.commit === "e6a98d2", "osPhaseStatus", "P42.7 commit must be e6a98d2");
check(["in_progress", "complete"].includes(statusById.get("P43")?.status), "osPhaseStatus", "P43 must be active");
check(statusById.get("P43.1")?.status === "complete", "osPhaseStatus", "P43.1 must be complete");
check(statusById.get("P43.1")?.branch === "arch/scope-classification-model", "osPhaseStatus", "P43.1 branch mismatch");
check(statusById.get("P43.1")?.nextPhase === "P43.2", "osPhaseStatus", "P43.1 nextPhase must be P43.2");
check(["planned", "complete"].includes(statusById.get("P43.2")?.status), "osPhaseStatus", "P43.2 must exist");
check(["planned", "complete"].includes(statusById.get("P43.3")?.status), "osPhaseStatus", "P43.3 must exist");
check(["planned", "complete"].includes(statusById.get("P43.4")?.status), "osPhaseStatus", "P43.4 must exist");
check(["planned", "complete"].includes(statusById.get("P43.5")?.status), "osPhaseStatus", "P43.5 must exist");
const laterHandoffPhases = ["P44", "P44.1", "P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6", "P46"];
check(["P43", "P43.1", "P43.2", "P43.3", "P43.4", "P43.5", ...laterHandoffPhases].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P43 or a later handoff phase");
check(["P42.7", "P43.1", "P43.2", "P43.3", "P43.4", "P43.6", ...laterHandoffPhases].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be P42.7/P43 or a later handoff phase");
check(["P43.2", "P43.3", "P43.4", "P43.5", "P43.6", ...laterHandoffPhases].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be P43 or a later handoff phase");

check(commandCenterSource.includes("Scope Boundary"), "commandCenterUx", "Command Center scope boundary copy missing");
check(commandCenterSource.includes("classification ready"), "commandCenterUx", "Command Center classification status missing");
check(commandCenterSource.includes("enforcement not enabled yet"), "commandCenterUx", "Command Center enforcement status missing");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("orchestrator/"), "noForbiddenChanges", `Forbidden orchestrator change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tool change: ${file}`);
  check(!file.startsWith("local-api/"), "noForbiddenChanges", `Forbidden local API behavior change: ${file}`);
  check(!file.startsWith("db/"), "noForbiddenChanges", `Forbidden DB behavior change: ${file}`);
}

for (const file of [
  "scope-boundary/scopeTypes.js",
  "scope-boundary/scopeClassifier.js",
  "scope-boundary/scopePolicy.js",
  "scope-boundary/scopeReport.js",
  "scope-boundary/index.js",
  "policy/scope-classification-policy.json",
  "scripts/check-scope-classification.js",
]) {
  check(!lineTooLong(file), "formatting", `Line over 1000 chars in ${file}`);
}

check(Boolean(packageJson.scripts?.["check:scope-classification"]), "modules", "Missing package check script");

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Path classification: ${sections.pathClassification ? "PASS" : "FAIL"}`);
console.log(`File-set classification: ${sections.fileSetClassification ? "PASS" : "FAIL"}`);
console.log(`Task/action classification: ${sections.taskActionClassification ? "PASS" : "FAIL"}`);
console.log(`Policy evaluation: ${sections.policyEvaluation ? "PASS" : "FAIL"}`);
console.log(`Report: ${sections.report ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
if (failures.length) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(`- ${failure}`);
}
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
