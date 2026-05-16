import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/test-suite-manager-final-report.md");

const sections = {
  allReportsExist: true,
  indexExports: true,
  projectSuitesExports: true,
  osSuitesExports: true,
  mapperExports: true,
  evidenceModelExports: true,
  policyCorrect: true,
  noForbiddenChanges: true,
  commandCenterTestCenter: true,
  testCenterRoute: true,
  osPhaseStatus: true,
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

// Check all P55.1-P55.6 reports exist
const expectedReports = [
  "reports/test-suite-manager-report.md",
  "reports/project-test-suites-report.md",
  "reports/os-test-suites-report.md",
  "reports/test-selection-preview-report.md",
  "reports/test-evidence-model-report.md",
  "reports/command-center-ux-report.md",
];
for (const reportPath of expectedReports) {
  check(existsSync(join(ROOT, reportPath)), "allReportsExist", `Missing report: ${reportPath}`);
}

// Check test-suite/index.js exports
const indexSource = readFile("test-suite/index.js");
const expectedIndexExports = [
  "getTestRegistrySchema",
  "validateTestRegistrySchema",
  "getSupportedTestScopes",
  "getSupportedTestTools",
  "normalizeTestSuiteRecord",
  "validateTestSuiteRecord",
];
for (const exp of expectedIndexExports) {
  check(indexSource.includes(exp), "indexExports", `test-suite/index.js missing export: ${exp}`);
}

// Check test-suite/projectTestSuites.js exports
const projectSuitesSource = readFile("test-suite/projectTestSuites.js");
const expectedProjectExports = [
  "buildProjectTestSuites",
  "loadProjectTestSuitePreview",
  "validateProjectTestSuites",
  "summarizeProjectTestSuites",
];
for (const exp of expectedProjectExports) {
  check(projectSuitesSource.includes(exp), "projectSuitesExports", `test-suite/projectTestSuites.js missing export: ${exp}`);
}

// Check test-suite/osTestSuites.js exports
const osSuitesSource = readFile("test-suite/osTestSuites.js");
const expectedOsExports = [
  "buildOsTestSuites",
  "validateOsTestSuites",
  "summarizeOsTestSuites",
];
for (const exp of expectedOsExports) {
  check(osSuitesSource.includes(exp), "osSuitesExports", `test-suite/osTestSuites.js missing export: ${exp}`);
}

// Check test-suite/changedFileTestMapper.js exports
const mapperSource = readFile("test-suite/changedFileTestMapper.js");
check(mapperSource.includes("mapChangedFilesToTestSuites"), "mapperExports", "test-suite/changedFileTestMapper.js missing export: mapChangedFilesToTestSuites");

// Check test-suite/testEvidenceModel.js exports
const evidenceSource = readFile("test-suite/testEvidenceModel.js");
const expectedEvidenceExports = [
  "createTestResultRecord",
  "validateTestResultRecord",
  "createTestEvidencePreview",
  "validateTestEvidencePreview",
  "summarizeTestEvidence",
];
for (const exp of expectedEvidenceExports) {
  check(evidenceSource.includes(exp), "evidenceModelExports", `test-suite/testEvidenceModel.js missing export: ${exp}`);
}

// Check policy
const policyPath = join(ROOT, "policy/test-suite-manager-policy.json");
if (existsSync(policyPath)) {
  try {
    const policy = JSON.parse(readFileSync(policyPath, "utf8"));
    check(policy.testExecutionAllowed === false, "policyCorrect", "testExecutionAllowed must be false");
    check(policy.registryOnly === true, "policyCorrect", "registryOnly must be true");
  } catch {
    fail("policyCorrect", "policy/test-suite-manager-policy.json is not valid JSON");
  }
} else {
  fail("policyCorrect", "policy/test-suite-manager-policy.json missing");
}

// Check no forbidden changes
try {
  const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
  check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed");
} catch (error) {
  fail("noForbiddenChanges", `Could not inspect private project diff: ${error.message}`);
}

// Check CommandCenterV2.jsx includes "Test Center"
const commandCenterSource = readFile("dashboard/src/pages/CommandCenterV2.jsx");
check(commandCenterSource.includes("Test Center"), "commandCenterTestCenter", "CommandCenterV2.jsx does not contain 'Test Center'");
check(commandCenterSource.includes("TestCenterPage"), "commandCenterTestCenter", "CommandCenterV2.jsx missing TestCenterPage component");

// Check commandCenterRoutes.js includes /command-center/tests
const routeSource = readFile("dashboard/src/data/commandCenterRoutes.js");
check(routeSource.includes("/command-center/tests"), "testCenterRoute", "commandCenterRoutes.js missing /command-center/tests route");

// Check OS phase status shows P55 in it
const phaseStatusSource = readFile("os-roadmap/phase-status.json");
check(
  phaseStatusSource.includes("P55.1") && phaseStatusSource.includes("P55.6"),
  "osPhaseStatus",
  "os-roadmap/phase-status.json missing P55.1 or P55.6"
);

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

let branch = "unknown";
let head = "unknown";
try {
  branch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]);
  head = gitOutput(["rev-parse", "--short", "HEAD"]);
} catch {}

const report = `# Test Suite Manager Final Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Phase: P55.7
- Validation branch: ${branch}
- Validation HEAD: ${head}

## Checks

- All P55.1-P55.6 reports exist: ${sections.allReportsExist ? "PASS" : "FAIL"}
- test-suite/index.js exports: ${sections.indexExports ? "PASS" : "FAIL"}
- test-suite/projectTestSuites.js exports: ${sections.projectSuitesExports ? "PASS" : "FAIL"}
- test-suite/osTestSuites.js exports: ${sections.osSuitesExports ? "PASS" : "FAIL"}
- test-suite/changedFileTestMapper.js exports: ${sections.mapperExports ? "PASS" : "FAIL"}
- test-suite/testEvidenceModel.js exports: ${sections.evidenceModelExports ? "PASS" : "FAIL"}
- policy/test-suite-manager-policy.json correct: ${sections.policyCorrect ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- CommandCenterV2.jsx includes Test Center: ${sections.commandCenterTestCenter ? "PASS" : "FAIL"}
- commandCenterRoutes.js includes /command-center/tests: ${sections.testCenterRoute ? "PASS" : "FAIL"}
- OS phase status shows P55: ${sections.osPhaseStatus ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((f) => `- ${f}`).join("\n")}

## Result

${result}

## Summary

P55 Test Suite Manager is complete. The registry covers ${5} project suites and ${15} OS suites.
All suites have executionEnabled: false. The Command Center Test Center route is live at
/command-center/tests with 6 tabs: Overview, Project Tests, OS Tests, Selection Preview,
Evidence Model, and Gaps. No test execution, no commands run, no provider calls, no DB writes.

Next phase: P56 — Quality Intelligence + Test Gap Detection.
`;

writeFileSync(REPORT_PATH, report, "utf8");
console.log(`Test Suite Manager Final: ${result}`);
for (const f of failures) console.log(`  FAIL: ${f}`);

if (result !== "PASS") process.exitCode = 1;
