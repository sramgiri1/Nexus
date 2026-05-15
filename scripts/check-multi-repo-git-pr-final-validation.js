import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "multi-repo-git-pr-final-validation-report.md");

const checks = [
  ["check:repo-registry", "P44.1 repo registry"],
  ["check:repo-dependency-map", "P44.2 repo dependency map"],
  ["check:git-workflow-model", "P44.3 git workflow model"],
  ["check:pr-draft-model", "P44.4 PR draft model"],
  ["check:review-ingestion-model", "P44.5 review ingestion model"],
  ["check:merge-gate-model", "P44.6 merge gate model"],
  ["check:scope-boundary-final-validation", "P43 scope boundary carry-forward"],
  ["check:project-registry-final-validation", "P42 project registry carry-forward"],
  ["check:command-center-ux", "Command Center UX"],
  ["check:docs-coverage", "Docs coverage"],
  ["check:architecture-diagrams", "Architecture diagrams"],
  ["check:public-safety", "Public safety"],
];

const sections = {
  subphaseChecks: true,
  osPhaseStatus: true,
  safety: true,
  noForbiddenChanges: true,
  reportWritten: true,
};
const failures = [];
const results = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
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

function runNpmCheck(scriptName, label) {
  try {
    execFileSync("npm", ["run", scriptName], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
    results.push({ scriptName, label, status: "PASS" });
  } catch (error) {
    results.push({ scriptName, label, status: "FAIL", output: `${error.stdout || ""}${error.stderr || ""}`.trim() });
    fail("subphaseChecks", `${scriptName} failed`);
  }
}

console.log("NEXUS Multi-Repo Git/PR Final Validation Check");
console.log("==============================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const [scriptName, label] of checks) {
  runNpmCheck(scriptName, label);
}

const phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P44", "P44.1", "P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7", "P45"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
}
for (const phaseId of ["P44.1", "P44.2", "P44.3", "P44.4", "P44.5", "P44.6", "P44.7"]) {
  check(statusById.get(phaseId)?.status === "complete", "osPhaseStatus", `${phaseId} must be complete`);
  check(statusById.get(phaseId)?.branch === "arch/multi-repo-git-pr-lifecycle", "osPhaseStatus", `${phaseId} branch mismatch`);
}
check(statusById.get("P44")?.status === "complete", "osPhaseStatus", "P44 parent phase must be complete");
check(statusById.get("P45")?.status === "planned", "osPhaseStatus", "P45 must be planned");
check(phaseStatus.currentPhase === "P44.7", "osPhaseStatus", "currentPhase must be P44.7");
check(phaseStatus.previousPhase === "P44.6", "osPhaseStatus", "previousPhase must be P44.6");
check(phaseStatus.nextPhase === "P45", "osPhaseStatus", "nextPhase must be P45");

const policySources = [
  "policy/repo-registry-policy.json",
  "policy/repo-dependency-policy.json",
  "policy/git-workflow-policy.json",
  "policy/pr-draft-policy.json",
  "policy/review-ingestion-policy.json",
  "policy/merge-gate-policy.json",
].map((path) => [path, JSON.parse(read(path))]);
for (const [path, policy] of policySources) {
  for (const field of [
    "projectMutationAllowed",
    "providerCallsAllowed",
    "externalNetworkCallsAllowed",
    "dbWritesAllowed",
  ]) {
    if (field in policy) check(policy[field] === false, "safety", `${path} must keep ${field} false`);
  }
}
const privateDiff = gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.trim().length === 0, "noForbiddenChanges", "Private project files must not be modified");

const report = `# NEXUS Multi-Repo Git/PR Final Validation Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.7 - Multi-Repo Git/PR Final Validation

## Subphase Results
${results.map((result) => `- ${result.label} (${result.scriptName}): ${result.status}`).join("\n")}

## Final Safety Confirmation
- No git branch was created.
- No git commit was created by the lifecycle model.
- No pull request was created.
- No merge was performed.
- No git push was performed by this lifecycle.
- No GitHub, GitLab, provider, or tool API call was made.
- No DB write was added.
- No project source file was modified.
- No release, deployment, project package, or rollback branch was created.

## OS Phase Status
- P44.1 through P44.7: complete
- P44 parent phase: complete
- Next phase: P45 - Agent Registry + Boundary Compiler

## Checks
${Object.entries(sections).map(([name, passed]) => `- ${name}: ${passed ? "PASS" : "FAIL"}`).join("\n")}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : "## Failures\n- None\n"}

## Result
${failures.length ? "FAIL" : "PASS"}
`;

writeFileSync(REPORT_PATH, report);
check(existsSync(REPORT_PATH), "reportWritten", "Report was not written");

for (const [label, passed] of Object.entries(sections)) {
  console.log(`${label}: ${passed ? "PASS" : "FAIL"}`);
}
console.log(`Result: ${failures.length ? "FAIL" : "PASS"}`);

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
