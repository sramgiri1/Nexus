import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildGitSafetyPolicy,
  buildGitWorkflowPlan,
  summarizeGitWorkflowPlan,
  validateGitSafetyPolicy,
  validateGitWorkflowPlan,
} from "../git-lifecycle/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "git-workflow-model-report.md");
const sections = {
  modules: true,
  exports: true,
  policy: true,
  workflowPlan: true,
  safety: true,
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

console.log("NEXUS Git Workflow Model Check");
console.log("==============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("git-lifecycle/index.js");
const policy = parseJson("policy/git-workflow-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const workflowPlan = buildGitWorkflowPlan({
  changeId: "p44-3-sample-change",
  scope: "NEXUS_OS_CHANGE",
  projectId: "nexus-os",
  repoIds: ["nexus-os"],
  summary: "add governed git workflow model",
});
const safetyPolicy = buildGitSafetyPolicy();
const workflowSummary = summarizeGitWorkflowPlan(workflowPlan);

for (const artifact of [
  "git-lifecycle/gitWorkflowModel.js",
  "git-lifecycle/gitSafetyPolicy.js",
  "git-lifecycle/index.js",
]) {
  check(existsSync(join(ROOT, artifact)), "modules", `Missing module: ${artifact}`);
}
for (const exportName of [
  "buildGitWorkflowPlan",
  "validateGitWorkflowPlan",
  "summarizeGitWorkflowPlan",
  "buildGitSafetyPolicy",
  "validateGitSafetyPolicy",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P44.3", "policy", "Policy phase must be P44.3");
check(policy.planOnly === true, "policy", "Policy must be plan-only");
for (const field of [
  "gitBranchCreationAllowed",
  "gitCommitAllowed",
  "gitPrCreationAllowed",
  "gitMergeAllowed",
  "gitPushAllowed",
  "directMainCommitAllowed",
  "projectMutationAllowed",
  "externalNetworkCallsAllowed",
  "dbWritesAllowed",
]) {
  check(policy[field] === false, "policy", `${field} must be false`);
}

const workflowValidation = validateGitWorkflowPlan(workflowPlan);
check(workflowValidation.valid === true, "workflowPlan", `Workflow invalid: ${workflowValidation.errors.join("; ")}`);
check(workflowPlan.allowedGitActions.includes("branch-plan"), "workflowPlan", "branch-plan must be allowed");
check(workflowPlan.allowedGitActions.includes("commit-plan"), "workflowPlan", "commit-plan must be allowed");
check(workflowPlan.forbiddenGitActions.includes("direct-main-commit"), "workflowPlan", "direct-main-commit must be forbidden");
check(workflowPlan.branchCreated === false, "workflowPlan", "Branch must not be created");
check(workflowPlan.commitCreated === false, "workflowPlan", "Commit must not be created");
check(workflowPlan.prCreated === false, "workflowPlan", "PR must not be created");

const safetyValidation = validateGitSafetyPolicy(safetyPolicy);
check(safetyValidation.valid === true, "safety", `Safety policy invalid: ${safetyValidation.errors.join("; ")}`);
check(safetyPolicy.directMainMutationAllowed === false, "safety", "Direct main mutation must be disabled");
check(safetyPolicy.pushAllowed === false, "safety", "Push must be disabled");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P44", "P44.2", "P44.3", "P44.4"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P44.3", "P44.4", "P44.5", "P44.6", "P44.7"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P44.3 or later P44 subphase");
check(["P44.2", "P44.3", "P44.4", "P44.5", "P44.6"].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be a prior P44 subphase");
check(["P44.4", "P44.5", "P44.6", "P44.7", "P45"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be a P44 subphase or P45");
check(statusById.get("P44.2")?.status === "complete", "osPhaseStatus", "P44.2 must be complete");
check(statusById.get("P44.3")?.status === "complete", "osPhaseStatus", "P44.3 must be complete");
check(["planned", "complete"].includes(statusById.get("P44.4")?.status), "osPhaseStatus", "P44.4 must be planned or complete");

const privateDiff = gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.trim().length === 0, "noForbiddenChanges", "Private project files must not be modified");

for (const filePath of [
  "git-lifecycle/gitWorkflowModel.js",
  "git-lifecycle/gitSafetyPolicy.js",
  "scripts/check-git-workflow-model.js",
  "policy/git-workflow-policy.json",
]) {
  read(filePath).split("\n").forEach((line, index) => {
    check(line.length <= 1000, "formatting", `${filePath}:${index + 1} exceeds 1000 chars`);
  });
}

const report = `# NEXUS Git Workflow Model Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.3 - Branch / Commit Workflow Model

## Summary
- Change ID: ${workflowSummary.changeId}
- Scope: ${workflowSummary.scope}
- Repo count: ${workflowSummary.repoCount}
- Proposed branch: ${workflowSummary.proposedBranchName}
- Requires review: ${workflowSummary.requiresReview ? "yes" : "no"}
- Requires evidence: ${workflowSummary.requiresEvidence ? "yes" : "no"}
- Execution allowed: ${workflowSummary.executionAllowed ? "yes" : "no"}

## Allowed Plan Actions
${workflowPlan.allowedGitActions.map((action) => `- ${action}`).join("\n")}

## Forbidden Git Actions
${workflowPlan.forbiddenGitActions.map((action) => `- ${action}`).join("\n")}

## Non-Goals
- No git branch was created.
- No commit was created.
- No pull request was created.
- No merge, push, provider call, DB write, or project mutation occurred.

## Validation
${Object.entries(sections).map(([name, passed]) => `- ${name}: ${passed ? "PASS" : "FAIL"}`).join("\n")}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
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
