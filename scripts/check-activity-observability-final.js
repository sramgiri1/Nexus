import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  appendActivityEvent,
  buildActivityTrace,
  createActivityContext,
  createActivityEvent,
  getActivityStorePath,
  getRequiredActivityFields,
  logActivityDryRun,
  recordActionBridgeActivity,
  recordActivityFailure,
  recordApiActivity,
  recordUiActivity,
  sanitizeActivityPayload,
  summarizeActivityTrace,
  validateActivityEvent,
  validateActivityTrace,
} from "../observability/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/activity-observability-final-report.md");

const sections = {
  schema: true,
  centralLogger: true,
  activityCapture: true,
  traceView: true,
  localApi: true,
  commandCenterUi: true,
  reports: true,
  osPhaseStatus: true,
  docs: true,
  noForbiddenChanges: true,
  formatting: true,
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

console.log("NEXUS Activity Observability Final Check\n========================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of [
  "observability/activitySchema.js",
  "observability/activityTypes.js",
  "observability/correlation.js",
  "observability/redactionPolicy.js",
]) {
  check(existsSync(join(ROOT, file)), "schema", `Missing schema module: ${file}`);
}

const event = createActivityEvent({
  idOptions: { seed: "finalactivity" },
  category: "system",
  eventType: "roadmap_status_updated",
  mode: "local-private",
  source: "checker",
  scope: "NEXUS_OS_CHANGE",
  status: "success",
  decision: "NOT_APPLICABLE",
  summary: "Activity observability final validation event.",
  metadata: { apiKey: "sk-finalvalidationfakekeymustredact" },
});
check(validateActivityEvent(event).ok, "schema", "Activity event schema validation failed");
check(event.metadata.apiKey === "[REDACTED]", "schema", "Activity schema did not redact secret-like metadata");
check(getRequiredActivityFields().includes("correlationId"), "schema", "Activity schema must require correlationId");
check(sanitizeActivityPayload({ accessToken: "secret-token-value" }).accessToken === "[REDACTED]", "schema", "Redaction policy did not redact access token");

for (const file of [
  "observability/activityLogger.js",
  "observability/activityStore.js",
  "local-state/runtime/activity.jsonl",
]) {
  check(existsSync(join(ROOT, file)), "centralLogger", `Missing logger/store artifact: ${file}`);
}
const dryRun = logActivityDryRun({
  idOptions: { seed: "finaldryrun" },
  category: "docs",
  eventType: "docs_check_completed",
  mode: "local-private",
  source: "checker",
  scope: "NEXUS_OS_CHANGE",
  status: "success",
  decision: "NOT_APPLICABLE",
  summary: "Dry-run activity logging validated.",
});
check(dryRun.ok === true && dryRun.written === false, "centralLogger", "Dry-run logger must pass without writing");
check(getActivityStorePath().endsWith("local-state/runtime/activity.jsonl"), "centralLogger", "Activity store path must be local runtime JSONL");
check(typeof appendActivityEvent === "function", "centralLogger", "Append helper must remain available for governed logger use");

const context = createActivityContext({
  source: "checker",
  scope: "NEXUS_OS_CHANGE",
  idOptions: { seed: "finalcontext" },
});
const captureResults = [
  recordUiActivity({ traceContext: context, eventType: "operator_action_requested", summary: "UI capture dry-run." }, { dryRun: true }),
  recordApiActivity({ traceContext: context, eventType: "local_api_request_completed", summary: "API capture dry-run." }, { dryRun: true }),
  recordActionBridgeActivity({ traceContext: context, eventType: "mission_compose_completed", summary: "Action capture dry-run." }, { dryRun: true }),
  recordActivityFailure({ traceContext: context, category: "api", source: "local_api", eventType: "local_api_request_failed", summary: "Failure capture dry-run.", error: new Error("redacted") }, { dryRun: true }),
];
check(captureResults.every((result) => result.ok === true && result.written === false), "activityCapture", "Capture helpers must pass in dry-run mode");
check(captureResults.every((result) => result.event?.redacted === true), "activityCapture", "Capture helper events must remain redacted");

const trace = buildActivityTrace(captureResults.map((result) => result.event), context.correlationId);
const traceSummary = summarizeActivityTrace(trace);
check(validateActivityTrace(trace).ok, "traceView", "Activity trace validation failed");
check(trace.eventCount >= 4, "traceView", "Trace should include UI/API/action/failure dry-run records");
check(trace.timeline.every((entry) => entry.redacted === true), "traceView", "Trace timeline entries must be redacted");
check(traceSummary.redacted === true, "traceView", "Trace summary must remain redacted");

const activityRoute = read("local-api/routes/activity.js");
check(activityRoute.includes("buildActivityTrace"), "localApi", "/activity route must build traces");
check(activityRoute.includes("traceRequested"), "localApi", "/activity route must support trace requests");
check(activityRoute.includes("correlationSummaries"), "localApi", "/activity summary must include correlation summaries");
check(!activityRoute.includes("appendActivityEvent"), "localApi", "/activity route must remain read-only");
check(!activityRoute.includes("DATABASE_URL"), "localApi", "/activity route must not use production DB");

