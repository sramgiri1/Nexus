import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/test-suite-manager-report.md");

const sections = {
  indexExists: true,
  indexExports: true,
  policyExists: true,
  policyValues: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
};

const failures = [];

function readFile(relativePath) {
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

// Check index.js exists
const indexPath = join(ROOT, "test-suite/index.js");
check(existsSync(indexPath), "indexExists", "test-suite/index.js does not exist");

// Check index exports
const indexSource = readFile("test-suite/index.js");
const expectedExports = [
  "getTestRegistrySchema",
  "validateTestRegistrySchema",
  "getSupportedTestScopes",
  "getSupportedTestTools",
  "normalizeTestSuiteRecord",
  "validateTestSuiteRecord",
];
for (const exp of expectedExports) {
  check(indexSource.includes(exp), "indexExports", `test-suite/index.js missing export: ${exp}`);
}

// Check policy file
const policyPath = join(ROOT, "policy/test-suite-manager-policy.json");
check(existsSync(policyPath), "policyExists", "policy/test-suite-manager-policy.json does not exist");

if (existsSync(policyPath)) {
  let policy;
  try {
    policy = JSON.parse(readFileSync(policyPath, "utf8"));
  } catch {
    fail("policyValues", "policy/test-suite-manager-policy.json is not valid JSON");
    policy = null;
  }
  if (policy) {
    check(policy.testExecutionAllowed === false, "policyValues", "testExecutionAllowed must be false");
    check(policy.registryOnly === true, "policyValues", "registryOnly must be true");
    check(policy.commandExecutionAllowed === false, "policyValues", "commandExecutionAllowed must be false");
    check(policy.providerCallsAllowed === false, "policyValues", "providerCallsAllowed must be false");
    check(policy.projectMutationAllowed === false, "policyValues", "projectMutationAllowed must be false");
  }
}

// Check OS phase status includes P55.1
const phaseStatusPath = join(ROOT, "os-roadmap/phase-status.json");
if (existsSync(phaseStatusPath)) {
  const phaseStatusSource = readFileSync(phaseStatusPath, "utf8");
  check(
    phaseStatusSource.includes("P55.1") || phaseStatusSource.includes('"P55"'),
    "osPhaseStatus",
    "os-roadmap/phase-status.json does not include P55.1 or P55 entry"
  );
} else {
  fail("osPhaseStatus", "os-roadmap/phase-status.json does not exist");
}

// No forbidden changes to projects/careloop or projects/careloop-ios
try {
  const privateDiff = gitOutput(["diff", "--name-only", "--", "projects/careloop", "projects/careloop-ios"]);
  check(privateDiff.length === 0, "noForbiddenChanges", "Private project files changed: projects/careloop or projects/careloop-ios");
} catch (error) {
  fail("noForbiddenChanges", `Could not inspect private project diff: ${error.message}`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

let branch = "unknown";
let head = "unknown";
try {
  branch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]);
  head = gitOutput(["rev-parse", "--short", "HEAD"]);
} catch {}

const report = `# Test Suite Manager Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Phase: P55.1
- Validation branch: ${branch}
- Validation HEAD: ${head}

## Checks

- test-suite/index.js exists: ${sections.indexExists ? "PASS" : "FAIL"}
- test-suite/index.js exports: ${sections.indexExports ? "PASS" : "FAIL"}
- policy/test-suite-manager-policy.json exists: ${sections.policyExists ? "PASS" : "FAIL"}
- Policy values correct: ${sections.policyValues ? "PASS" : "FAIL"}
- OS phase status includes P55.1: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((f) => `- ${f}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");
console.log(`Test suite manager: ${result}`);
for (const f of failures) console.log(`  FAIL: ${f}`);

if (result !== "PASS") process.exitCode = 1;
