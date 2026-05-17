import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  createActivityContext,
  recordActionBridgeActivity,
  recordActivityFailure,
  recordApiActivity,
  recordUiActivity,
  withActivityCapture,
} from "../observability/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/activity-capture-report.md");

const sections = {
  modules: true,
  exports: true,
  policy: true,
  captureHelpers: true,
  localApi: true,
  actionBridge: true,
  commandCenterUi: true,
  osPhaseStatus: true,
  docs: true,
  noForbiddenChanges: true,
  formatting: true,
  reportWritten: true,
};
const failures = [];
const details = {
  uiActivityId: "",
  apiActivityId: "",
  actionActivityId: "",
  failureActivityId: "",
};

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

function isAllowedCareLoopMetadata(file) {
  return [
    "projects/careloop/nexus.project.json",
    "projects/careloop/docs/NEXUS_CARELOOP_PHASE_2.md",
    "projects/careloop/docs/NEXUS_PROJECT_STATUS.md",
  ].includes(file);
}

console.log("NEXUS Activity Capture Check\n============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

for (const file of [
  "observability/activityCapture.js",
  "observability/index.js",
  "local-api/routes/activity.js",
  "local-api/server.js",
  "policy/activity-capture-policy.json",
  "scripts/check-activity-capture.js",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing required file: ${file}`);
}

for (const fn of [
  createActivityContext,
  withActivityCapture,
  recordUiActivity,
  recordApiActivity,
  recordActionBridgeActivity,
  recordActivityFailure,
]) {
  check(typeof fn === "function", "exports", "Required activity capture export is not a function");
}

let policy = {};
try {
  policy = JSON.parse(read("policy/activity-capture-policy.json"));
} catch (error) {
  fail("policy", `Could not parse activity capture policy: ${error.message}`);
}
check(policy.phase === "P41.8.3", "policy", "Policy phase must be P41.8.3");
check(policy.activityWritesAllowed === true, "policy", "Policy must allow activity writes");
check(policy.activityApiAllowed === "local_read_only", "policy", "Policy must keep activity API read-only");
check(policy.providerCallsAllowed === false, "policy", "Policy must disallow provider calls");
check(policy.externalNetworkCallsAllowed === false, "policy", "Policy must disallow external network calls");
check(policy.dbWritesAllowed === false, "policy", "Policy must disallow DB writes");
check(policy.rawPayloadLoggingAllowed === false, "policy", "Policy must block raw payload logging");

const context = createActivityContext({
  source: "checker",
  scope: "NEXUS_OS_CHANGE",
  projectId: "private-project-01",
});
check(context.correlationId?.startsWith("corr_"), "captureHelpers", "Activity context needs corr_ ID");

const ui = recordUiActivity({
  traceContext: context,
  eventType: "operator_action_requested",
  summary: "Command Center docs guide card opened.",
  metadata: { route: "/command-center/docs/running-nexus-locally" },
}, { dryRun: true });
const api = recordApiActivity({
  traceContext: context,
  eventType: "local_api_request_completed",
  route: "/activity",
  summary: "Local API /activity read completed.",
}, { dryRun: true });
const action = recordActionBridgeActivity({
  traceContext: context,
  actionType: "mission.compose",
  eventType: "mission_compose_completed",
  summary: "Mission compose bridge completed.",
}, { dryRun: true });
const failure = recordActivityFailure({
  traceContext: context,
  category: "api",
  source: "local_api",
  eventType: "local_api_request_failed",
  summary: "Local API read failed.",
  error: new Error("redacted checker failure"),
}, { dryRun: true });

details.uiActivityId = ui.event?.activityId || "";
details.apiActivityId = api.event?.activityId || "";
details.actionActivityId = action.event?.activityId || "";
details.failureActivityId = failure.event?.activityId || "";

for (const [label, result] of Object.entries({ ui, api, action, failure })) {
  check(result.ok === true, "captureHelpers", `${label} capture dry-run should pass`);
  check(result.written === false, "captureHelpers", `${label} dry-run must not write`);
  check(result.event?.redacted === true, "captureHelpers", `${label} event must be redacted`);
}

const serverSource = read("local-api/server.js");
const activityRouteSource = read("local-api/routes/activity.js");
check(serverSource.includes("recordApiActivity"), "localApi", "local API server must record API activity");
check(serverSource.includes("recordActivityFailure"), "localApi", "local API server must record API failures");
check(serverSource.includes("handleActivity"), "localApi", "local API server must expose /activity route");
check(activityRouteSource.includes("readRecentActivityEvents"), "localApi", "/activity route must read activity store");
check(activityRouteSource.includes("summarizeRecord"), "localApi", "/activity route must return summarized records");
check(!activityRouteSource.includes("appendActivityEvent"), "localApi", "/activity route must not append records");

for (const file of [
  "mission-actions/missionActionBridge.js",
  "task-actions/taskActivationBridge.js",
  "workbench/reviewBridge.js",
  "implementation-actions/implementationBridge.js",
]) {
  const source = read(file);
  check(source.includes("withActivityCapture"), "actionBridge", `${file} must use activity capture wrapper`);
}

const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const clientSource = read("dashboard/src/api/localApiClient.js");
check(clientSource.includes("getActivity"), "commandCenterUi", "local API client must expose getActivity");
check(commandCenterSource.includes("Activity Log is ready for summarized local records."), "commandCenterUi", "Activity Log must be a real operator page");
for (const label of ["Overview", "Timeline", "By Agent", "By Task", "Failures & Blocks", "API & Actions", "Correlations"]) {
  check(commandCenterSource.includes(label), "commandCenterUi", `Activity Log missing tab/copy: ${label}`);
}
check(commandCenterSource.includes("ActivityFilterBar"), "commandCenterUi", "Activity Log must include filters");
check(commandCenterSource.includes("No matching activity records"), "commandCenterUi", "Activity Log must include no-results empty state");
check(commandCenterSource.includes("No captured activity records"), "commandCenterUi", "Activity Log must show useful empty state");
check(commandCenterSource.includes("UI/API/action instrumentation"), "commandCenterUi", "Activity Log must show capture readiness");

let phaseStatus = {};
try {
  phaseStatus = JSON.parse(read("os-roadmap/phase-status.json"));
} catch (error) {
  fail("osPhaseStatus", `phase-status.json must parse: ${error.message}`);
}
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P41.8.2A")?.commit === "e2e7c88", "osPhaseStatus", "P41.8.2A commit must be e2e7c88");
check(statusById.get("P41.8.3")?.branch === "observability/activity-capture-wiring", "osPhaseStatus", "P41.8.3 branch mismatch");
check(statusById.get("P41.8.3")?.status === "complete", "osPhaseStatus", "P41.8.3 must be complete");
check(statusById.get("P41.8.3")?.commit === "adcc916", "osPhaseStatus", "P41.8.3 commit must be adcc916");
check(statusById.get("P41.8.3")?.nextPhase === "P41.8.4", "osPhaseStatus", "P41.8.3 next phase must be P41.8.4");
check(statusById.get("P41.8.4")?.branch === "observability/activity-log-command-center-page", "osPhaseStatus", "P41.8.4 branch mismatch");
check(["in_progress", "complete"].includes(statusById.get("P41.8.4")?.status), "osPhaseStatus", "P41.8.4 must be current or complete");
check(statusById.get("P41.8.4")?.nextPhase === "P41.8.5", "osPhaseStatus", "P41.8.4 next phase must be P41.8.5");

for (const [file, expected] of [
  ["docs/architecture/CENTRALIZED_ACTIVITY_LOG.md", "P41.8.3 - API / UI / Action Bridge Activity Capture"],
  ["docs/architecture/CENTRALIZED_ACTIVITY_LOG.md", "P41.8.4 - Command Center Activity Log Page"],
  ["docs/usage/UNDERSTANDING_EVIDENCE_AUDIT.md", "Activity Capture"],
  ["README.md", "P41.8.4"],
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
  if (isAllowedCareLoopMetadata(changedFile)) continue;
  if (forbiddenPrefixes.some((prefix) => changedFile.startsWith(prefix))) {
    fail("noForbiddenChanges", `Forbidden changed file: ${changedFile}`);
  }
}

const captureSource = read("observability/activityCapture.js");
check(!captureSource.includes("fetch("), "noForbiddenChanges", "Activity capture must not call external network");
check(!captureSource.includes("spawn("), "noForbiddenChanges", "Activity capture must not start processes");
check(!captureSource.includes("DATABASE_URL"), "noForbiddenChanges", "Activity capture must not use production DB");

for (const changedFile of changedFiles) {
  if (!/\.(js|json|md|jsonl|css|jsx)$/.test(changedFile)) continue;
  const lines = read(changedFile).split("\n");
  const longLine = lines.findIndex((line) => line.length > 1000);
  check(longLine === -1, "formatting", `${changedFile} has line over 1000 chars`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Activity Capture Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.8.3 - API / UI / Action Bridge Activity Capture

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Capture helpers: ${sections.captureHelpers ? "PASS" : "FAIL"}
- Local API: ${sections.localApi ? "PASS" : "FAIL"}
- Action bridge: ${sections.actionBridge ? "PASS" : "FAIL"}
- Command Center UI: ${sections.commandCenterUi ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Capture Summary

- UI capture helper dry-run event: ${details.uiActivityId || "not generated"}
- API capture helper dry-run event: ${details.apiActivityId || "not generated"}
- Action bridge capture helper dry-run event: ${details.actionActivityId || "not generated"}
- Failure capture helper dry-run event: ${details.failureActivityId || "not generated"}
- Local activity API: GET /activity, read-only, summarized records only

## Captured Now

- Local API read requests and failures.
- Governed action bridge requests and outcomes for mission compose, task activation, human review, and implementation.
- Command Center Activity Log display for summarized records from the local activity store.

## Still Deferred

- Browser-only UI click persistence without a governed capture endpoint.
- Provider/tool/worker activity capture.
- DB-backed activity storage.
- Retention/export for correlation trace records.

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
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Capture helpers: ${sections.captureHelpers ? "PASS" : "FAIL"}`);
console.log(`Local API: ${sections.localApi ? "PASS" : "FAIL"}`);
console.log(`Action bridge: ${sections.actionBridge ? "PASS" : "FAIL"}`);
console.log(`Command Center UI: ${sections.commandCenterUi ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
