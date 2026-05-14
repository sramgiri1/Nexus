import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildActivityTrace,
  buildTraceTimeline,
  findRelatedActivity,
  groupTraceByCategory,
  groupTraceBySource,
  summarizeActivityTrace,
  validateActivityTrace,
} from "../observability/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/activity-trace-view-report.md");

const sections = {
  modules: true,
  exports: true,
  traceModel: true,
  localApi: true,
  commandCenterUi: true,
  playwright: true,
  osPhaseStatus: true,
  docs: true,
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
  const staged = gitOutput(["diff", "--cached", "--name-only"]);
  const untracked = gitOutput(["ls-files", "--others", "--exclude-standard"]);
  return [...output.split("\n"), ...staged.split("\n"), ...untracked.split("\n")].filter(Boolean);
}

console.log("NEXUS Activity Trace View Check\n===============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of [
  "observability/activityTrace.js",
  "observability/index.js",
  "local-api/routes/activity.js",
  "dashboard/src/pages/CommandCenterV2.jsx",
  "dashboard/tests/routes.spec.js",
  "scripts/check-activity-trace-view.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing required file: ${file}`);
}

for (const fn of [
  buildActivityTrace,
  summarizeActivityTrace,
  groupTraceByCategory,
  groupTraceBySource,
  findRelatedActivity,
  validateActivityTrace,
  buildTraceTimeline,
]) {
  check(typeof fn === "function", "exports", "Required activity trace export is not a function");
}

const events = [
  {
    activityId: "act_tracecheck001",
    correlationId: "corr_tracecheck001",
    timestamp: "2026-05-14T10:00:00.000Z",
    category: "ui",
    eventType: "operator_action_requested",
    source: "command_center",
    status: "success",
    decision: "ALLOW",
    summary: "Operator selected a trace.",
    taskId: "task-trace-check",
    agentId: "NEXUS",
    evidenceIds: ["ev_trace_check"],
    auditIds: ["audit_trace_check"],
    redacted: true,
  },
  {
    activityId: "act_tracecheck002",
    parentActivityId: "act_tracecheck001",
    correlationId: "corr_tracecheck001",
    timestamp: "2026-05-14T10:00:02.000Z",
    category: "api",
    eventType: "local_api_request_completed",
    source: "local_api",
    status: "success",
    decision: "ALLOW",
    summary: "Local API returned a redacted trace.",
    taskId: "task-trace-check",
    agentId: "NEXUS",
    evidenceIds: ["ev_trace_check"],
    auditIds: ["audit_trace_check"],
    redacted: true,
  },
];
const trace = buildActivityTrace(events, "corr_tracecheck001");
const summary = summarizeActivityTrace(trace);
const emptyTrace = buildActivityTrace(events, "corr_missing_trace");
const validation = validateActivityTrace(trace);

check(trace.traceVersion === "1.0", "traceModel", "Trace version must be 1.0");
check(trace.correlationId === "corr_tracecheck001", "traceModel", "Trace correlation ID mismatch");
check(trace.eventCount === 2, "traceModel", "Trace must include matching events");
check(trace.timeline[0]?.activityId === "act_tracecheck001", "traceModel", "Trace timeline must be timestamp ordered");
check(trace.timeline.every((item) => item.redacted === true), "traceModel", "Trace timeline entries must be redacted");
check(trace.related.taskIds.includes("task-trace-check"), "traceModel", "Trace must include related task IDs");
check(trace.related.evidenceIds.includes("ev_trace_check"), "traceModel", "Trace must include related evidence IDs");
check(summary.redacted === true, "traceModel", "Trace summary must remain redacted");
check(validation.ok === true, "traceModel", `Trace validation failed: ${validation.errors.join("; ")}`);
check(emptyTrace.eventCount === 0, "traceModel", "Empty trace must be safe when no events match");
check(findRelatedActivity(events, "act_tracecheck001").length >= 1, "traceModel", "Related activity lookup failed");

const activityRouteSource = read("local-api/routes/activity.js");
check(activityRouteSource.includes("buildActivityTrace"), "localApi", "Activity route must build traces");
check(activityRouteSource.includes("traceRequested"), "localApi", "Activity route must support trace requests");
check(activityRouteSource.includes("/activity/"), "localApi", "Activity route must support /activity/:correlationId");
check(activityRouteSource.includes("correlationSummaries"), "localApi", "Activity summary must include correlation summaries");
check(!activityRouteSource.includes("appendActivityEvent"), "localApi", "Trace endpoint must not write activity records");

