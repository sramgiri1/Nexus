import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildRepoDependencyMap,
  buildRepoOwnershipMap,
  getRepoRegistry,
  summarizeRepoBlastRadius,
  validateRepoDependencyMap,
  validateRepoOwnershipMap,
} from "../repo-workspace/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "repo-dependency-map-report.md");

const sections = {
  modules: true,
  exports: true,
  policy: true,
  ownership: true,
  dependencyMap: true,
  blastRadius: true,
  commandCenter: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formatting: true,
  reportWritten: true,
};
const failures = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
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

console.log("NEXUS Repo Dependency Map Check");
console.log("===============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("repo-workspace/index.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");
const policy = parseJson("policy/repo-dependency-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const registry = getRepoRegistry();
const ownershipMap = buildRepoOwnershipMap(registry);
const dependencyMap = buildRepoDependencyMap(registry);
const blastRadius = summarizeRepoBlastRadius({ repoIds: ["nexus-os", "private-project-backend"] }, registry);

for (const artifact of [
  "repo-workspace/repoOwnership.js",
  "repo-workspace/repoDependencyMap.js",
  "repo-workspace/index.js",
]) {
  check(existsSync(join(ROOT, artifact)), "modules", `Missing module: ${artifact}`);
}

for (const exportName of [
  "buildRepoOwnershipMap",
  "validateRepoOwnershipMap",
  "buildRepoDependencyMap",
  "validateRepoDependencyMap",
  "summarizeRepoBlastRadius",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P44.2", "policy", "Policy phase must be P44.2");
check(policy.readOnly === true, "policy", "Policy must be read-only");
check(policy.runtimeBehaviorChangesAllowed === false, "policy", "Runtime behavior changes must be disabled");
check(policy.gitBranchCreationAllowed === false, "policy", "Git branch creation must be disabled");
check(policy.gitCommitAllowed === false, "policy", "Git commit must be disabled");
check(policy.gitPrCreationAllowed === false, "policy", "PR creation must be disabled");
check(policy.externalNetworkCallsAllowed === false, "policy", "External network calls must be disabled");
check(policy.privateSourceDetailedScanningAllowed === false, "policy", "Private source detailed scanning must be disabled");

const ownershipValidation = validateRepoOwnershipMap(ownershipMap);
check(ownershipValidation.valid === true, "ownership", `Ownership invalid: ${ownershipValidation.errors.join("; ")}`);
check(ownershipMap.owners.length >= 3, "ownership", "Expected baseline repo owners");
check(ownershipMap.owners.some((owner) => owner.repoId === "nexus-os" && owner.ownerAgent === "NEXUS"), "ownership", "NEXUS OS owner missing");
check(ownershipMap.owners.some((owner) => owner.repoId === "private-project-ios" && owner.ownerAgent === "SWIFT"), "ownership", "iOS owner missing");

const dependencyValidation = validateRepoDependencyMap(dependencyMap);
check(dependencyValidation.valid === true, "dependencyMap", `Dependency map invalid: ${dependencyValidation.errors.join("; ")}`);
check(dependencyMap.relationships.some((rel) => rel.relationshipType === "consumes-api"), "dependencyMap", "consumes-api relationship missing");
check(dependencyMap.relationships.some((rel) => rel.relationshipType === "documentation-reference"), "dependencyMap", "documentation-reference relationship missing");
check(dependencyMap.privateSourceDetailedScanningAllowed === false, "dependencyMap", "Private source scanning must be disabled");

check(blastRadius.gitActionsAllowed === false, "blastRadius", "Blast radius summary must keep git actions disabled");
check(blastRadius.requiresCrossRepoReview === true, "blastRadius", "Cross-repo review should be required for sampled scope");
check(blastRadius.packageBoundaryReviewRequired === true, "blastRadius", "OS/project sample should require package boundary review");

check(commandCenterSource.includes("Dependency links"), "commandCenter", "Command Center must show dependency links");
check(viewModelSource.includes("buildRepoDependencyMap"), "commandCenter", "View model must include dependency map");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P44", "P44.1", "P44.2", "P44.3"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P44.2 or later P44 subphase");
check(["P44.1", "P44.2", "P44.3", "P44.4", "P44.5", "P44.6"].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be a prior P44 subphase");
check(["P44.3", "P44.4", "P44.5", "P44.6", "P44.7", "P45"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be a P44 subphase or P45");
check(statusById.get("P44.1")?.status === "complete", "osPhaseStatus", "P44.1 must be complete");
check(statusById.get("P44.2")?.status === "complete", "osPhaseStatus", "P44.2 must be complete");
check(statusById.get("P44.2")?.branch === "arch/multi-repo-git-pr-lifecycle", "osPhaseStatus", "P44.2 branch mismatch");
check(["planned", "complete"].includes(statusById.get("P44.3")?.status), "osPhaseStatus", "P44.3 must be planned or complete");

const privateDiff = gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.trim().length === 0, "noForbiddenChanges", "Private project files must not be modified");

for (const filePath of [
  "repo-workspace/repoOwnership.js",
  "repo-workspace/repoDependencyMap.js",
  "scripts/check-repo-dependency-map.js",
  "policy/repo-dependency-policy.json",
]) {
  read(filePath).split("\n").forEach((line, index) => {
    check(line.length <= 1000, "formatting", `${filePath}:${index + 1} exceeds 1000 chars`);
  });
}

const report = `# NEXUS Repo Dependency Map Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.2 - Repo Ownership + Dependency Map

## Summary
- Owners mapped: ${ownershipMap.owners.length}
- Relationships mapped: ${dependencyMap.relationships.length}
- Cross-repo review required for sample: ${blastRadius.requiresCrossRepoReview ? "yes" : "no"}
- Git actions allowed: ${blastRadius.gitActionsAllowed ? "yes" : "no"}

## Ownership Map
| Repo | Owner Team | Owner Agent | Boundary |
| --- | --- | --- | --- |
${ownershipMap.owners.map((owner) => `| ${owner.repoId} | ${owner.ownerTeam} | ${owner.ownerAgent} | ${owner.packageBoundary} |`).join("\n")}

## Dependency Map
| From | To | Relationship | Review |
| --- | --- | --- | --- |
${dependencyMap.relationships.map((rel) => `| ${rel.fromRepoId} | ${rel.toRepoId} | ${rel.relationshipType} | ${rel.requiresReview ? "required" : "not required"} |`).join("\n")}

## Non-Goals
- No runtime behavior changed.
- No git branch, commit, PR, merge, or push action executed.
- No project source was mutated or deeply scanned.

## Validation
${Object.entries(sections).map(([name, passed]) => `- ${name}: ${passed ? "PASS" : "FAIL"}`).join("\n")}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(REPORT_PATH, report);
check(existsSync(REPORT_PATH), "reportWritten", "Report was not written");

for (const [label, passed] of [
  ["Modules", sections.modules],
  ["Exports", sections.exports],
  ["Policy", sections.policy],
  ["Ownership", sections.ownership],
  ["Dependency map", sections.dependencyMap],
  ["Blast radius", sections.blastRadius],
  ["Command Center", sections.commandCenter],
  ["OS phase status", sections.osPhaseStatus],
  ["No forbidden changes", sections.noForbiddenChanges],
  ["Formatting/readability", sections.formatting],
  ["Report written", sections.reportWritten],
]) {
  console.log(`${label}: ${passed ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${failures.length ? "FAIL" : "PASS"}`);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
