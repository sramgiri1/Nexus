import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildProjectExportSafetyReport,
  createProjectExportSafetyPlan,
  getProjectExportAllowRules,
  getProjectExportDenyRules,
  isPathExportAllowed,
  summarizeExportSafety,
  validateExportRules,
  writeProjectExportSafetyReport,
} from "../scope-boundary/index.js";

const ROOT = process.cwd();
const sections = {
  modules: true,
  exports: true,
  policy: true,
  exportRules: true,
  dryRunPlan: true,
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

console.log("NEXUS Project Export Safety Check");
console.log("=================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("scope-boundary/index.js");
const policy = parseJson("policy/project-export-safety-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");

for (const modulePath of [
  "scope-boundary/exportRules.js",
  "scope-boundary/exportSafety.js",
  "scope-boundary/exportSafetyReport.js",
  "scope-boundary/index.js",
]) {
  check(existsSync(fullPath(modulePath)), "modules", `Missing module: ${modulePath}`);
}

for (const exportName of [
  "getProjectExportAllowRules",
  "getProjectExportDenyRules",
  "validateExportRules",
  "createProjectExportSafetyPlan",
  "evaluateProjectExportSafety",
  "summarizeExportSafety",
  "isPathExportAllowed",
  "buildProjectExportSafetyReport",
  "writeProjectExportSafetyReport",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P43.3", "policy", "Policy phase must be P43.3");
check(policy.exportExecutionEnabled === false, "policy", "Export execution must remain disabled");
check(policy.dryRunOnly === true, "policy", "Export safety must remain dry-run only");
check(policy.packageCreationAllowed === false, "policy", "Package creation must remain disabled");
check(policy.nexusInternalsAllowedInProjectPackage === false, "policy", "NEXUS internals must be blocked");
check(policy.rawEvidenceAllowed === false, "policy", "Raw evidence must be blocked");
check(policy.rawAuditAllowed === false, "policy", "Raw audit must be blocked");
check(policy.rawActivityAllowed === false, "policy", "Raw activity must be blocked");
check(policy.secretsAllowed === false, "policy", "Secrets must be blocked");
check(policy.demoDataAllowed === false, "policy", "Demo data must be blocked");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must remain disabled");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must remain disabled");
check(policy.dbWritesAllowed === false, "policy", "DB writes must remain disabled");

const allowRules = getProjectExportAllowRules();
const denyRules = getProjectExportDenyRules();
check(validateExportRules({ allowRules, denyRules }).valid === true, "exportRules", "Export rules must validate");
check(allowRules.some((rule) => rule.category === "project_source"), "exportRules", "Project source allow rule missing");
check(allowRules.some((rule) => rule.category === "project_docs"), "exportRules", "Project docs allow rule missing");
check(allowRules.some((rule) => rule.category === "project_tests"), "exportRules", "Project tests allow rule missing");
check(denyRules.some((rule) => rule.category === "nexus_agents"), "exportRules", "Agents deny rule missing");
check(denyRules.some((rule) => rule.category === "command_center"), "exportRules", "Command Center deny rule missing");
check(denyRules.some((rule) => rule.category === "raw_evidence"), "exportRules", "Raw evidence deny rule missing");
check(denyRules.some((rule) => rule.category === "secrets"), "exportRules", "Secrets deny rule missing");

const plan = createProjectExportSafetyPlan({
  projectId: "private-project",
  mode: "local-private",
  candidatePaths: [
    "projects/private-project/src/index.js",
    "projects/private-project/README.md",
    "projects/private-project/tests/app.test.js",
    "projects/private-project/package.json",
    "artifacts/project-release/private-project-release-manifest.json",
    "agents/shepherd.json",
    "dashboard/src/pages/CommandCenterV2.jsx",
    "policy/project-export-safety-policy.json",
    "evidence/private-project/raw.jsonl",
    "audit/private-project/actions.jsonl",
    "activity/events.jsonl",
    "local-state/runtime/services/service-state.json",
    "secrets/github-token.txt",
    ".env",
    "demo/scenarios/demoapp.json",
  ],
});
const summary = summarizeExportSafety(plan);
check(plan.exportAllowed === false, "dryRunPlan", "Dry-run plan must not allow actual export");
check(plan.dryRunOnly === true, "dryRunPlan", "Dry-run plan must stay dry-run only");
check(summary.allowedPathCount >= 5, "dryRunPlan", "Expected project source/doc/test/config/redacted paths allowed in dry-run");
check(summary.blockedPathCount >= 9, "dryRunPlan", "Expected internal/raw/secret/demo paths blocked");
check(plan.nexusInternalsDetected === true, "dryRunPlan", "NEXUS internals should be detected");
check(plan.secretsDetected === true, "dryRunPlan", "Secrets should be detected");
check(plan.demoDataDetected === true, "dryRunPlan", "Demo data should be detected");
check(isPathExportAllowed("projects/private-project/src/index.js", { mode: "local-private" }) === true, "exportRules", "Project source should be allowed in dry-run");
check(isPathExportAllowed("agents/shepherd.json", { mode: "local-private" }) === false, "exportRules", "NEXUS agents must be blocked");
check(isPathExportAllowed(".env", { mode: "local-private" }) === false, "exportRules", ".env must be blocked");
check(!existsSync(fullPath("artifacts/project-release/private-project.zip")), "dryRunPlan", "Checker must not create a project package");

const report = buildProjectExportSafetyReport(plan, { branch, head });
const writeResult = writeProjectExportSafetyReport(report, { root: ROOT });
check(writeResult.bytes > 0, "report", "Export safety report must be written");
check(read("reports/project-export-safety-report.md").includes("Validation HEAD"), "report", "Report missing metadata");
check(read("reports/project-export-safety-report.md").includes("No project package is created"), "report", "Report must state no package is created");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P43", "P43.1", "P43.2", "P43.3", "P43.4"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(phaseStatus.currentPhase === "P43.3", "osPhaseStatus", "currentPhase must be P43.3");
check(phaseStatus.previousPhase === "P43.2", "osPhaseStatus", "previousPhase must be P43.2");
check(phaseStatus.nextPhase === "P43.4", "osPhaseStatus", "nextPhase must be P43.4");
check(statusById.get("P43.1")?.status === "complete", "osPhaseStatus", "P43.1 must be complete");
check(statusById.get("P43.2")?.status === "complete", "osPhaseStatus", "P43.2 must be complete");
check(statusById.get("P43.2")?.commit === "5ae9242", "osPhaseStatus", "P43.2 commit must be 5ae9242");
check(statusById.get("P43.3")?.status === "complete", "osPhaseStatus", "P43.3 must be complete");
check(statusById.get("P43.3")?.branch === "arch/scope-boundary-packaging-safety", "osPhaseStatus", "P43.3 branch mismatch");
check(statusById.get("P43.4")?.status === "planned", "osPhaseStatus", "P43.4 must be planned");

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
  "scope-boundary/exportRules.js",
  "scope-boundary/exportSafety.js",
  "scope-boundary/exportSafetyReport.js",
  "policy/project-export-safety-policy.json",
  "scripts/check-project-export-safety.js",
]) {
  check(!lineTooLong(file), "formatting", `Line over 1000 chars in ${file}`);
}

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Export rules: ${sections.exportRules ? "PASS" : "FAIL"}`);
console.log(`Dry-run plan: ${sections.dryRunPlan ? "PASS" : "FAIL"}`);
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
