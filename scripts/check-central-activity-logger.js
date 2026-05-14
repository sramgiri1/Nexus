import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import {
  appendActivityEvent,
  buildActivityLoggerSummary,
  createActivityLogger,
  findActivityByCorrelationId,
  findActivityById,
  getActivityStorePath,
  logActivity,
  logActivityDryRun,
  readActivityEvents,
  readRecentActivityEvents,
  summarizeActivityStore,
  validateActivityForLogging,
} from "../observability/index.js";
import { createActivityEvent as createLoggerActivityEvent } from "../observability/activityLogger.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "central-activity-logger-report.md");
const ACTIVITY_STORE_PATH = join(ROOT, "local-state/runtime/activity.jsonl");

const sections = {
  modules: true,
  exports: true,
  policy: true,
  dryRunEvent: true,
  appendReadActivity: true,
  redaction: true,
  storeSafety: true,
  osPhaseStatus: true,
  docs: true,
  noForbiddenChanges: true,
  formatting: true,
  reportWritten: true,
};

const failures = [];
const details = {
  dryRunActivityId: "",
  appendedActivityId: "",
  correlationId: "",
  storeWarnings: [],
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

function restoreActivityStore(snapshot, existed) {
  if (existed) {
    writeFileSync(ACTIVITY_STORE_PATH, snapshot, "utf8");
  } else {
    writeFileSync(ACTIVITY_STORE_PATH, "", "utf8");
  }
}

console.log("NEXUS Central Activity Logger Check\n===================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const activityStoreExisted = existsSync(ACTIVITY_STORE_PATH);
const activityStoreSnapshot = activityStoreExisted ? readFileSync(ACTIVITY_STORE_PATH, "utf8") : "";

try {
  const requiredFiles = [
    "observability/activityLogger.js",
    "observability/activityStore.js",
    "observability/activitySchema.js",
    "observability/correlation.js",
    "observability/redactionPolicy.js",
    "observability/activityTypes.js",
    "observability/index.js",
    "policy/central-activity-logger-policy.json",
    "local-state/runtime/activity.jsonl",
    "scripts/check-central-activity-logger.js",
  ];

  for (const file of requiredFiles) {
    check(existsSync(join(ROOT, file)), "modules", `Missing required file: ${file}`);
  }

  for (const fn of [
    createActivityLogger,
    createLoggerActivityEvent,
    validateActivityForLogging,
    logActivity,
    logActivityDryRun,
    buildActivityLoggerSummary,
    getActivityStorePath,
    appendActivityEvent,
    readActivityEvents,
    readRecentActivityEvents,
    findActivityById,
    findActivityByCorrelationId,
    summarizeActivityStore,
  ]) {
    check(typeof fn === "function", "exports", "Required activity logger export is not a function");
  }

  let policy = {};
  try {
    policy = JSON.parse(read("policy/central-activity-logger-policy.json"));
  } catch (error) {
    fail("policy", `Could not parse central activity logger policy: ${error.message}`);
  }

  check(policy.phase === "P41.8.2", "policy", "Policy phase must be P41.8.2");
  check(policy.activityWritesAllowed === true, "policy", "Policy must allow activity writes");
  check(policy.appendOnly === true, "policy", "Policy must require append-only writes");
  check(policy.redactionRequired === true, "policy", "Policy must require redaction");
  check(policy.providerCallsAllowed === false, "policy", "Policy must disallow provider calls");
  check(policy.externalNetworkCallsAllowed === false, "policy", "Policy must disallow external network calls");
  check(policy.dbWritesAllowed === false, "policy", "Policy must disallow DB writes");
  check(policy.activityApiEndpointAllowed === false, "policy", "Policy must disallow activity API endpoint");

  const logger = createActivityLogger({
    scope: "NEXUS_OS_CHANGE",
    source: "checker",
    projectId: null,
  });

  const beforeDryRun = activityStoreExisted ? readFileSync(ACTIVITY_STORE_PATH, "utf8") : "";
  const dryRun = logger.dryRun({
    idOptions: { seed: "dryrunactivity" },
    category: "system",
    eventType: "service_health_checked",
    status: "success",
    summary: "Central activity logger dry-run validated.",
    metadata: { apiKey: "sk-thisfakekeyislongenoughtoberedacted" },
  });
  const afterDryRun = existsSync(ACTIVITY_STORE_PATH) ? readFileSync(ACTIVITY_STORE_PATH, "utf8") : "";
  details.dryRunActivityId = dryRun.event?.activityId || "";
  check(dryRun.ok === true, "dryRunEvent", "Dry-run activity should pass");
  check(dryRun.written === false, "dryRunEvent", "Dry-run activity must not write");
  check(dryRun.event?.activityId?.startsWith("act_"), "dryRunEvent", "Dry-run event needs act_ ID");
  check(dryRun.event?.correlationId?.startsWith("corr_"), "dryRunEvent", "Dry-run event needs corr_ ID");
  check(dryRun.event?.redacted === true, "dryRunEvent", "Dry-run event must be redacted");
  check(beforeDryRun === afterDryRun, "dryRunEvent", "Dry-run changed activity store");

  const appendResult = logActivity({
    idOptions: { seed: "appendactivity" },
    category: "system",
    eventType: "docs_check_completed",
    mode: "local-private",
    source: "checker",
    scope: "NEXUS_OS_CHANGE",
    status: "success",
    decision: "NOT_APPLICABLE",
    summary: "Central activity logger append validated.",
    metadata: { token: "secret-token-value" },
  });
  details.appendedActivityId = appendResult.event?.activityId || "";
  details.correlationId = appendResult.event?.correlationId || "";
  check(appendResult.ok === true, "appendReadActivity", "Append activity should pass");
  check(appendResult.written === true, "appendReadActivity", "Append activity should write");

  const readBack = readActivityEvents();
  check(readBack.events.some((event) => event.activityId === appendResult.event.activityId), "appendReadActivity", "Appended event not found");
  const byId = findActivityById(appendResult.event.activityId);
  check(byId.event?.activityId === appendResult.event.activityId, "appendReadActivity", "findActivityById failed");
  const byCorrelation = findActivityByCorrelationId(appendResult.event.correlationId);
  check(byCorrelation.events.length >= 1, "appendReadActivity", "findActivityByCorrelationId failed");
  check(readBack.warnings.length === 0, "appendReadActivity", "Valid JSONL should not produce warnings");

  const redactionEvent = logActivityDryRun({
    idOptions: { seed: "redactionactivity" },
    category: "security",
    eventType: "security_boundary_checked",
    mode: "local-private",
    source: "checker",
    scope: "NEXUS_OS_CHANGE",
    status: "success",
    decision: "REDACT",
    summary: "Redaction fixture validated.",
    metadata: {
      authorization: "Bearer secret",
      cookie: "session=secret",
      stack: "\n    at unsafe (/tmp/private.js:1:1)",
      source: `function demo() { return "private"; }\n${"const x = 1;\n".repeat(100)}`,
    },
  });
  const redactionText = JSON.stringify(redactionEvent.event);
  check(redactionEvent.ok === true, "redaction", "Redaction fixture should pass");
  check(!redactionText.includes("Bearer secret"), "redaction", "Authorization value was not redacted");
  check(!redactionText.includes("session=secret"), "redaction", "Cookie value was not redacted");
  check(!redactionText.includes("unsafe (/tmp/private.js"), "redaction", "Stack trace was not redacted");
  check(!redactionText.includes("function demo()"), "redaction", "Source-like snippet was not redacted");

  const storePath = getActivityStorePath();
  check(storePath.endsWith("local-state/runtime/activity.jsonl"), "storeSafety", "Store path mismatch");
  check(!isAbsolute("local-state/runtime/activity.jsonl"), "storeSafety", "Default store path should be relative by policy");
  try {
    getActivityStorePath({ storePath: "/tmp/activity.jsonl" });
    fail("storeSafety", "Absolute store path was not blocked");
  } catch {
    // expected
  }
  try {
    getActivityStorePath({ storePath: "../activity.jsonl" });
    fail("storeSafety", "Traversal store path was not blocked");
  } catch {
    // expected
  }
  writeFileSync(ACTIVITY_STORE_PATH, `${activityStoreSnapshot}\nnot-json\n`, "utf8");
  const malformedRead = readActivityEvents();
  details.storeWarnings = malformedRead.warnings;
  check(malformedRead.warnings.length >= 1, "storeSafety", "Malformed JSONL should produce warnings");

  const phaseStatusSource = read("os-roadmap/phase-status.json");
  const phaseIndexSource = read("os-roadmap/nexus-phases.json");
  let phaseStatus = {};
  try {
    phaseStatus = JSON.parse(phaseStatusSource);
  } catch (error) {
    fail("osPhaseStatus", `phase-status.json must parse: ${error.message}`);
  }
  const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
  check(phaseStatusSource.trim().length > 0, "osPhaseStatus", "phase-status.json must be non-empty");
  check(statusById.get("P41.8.1")?.status === "complete", "osPhaseStatus", "P41.8.1 must be complete");
  check(statusById.get("P41.8.1")?.commit === "30c3bea", "osPhaseStatus", "P41.8.1 commit must be 30c3bea");
  check(statusById.get("P41.8.2")?.branch === "observability/central-activity-logger", "osPhaseStatus", "P41.8.2 branch mismatch");
  check(["complete", "in_progress"].includes(statusById.get("P41.8.2")?.status), "osPhaseStatus", "P41.8.2 must be current or complete");
  check(
    ["planned", "in_progress", "complete"].includes(statusById.get("P41.8.3")?.status),
    "osPhaseStatus",
    "P41.8.3 must be planned, current, or complete"
  );
  check(phaseIndexSource.includes('"phaseId": "P41.8.3"'), "osPhaseStatus", "P41.8.3 must be indexed");

  const docs = read("docs/architecture/CENTRALIZED_ACTIVITY_LOG.md");
  for (const expected of [
    "P41.8.2 - Central Activity Logger",
    "activity.jsonl",
    "Dry-run vs append",
    "Redaction before persistence",
    "Correlation lookup",
    "P41.8.3",
  ]) {
    check(docs.includes(expected), "docs", `Centralized activity log docs missing: ${expected}`);
  }
  check(read("README.md").includes("Central Activity Logger"), "docs", "README missing central activity logger note");

  const changedFiles = listChangedFiles();
  let currentPhase = "";
  try {
    currentPhase = JSON.parse(read("os-roadmap/phase-status.json")).currentPhase || "";
  } catch {
    currentPhase = "";
  }
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
  if (!["P41.8.3", "P41.8.4", "P41.8.5", "P41.8.6"].includes(currentPhase)) {
    forbiddenPrefixes.push("local-api/");
  }
  if (!["P41.8.2A", "P41.8.3", "P41.8.4", "P41.8.5", "P41.8.6"].includes(currentPhase)) {
    forbiddenPrefixes.push("dashboard/");
  }
  for (const changedFile of changedFiles) {
    if (forbiddenPrefixes.some((prefix) => changedFile.startsWith(prefix))) {
      fail("noForbiddenChanges", `Forbidden changed file: ${changedFile}`);
    }
  }

  const sourceBundle = [
    read("observability/activityLogger.js"),
    read("observability/activityStore.js"),
    read("observability/activitySchema.js"),
  ].join("\n");
  check(!sourceBundle.includes("fetch("), "noForbiddenChanges", "Logger/store must not call external network");
  check(!sourceBundle.includes("spawn("), "noForbiddenChanges", "Logger/store must not start processes");
  check(!sourceBundle.includes("local-api"), "noForbiddenChanges", "Logger/store must not add API endpoints");

  for (const changedFile of changedFiles) {
    if (!/\.(js|json|md|jsonl)$/.test(changedFile)) continue;
    const lines = read(changedFile).split("\n");
    const longLine = lines.findIndex((line) => line.length > 1000);
    check(longLine === -1, "formatting", `${changedFile} has line over 1000 chars`);
  }
} finally {
  restoreActivityStore(activityStoreSnapshot, activityStoreExisted);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

const report = `# NEXUS Central Activity Logger Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P41.8.2 - Central Activity Logger

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Dry-run event: ${sections.dryRunEvent ? "PASS" : "FAIL"}
- Append/read activity: ${sections.appendReadActivity ? "PASS" : "FAIL"}
- Redaction: ${sections.redaction ? "PASS" : "FAIL"}
- Store safety: ${sections.storeSafety ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Logger Summary

- Dry-run activity ID: ${details.dryRunActivityId || "not generated"}
- Appended activity ID during snapshot test: ${details.appendedActivityId || "not generated"}
- Correlation ID during snapshot test: ${details.correlationId || "not generated"}
- Store path: local-state/runtime/activity.jsonl
- Store warnings observed in malformed-line test: ${details.storeWarnings.length}

## Explicit Non-Goals

- No broad runtime instrumentation was added.
- P41.8.2 itself did not add Command Center Activity Log UI.
- P41.8.2 itself did not add the /activity API endpoint.
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
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Dry-run event: ${sections.dryRunEvent ? "PASS" : "FAIL"}`);
console.log(`Append/read activity: ${sections.appendReadActivity ? "PASS" : "FAIL"}`);
console.log(`Redaction: ${sections.redaction ? "PASS" : "FAIL"}`);
console.log(`Store safety: ${sections.storeSafety ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Formatting/readability: ${sections.formatting ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
