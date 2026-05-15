import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createScheduledTriggerPreview,
  summarizeScheduledTriggers,
  validateScheduleExpression,
  validateScheduledTriggerPreview,
} from "../trigger-gateway/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/scheduled-trigger-report.md");
const sections = {
  modules: true,
  exports: true,
  schedules: true,
  commandCenter: true,
  docs: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  reportWritten: true,
};
const failures = [];

function read(relativePath) {
  const fullPath = join(ROOT, relativePath);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function parseJson(relativePath, section) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(section, `${relativePath} did not parse: ${error.message}`);
    return {};
  }
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

function changedFiles() {
  return gitOutput(["status", "--short"])
    .split("\n")
    .map((line) => line.trim().slice(3))
    .filter(Boolean);
}

console.log("NEXUS Scheduled Trigger Check");
console.log("=============================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");

check(existsSync(join(ROOT, "trigger-gateway/scheduledTrigger.js")), "modules", "Missing scheduledTrigger module");
check(
  packageJson.scripts?.["check:scheduled-trigger"] === "node scripts/check-scheduled-trigger.js",
  "modules",
  "Missing package script check:scheduled-trigger",
);
for (const fn of [
  createScheduledTriggerPreview,
  validateScheduleExpression,
  validateScheduledTriggerPreview,
  summarizeScheduledTriggers,
]) {
  check(typeof fn === "function", "exports", "Scheduled trigger export must be a function");
}

const summary = summarizeScheduledTriggers();
for (const form of ["disabled", "manual-only", "daily-preview", "weekly-preview", "cron-preview"]) {
  const preview = createScheduledTriggerPreview({
    scheduleForm: form,
    expression: form === "cron-preview" ? "0 9 * * 1" : "",
  });
  const validation = validateScheduledTriggerPreview(preview);
  check(validateScheduleExpression(preview).valid, "schedules", `${form} schedule expression must validate`);
  check(validation.valid, "schedules", `${form} scheduled preview must validate`);
  check(preview.disabledByDefault === true, "schedules", `${form} must be disabled by default`);
  check(preview.executionAllowed === false, "schedules", `${form} execution must be disabled`);
  check(preview.timerRegistrationAllowed === false, "schedules", `${form} timer registration must be disabled`);
  check(preview.workerRuntimeAllowed === false, "schedules", `${form} worker runtime must be disabled`);
  check(preview.killSwitchRequired === true, "schedules", `${form} kill switch must be required`);
}
check(summary.executionAllowedCount === 0, "schedules", "No scheduled trigger may allow execution");
check(summary.workerRuntimeEnabledCount === 0, "schedules", "No scheduled trigger may allow worker runtime");

check(commandCenterSource.includes("Scheduled triggers: Preview only"), "commandCenter", "Command Center must show scheduled preview status");
check(commandCenterSource.includes("Runtime scheduler: Not enabled"), "commandCenter", "Command Center must show scheduler disabled");
check(commandCenterSource.includes("Worker runtime: Not enabled"), "commandCenter", "Command Center must show worker disabled");

const docs = read("docs/architecture/TRIGGER_INTEGRATION_GATEWAY.md");
check(docs.includes("P53.3 - Cron / Scheduled Trigger Preview"), "docs", "Architecture doc missing P53.3");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P53.2")?.status === "complete", "osPhaseStatus", "P53.2 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P53.3")?.status), "osPhaseStatus", "P53.3 must be tracked");
check(phaseStatus.currentPhase === "P53.3", "osPhaseStatus", "Current phase must be P53.3");
check(phaseStatus.nextPhase === "P53.4", "osPhaseStatus", "Next phase must be P53.4");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Scheduled Trigger Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P53.3 - Cron / Scheduled Trigger Preview

## Summary

- Supported schedule forms: ${summary.supportedScheduleForms.join(", ")}
- Preview count: ${summary.previewCount}
- Disabled by default: ${summary.disabledByDefaultCount}
- Execution-enabled schedules: ${summary.executionAllowedCount}
- Worker-enabled schedules: ${summary.workerRuntimeEnabledCount}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Schedules: ${sections.schedules ? "PASS" : "FAIL"}
- Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Explicit Non-Goals

- No real cron registration.
- No timers.
- No background task scheduling.
- No worker runtime dependency.

## Failures

${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

## Result

${result}
`;

try {
  writeFileSync(REPORT_PATH, report, "utf8");
} catch (error) {
  fail("reportWritten", `Could not write report: ${error.message}`);
}

result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
console.log(`Modules: ${sections.modules ? "PASS" : "FAIL"}`);
console.log(`Exports: ${sections.exports ? "PASS" : "FAIL"}`);
console.log(`Schedules: ${sections.schedules ? "PASS" : "FAIL"}`);
console.log(`Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
