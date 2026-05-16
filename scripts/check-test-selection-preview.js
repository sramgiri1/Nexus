import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { mapChangedFilesToTestSuites } from "../test-suite/changedFileTestMapper.js";
import { buildTestSelectionPreview, validateTestSelectionPreview, summarizeTestSelectionPreview } from "../test-suite/testSelectionPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/test-selection-preview-report.md");

const sections = {
  mappingWorks: true,
  noExecution: true,
  emptyFiles: true,
  dashboardMapping: true,
  projectMapping: true,
  validationPasses: true,
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

// Test mapping works
let matches = [];
try {
  matches = mapChangedFilesToTestSuites(["dashboard/src/App.jsx", "db/schema.sql"]);
  check(Array.isArray(matches), "mappingWorks", "mapChangedFilesToTestSuites did not return an array");
  check(matches.length >= 1, "mappingWorks", "Expected at least 1 match for dashboard/ file");
} catch (e) {
  fail("mappingWorks", `mapChangedFilesToTestSuites threw: ${e.message}`);
}

// No execution enabled
for (const m of matches) {
  check(m.executionEnabled === false, "noExecution", `Match ${m.suiteId} has executionEnabled: ${m.executionEnabled}`);
}

// Empty file list returns empty
try {
  const emptyMatches = mapChangedFilesToTestSuites([]);
  check(Array.isArray(emptyMatches) && emptyMatches.length === 0, "emptyFiles", "Empty file list should return empty array");
} catch (e) {
  fail("emptyFiles", `Empty file test threw: ${e.message}`);
}

// Dashboard file maps to command center route tests
const dashboardMatches = matches.filter((m) => m.suiteId === "os-command-center-route-tests");
check(dashboardMatches.length > 0, "dashboardMapping", "dashboard/ file should map to os-command-center-route-tests");

// Project file maps to project suite (execution disabled)
try {
  const projectMatches = mapChangedFilesToTestSuites(["projects/careloop/src/server.js"]);
  const careloopMatch = projectMatches.find((m) => m.suiteId === "careloop-backend-validation");
  check(careloopMatch !== undefined, "projectMapping", "projects/careloop/ should map to careloop-backend-validation suite");
  if (careloopMatch) {
    check(careloopMatch.executionEnabled === false, "projectMapping", "Project suite match must have executionEnabled: false");
  }
} catch (e) {
  fail("projectMapping", `Project mapping test threw: ${e.message}`);
}

// Build preview and validate
try {
  const preview = buildTestSelectionPreview({ changedFiles: ["dashboard/src/App.jsx", "db/schema.sql"], context: {} });
  const { valid, errors } = validateTestSelectionPreview(preview);
  check(valid, "validationPasses", `Preview validation failed: ${errors.join("; ")}`);
  check(preview.executionEnabled === false, "validationPasses", "Preview executionEnabled must be false");
} catch (e) {
  fail("validationPasses", `buildTestSelectionPreview threw: ${e.message}`);
}

// Build empty preview
const emptyPreview = buildTestSelectionPreview({ changedFiles: [], context: {} });
const emptySummary = summarizeTestSelectionPreview(emptyPreview);

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

let branch = "unknown";
let head = "unknown";
try {
  branch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]);
  head = gitOutput(["rev-parse", "--short", "HEAD"]);
} catch {}

const samplePreview = buildTestSelectionPreview({
  changedFiles: ["dashboard/src/App.jsx", "db/schema.sql", "memory/portfolio.json"],
  context: {},
});

const report = `# Test Selection Preview Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Phase: P55.4
- Validation branch: ${branch}
- Validation HEAD: ${head}

## Sample Preview (dashboard + db + memory)

- Changed files: 3
- Selected suites: ${samplePreview.selectedSuites}
- Execution enabled: false
- Highest risk: ${samplePreview.riskSummary.highest}
- Note: ${samplePreview.note}
- Suite IDs: ${samplePreview.selectedSuiteIds.join(", ")}

## Empty Preview

- Changed files: 0
- Selected suites: ${emptySummary.selectedSuites}
- Note: ${emptyPreview.note}

## Checks

- Mapping works: ${sections.mappingWorks ? "PASS" : "FAIL"}
- No execution enabled in matches: ${sections.noExecution ? "PASS" : "FAIL"}
- Empty file list returns empty: ${sections.emptyFiles ? "PASS" : "FAIL"}
- Dashboard file maps to route tests: ${sections.dashboardMapping ? "PASS" : "FAIL"}
- Project file maps to project suite: ${sections.projectMapping ? "PASS" : "FAIL"}
- Preview validation passes: ${sections.validationPasses ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((f) => `- ${f}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");
console.log(`Test selection preview: ${result}`);
for (const f of failures) console.log(`  FAIL: ${f}`);

if (result !== "PASS") process.exitCode = 1;
