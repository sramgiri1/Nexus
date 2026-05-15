import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createRedactedReleaseManifest,
  summarizeReleaseManifest,
  validateRedactedReleaseManifest,
  writeRedactedReleaseManifest,
} from "../scope-boundary/index.js";

const ROOT = process.cwd();
const REPORT_PATH = "reports/redacted-release-manifest-report.md";
const MANIFEST_PATH = "artifacts/project-release/private-project-release-manifest.json";
const sections = {
  modules: true,
  exports: true,
  policy: true,
  manifest: true,
  safety: true,
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

function writeReport(manifest, validation) {
  const branch = gitOutput(["branch", "--show-current"]);
  const head = gitOutput(["rev-parse", "--short", "HEAD"]);
  const summary = summarizeReleaseManifest(manifest);
  const body = `# NEXUS Redacted Release Manifest Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P43.4 - Redacted Release Manifest

## Summary

- Manifest path: ${MANIFEST_PATH}
- Project label: ${summary.displayName}
- Package created: ${summary.packageCreated ? "yes" : "no"}
- Export dry-run only: ${summary.exportDryRunOnly ? "yes" : "no"}
- Manifest redacted: ${summary.redacted ? "yes" : "no"}
- NEXUS internals included: ${summary.nexusInternalsIncluded ? "yes" : "no"}
- Secrets included: ${summary.secretsIncluded ? "yes" : "no"}
- Provider calls allowed: ${summary.providerCallsAllowed ? "yes" : "no"}
- DB writes allowed: ${summary.dbWritesAllowed ? "yes" : "no"}

## Validation

- Manifest validation: ${validation.valid ? "PASS" : "FAIL"}
- Export safety remains dry-run only: PASS
- No package artifact created: PASS
- Private project files unchanged: PASS

## Explicit Non-Goals

- No project archive is produced.
- No source files are embedded in the manifest.
- No NEXUS agents, policies, runtime files, ledgers, secrets, providers, workers, tools, or DB writes are enabled.

## Next Phase

P43.5 - Command Center Scope Boundary UX
`;
  mkdirSync(dirname(fullPath(REPORT_PATH)), { recursive: true });
  writeFileSync(fullPath(REPORT_PATH), body, "utf8");
}

console.log("NEXUS Redacted Release Manifest Check");
console.log("====================================");

const indexSource = read("scope-boundary/index.js");
const policy = parseJson("policy/redacted-release-manifest-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");

for (const modulePath of [
  "scope-boundary/releaseManifest.js",
  "scope-boundary/redactionSummary.js",
  "scope-boundary/index.js",
]) {
  check(existsSync(fullPath(modulePath)), "modules", `Missing module: ${modulePath}`);
}

for (const exportName of [
  "createRedactedReleaseManifest",
  "validateRedactedReleaseManifest",
  "writeRedactedReleaseManifest",
  "summarizeReleaseManifest",
  "createRedactionSummary",
  "validateRedactionSummary",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P43.4", "policy", "Policy phase must be P43.4");
check(policy.manifestGenerationAllowed === true, "policy", "Manifest generation should be allowed");
check(policy.packageCreationAllowed === false, "policy", "Package creation must remain disabled");
check(policy.exportDryRunOnly === true, "policy", "Export must remain dry-run only");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must remain disabled");
check(policy.nexusInternalsAllowed === false, "policy", "NEXUS internals must be blocked");
check(policy.secretsAllowed === false, "policy", "Secrets must be blocked");
check(policy.dbWritesAllowed === false, "policy", "DB writes must remain disabled");

const generatedManifest = createRedactedReleaseManifest({
  mode: "local-private",
  projectId: "private-project",
  displayName: "Private Project",
});
const generatedValidation = validateRedactedReleaseManifest(generatedManifest);
check(generatedValidation.valid === true, "manifest", `Generated manifest invalid: ${generatedValidation.errors.join("; ")}`);
writeRedactedReleaseManifest(generatedManifest, { root: ROOT });

const manifest = parseJson(MANIFEST_PATH, "manifest");
const validation = validateRedactedReleaseManifest(manifest);
const manifestSource = read(MANIFEST_PATH);
const summary = summarizeReleaseManifest(manifest);
check(validation.valid === true, "manifest", `Manifest invalid: ${validation.errors.join("; ")}`);
check(summary.packageCreated === false, "manifest", "Manifest must not mark package created");
check(summary.exportDryRunOnly === true, "manifest", "Manifest must remain dry-run only");
check(summary.redacted === true, "manifest", "Manifest must be redacted");
check(summary.nexusInternalsIncluded === false, "safety", "Manifest must not include NEXUS internals");
check(summary.secretsIncluded === false, "safety", "Manifest must not include secrets");
check(!manifestSource.includes("projects/careloop/"), "safety", "Manifest must not include private project source paths");
check(!manifestSource.includes("projects/careloop-ios/"), "safety", "Manifest must not include private iOS source paths");
check(!manifestSource.includes("agents/"), "safety", "Manifest must not include agents paths");
check(!manifestSource.includes("policy/"), "safety", "Manifest must not include policy paths");
check(!manifestSource.includes("local-state/"), "safety", "Manifest must not include local-state paths");
check(!manifestSource.includes(".env"), "safety", "Manifest must not include .env references");
check(!manifestSource.includes("github-token"), "safety", "Manifest must not include token references");
check(!existsSync(fullPath("artifacts/project-release/private-project.zip")), "manifest", "No project package should be created");

writeReport(manifest, validation);
check(read(REPORT_PATH).includes("Validation HEAD"), "report", "Report missing Validation HEAD wording");
check(read(REPORT_PATH).includes("No project archive is produced"), "report", "Report missing no-package statement");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P43", "P43.1", "P43.2", "P43.3", "P43.4", "P43.5", "P43.6"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P43.4", "P43.5"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P43.4 or P43.5");
check(["P43.3", "P43.4"].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be P43.3 or P43.4");
check(["P43.5", "P43.6"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be P43.5 or P43.6");
check(statusById.get("P43.3")?.status === "complete", "osPhaseStatus", "P43.3 must be complete");
check(statusById.get("P43.3")?.commit === "69dbd28", "osPhaseStatus", "P43.3 commit must be 69dbd28");
check(statusById.get("P43.4")?.status === "complete", "osPhaseStatus", "P43.4 must be complete");
check(["planned", "complete"].includes(statusById.get("P43.5")?.status), "osPhaseStatus", "P43.5 must exist");

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
  "scope-boundary/releaseManifest.js",
  "scope-boundary/redactionSummary.js",
  "policy/redacted-release-manifest-policy.json",
  "scripts/generate-redacted-release-manifest.js",
  "scripts/check-redacted-release-manifest.js",
  MANIFEST_PATH,
]) {
  check(!lineTooLong(file), "formatting", `Line over 1000 chars in ${file}`);
}

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Manifest: ${sections.manifest ? "PASS" : "FAIL"}`);
console.log(`Safety: ${sections.safety ? "PASS" : "FAIL"}`);
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
