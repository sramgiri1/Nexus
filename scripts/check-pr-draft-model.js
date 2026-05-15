import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildPrDraft,
  buildPrEvidenceLinks,
  summarizePrDraft,
  validatePrDraft,
  validatePrEvidenceLinks,
} from "../git-lifecycle/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "pr-draft-model-report.md");
const sections = {
  modules: true,
  exports: true,
  policy: true,
  prDraft: true,
  evidenceLinks: true,
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

console.log("NEXUS PR Draft Model Check");
console.log("==========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const indexSource = read("git-lifecycle/index.js");
const policy = parseJson("policy/pr-draft-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndex = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const evidenceLinks = buildPrEvidenceLinks({
  evidenceIds: ["evidence-local-p44-4"],
  auditIds: ["audit-local-p44-4"],
  activityCorrelationIds: ["corr-local-p44-4"],
});
const prDraft = buildPrDraft({
  prDraftId: "pr-draft-p44-4",
  title: "Draft: add PR metadata model",
  summary: "Validate local PR draft metadata and evidence links.",
  evidenceIds: evidenceLinks.evidenceIds,
  auditIds: evidenceLinks.auditIds,
  activityCorrelationIds: evidenceLinks.activityCorrelationIds,
});
const prSummary = summarizePrDraft(prDraft);

for (const artifact of [
  "git-lifecycle/prDraftModel.js",
  "git-lifecycle/prEvidenceLinks.js",
  "git-lifecycle/index.js",
]) {
  check(existsSync(join(ROOT, artifact)), "modules", `Missing module: ${artifact}`);
}
for (const exportName of [
  "buildPrDraft",
  "validatePrDraft",
  "summarizePrDraft",
  "buildPrEvidenceLinks",
  "validatePrEvidenceLinks",
]) {
  check(indexSource.includes(exportName), "exports", `Missing export: ${exportName}`);
}

check(policy.phase === "P44.4", "policy", "Policy phase must be P44.4");
check(policy.metadataOnly === true, "policy", "Policy must be metadata-only");
for (const field of [
  "githubApiCallsAllowed",
  "gitlabApiCallsAllowed",
  "externalNetworkCallsAllowed",
  "prCreationAllowed",
  "gitBranchCreationAllowed",
  "gitCommitAllowed",
  "gitMergeAllowed",
  "gitPushAllowed",
  "projectMutationAllowed",
  "providerCallsAllowed",
  "dbWritesAllowed",
]) {
  check(policy[field] === false, "policy", `${field} must be false`);
}

const evidenceValidation = validatePrEvidenceLinks(evidenceLinks);
check(evidenceValidation.valid === true, "evidenceLinks", `Evidence links invalid: ${evidenceValidation.errors.join("; ")}`);
check(evidenceLinks.externalNetworkCallsAllowed === false, "evidenceLinks", "Evidence links must not allow external calls");

const prValidation = validatePrDraft(prDraft);
check(prValidation.valid === true, "prDraft", `PR draft invalid: ${prValidation.errors.join("; ")}`);
check(prDraft.status === "draft-metadata-only", "prDraft", "PR draft status mismatch");
check(prDraft.humanReviewRequired === true, "prDraft", "Human review must be required");
check(prDraft.githubApiCalled === false, "prDraft", "GitHub API must not be called");
check(prDraft.gitlabApiCalled === false, "prDraft", "GitLab API must not be called");
check(prDraft.prCreated === false, "prDraft", "PR must not be created");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P44", "P44.3", "P44.4", "P44.5"]) {
  check(statusById.has(phaseId), "osPhaseStatus", `phase-status missing ${phaseId}`);
  check(indexById.has(phaseId), "osPhaseStatus", `nexus-phases missing ${phaseId}`);
}
check(["P44.4", "P44.5", "P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6", "P46"].includes(phaseStatus.currentPhase), "osPhaseStatus", "currentPhase must be P44.4 or later handoff phase");
check(["P44.3", "P44.4", "P44.5", "P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6"].includes(phaseStatus.previousPhase), "osPhaseStatus", "previousPhase must be a prior P44 or later handoff phase");
check(["P44.5", "P44.6", "P44.7", "P45", "P45.1", "P45.2", "P45.3", "P45.4", "P45.5", "P45.6", "P46"].includes(phaseStatus.nextPhase), "osPhaseStatus", "nextPhase must be a P44 or later handoff phase");
check(statusById.get("P44.3")?.status === "complete", "osPhaseStatus", "P44.3 must be complete");
check(statusById.get("P44.4")?.status === "complete", "osPhaseStatus", "P44.4 must be complete");
check(["planned", "complete"].includes(statusById.get("P44.5")?.status), "osPhaseStatus", "P44.5 must be planned or complete");

const privateDiff = gitOutput(["diff", "--", "projects/careloop", "projects/careloop-ios"]);
check(privateDiff.trim().length === 0, "noForbiddenChanges", "Private project files must not be modified");

for (const filePath of [
  "git-lifecycle/prDraftModel.js",
  "git-lifecycle/prEvidenceLinks.js",
  "scripts/check-pr-draft-model.js",
  "policy/pr-draft-policy.json",
]) {
  read(filePath).split("\n").forEach((line, index) => {
    check(line.length <= 1000, "formatting", `${filePath}:${index + 1} exceeds 1000 chars`);
  });
}

const report = `# NEXUS PR Draft Model Report

## Metadata
- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope
P44.4 - PR Draft + Evidence Link Model

## Summary
- PR draft ID: ${prSummary.prDraftId}
- Status: ${prSummary.status}
- Repositories linked: ${prSummary.repoCount}
- Evidence links: ${prSummary.evidenceCount}
- Audit links: ${prSummary.auditCount}
- Correlation links: ${prSummary.correlationCount}
- PR created: ${prSummary.prCreated ? "yes" : "no"}
- External calls allowed: ${prSummary.externalCallsAllowed ? "yes" : "no"}

## Non-Goals
- No GitHub or GitLab API call was made.
- No pull request was created.
- No git branch, commit, merge, or push action was executed.

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
