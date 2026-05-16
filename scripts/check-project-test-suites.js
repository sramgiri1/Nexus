import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildProjectTestSuites, validateProjectTestSuites, summarizeProjectTestSuites } from "../test-suite/projectTestSuites.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/project-test-suites-report.md");

const sections = {
  buildSuites: true,
  noExecutionEnabled: true,
  forbiddenInDemo: true,
  noCommandExecution: true,
  validation: true,
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

// Build suites
let suites = [];
let summary = {};
try {
  suites = buildProjectTestSuites({ projectId: "careloop" });
  check(Array.isArray(suites) && suites.length > 0, "buildSuites", "buildProjectTestSuites returned empty or non-array");
  summary = summarizeProjectTestSuites(suites);
} catch (e) {
  fail("buildSuites", `buildProjectTestSuites threw: ${e.message}`);
}

// No suite has executionEnabled: true
for (const suite of suites) {
  check(suite.executionEnabled === false, "noExecutionEnabled", `Suite ${suite.suiteId} has executionEnabled: ${suite.executionEnabled}`);
}

// All private project suites have forbiddenInDemo: true
for (const suite of suites) {
  if (suite.scope === "project" || suite.dataClassification === "private") {
    check(suite.forbiddenInDemo === true, "forbiddenInDemo", `Suite ${suite.suiteId} is private but forbiddenInDemo is not true`);
  }
}

// Validate all suites
const { valid, errors } = validateProjectTestSuites(suites);
check(valid, "validation", `Suite validation failed: ${errors.join("; ")}`);

// No commandPreview looks like a real command execution (just display strings)
for (const suite of suites) {
  check(typeof suite.commandPreview === "string", "noCommandExecution", `Suite ${suite.suiteId} missing commandPreview string`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

let branch = "unknown";
let head = "unknown";
try {
  branch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]);
  head = gitOutput(["rev-parse", "--short", "HEAD"]);
} catch {}

const suiteRows = suites.map((s) =>
  `| ${s.suiteId} | ${s.layer} | ${s.tool} | ${s.riskLevel} | ${s.status || "planned"} |`
).join("\n");

const report = `# Project Test Suites Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Phase: P55.2
- Validation branch: ${branch}
- Validation HEAD: ${head}

## Summary

- Total suites: ${summary.total}
- Execution enabled: false (always)
- Project IDs: ${(summary.projectIds || []).join(", ")}
- By layer: ${JSON.stringify(summary.byLayer || {})}
- By status: ${JSON.stringify(summary.byStatus || {})}

## Suite Records (Preview Only)

| Suite ID | Layer | Tool | Risk | Status |
|---|---|---|---|---|
${suiteRows}

## Checks

- buildProjectTestSuites returns suites: ${sections.buildSuites ? "PASS" : "FAIL"}
- No suite has executionEnabled true: ${sections.noExecutionEnabled ? "PASS" : "FAIL"}
- All private suites have forbiddenInDemo true: ${sections.forbiddenInDemo ? "PASS" : "FAIL"}
- commandPreview strings present (display only): ${sections.noCommandExecution ? "PASS" : "FAIL"}
- Suite validation: ${sections.validation ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((f) => `- ${f}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");
console.log(`Project test suites: ${result}`);
for (const f of failures) console.log(`  FAIL: ${f}`);

if (result !== "PASS") process.exitCode = 1;