const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
for (const expected of [
  "ActivityTracePanel",
  "Trace Details",
  "Select a correlation ID from the activity list to inspect the full trace.",
  "Copy correlation ID",
  "Clear selection",
  "Open trace",
  "Trace drilldown available",
]) {
  check(commandCenterSource.includes(expected), "commandCenterUi", `Activity Log missing trace UI copy: ${expected}`);
}
check(commandCenterSource.includes("fetchActivityTrace"), "commandCenterUi", "Activity Log should call trace endpoint when available");
check(!commandCenterSource.includes("raw JSON dumps"), "commandCenterUi", "Activity Log should not promote raw JSON dumps");

const routeTestSource = read("dashboard/tests/routes.spec.js");
for (const expected of [
  "corr_traceview001",
  "Trace Details",
  "Copy correlation ID",
  "Local API returned redacted activity trace.",
]) {
  check(routeTestSource.includes(expected), "playwright", `Route tests missing trace coverage: ${expected}`);
}

let phaseStatus = {};
try {
  phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
} catch (error) {
  fail("osPhaseStatus", `phase-status.json must parse: ${error.message}`);
}
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P41.8.4")?.status === "complete", "osPhaseStatus", "P41.8.4 must be complete");
check(statusById.get("P41.8.4")?.branch === "observability/activity-log-command-center-page", "osPhaseStatus", "P41.8.4 branch mismatch");
check(statusById.get("P41.8.4")?.commit === "5c6b80d", "osPhaseStatus", "P41.8.4 commit must be 5c6b80d");
check(["in_progress", "complete"].includes(statusById.get("P41.8.5")?.status), "osPhaseStatus", "P41.8.5 must be current or complete");
check(statusById.get("P41.8.5")?.branch === "observability/activity-trace-view", "osPhaseStatus", "P41.8.5 branch mismatch");
check(statusById.get("P41.8.5")?.nextPhase === "P41.8.6", "osPhaseStatus", "P41.8.5 next phase must be P41.8.6");

for (const [file, expected] of [
  ["docs/architecture/CENTRALIZED_ACTIVITY_LOG.md", "P41.8.5 - Trace View by Correlation ID"],
  ["docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md", "Trace View by Correlation ID"],
  ["README.md", "P41.8.5"],
]) {
  check(read(file).includes(expected), "docs", `${file} missing ${expected}`);
}

const changedFiles = listChangedFiles();
const forbiddenPrefixes = [
  "projects/careloop/",
  "projects/careloop-ios/",
  "agents/",
  "orchestrator/",
  "providers/",
  "tools/",
  "state-machine/",
  "command-execution/",
  "db/",
];
for (const changedFile of changedFiles) {
  if (forbiddenPrefixes.some((prefix) => changedFile.startsWith(prefix))) {
    fail("noForbiddenChanges", `Forbidden changed file: ${changedFile}`);
  }
}

for (const changedFile of changedFiles) {
  if (!/\.(js|jsx|json|md|css)$/.test(changedFile)) continue;
  const longLine = read(changedFile).split("\n").findIndex((line) => line.length > 1000);
  check(longLine === -1, "formatting", `${changedFile} has a line over 1000 characters`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Activity Trace View Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.8.5 - Trace View by Correlation ID

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Trace model: ${sections.traceModel ? "PASS" : "FAIL"}
- Local API: ${sections.localApi ? "PASS" : "FAIL"}
- Command Center UI: ${sections.commandCenterUi ? "PASS" : "FAIL"}
- Playwright coverage: ${sections.playwright ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Trace Summary

- Correlation ID tested: ${trace.correlationId}
- Event count: ${trace.eventCount}
- Status: ${trace.status}
- Related tasks: ${trace.related.taskIds.join(", ") || "none"}
- Related evidence: ${trace.related.evidenceIds.join(", ") || "none"}
- Empty trace event count: ${emptyTrace.eventCount}

## Behavior

- GET /activity/:correlationId returns a redacted trace envelope.
- GET /activity includes recent correlation summaries and trace counts.
- Command Center Activity Log can open Trace Details from a correlation ID.

## Non-Goals Preserved

- No worker/provider/tool/DB-backed instrumentation was added.
- No DB writes or production DB behavior was added.
- No private project source files were modified.

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
console.log(`Trace model: ${sections.traceModel ? "PASS" : "FAIL"}`);
console.log(`Local API: ${sections.localApi ? "PASS" : "FAIL"}`);
console.log(`Command Center UI: ${sections.commandCenterUi ? "PASS" : "FAIL"}`);
console.log(`Playwright coverage: ${sections.playwright ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