const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
for (const expected of [
  "ActivityLogPage",
  "ActivityFilterBar",
  "ActivityTracePanel",
  "Trace Details",
  "Trace drilldown available",
  "No captured activity records are available",
]) {
  check(commandCenterSource.includes(expected), "commandCenterUi", `Command Center Activity Log missing: ${expected}`);
}
for (const forbidden of ["raw JSON dump", "raw log dump", "Provider traces enabled", "Worker traces enabled"]) {
  check(!commandCenterSource.includes(forbidden), "commandCenterUi", `Activity Log contains unsafe/misleading copy: ${forbidden}`);
}

for (const report of [
  "reports/activity-event-schema-report.md",
  "reports/central-activity-logger-report.md",
  "reports/activity-capture-report.md",
  "reports/activity-trace-view-report.md",
]) {
  const source = read(report);
  check(source.includes("Validation branch:"), "reports", `${report} missing validation branch metadata`);
  check(source.includes("Validation HEAD:"), "reports", `${report} missing validation HEAD metadata`);
  check(source.includes("Note: Validation HEAD is the commit checked out"), "reports", `${report} missing validation note`);
}

let phaseStatus = {};
try {
  phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
} catch (error) {
  fail("osPhaseStatus", `phase-status.json does not parse: ${error.message}`);
}
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P41.8")?.status === "complete", "osPhaseStatus", "P41.8 parent phase must be complete");
check(statusById.get("P41.8.5")?.status === "complete", "osPhaseStatus", "P41.8.5 must be complete");
check(statusById.get("P41.8.5")?.commit === "a473bc0", "osPhaseStatus", "P41.8.5 commit must be a473bc0");
check(["complete", "in_progress"].includes(statusById.get("P41.8.6")?.status), "osPhaseStatus", "P41.8.6 must be current or complete");
check(statusById.get("P41.8.6")?.branch === "observability/activity-final-validation", "osPhaseStatus", "P41.8.6 branch mismatch");
check(phaseStatus.nextPhase === "P41.9", "osPhaseStatus", "P41.9 must be next");
check(statusById.get("P41.9")?.status === "planned", "osPhaseStatus", "P41.9 must be planned");

for (const [file, expected] of [
  ["docs/architecture/CENTRALIZED_ACTIVITY_LOG.md", "P41.8.6 - Activity Tests + Docs + Final Validation"],
  ["docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md", "How to Use the Activity Log"],
  ["docs/usage/COMMAND_CENTER_GUIDE.md", "Activity Log"],
  ["docs/codebase/MODULE_REGISTRY.md", "Observability Activity Modules"],
  ["docs/codebase/PHASE_MODULE_INDEX.md", "P41.8.6"],
  ["README.md", "P41.8 complete"],
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
const changedSource = changedFiles.map(read).join("\n");
check(!changedSource.includes("fetch(\"https://"), "noForbiddenChanges", "Changes must not add external network calls");

for (const changedFile of changedFiles) {
  if (!/\.(js|jsx|json|md|css)$/.test(changedFile)) continue;
  const longLine = read(changedFile).split("\n").findIndex((line) => line.length > 1000);
  check(longLine === -1, "formatting", `${changedFile} has a line over 1000 characters`);
}

const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Activity Observability Final Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.8.6 - Activity Tests + Docs + Final Validation

## Checks

- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Central logger: ${sections.centralLogger ? "PASS" : "FAIL"}
- Activity capture: ${sections.activityCapture ? "PASS" : "FAIL"}
- Trace view: ${sections.traceView ? "PASS" : "FAIL"}
- Local API: ${sections.localApi ? "PASS" : "FAIL"}
- Command Center UI: ${sections.commandCenterUi ? "PASS" : "FAIL"}
- Reports: ${sections.reports ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}

## Activity Observability Summary

- Schema/correlation model: validated.
- Central logger and local append-only JSONL store: validated in dry-run/read path.
- UI/API/action bridge capture helpers: validated in dry-run mode.
- Trace view by correlation ID: validated with redacted timeline output.
- Activity Log Command Center page: validated as the operator-facing observability surface.

## Non-Goals Preserved

- Provider/tool/worker instrumentation remains disabled.
- DB-backed activity storage remains disabled.
- Retention, export, telemetry, SLOs, and production observability stack remain future work.
- Private project files were not modified.

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

writeFileSync(REPORT_PATH, report, "utf8");

console.log(`Schema: ${sections.schema ? "PASS" : "FAIL"}`);
console.log(`Central logger: ${sections.centralLogger ? "PASS" : "FAIL"}`);
console.log(`Activity capture: ${sections.activityCapture ? "PASS" : "FAIL"}`);
console.log(`Trace view: ${sections.traceView ? "PASS" : "FAIL"}`);
console.log(`Local API: ${sections.localApi ? "PASS" : "FAIL"}`);
console.log(`Command Center UI: ${sections.commandCenterUi ? "PASS" : "FAIL"}`);
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
