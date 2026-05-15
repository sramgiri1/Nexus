import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  getRepoById,
  getRepoRegistry,
  listReposForProject,
  summarizeRepoRegistry,
  validateRepoRegistryModel,
} from "../repo-workspace/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "repo-registry-report.md");

const sections = {
  modules: true,
  exports: true,
  policy: true,
  registry: true,
  boundaries: true,
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

function changedFiles() {
  return gitOutput(["status", "--short"])
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Repo Registry Check");
console.log("=========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("repo-workspace/index.js");
const schemaSource = read("repo-workspace/repoSchema.js");
const registrySource = read("repo-workspace/repoRegistry.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const viewModelSource = read("dashboard/src/data/commandCenterViewModel.js");
const policy = parseJson("policy/repo-registry-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");

for (const artifact of [
  "repo-workspace/repoSchema.js",
  "repo-workspace/repoRegistry.js",
  "repo-workspace/index.js",
]) {
  check(existsSync(join(ROOT, artifact)), "modules", `Missing module: ${artifact}`);
}

for (const exportName of [
  "getRepoRegistry",
  "getRepoById",
  "listReposForProject",
  "summarizeRepoRegistry",
  "validateRepoRegistryModel",
  "validateRepoEntry",
  "validateRepoRegistry",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

for (const expected of ["REPO_TYPES", "REPO_VISIBILITIES", "REPO_STATUSES", "PACKAGE_BOUNDARIES"]) {
  check(schemaSource.includes(expected), "modules", `Schema missing ${expected}`);
}

check(policy.phase === "P44.1", "policy", "Policy phase must be P44.1");
check(policy.readOnly === true, "policy", "Policy must be read-only");
check(policy.gitBranchCreationAllowed === false, "policy", "Git branch creation must be disabled");
check(policy.gitCommitAllowed === false, "policy", "Git commit actions must be disabled by policy");
check(policy.gitPrCreationAllowed === false, "policy", "PR creation must be disabled by policy");
check(policy.projectMutationAllowed === false, "policy", "Project mutation must be disabled by policy");
check(policy.externalNetworkCallsAllowed === false, "policy", "External network calls must be disabled by policy");
check(policy.dbWritesAllowed === false, "policy", "DB writes must be disabled by policy");
check(policy.privateSourceDetailedScanningAllowed === false, "policy", "Private source detailed scanning must be disabled");

const registry = getRepoRegistry();
const validation = validateRepoRegistryModel(registry);
const summary = summarizeRepoRegistry(registry);
check(validation.valid === true, "registry", `Registry invalid: ${validation.errors.join("; ")}`);
check(summary.repoCount >= 3, "registry", "Registry must include baseline repos");
check(summary.gitActionsEnabled === false, "registry", "Registry must not enable git actions");
check(summary.branchCreationAllowed === false, "registry", "Registry must not enable branch creation");
check(summary.commitAllowed === false, "registry", "Registry must not enable commits");
check(summary.prCreationAllowed === false, "registry", "Registry must not enable PR creation");
check(Boolean(getRepoById("nexus-os")), "registry", "nexus-os repo missing");
check(Boolean(getRepoById("private-project-backend")), "registry", "private-project-backend repo missing");
check(Boolean(getRepoById("private-project-ios")), "registry", "private-project-ios repo missing");
check(listReposForProject("private-project-01").length >= 2, "registry", "Private project repo refs missing");

const nexusOs = getRepoById("nexus-os");
check(nexusOs?.forbiddenPaths?.includes("projects/careloop/"), "boundaries", "NEXUS OS repo must forbid private project source mutation");
check(nexusOs?.packageBoundary === "os", "boundaries", "NEXUS OS repo must use OS package boundary");
for (const repoId of ["private-project-backend", "private-project-ios"]) {
  const repo = getRepoById(repoId);
  check(repo?.writesAllowed === false, "boundaries", `${repoId} writes must be disabled`);
  check(repo?.privateSourceDetailedScanningAllowed === false, "boundaries", `${repoId} detailed source scanning must be disabled`);
  check(repo?.packageBoundary === "project", "boundaries", `${repoId} must use project package boundary`);
}

check(
  commandCenterSource.includes("Multi-Repo Workspace") || viewModelSource.includes("multiRepoWorkspace"),
  "commandCenter",
  "Command Center must expose multi-repo workspace summary",
);
check(
  commandCenterSource.includes("No git branch, commit, PR, merge, or push actions are enabled")
    || viewModelSource.includes("gitActionsEnabled"),
  "commandCenter",
  "Command Center must explain read-only git lifecycle posture",
);

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P44", "P44.1", "P44.2", "P44.7", "P45"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P44", "P44.1", "P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P44 or active P44 subphase");
check(["P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7", "P45"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be a P44 subphase or P45");
check(["in_progress", "complete"].includes(statusById.get("P44")?.status), "osPhaseStatus", "P44 must be active");
check(statusById.get("P44.1")?.status === "complete", "osPhaseStatus", "P44.1 must be complete");
check(statusById.get("P44.1")?.branch === "arch/multi-repo-git-pr-lifecycle", "osPhaseStatus", "P44.1 branch mismatch");
check(Boolean(statusById.get("P44.1")?.summary), "osPhaseStatus", "P44.1 summary missing");
check(["planned", "complete"].includes(statusById.get("P44.2")?.status), "osPhaseStatus", "P44.2 must be planned or complete");

const privateDiff = gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.trim().length === 0, "noForbiddenChanges", "Private project files must not be modified");
for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private backend change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS change: ${file}`);
}

for (const [filePath, source] of [
  ["repo-workspace/repoSchema.js", schemaSource],
  ["repo-workspace/repoRegistry.js", registrySource],
  ["scripts/check-repo-registry.js", read("scripts/check-repo-registry.js")],
  ["policy/repo-registry-policy.json", read("policy/repo-registry-policy.json")],
]) {
  source.split("\n").forEach((line, index) => {
    check(line.length <= 1000, "formatting", `${filePath}:${index + 1} exceeds 1000 chars`);
  });
}

const report = `# NEXUS Repo Registry Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.1 - Multi-Repo Registry Model

## Summary
- Registry version: ${summary.registryVersion}
- Repositories tracked: ${summary.repoCount}
- Active repositories: ${summary.activeRepos}
- Project repositories: ${summary.projectRepos}
- OS repositories: ${summary.osRepos}
- Git actions enabled: ${summary.gitActionsEnabled ? "yes" : "no"}

## Registry Entries
| Repo | Project | Type | Visibility | Status | Boundary |
| --- | --- | --- | --- | --- | --- |
${registry.repos.map((repo) => `| ${repo.label} | ${repo.projectId} | ${repo.repoType} | ${repo.visibility} | ${repo.status} | ${repo.packageBoundary} |`).join("\n")}

## Safety Posture
- Branch creation: disabled
- Commits: disabled
- PR creation: disabled
- Merge/push/deploy/package actions: disabled
- Private project source detailed scanning: disabled
- Project mutation: disabled

## Validation
${Object.entries(sections).map(([name, passed]) => `- ${name}: ${passed ? "PASS" : "FAIL"}`).join("\n")}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(REPORT_PATH, report);
check(existsSync(REPORT_PATH), "reportWritten", "Report was not written");

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Repo registry: ${sections.registry ? "PASS" : "FAIL"}`);
console.log(`Boundaries: ${sections.boundaries ? "PASS" : "FAIL"}`);
console.log(`Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${failures.length ? "FAIL" : "PASS"}`);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
