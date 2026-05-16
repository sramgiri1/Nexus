import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildOsTestSuites, validateOsTestSuites, summarizeOsTestSuites } from "../test-suite/osTestSuites.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/os-test-suites-report.md");

const sections = {
  buildSuites: true,
  noExecutionEnabled: true,
  validScopes: true,
  validation: true,
  minimumCount: true,
};

const failures = [];

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

let suites = [];
let summary = {};

try {
  suites = buildOsTestSuites({});
  check(Array.isArray(suites) && suites.length > 0, "buildSuites", "buildOsTestSuites returned empty or non-array");
  summary = summarizeOsTestSuites(suites);
} catch (e) {
  fail("buildSuites", `buildOsTestSuites threw: ${e.message}`);
}

// No executionEnabled: true
for (const suite of suites) {
  check(suite.executionEnabled === false, "noExecutionEnabled", `Suite ${suite.suiteId} has executionEnabled: ${suite.executionEnabled}`);
}

// All must be os or cross_cutting scope
for (const suite of suites) {
  check(
    suite.scope === "os" || suite.scope === "cross_cutting",
    "validScopes",
    `Suite ${suite.suiteId} has invalid scope: ${suite.scope}`
  );
}

// Minimum count: 15
check(suites.length >= 15, "minimumCount", `Expected at least 15 OS suites, got ${suites.length}`);

// Validate all suites
const { valid, errors } = validateOsTestSuites(suites);
check(valid, "validation", `Suite validation failed: ${errors.join("; ")}`);

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

let branch = "unknown";
let head = "unknown";
try {
  branch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]);
  head = gitOutput(["rev-parse", "--short", "HEAD"]);
} catch {}

const suiteRows = suites.map((s) =>
  `| ${s.suiteId} | ${s.layer} | ${s.tool} | ${s.ownerAgent} |`
).join("\n");

const report = `# OS Test Suites Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Phase: P55.3
- Validation branch: ${branch}
- Validation HEAD: ${head}

## Summary

- Total suites: ${summary.total}
- Execution enabled: false (always)
- By layer: ${JSON.stringify(summary.byLayer || {})}
- By tool: ${JSON.stringify(summary.byTool || {})}
- Owner agents: ${(summary.ownerAgents || []).join(", ")}

## Suite Records (Preview Only)

| Suite ID | Layer | Tool | Owner Agent |
|---|---|---|---|
${suiteRows}

## Checks

- buildOsTestSuites returns suites: ${sections.buildSuites ? "PASS" : "FAIL"}
- No suite has executionEnabled true: ${sections.noExecutionEnabled ? "PASS" : "FAIL"}
- All suites have valid OS scope: ${sections.validScopes ? "PASS" : "FAIL"}
- Minimum 15 suites: ${sections.minimumCount ? "PASS" : "FAIL"}
- Suite validation: ${sections.validation ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((f) => `- ${f}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");
console.log(`OS test suites: ${result}`);
for (const f of failures) console.log(`  FAIL: ${f}`);

if (result !== "PASS") process.exitCode = 1;
