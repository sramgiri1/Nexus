import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildRefactorCandidatePlan,
  buildReuseAudit,
  validateRefactorCandidatePlan,
  validateReuseAudit,
} from "../codebase/index.js";

const ROOT = process.cwd();
const JSON_REPORT_PATH = join(ROOT, "reports", "reuse-audit.json");
const MARKDOWN_REPORT_PATH = join(ROOT, "reports", "reuse-audit-report.md");

const sections = {
  modules: true,
  exports: true,
  policy: true,
  auditOutput: true,
  refactorCandidates: true,
  reports: true,
  docs: true,
  osRoadmapStatus: true,
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

function renderCandidateList(candidates) {
  if (!candidates.length) return "- None";
  return candidates
    .map((candidate) => `- ${candidate.title} (${candidate.recommendedSharedModule})`)
    .join("\n");
}

function renderMarkdownReport({ audit, plan, branch, head }) {
  const rows = audit.patterns
    .map((pattern) => {
      const occurrenceCount = pattern.occurrences.length;
      return `| ${pattern.title} | ${pattern.category} | ${occurrenceCount} | ${pattern.priority} | ${pattern.recommendedSharedModule} | ${pattern.doNow ? "yes" : "no"} | ${pattern.reasonDeferred} |`;
    })
    .join("\n");

  return `# NEXUS Reuse Audit Report

## Metadata

- Generated at: ${audit.generatedAt}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.7.2 - Reuse Audit + Duplicate Pattern Inventory

## Summary

- Areas scanned: ${audit.summary.areasScanned}
- Patterns found: ${audit.summary.patternsFound}
- High-priority candidates: ${audit.summary.highPriorityCandidates}
- Medium-priority candidates: ${audit.summary.mediumPriorityCandidates}
- Low-priority candidates: ${audit.summary.lowPriorityCandidates}
- Safe refactors recommended: ${audit.summary.safeRefactorsRecommended}
- Risky refactors deferred: ${audit.summary.riskyRefactorsDeferred}

## Duplicate Pattern Inventory

| Pattern | Category | Occurrences | Priority | Recommended shared module | Do now? | Notes |
| --- | --- | ---: | --- | --- | --- | --- |
${rows}

## Refactor Candidate Plan

### Safe Near-Term Helper Candidates

${renderCandidateList(plan.safeNearTerm)}

### Medium-Risk Later Candidates

${renderCandidateList(plan.mediumRiskLater)}

### High-Risk Deferred Candidates

${renderCandidateList(plan.highRiskDeferred)}

## Explicit Non-Goals

- no runtime behavior changed
- no action bridge rewrite
- no local API behavior change
- no DB behavior change
- no project source mutation

## Next Phase

P41.7.3 - Shared Helper Catalog + Refactor Candidate Plan
`;
}

console.log("NEXUS Reuse Audit Check\n=======================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of [
  "codebase/reuseAudit.js",
  "codebase/refactorCandidates.js",
  "codebase/index.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing module: ${file}`);
}

const moduleExports = await import("../codebase/index.js");
for (const exportName of [
  "buildReuseAudit",
  "scanDuplicatePatterns",
  "classifyDuplicatePattern",
  "summarizeReuseAudit",
  "validateReuseAudit",
  "buildRefactorCandidatePlan",
  "prioritizeRefactorCandidates",
  "validateRefactorCandidatePlan",
]) {
  check(typeof moduleExports[exportName] === "function", "exports", `Missing export: ${exportName}`);
}

const policy = parseJson("policy/reuse-audit-policy.json", "policy");
check(policy?.phase === "P41.7.2", "policy", "Policy phase must be P41.7.2");
check(policy?.auditOnly === true, "policy", "Policy must mark auditOnly true");
check(policy?.riskyRefactorsAllowed === false, "policy", "Policy must forbid risky refactors");
check(policy?.runtimeBehaviorChangesAllowed === false, "policy", "Policy must forbid runtime behavior changes");
check(policy?.privateSourceDetailedScanningAllowed === false, "policy", "Policy must forbid detailed private source scanning");

const audit = buildReuseAudit();
const plan = buildRefactorCandidatePlan(audit);
const auditValidation = validateReuseAudit(audit);
const planValidation = validateRefactorCandidatePlan(plan);

check(auditValidation.valid, "auditOutput", `Audit validation failed: ${auditValidation.errors.join("; ")}`);
check(planValidation.valid, "refactorCandidates", `Refactor candidate plan failed: ${planValidation.errors.join("; ")}`);

const categories = new Set(audit.patterns.map((pattern) => pattern.patternId));
for (const patternId of [
  "policy-loading-parsing",
  "report-metadata-writing",
  "checker-formatting",
  "redaction-helpers",
  "mode-guards",
  "action-result-envelopes",
]) {
  check(categories.has(patternId), "auditOutput", `Audit missing required duplicate pattern category: ${patternId}`);
}

writeFileSync(JSON_REPORT_PATH, JSON.stringify({ ...audit, refactorCandidatePlan: plan }, null, 2), "utf8");
writeFileSync(MARKDOWN_REPORT_PATH, renderMarkdownReport({ audit, plan, branch, head }), "utf8");

const writtenAudit = parseJson("reports/reuse-audit.json", "reports");
const markdownReport = read("reports/reuse-audit-report.md");
check(writtenAudit?.phase === "P41.7.2", "reports", "reuse-audit.json must record P41.7.2");
check(markdownReport.includes("Validation HEAD"), "reports", "reuse-audit-report.md must include Validation HEAD wording");
check(markdownReport.includes("Duplicate Pattern Inventory"), "reports", "reuse-audit-report.md must include duplicate inventory");

const reuseGuide = read("docs/codebase/REUSE_AND_REFACTOR_GUIDE.md");
const moduleRegistry = read("docs/codebase/MODULE_REGISTRY.md");
const phaseIndex = read("docs/codebase/PHASE_MODULE_INDEX.md");
for (const expected of [
  "P41.7.2 audit summary",
  "codebase/reuseAudit.js",
  "codebase/refactorCandidates.js",
  "scripts/check-reuse-audit.js",
  "P41.7.2 — Reuse Audit + Duplicate Pattern Inventory",
]) {
  check(
    reuseGuide.includes(expected) || moduleRegistry.includes(expected) || phaseIndex.includes(expected),
    "docs",
    `Docs missing expected reuse-audit reference: ${expected}`,
  );
}

const phaseStatus = parseJson("os-roadmap/phase-status.json", "osRoadmapStatus");
const phaseIndexJson = parseJson("os-roadmap/nexus-phases.json", "osRoadmapStatus");
const statusById = new Map((phaseStatus?.phases || []).map((entry) => [entry.phaseId, entry]));
const indexById = new Map((phaseIndexJson?.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P41.7.1")?.status === "complete", "osRoadmapStatus", "P41.7.1 must be complete");
check(statusById.get("P41.7.1")?.commit === "e0026e4", "osRoadmapStatus", "P41.7.1 must record commit e0026e4");
check(statusById.get("P41.7.2")?.status === "complete", "osRoadmapStatus", "P41.7.2 must be complete");
check(statusById.get("P41.7.2")?.nextPhase === "P41.7.3", "osRoadmapStatus", "P41.7.2 nextPhase must be P41.7.3");
check(statusById.get("P41.7.3")?.status === "planned", "osRoadmapStatus", "P41.7.3 must be planned");
check(indexById.get("P41.7.2")?.title === "Reuse Audit + Duplicate Pattern Inventory", "osRoadmapStatus", "P41.7.2 title must match audit phase");
check(indexById.get("P41.7.3")?.title === "Shared Helper Catalog + Refactor Candidate Plan", "osRoadmapStatus", "P41.7.3 title must match next phase");

const changedFiles = gitOutput(["diff", "--name-only"]).split("\n").filter(Boolean);
for (const forbiddenPrefix of [
  "projects/careloop/",
  "projects/careloop-ios/",
  "agents/",
  "orchestrator/",
  "providers/",
  "tools/",
  "state-machine/",
  "local-api/",
  "db/",
  "action bridge behavior",
]) {
  check(!changedFiles.some((file) => file.startsWith(forbiddenPrefix)), "noForbiddenChanges", `Forbidden changed path: ${forbiddenPrefix}`);
}

for (const file of [
  "codebase/reuseAudit.js",
  "codebase/refactorCandidates.js",
  "scripts/check-reuse-audit.js",
  "docs/codebase/REUSE_AND_REFACTOR_GUIDE.md",
  "docs/codebase/MODULE_REGISTRY.md",
  "docs/codebase/PHASE_MODULE_INDEX.md",
]) {
  const warnings = lineWarnings(file);
  check(warnings.length === 0, "formattingReadability", `${file} contains lines over 1000 characters`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Audit output: ${sections.auditOutput ? "PASS" : "FAIL"}`);
console.log(`Refactor candidates: ${sections.refactorCandidates ? "PASS" : "FAIL"}`);
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS Roadmap status: ${sections.osRoadmapStatus ? "PASS" : "FAIL"}`);
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
