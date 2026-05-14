import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildSharedHelperRefactorCandidatePlan,
  getFirstSafeRefactorCandidates,
  getSharedHelperCatalog,
  validateSharedHelperCatalog,
  validateSharedHelperRefactorCandidatePlan,
} from "../codebase/index.js";

const ROOT = process.cwd();
const PLAN_REPORT_PATH = join(ROOT, "reports", "refactor-candidate-plan.json");
const CHECK_REPORT_PATH = join(ROOT, "reports", "shared-helper-catalog-report.md");

const sections = {
  modules: true,
  exports: true,
  sharedHelperCatalog: true,
  refactorCandidatePlan: true,
  docs: true,
  policy: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};

const failures = [];

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

function parseJson(relativePath, section) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(section, `Could not parse ${relativePath}: ${error.message}`);
    return null;
  }
}

function lineWarnings(relativePath) {
  return read(relativePath)
    .split("\n")
    .map((line, index) => ({ lineNumber: index + 1, length: line.length }))
    .filter((entry) => entry.length > 1000);
}

function renderReport({ branch, head, catalog, plan }) {
  const summary = plan.summary;
  const firstCandidates = getFirstSafeRefactorCandidates(plan)
    .map((candidate) => `- ${candidate.title} (${candidate.recommendedModule})`)
    .join("\n");
  const highRisk = plan.candidates
    .filter((candidate) => candidate.riskLevel === "high")
    .map((candidate) => `- ${candidate.title}`)
    .join("\n");

  return `# NEXUS Shared Helper Catalog Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Catalog Summary

- Helpers cataloged: ${catalog.helpers.length}
- Existing helpers: ${catalog.helpers.filter((helper) => helper.status === "existing").length}
- Planned helpers: ${catalog.helpers.filter((helper) => helper.status === "planned").length}
- Future helpers: ${catalog.helpers.filter((helper) => helper.status === "future").length}
- High-risk helpers: ${catalog.helpers.filter((helper) => helper.riskLevel === "high").length}

## Refactor Candidate Plan

- Total candidates: ${summary.totalCandidates}
- Low risk: ${summary.lowRisk}
- Medium risk: ${summary.mediumRisk}
- High risk: ${summary.highRisk}
- First candidates: ${summary.firstCandidates}
- Do not refactor yet: ${summary.doNotRefactorYet}

## First Safe Candidates

${firstCandidates || "- None"}

## High-Risk Deferred

${highRisk || "- None"}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Shared helper catalog: ${sections.sharedHelperCatalog ? "PASS" : "FAIL"}
- Refactor candidate plan: ${sections.refactorCandidatePlan ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${Object.values(sections).every(Boolean) ? "PASS" : "FAIL"}
`;
}

console.log("NEXUS Shared Helper Catalog Check\n=================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of [
  "codebase/sharedHelperCatalog.js",
  "codebase/refactorCandidatePlan.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing module: ${file}`);
}

const moduleExports = await import("../codebase/index.js");
for (const exportName of [
  "getSharedHelperCatalog",
  "getSharedHelperById",
  "listSharedHelperCategories",
  "validateSharedHelperCatalog",
  "summarizeSharedHelperCatalog",
  "buildSharedHelperRefactorCandidatePlan",
  "validateSharedHelperRefactorCandidatePlan",
  "getRefactorCandidatesByRisk",
  "getFirstSafeRefactorCandidates",
  "summarizeRefactorCandidatePlan",
  "writeRefactorCandidatePlanReport",
]) {
  check(typeof moduleExports[exportName] === "function", "exports", `Missing export: ${exportName}`);
}

const catalog = getSharedHelperCatalog();
const catalogValidation = validateSharedHelperCatalog(catalog);
check(catalogValidation.valid, "sharedHelperCatalog", `Catalog invalid: ${catalogValidation.errors.join("; ")}`);
check(catalog.helpers.length >= 12, "sharedHelperCatalog", "Catalog must include at least 12 helper entries");
for (const helperId of [
  "policy-loader",
  "mode-guard",
  "report-writer",
  "check-result-formatter",
  "redaction-helper",
  "runtime-snapshot-guard",
  "local-api-response-envelope",
  "action-response-envelope",
  "command-center-route-matrix",
  "capability-readiness-model",
  "os-phase-status-helper",
  "activity-logger",
]) {
  check(
    catalog.helpers.some((helper) => helper.helperId === helperId),
    "sharedHelperCatalog",
    `Catalog missing helper: ${helperId}`,
  );
}

const plan = buildSharedHelperRefactorCandidatePlan();
const planValidation = validateSharedHelperRefactorCandidatePlan(plan);
check(planValidation.valid, "refactorCandidatePlan", `Plan invalid: ${planValidation.errors.join("; ")}`);
check(plan.broadRefactorsAllowed === false, "refactorCandidatePlan", "Plan must block broad refactors");
check(plan.runtimeBehaviorChangesAllowed === false, "refactorCandidatePlan", "Plan must block runtime behavior changes");
check(plan.summary.lowRisk > 0, "refactorCandidatePlan", "Plan must include low-risk candidates");
check(plan.summary.mediumRisk > 0, "refactorCandidatePlan", "Plan must include medium-risk candidates");
check(plan.summary.highRisk > 0, "refactorCandidatePlan", "Plan must include high-risk candidates");
check(
  plan.candidates.filter((candidate) => candidate.riskLevel === "high").every((candidate) => candidate.doNotRefactorYet === true),
  "refactorCandidatePlan",
  "High-risk candidates must be marked doNotRefactorYet",
);

