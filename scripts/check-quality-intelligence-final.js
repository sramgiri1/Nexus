import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import * as qualityIntelligence from "../quality-intelligence/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/quality-intelligence-final-report.md");

const sections = {
  reports: true,
  modules: true,
  policy: true,
  commandCenterUx: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formattingReadability: true,
};

const failures = [];

function fail(section, message) {
  sections[section] = false;
  failures.push(message);
}

function check(condition, section, message) {
  if (!condition) fail(section, message);
}

function readFile(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function gitOutput(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function parseJson(relativePath, section) {
  try {
    return JSON.parse(readFile(relativePath));
  } catch (error) {
    fail(section, `${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

const expectedReports = [
  "reports/prd-test-mapping-report.md",
  "reports/coverage-gap-report.md",
  "reports/flaky-test-tracker-report.md",
  "reports/test-recommendation-report.md",
  "reports/test-proposal-workflow-report.md",
  "reports/command-center-ux-report.md",
];

for (const reportPath of expectedReports) {
  const report = readFile(reportPath);
  check(report.length > 0, "reports", `Missing report: ${reportPath}`);
  check(report.includes("Validation HEAD"), "reports", `${reportPath} missing Validation HEAD wording`);
}

const requiredExports = [
  "buildPrdTestMap",
  "validatePrdTestMap",
  "summarizePrdTestCoverage",
  "loadPrdSignals",
  "detectCoverageGaps",
  "classifyCoverageGap",
  "summarizeCoverageGaps",
  "buildGapRecommendations",
  "buildFlakyTestRecords",
  "classifyFlakySignal",
  "summarizeFlakyTests",
  "recommendFlakyTestActions",
  "recommendTestsForChange",
  "scoreTestRecommendation",
  "summarizeTestRecommendations",
  "explainRecommendation",
  "createTestProposal",
  "validateTestProposal",
  "summarizeTestProposal",
  "listTestProposalPreview",
];

for (const exportName of requiredExports) {
  check(
    typeof qualityIntelligence[exportName] === "function",
    "modules",
    `quality-intelligence/index.js missing export: ${exportName}`,
  );
}

const prdMap = qualityIntelligence.buildPrdTestMap();
const gaps = qualityIntelligence.detectCoverageGaps(prdMap, []);
const flakyRecords = qualityIntelligence.buildFlakyTestRecords([]);
const recommendations = qualityIntelligence.recommendTestsForChange({
  changedFiles: ["dashboard/src/pages/CommandCenterV2.jsx"],
  coverageGaps: gaps,
});
const proposals = qualityIntelligence.listTestProposalPreview({ gaps: gaps.length ? gaps : undefined });

check(prdMap.executionEnabled === false, "modules", "PRD test map must be preview-only");
check(qualityIntelligence.summarizeCoverageGaps(gaps).testGenerationEnabled === false, "modules", "Gap summary must keep test generation disabled");
check(qualityIntelligence.summarizeFlakyTests(flakyRecords).executionEnabled === false, "modules", "Flaky summary must keep execution disabled");
check(qualityIntelligence.summarizeTestRecommendations(recommendations).executionEnabled === false, "modules", "Recommendations must keep execution disabled");
check(proposals.every((proposal) => proposal.executionEnabled === false), "modules", "Test proposals must not enable execution");
check(proposals.every((proposal) => proposal.mutationAllowed === false), "modules", "Test proposals must not allow mutation");

const policy = parseJson("policy/quality-intelligence-policy.json", "policy");
if (policy) {
  for (const [field, expected] of Object.entries({
    previewOnly: true,
    proposalOnly: true,
    testExecutionAllowed: false,
    testFileCreationAllowed: false,
    projectMutationAllowed: false,
    providerCallsAllowed: false,
    toolExecutionAllowed: false,
    mcpExecutionAllowed: false,
    workerRuntimeAllowed: false,
    dbWritesAllowed: false,
    externalNetworkCallsAllowed: false,
    privateSourceContentScanningAllowed: false,
    reportsOnly: true,
  })) {
    check(policy[field] === expected, "policy", `Policy field ${field} must be ${expected}`);
  }
}

const routeSource = readFile("dashboard/src/data/commandCenterRoutes.js");
const tabSource = readFile("dashboard/src/data/commandCenterTabs.js");
const commandCenterSource = readFile("dashboard/src/pages/CommandCenterV2.jsx");
const testSource = readFile("dashboard/tests/routes.spec.js");

check(routeSource.includes("/command-center/quality"), "commandCenterUx", "Missing Quality Intelligence route");
check(tabSource.includes("QUALITY_INTELLIGENCE_TABS"), "commandCenterUx", "Missing Quality Intelligence tab config");
check(commandCenterSource.includes("QualityIntelligencePage"), "commandCenterUx", "Missing QualityIntelligencePage component");
check(commandCenterSource.includes("Test execution disabled"), "commandCenterUx", "Quality page must show execution-disabled posture");
check(testSource.includes("Quality Intelligence route renders preview-only test gap metadata"), "commandCenterUx", "Missing Playwright Quality Intelligence coverage");

const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
if (phaseStatus) {
  const phaseById = new Map((phaseStatus.phases || []).map((phase) => [phase.phaseId, phase]));
  check(phaseById.get("P56")?.status === "complete", "osPhaseStatus", "P56 must be complete");
  check(phaseById.get("P56.1")?.status === "complete", "osPhaseStatus", "P56.1 must be complete");
  check(phaseById.get("P56.2")?.status === "complete", "osPhaseStatus", "P56.2 must be complete");
  check(phaseById.get("P56.3")?.status === "complete", "osPhaseStatus", "P56.3 must be complete");
  check(phaseById.get("P56.4")?.status === "complete", "osPhaseStatus", "P56.4 must be complete");
  check(phaseById.get("P56.5")?.status === "complete", "osPhaseStatus", "P56.5 must be complete");
  check(phaseById.get("P56.6")?.status === "complete", "osPhaseStatus", "P56.6 must be complete");
  check(phaseById.get("P56.7")?.status === "complete", "osPhaseStatus", "P56.7 must be complete");
  check(phaseById.get("P57")?.status === "planned", "osPhaseStatus", "P57 must be planned");
  check(phaseStatus.currentPhase === "P57", "osPhaseStatus", "P57 must be current/next after P56 closure");
}

try {
  const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
  check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");

  const forbiddenRuntimeDiff = gitOutput([
    "diff",
    "--name-only",
    "--",
    "local-api",
    "db",
    "agents",
    "orchestrator",
    "providers",
    "tools",
    "command-execution",
  ]);
  check(forbiddenRuntimeDiff.length === 0, "noForbiddenChanges", `Forbidden runtime files changed: ${forbiddenRuntimeDiff}`);
} catch (error) {
  fail("noForbiddenChanges", `Could not inspect forbidden diffs: ${error.message}`);
}

for (const filePath of [
  "quality-intelligence/prdTestMapper.js",
  "quality-intelligence/coverageGapDetector.js",
  "quality-intelligence/flakyTestTracker.js",
  "quality-intelligence/testRecommendationEngine.js",
  "quality-intelligence/testProposalWorkflow.js",
  "scripts/check-quality-intelligence-final.js",
  "policy/quality-intelligence-policy.json",
]) {
  const longLines = readFile(filePath)
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter((entry) => entry.line.length > 1000);
  check(longLines.length === 0, "formattingReadability", `${filePath} has lines over 1000 chars`);
}

let branch = "unknown";
let head = "unknown";
try {
  branch = gitOutput(["branch", "--show-current"]);
  head = gitOutput(["rev-parse", "--short", "HEAD"]);
} catch {}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

const report = `# Quality Intelligence Final Validation Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Phase: P56.7 - Quality Intelligence Final Validation
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Checks

- Reports: ${sections.reports ? "PASS" : "FAIL"}
- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}

## Summary

- PRD records: ${prdMap.records?.length || 0}
- Coverage gaps: ${gaps.length}
- Flaky records: ${flakyRecords.length}
- Test recommendations: ${recommendations.length}
- Governed test proposals: ${proposals.length}

## Safety Boundary

- Test execution: disabled
- Test file creation: disabled
- Project mutation: disabled
- Provider/tool/MCP/worker execution: disabled
- DB writes and external network calls: disabled
- Private source content scanning: disabled

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}

## Next Phase

P57 - Cost Center + Budget Enforcement.
`;

writeFileSync(REPORT_PATH, report, "utf8");

console.log("NEXUS Quality Intelligence Final Check");
console.log("======================================");
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Command Center UX: ${sections.commandCenterUx ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);
for (const failure of failures) console.log(`FAIL: ${failure}`);

if (result !== "PASS") process.exitCode = 1;
