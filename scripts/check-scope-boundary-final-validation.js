import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createProjectExportSafetyPlan,
  createRedactedReleaseManifest,
  createMutationBoundaryDecision,
  summarizeExportSafety,
  summarizeReleaseManifest,
  validateRedactedReleaseManifest,
} from "../scope-boundary/index.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/scope-boundary-final-validation-report.md";
const sections = {
  p431: true,
  p432: true,
  p433: true,
  p434: true,
  p435: true,
  policies: true,
  dryRunSafety: true,
  manifestSafety: true,
  osPhaseStatus: true,
  docs: true,
  noForbiddenChanges: true,
  formatting: true,
  report: true,
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

function writeReport({ exportSummary, manifestSummary }) {
  const branch = gitOutput(["branch", "--show-current"]);
  const head = gitOutput(["rev-parse", "--short", "HEAD"]);
  const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
  const body = `# NEXUS Scope Boundary Final Validation Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P43.6 - Packaging Safety Checker + Final Validation

## Summary

- P43.1 scope classification: ${sections.p431 ? "PASS" : "FAIL"}
- P43.2 project/OS mutation boundary: ${sections.p432 ? "PASS" : "FAIL"}
- P43.3 project export safety: ${sections.p433 ? "PASS" : "FAIL"}
- P43.4 redacted release manifest: ${sections.p434 ? "PASS" : "FAIL"}
- P43.5 Command Center scope boundary UX: ${sections.p435 ? "PASS" : "FAIL"}
- Export dry-run only: ${exportSummary.dryRunOnly ? "yes" : "no"}
- Export package allowed: ${exportSummary.exportAllowed ? "yes" : "no"}
- Manifest package created: ${manifestSummary.packageCreated ? "yes" : "no"}
- Manifest redacted: ${manifestSummary.redacted ? "yes" : "no"}
- NEXUS internals included: ${manifestSummary.nexusInternalsIncluded ? "yes" : "no"}
- Secrets included: ${manifestSummary.secretsIncluded ? "yes" : "no"}

## Explicit Safety Closure

- Project mutation remains disabled.
- OS mutation remains disabled unless governed in a future phase.
- Project export/package creation remains disabled.
- Redacted release manifest generation is allowed, but package creation is not.
- Provider/tool/worker execution and DB writes remain disabled.
- Private project source files were not modified.

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}

## Next Phase

P44 - Multi-Repo Workspace + Git/PR Lifecycle
`;
  mkdirSync(dirname(fullPath(REPORT_PATH)), { recursive: true });
  writeFileSync(fullPath(REPORT_PATH), body, "utf8");
}

console.log("NEXUS Scope Boundary Final Validation Check");
console.log("===========================================");

for (const file of [
  "scope-boundary/scopeTypes.js",
  "scope-boundary/scopeClassifier.js",
  "scope-boundary/pathBoundary.js",
  "scope-boundary/mutationBoundary.js",
  "scope-boundary/exportSafety.js",
  "scope-boundary/exportRules.js",
  "scope-boundary/releaseManifest.js",
  "scope-boundary/redactionSummary.js",
  "reports/scope-classification-report.md",
  "reports/project-os-boundary-report.md",
  "reports/project-export-safety-report.md",
  "reports/redacted-release-manifest-report.md",
  "reports/command-center-ux-report.md",
]) {
  check(existsSync(fullPath(file)), "p431", `Missing P43 artifact: ${file}`);
}
check(read("reports/scope-classification-report.md").includes("P43.1"), "p431", "P43.1 report missing");
check(read("reports/project-os-boundary-report.md").includes("P43.2"), "p432", "P43.2 report missing");
check(read("reports/project-export-safety-report.md").includes("P43.3"), "p433", "P43.3 report missing");
check(read("reports/redacted-release-manifest-report.md").includes("P43.4"), "p434", "P43.4 report missing");
check(read("reports/command-center-ux-report.md").includes("Scope boundary UX: PASS"), "p435", "P43.5 UX report missing scope boundary pass");

const policies = {
  scope: parseJson("policy/scope-classification-policy.json", "policies"),
  boundary: parseJson("policy/project-os-boundary-policy.json", "policies"),
  export: parseJson("policy/project-export-safety-policy.json", "policies"),
  manifest: parseJson("policy/redacted-release-manifest-policy.json", "policies"),
};
check(policies.scope.phase === "P43.1", "policies", "Scope policy phase mismatch");
check(policies.boundary.phase === "P43.2", "policies", "Boundary policy phase mismatch");
check(policies.export.phase === "P43.3", "policies", "Export policy phase mismatch");
check(policies.manifest.phase === "P43.4", "policies", "Manifest policy phase mismatch");
check(policies.boundary.projectMutationAllowed === false, "policies", "Project mutation must be disabled");
check(policies.export.packageCreationAllowed === false, "policies", "Package creation must be disabled");
check(policies.export.dryRunOnly === true, "policies", "Export safety must be dry-run only");
check(policies.manifest.packageCreationAllowed === false, "policies", "Manifest package creation must be disabled");
check(policies.manifest.dbWritesAllowed === false, "policies", "DB writes must remain disabled");

const boundaryDecision = createMutationBoundaryDecision({
  paths: ["scope-boundary/exportSafety.js", "projects/private-project/src/index.js"],
});
check(boundaryDecision.mutationAllowed === false, "dryRunSafety", "Cross-cutting mutation must remain disabled");
check(boundaryDecision.requiresReview === true, "dryRunSafety", "Cross-cutting mutation must require review");

const exportPlan = createProjectExportSafetyPlan({
  projectId: "private-project",
  candidatePaths: [
    "projects/private-project/src/index.js",
    "artifacts/project-release/private-project-release-manifest.json",
    "agents/shepherd.json",
    "local-state/runtime/services/service-state.json",
    ".env",
  ],
});
const exportSummary = summarizeExportSafety(exportPlan);
check(exportPlan.exportAllowed === false, "dryRunSafety", "Project export must not be executable");
check(exportPlan.dryRunOnly === true, "dryRunSafety", "Project export must stay dry-run only");
check(exportPlan.nexusInternalsDetected === true, "dryRunSafety", "Export safety must detect NEXUS internals");
check(exportPlan.secretsDetected === true, "dryRunSafety", "Export safety must detect secrets");
check(!existsSync(fullPath("artifacts/project-release/private-project.zip")), "dryRunSafety", "No project package should exist");

const manifest = parseJson("artifacts/project-release/private-project-release-manifest.json", "manifestSafety");
const generatedManifest = createRedactedReleaseManifest({ mode: "local-private" });
const validation = validateRedactedReleaseManifest(manifest);
const generatedValidation = validateRedactedReleaseManifest(generatedManifest);
const manifestSummary = summarizeReleaseManifest(manifest);
const manifestSource = read("artifacts/project-release/private-project-release-manifest.json");
check(validation.valid === true, "manifestSafety", `Manifest invalid: ${validation.errors.join("; ")}`);
check(generatedValidation.valid === true, "manifestSafety", "Generated manifest template must validate");
check(manifestSummary.packageCreated === false, "manifestSafety", "Manifest must not mark package created");
check(manifestSummary.nexusInternalsIncluded === false, "manifestSafety", "Manifest must not include NEXUS internals");
check(manifestSummary.secretsIncluded === false, "manifestSafety", "Manifest must not include secrets");
check(!manifestSource.includes("projects/careloop/"), "manifestSafety", "Manifest must not include private project paths");
check(!manifestSource.includes("agents/"), "manifestSafety", "Manifest must not include agent paths");
check(!manifestSource.includes("policy/"), "manifestSafety", "Manifest must not include policy paths");
check(!manifestSource.includes(".env"), "manifestSafety", "Manifest must not include env file names");

const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P43", "P43.1", "P43.2", "P43.3", "P43.4", "P43.5", "P43.6", "P44"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `Missing OS phase status: ${phaseId}`);
}
check(statusById.get("P43")?.status === "complete", "osPhaseStatus", "P43 must be complete");
check(statusById.get("P43.1")?.status === "complete", "osPhaseStatus", "P43.1 must be complete");
check(statusById.get("P43.2")?.commit === "5ae9242", "osPhaseStatus", "P43.2 commit mismatch");
check(statusById.get("P43.3")?.commit === "69dbd28", "osPhaseStatus", "P43.3 commit mismatch");
check(statusById.get("P43.4")?.commit === "9c964a8", "osPhaseStatus", "P43.4 commit mismatch");
check(statusById.get("P43.5")?.commit === "ee1f92c", "osPhaseStatus", "P43.5 commit mismatch");
check(statusById.get("P43.6")?.status === "complete", "osPhaseStatus", "P43.6 must be complete");
const laterHandoffPhases = ["P44", "P44.1", "P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6", "P46"];
check(["P43", ...laterHandoffPhases].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P43 or later handoff phase");
check(["P43.6", ...laterHandoffPhases].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be P43.6 or later handoff phase");
check(laterHandoffPhases.includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be P44 or later handoff phase");

check(
  read("README.md").includes("P44 - Multi-Repo Workspace + Git/PR Lifecycle")
    || read("README.md").includes("P44.2 - Repo Ownership + Dependency Map")
    || read("README.md").includes("P45 - Agent Registry + Boundary Compiler")
    || read("README.md").includes("P45.4 - Boundary Compiler")
    || read("README.md").includes("P46 - Scoped Memory Architecture + Memory Center"),
  "docs",
  "README must point to P44, active P44 subphase, or P45 handoff",
);
check(read("docs/architecture/SCOPE_BOUNDARY_AND_PROJECT_PACKAGING.md").includes("P43.6"), "docs", "Scope boundary docs must mention P43.6");
check(read("docs/architecture/NEXUS_PLATFORM_ROADMAP.md").includes("P43.6"), "docs", "Roadmap docs must mention P43.6");

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
  "scripts/check-scope-boundary-final-validation.js",
  "docs/architecture/SCOPE_BOUNDARY_AND_PROJECT_PACKAGING.md",
  "README.md",
]) {
  check(!lineTooLong(file), "formatting", `Line over 1000 chars in ${file}`);
}

writeReport({ exportSummary, manifestSummary });
check(read(REPORT_PATH).includes("Validation HEAD"), "report", "Final report missing Validation HEAD wording");

console.log(`P43.1 scope classification: ${sections.p431 ? "PASS" : "FAIL"}`);
console.log(`P43.2 mutation boundary: ${sections.p432 ? "PASS" : "FAIL"}`);
console.log(`P43.3 export safety: ${sections.p433 ? "PASS" : "FAIL"}`);
console.log(`P43.4 redacted manifest: ${sections.p434 ? "PASS" : "FAIL"}`);
console.log(`P43.5 Command Center UX: ${sections.p435 ? "PASS" : "FAIL"}`);
console.log(`Policies: ${sections.policies ? "PASS" : "FAIL"}`);
console.log(`Dry-run safety: ${sections.dryRunSafety ? "PASS" : "FAIL"}`);
console.log(`Manifest safety: ${sections.manifestSafety ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Report: ${sections.report ? "PASS" : "FAIL"}`);
const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
if (failures.length) {
  console.log("\nFailures:");
  for (const failure of failures) console.log(`- ${failure}`);
}
console.log(`Result: ${result}`);
if (result !== "PASS") process.exitCode = 1;
