import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildPrDraft,
  buildRollbackBranchPlan,
  evaluateMergeGate,
  summarizeMergeGate,
  validateMergeGate,
  validateRollbackBranchPlan,
} from "../git-lifecycle/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "merge-gate-report.md");
const sections = {
  modules: true,
  exports: true,
  policy: true,
  mergeGate: true,
  rollbackPlan: true,
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

console.log("NEXUS Merge Gate Model Check");
console.log("============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("git-lifecycle/index.js");
const policy = parseJson("policy/merge-gate-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const prDraft = buildPrDraft({
  prDraftId: "pr-draft-p44-6",
  evidenceIds: ["evidence-p44-6"],
});
const rollbackPlan = buildRollbackBranchPlan({ changeId: "p44-6-merge-gate" });
const gate = evaluateMergeGate({
  prDraft,
  rollbackPlan,
  testsRun: false,
  reviewComplete: false,
  approvalsPresent: false,
});
const summary = summarizeMergeGate(gate);

for (const artifact of [
  "git-lifecycle/mergeGate.js",
  "git-lifecycle/rollbackBranchPlan.js",
  "git-lifecycle/index.js",
]) {
  check(existsSync(join(ROOT, artifact)), "modules", `Missing module: ${artifact}`);
}
for (const exportName of [
  "evaluateMergeGate",
  "validateMergeGate",
  "summarizeMergeGate",
  "buildRollbackBranchPlan",
  "validateRollbackBranchPlan",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P44.6", "policy", "Policy phase must be P44.6");
check(policy.metadataOnly === true, "policy", "Policy must be metadata-only");
for (const field of [
  "mergeAllowed",
  "pushAllowed",
  "releaseAllowed",
  "packageCreationAllowed",
  "rollbackBranchCreationAllowed",
  "gitCommitAllowed",
  "projectMutationAllowed",
  "externalNetworkCallsAllowed",
  "dbWritesAllowed",
]) {
  check(policy[field] === false, "policy", `${field} must be false`);
}

const rollbackValidation = validateRollbackBranchPlan(rollbackPlan);
check(rollbackValidation.valid === true, "rollbackPlan", `Rollback invalid: ${rollbackValidation.errors.join("; ")}`);
check(rollbackPlan.rollbackBranchCreated === false, "rollbackPlan", "Rollback branch must not be created");
check(rollbackPlan.rollbackExecutionAllowed === false, "rollbackPlan", "Rollback execution must be disabled");

const gateValidation = validateMergeGate(gate);
check(gateValidation.valid === true, "mergeGate", `Merge gate invalid: ${gateValidation.errors.join("; ")}`);
check(["not-ready", "ready-for-review", "blocked", "approved-for-merge-metadata-only"].includes(gate.status), "mergeGate", "Invalid gate status");
check(gate.mergeAllowed === false, "mergeGate", "Merge must be disabled");
check(gate.pushAllowed === false, "mergeGate", "Push must be disabled");
check(gate.releaseAllowed === false, "mergeGate", "Release must be disabled");
check(gate.packageCreationAllowed === false, "mergeGate", "Package creation must be disabled");
check(gate.checks.scopeClassificationPresent === true, "mergeGate", "Scope classification must be present");
check(gate.checks.rollbackPlanPresent === true, "mergeGate", "Rollback plan must be present");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P44", "P44.5", "P44.6", "P44.7"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(phaseStatus.currentPhase === "P44.6", "osPhaseStatus", "currentPhase must be P44.6");
check(phaseStatus.previousPhase === "P44.5", "osPhaseStatus", "previousPhase must be P44.5");
check(phaseStatus.nextPhase === "P44.7", "osPhaseStatus", "nextPhase must be P44.7");
check(statusById.get("P44.6")?.status === "complete", "osPhaseStatus", "P44.6 must be complete");
check(statusById.get("P44.7")?.status === "planned", "osPhaseStatus", "P44.7 must be planned");

const privateDiff = gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.trim().length === 0, "noForbiddenChanges", "Private project files must not be modified");

for (const filePath of [
  "git-lifecycle/mergeGate.js",
  "git-lifecycle/rollbackBranchPlan.js",
  "scripts/check-merge-gate-model.js",
  "policy/merge-gate-policy.json",
]) {
  read(filePath).split("\n").forEach((line, index) => {
    check(line.length <= 1000, "formatting", `${filePath}:${index + 1} exceeds 1000 chars`);
  });
}

const report = `# NEXUS Merge Gate Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.6 - Merge Gate + Rollback Branch Model

## Summary
- PR draft ID: ${summary.prDraftId}
- Gate status: ${summary.status}
- Blocker count: ${summary.blockerCount}
- Merge allowed: ${summary.mergeAllowed ? "yes" : "no"}
- Push allowed: ${summary.pushAllowed ? "yes" : "no"}
- Release allowed: ${summary.releaseAllowed ? "yes" : "no"}
- Package creation allowed: ${summary.packageCreationAllowed ? "yes" : "no"}

## Gate Checks
${Object.entries(gate.checks).map(([name, passed]) => `- ${name}: ${passed ? "PASS" : "PENDING"}`).join("\n")}

## Non-Goals
- No merge was performed.
- No push was performed.
- No rollback branch was created.
- No release or package was created.

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
