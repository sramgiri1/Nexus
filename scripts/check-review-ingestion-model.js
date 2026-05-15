import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildReviewComment,
  buildReviewIngestionPlan,
  triageReviewComment,
  validateReviewComment,
  validateReviewIngestionPlan,
} from "../git-lifecycle/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "review-ingestion-report.md");
const sections = {
  modules: true,
  exports: true,
  policy: true,
  commentModel: true,
  ingestionPlan: true,
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

console.log("NEXUS Review Ingestion Model Check");
console.log("===================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("git-lifecycle/index.js");
const policy = parseJson("policy/review-ingestion-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const comment = buildReviewComment({ classification: "security", assignedAgent: "WARDEN" });
const plan = buildReviewIngestionPlan({ comments: [comment] });
const triage = triageReviewComment(comment);

for (const artifact of [
  "git-lifecycle/reviewCommentModel.js",
  "git-lifecycle/reviewIngestionPlan.js",
  "git-lifecycle/index.js",
]) {
  check(existsSync(join(ROOT, artifact)), "modules", `Missing module: ${artifact}`);
}
for (const exportName of [
  "buildReviewComment",
  "validateReviewComment",
  "summarizeReviewComments",
  "buildReviewIngestionPlan",
  "validateReviewIngestionPlan",
  "triageReviewComment",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P44.5", "policy", "Policy phase must be P44.5");
check(policy.metadataOnly === true, "policy", "Policy must be metadata-only");
for (const field of [
  "githubApiCallsAllowed",
  "gitlabApiCallsAllowed",
  "externalNetworkCallsAllowed",
  "taskCreationAllowed",
  "projectMutationAllowed",
  "providerCallsAllowed",
  "dbWritesAllowed",
]) {
  check(policy[field] === false, "policy", `${field} must be false`);
}

const commentValidation = validateReviewComment(comment);
check(commentValidation.valid === true, "commentModel", `Comment invalid: ${commentValidation.errors.join("; ")}`);
check(comment.externalSourceFetched === false, "commentModel", "Comment must not fetch external source");
check(comment.taskCreated === false, "commentModel", "Comment must not create task");
check(triage.taskCreationAllowed === false, "commentModel", "Triage must not allow task creation");

const planValidation = validateReviewIngestionPlan(plan);
check(planValidation.valid === true, "ingestionPlan", `Plan invalid: ${planValidation.errors.join("; ")}`);
check(plan.githubApiCallsAllowed === false, "ingestionPlan", "GitHub calls must be disabled");
check(plan.gitlabApiCallsAllowed === false, "ingestionPlan", "GitLab calls must be disabled");
check(plan.externalNetworkCallsAllowed === false, "ingestionPlan", "External network calls must be disabled");
check(plan.taskCreationAllowed === false, "ingestionPlan", "Task creation must be disabled");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P44", "P44.4", "P44.5", "P44.6"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P44.5", "P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6", "P46"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P44.5 or later handoff phase");
check(["P44.4", "P44.5", "P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6"].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be a prior P44 or later handoff phase");
check(["P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6", "P46"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be a P44 or later handoff phase");
check(statusById.get("P44.5")?.status === "complete", "osPhaseStatus", "P44.5 must be complete");
check(["planned", "complete"].includes(statusById.get("P44.6")?.status), "osPhaseStatus", "P44.6 must be planned or complete");

const privateDiff = gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.trim().length === 0, "noForbiddenChanges", "Private project files must not be modified");

for (const filePath of [
  "git-lifecycle/reviewCommentModel.js",
  "git-lifecycle/reviewIngestionPlan.js",
  "scripts/check-review-ingestion-model.js",
  "policy/review-ingestion-policy.json",
]) {
  read(filePath).split("\n").forEach((line, index) => {
    check(line.length <= 1000, "formatting", `${filePath}:${index + 1} exceeds 1000 chars`);
  });
}

const report = `# NEXUS Review Ingestion Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.5 - Review Comment Ingestion Model

## Summary
- Comments modeled: ${plan.comments.length}
- Sources: ${plan.sourceSystems.join(", ")}
- External source fetched: ${plan.summary.externalSourcesFetched ? "yes" : "no"}
- Tasks created: ${plan.summary.tasksCreated ? "yes" : "no"}
- Sample triage agent: ${triage.assignedAgent}

## Non-Goals
- No GitHub or GitLab API call was made.
- No review comment was fetched from an external service.
- No task was created from a comment.

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