writeFileSync(PLAN_REPORT_PATH, JSON.stringify(plan, null, 2), "utf8");
const writtenPlan = parseJson("reports/refactor-candidate-plan.json", "refactorCandidatePlan");
check(writtenPlan?.phase === "P41.7.3", "refactorCandidatePlan", "refactor-candidate-plan.json must record P41.7.3");

for (const file of [
  "docs/codebase/SHARED_HELPER_CATALOG.md",
  "docs/codebase/REFACTOR_CANDIDATE_PLAN.md",
  "docs/codebase/SHARED_HELPER_ADOPTION_GUIDE.md",
]) {
  check(existsSync(join(ROOT, file)), "docs", `Missing doc: ${file}`);
}

const reuseGuide = read("docs/codebase/REUSE_AND_REFACTOR_GUIDE.md");
const moduleRegistry = read("docs/codebase/MODULE_REGISTRY.md");
const phaseIndex = read("docs/codebase/PHASE_MODULE_INDEX.md");
for (const expected of [
  "SHARED_HELPER_CATALOG.md",
  "REFACTOR_CANDIDATE_PLAN.md",
  "SHARED_HELPER_ADOPTION_GUIDE.md",
  "P41.7.3 — Shared Helper Catalog + Refactor Candidate Plan",
]) {
  check(
    reuseGuide.includes(expected) || moduleRegistry.includes(expected) || phaseIndex.includes(expected),
    "docs",
    `Docs missing expected shared-helper reference: ${expected}`,
  );
}

const policy = parseJson("policy/shared-helper-catalog-policy.json", "policy");
check(policy?.phase === "P41.7.3", "policy", "Policy phase must be P41.7.3");
check(policy?.broadRefactorsAllowed === false, "policy", "Policy must block broad refactors");
check(policy?.projectMutationAllowed === false, "policy", "Policy must block project mutation");
check(policy?.highRiskRefactorsBlocked === true, "policy", "Policy must block high-risk refactors");

const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const phaseIndexJson = parseJson("os-roadmap/nexus-phases.json", "osPhaseStatus");
const statusById = new Map((phaseStatus?.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndexJson?.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P41.7.1")?.status === "complete", "osPhaseStatus", "P41.7.1 must be complete");
check(statusById.get("P41.7.2")?.status === "complete", "osPhaseStatus", "P41.7.2 must be complete");
check(statusById.get("P41.7.2")?.branch === "docs/reuse-audit-duplicate-pattern-inventory", "osPhaseStatus", "P41.7.2 branch must match");
check(statusById.get("P41.7.2")?.commit === "113db67", "osPhaseStatus", "P41.7.2 commit must be 113db67");
check(statusById.get("P41.7.3")?.status === "complete", "osPhaseStatus", "P41.7.3 must be complete");
check(statusById.get("P41.7.3")?.branch === "docs/shared-helper-catalog-refactor-plan", "osPhaseStatus", "P41.7.3 branch must match");
check(statusById.get("P41.7.4")?.status === "planned", "osPhaseStatus", "P41.7.4 must be planned");
check(indexById.get("P41.7.4")?.title === "OS Usage Documentation Foundation", "osPhaseStatus", "P41.7.4 title must match next phase");

const changedFiles = gitOutput(["diff", "--name-only"]).split("\n").filter(Boolean);
for (const forbiddenPrefix of [
  "projects/careloop/",
  "projects/careloop-ios/",
  "local-api/",
  "db/",
  "agents/",
  "orchestrator/",
  "providers/",
  "tools/",
  "state-machine/",
  "command-execution/",
]) {
  check(!changedFiles.some((file) => file.startsWith(forbiddenPrefix)), "noForbiddenChanges", `Forbidden changed path: ${forbiddenPrefix}`);
}

for (const file of [
  "codebase/sharedHelperCatalog.js",
  "codebase/refactorCandidatePlan.js",
  "scripts/check-shared-helper-catalog.js",
  "docs/codebase/SHARED_HELPER_CATALOG.md",
  "docs/codebase/REFACTOR_CANDIDATE_PLAN.md",
  "docs/codebase/SHARED_HELPER_ADOPTION_GUIDE.md",
  "policy/shared-helper-catalog-policy.json",
]) {
  const warnings = lineWarnings(file);
  check(warnings.length === 0, "formattingReadability", `${file} contains lines over 1000 characters`);
}

writeFileSync(CHECK_REPORT_PATH, renderReport({ branch, head, catalog, plan }), "utf8");
check(read("reports/shared-helper-catalog-report.md").includes("Validation HEAD"), "formattingReadability", "Report must include Validation HEAD wording");

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Shared helper catalog: ${sections.sharedHelperCatalog ? "PASS" : "FAIL"}`);
console.log(`Refactor candidate plan: ${sections.refactorCandidatePlan ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (failures.length > 0) {
  console.log("\nFailures:");
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
}

if (result !== "PASS") {
  process.exitCode = 1;
}
