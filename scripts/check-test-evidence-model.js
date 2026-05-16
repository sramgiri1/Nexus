import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { TEST_RESULT_FIELDS, createEmptyTestResult } from "../test-suite/testResultSchema.js";
import {
  createTestResultRecord,
  validateTestResultRecord,
  createTestEvidencePreview,
  validateTestEvidencePreview,
  summarizeTestEvidence,
} from "../test-suite/testEvidenceModel.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/test-evidence-model-report.md");

const sections = {
  schemaFields: true,
  createRecord: true,
  validateRecord: true,
  redactedTrue: true,
  evidencePreview: true,
  validateEvidence: true,
  summarize: true,
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

// Check schema fields
check(Array.isArray(TEST_RESULT_FIELDS) && TEST_RESULT_FIELDS.length >= 10, "schemaFields", "TEST_RESULT_FIELDS must be an array with at least 10 entries");

// createEmptyTestResult
const empty = createEmptyTestResult();
check(empty.redacted === true, "schemaFields", "createEmptyTestResult().redacted must be true");

// createTestResultRecord
let record;
try {
  record = createTestResultRecord({
    suiteId: "os-command-center-route-tests",
    osScope: "nexus-os",
    runMode: "preview",
    status: "not_run",
    commandPreview: "npx playwright test dashboard/tests/",
    evidenceType: "playwright-report",
    linkedAgentId: "AUDITOR",
  });
  check(typeof record.resultId === "string" && record.resultId.length > 0, "createRecord", "resultId must be a non-empty string");
  check(record.suiteId === "os-command-center-route-tests", "createRecord", "suiteId must match input");
  check(record.redacted === true, "createRecord", "redacted must be true");
} catch (e) {
  fail("createRecord", `createTestResultRecord threw: ${e.message}`);
}

// validateTestResultRecord
if (record) {
  const { valid, errors } = validateTestResultRecord(record);
  check(valid, "validateRecord", `Record validation failed: ${errors.join("; ")}`);
}

// redacted must be true
if (record) {
  check(record.redacted === true, "redactedTrue", "Record.redacted must always be true");
}

// createTestEvidencePreview
let evidence;
if (record) {
  try {
    evidence = createTestEvidencePreview(record);
    check(evidence.redacted === true, "evidencePreview", "Evidence.redacted must be true");
    check(typeof evidence.evidenceId === "string" && evidence.evidenceId.length > 0, "evidencePreview", "evidenceId must be a non-empty string");
    check(evidence.suiteId === record.suiteId, "evidencePreview", "Evidence suiteId must match record suiteId");
  } catch (e) {
    fail("evidencePreview", `createTestEvidencePreview threw: ${e.message}`);
  }
}

// validateTestEvidencePreview
if (evidence) {
  const { valid, errors } = validateTestEvidencePreview(evidence);
  check(valid, "validateEvidence", `Evidence validation failed: ${errors.join("; ")}`);
}

// summarizeTestEvidence
try {
  const r1 = createTestResultRecord({ suiteId: "s1", runMode: "preview", status: "pass", commandPreview: "x", evidenceType: "t" });
  const r2 = createTestResultRecord({ suiteId: "s2", runMode: "preview", status: "fail", commandPreview: "x", evidenceType: "t" });
  const r3 = createTestResultRecord({ suiteId: "s3", runMode: "preview", status: "not_run", commandPreview: "x", evidenceType: "t" });
  const summary = summarizeTestEvidence([r1, r2, r3]);
  check(summary.total === 3, "summarize", `Expected total 3, got ${summary.total}`);
  check(summary.passed === 1, "summarize", `Expected passed 1, got ${summary.passed}`);
  check(summary.failed === 1, "summarize", `Expected failed 1, got ${summary.failed}`);
  check(summary.notRun === 1, "summarize", `Expected notRun 1, got ${summary.notRun}`);
} catch (e) {
  fail("summarize", `summarizeTestEvidence threw: ${e.message}`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

let branch = "unknown";
let head = "unknown";
try {
  branch = gitOutput(["rev-parse", "--abbrev-ref", "HEAD"]);
  head = gitOutput(["rev-parse", "--short", "HEAD"]);
} catch {}

const fieldRows = TEST_RESULT_FIELDS.map((f) =>
  `| ${f.name} | ${f.type} | ${f.required ? "yes" : "no"} | ${f.description} |`
).join("\n");

const report = `# Test Evidence Model Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Phase: P55.5
- Validation branch: ${branch}
- Validation HEAD: ${head}

## Schema Fields

| Field | Type | Required | Description |
|---|---|---|---|
${fieldRows}

## Sample Record

- resultId: ${record?.resultId || "N/A"}
- suiteId: ${record?.suiteId || "N/A"}
- runMode: ${record?.runMode || "N/A"}
- status: ${record?.status || "N/A"}
- redacted: ${record?.redacted}
- evidenceType: ${record?.evidenceType || "N/A"}

## Sample Evidence Preview

- evidenceId: ${evidence?.evidenceId || "N/A"}
- redacted: ${evidence?.redacted}
- safetyNote: ${evidence?.safetyNote || "N/A"}

## Checks

- Schema fields defined: ${sections.schemaFields ? "PASS" : "FAIL"}
- createTestResultRecord works: ${sections.createRecord ? "PASS" : "FAIL"}
- validateTestResultRecord passes: ${sections.validateRecord ? "PASS" : "FAIL"}
- redacted always true: ${sections.redactedTrue ? "PASS" : "FAIL"}
- createTestEvidencePreview works: ${sections.evidencePreview ? "PASS" : "FAIL"}
- validateTestEvidencePreview passes: ${sections.validateEvidence ? "PASS" : "FAIL"}
- summarizeTestEvidence works: ${sections.summarize ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((f) => `- ${f}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");
console.log(`Test evidence model: ${result}`);
for (const f of failures) console.log(`  FAIL: ${f}`);

if (result !== "PASS") process.exitCode = 1;
