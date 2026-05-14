import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_EVENT_TYPES,
  createActivityEvent,
  createTraceContext,
  getRequiredActivityFields,
  isActivityEventRedacted,
  normalizeActivityEvent,
  sanitizeActivityPayload,
  validateActivityEvent,
  validateTraceContext,
} from "../observability/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "activity-event-schema-report.md");

const sections = {
  modules: true,
  exports: true,
  schema: true,
  correlation: true,
  redaction: true,
  eventTypes: true,
  policy: true,
  docs: true,
  osPhaseStatus: true,
  noInstrumentation: true,
  noForbiddenChanges: true,
  formatting: true,
  reportWritten: true,
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

function listChangedFiles() {
  const output = gitOutput(["diff", "--name-only"]);
  const untracked = gitOutput(["ls-files", "--others", "--exclude-standard"]);
  return [...output.split("\n"), ...untracked.split("\n")].filter(Boolean);
}

console.log("NEXUS Activity Event Schema Check\n=================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

const requiredFiles = [
  "observability/activitySchema.js",
  "observability/correlation.js",
  "observability/activityTypes.js",
  "observability/redactionPolicy.js",
  "observability/index.js",
  "policy/activity-event-schema-policy.json",
  "scripts/check-activity-event-schema.js",
  "docs/architecture/CENTRALIZED_ACTIVITY_LOG.md",
];

for (const file of requiredFiles) {
  check(existsSync(join(ROOT, file)), "modules", `Missing required file: ${file}`);
}

for (const exportName of [
  createActivityEvent,
  validateActivityEvent,
  normalizeActivityEvent,
  createTraceContext,
  validateTraceContext,
  sanitizeActivityPayload,
]) {
  check(typeof exportName === "function", "exports", "Required observability export is not a function");
}

const requiredFields = getRequiredActivityFields();
for (const field of ["activityId", "correlationId", "timestamp", "category", "eventType", "summary"]) {
  check(requiredFields.includes(field), "schema", `Required field missing from schema: ${field}`);
}

const validEvent = createActivityEvent({
  idOptions: { seed: "activityschema" },
  category: "system",
  eventType: "roadmap_status_updated",
  mode: "local-private",
  source: "checker",
  scope: "NEXUS_OS_CHANGE",
  status: "success",
  decision: "NOT_APPLICABLE",
  summary: "Activity event schema validated.",
  metadata: {
    phase: "P41.8.1",
    apiKey: "sk-thisfakekeyislongenoughtoberedacted",
  },
});

const validResult = validateActivityEvent(validEvent);
check(validResult.ok, "schema", `Valid schema fixture failed: ${validResult.errors.join("; ")}`);
check(validEvent.metadata.apiKey === "[REDACTED]", "redaction", "Sensitive metadata key was not redacted");
check(isActivityEventRedacted(validEvent), "redaction", "Valid event should be redacted and safe");

const invalidEvent = normalizeActivityEvent({
  idOptions: { seed: "invalidschema" },
  category: "system",
  eventType: "unknown_event_type",
  summary: "Invalid event fixture.",
});
const invalidResult = validateActivityEvent(invalidEvent);
check(!invalidResult.ok, "schema", "Invalid event type should fail validation");

const traceContext = createTraceContext({
  seed: "tracecontext",
  scope: "NEXUS_OS_CHANGE",
  source: "checker",
});
const traceResult = validateTraceContext(traceContext);
check(traceResult.ok, "correlation", `Trace context failed: ${traceResult.errors.join("; ")}`);
check(traceContext.correlationId.startsWith("corr_"), "correlation", "Correlation ID must use corr_ prefix");
check(traceContext.rootActivityId.startsWith("act_"), "correlation", "Activity ID must use act_ prefix");

for (const category of [
  "ui",
  "api",
  "action_bridge",
  "agent",
  "task",
  "policy",
  "evidence",
  "tool",
  "provider",
  "worker",
  "test",
  "cost",
  "security",
  "release",
  "recovery",
  "docs",
  "system",
]) {
  check(ACTIVITY_CATEGORIES.includes(category), "eventTypes", `Missing activity category: ${category}`);
  check(Array.isArray(ACTIVITY_EVENT_TYPES[category]), "eventTypes", `Missing event type list: ${category}`);
}

let policy = {};
try {
  policy = JSON.parse(read("policy/activity-event-schema-policy.json"));
} catch (error) {
  fail("policy", `Policy file does not parse: ${error.message}`);
}

check(policy.phase === "P41.8.1", "policy", "Policy phase must be P41.8.1");
check(policy.foundationOnly === true, "policy", "Policy must mark this phase foundation-only");
check(policy.instrumentationAllowed === false, "policy", "Instrumentation must be disallowed");
check(policy.providerCallsAllowed === false, "policy", "Provider calls must be disallowed");
check(policy.dbWritesAllowed === false, "policy", "DB writes must be disallowed");

const docs = read("docs/architecture/CENTRALIZED_ACTIVITY_LOG.md");
for (const expected of [
  "Activity Event Schema",
  "Correlation ID Model",
  "Redaction Rules",
  "P41.8.1 does not instrument runtime paths",
  "P41.8.2",
]) {
  check(docs.includes(expected), "docs", `Centralized activity log docs missing: ${expected}`);
}

const phaseStatus = read("os-roadmap/phase-status.json");
const phaseIndex = read("os-roadmap/nexus-phases.json");
check(phaseStatus.includes('"phaseId": "P41.8.1"'), "osPhaseStatus", "P41.8.1 status missing");
check(phaseStatus.includes('"status": "complete"'), "osPhaseStatus", "P41.8.1 complete status missing");
check(phaseStatus.includes('"phaseId": "P41.8.2"'), "osPhaseStatus", "P41.8.2 status missing");
check(phaseIndex.includes('"phaseId": "P41.8.2"'), "osPhaseStatus", "P41.8.2 index missing");

const changedFiles = listChangedFiles();
const forbiddenPrefixes = [
  "projects/careloop/",
  "projects/careloop-ios/",
  "providers/",
  "tools/",
  "agents/",
  "orchestrator/",
  "local-api/",
  "db/",
  "command-execution/",
  "state-machine/",
];
for (const changedFile of changedFiles) {
  if (forbiddenPrefixes.some((prefix) => changedFile.startsWith(prefix))) {
    fail("noForbiddenChanges", `Forbidden changed file: ${changedFile}`);
  }
}

for (const sourceFile of [
  "observability/activitySchema.js",
  "observability/correlation.js",
  "observability/activityTypes.js",
  "observability/redactionPolicy.js",
]) {
  const source = read(sourceFile);
  check(!source.includes("fetch("), "noInstrumentation", `${sourceFile} must not call external network`);
  check(!source.includes("writeFileSync"), "noInstrumentation", `${sourceFile} must not write runtime state`);
  check(!source.includes("spawn("), "noInstrumentation", `${sourceFile} must not start processes`);
}

for (const changedFile of changedFiles) {
  if (!/\.(js|json|md)$/.test(changedFile)) continue;
  const lines = read(changedFile).split("\n");
  const longLine = lines.findIndex((line) => line.length > 1000);
  check(longLine === -1, "formatting", `${changedFile} has line over 1000 chars`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

const report = `# NEXUS Activity Event Schema Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.8.1 - Activity Event Schema + Correlation ID Model

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Correlation: ${sections.correlation ? "PASS" : "FAIL"}
- Redaction: ${sections.redaction ? "PASS" : "FAIL"}
- Event types: ${sections.eventTypes ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No instrumentation: ${sections.noInstrumentation ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Schema Summary

- Event schema version: 1.0
- Required fields: ${requiredFields.join(", ")}
- Categories: ${ACTIVITY_CATEGORIES.join(", ")}
- Redacted payloads required: yes
- Correlation ID prefix: corr_
- Activity ID prefix: act_

## Explicit Non-Goals

- No runtime instrumentation was added.
- No Activity Log UI was added.
- No activity API endpoint was added.
- No provider, tool, worker, DB, or project mutation path was enabled.

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

try {
  writeFileSync(REPORT_PATH, report, "utf8");
} catch (error) {
  fail("reportWritten", `Could not write ${REPORT_PATH}: ${error.message}`);
}

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Schema: ${sections.schema ? "PASS" : "FAIL"}`);
console.log(`Correlation: ${sections.correlation ? "PASS" : "FAIL"}`);
console.log(`Redaction: ${sections.redaction ? "PASS" : "FAIL"}`);
console.log(`Event types: ${sections.eventTypes ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No instrumentation: ${sections.noInstrumentation ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
