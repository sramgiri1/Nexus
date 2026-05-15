import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildManualTriggerResponse,
  createManualTriggerRequest,
  previewManualTrigger,
  validateManualTriggerRequest,
} from "../trigger-gateway/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/manual-trigger-report.md");
const sections = {
  modules: true,
  exports: true,
  preview: true,
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

console.log("NEXUS Manual Trigger Check");
console.log("==========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const commandSource = read("dashboard/src/data/nexusCommands.js");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const routeTests = read("dashboard/tests/routes.spec.js");

check(existsSync(join(ROOT, "trigger-gateway/manualTrigger.js")), "modules", "Missing manualTrigger module");
check(
  packageJson.scripts?.["check:manual-trigger"] === "node scripts/check-manual-trigger.js",
  "modules",
  "Missing package script check:manual-trigger",
);

for (const fn of [
  createManualTriggerRequest,
  validateManualTriggerRequest,
  previewManualTrigger,
  buildManualTriggerResponse,
]) {
  check(typeof fn === "function", "exports", "Manual trigger export must be a function");
}

for (const action of ["plan", "review", "qa", "fix", "ship", "retro", "guard", "freeze", "explain"]) {
  const request = createManualTriggerRequest({ requestedAction: action });
  const validation = validateManualTriggerRequest(request);
  const preview = previewManualTrigger(request);
  const response = buildManualTriggerResponse(preview);
  check(validation.valid, "preview", `${action} request must validate`);
  check(preview.executionAllowed === false, "preview", `${action} execution must be disabled`);
  check(preview.dryRunOnly === true, "preview", `${action} must be dry-run only`);
  check(preview.taskActivationAllowed === false, "preview", `${action} must not activate tasks`);
  check(preview.agentExecutionAllowed === false, "preview", `${action} must not execute agents`);
  check(preview.providerCallsAllowed === false, "preview", `${action} must not call providers`);
  check(preview.projectMutationAllowed === false, "preview", `${action} must not mutate projects`);
  check(response.message.includes("Preview only"), "preview", `${action} response must say preview only`);
}

check(commandSource.includes("triggerPreview"), "commandCenter", "Command data must include trigger preview metadata");
check(commandSource.includes("previewManualTrigger"), "commandCenter", "Command data must use manual trigger preview");
check(commandCenterSource.includes("Trigger preview"), "commandCenter", "Command Palette must show trigger preview");
check(commandCenterSource.includes("Preview only - trigger execution is not enabled yet"), "commandCenter", "Command Palette must show preview-only copy");
check(routeTests.includes("Command Palette shows manual trigger preview state"), "commandCenter", "Route tests must cover manual trigger preview");

const docs = read("docs/architecture/TRIGGER_INTEGRATION_GATEWAY.md");
check(docs.includes("P53.2 - Manual Command Center Trigger"), "docs", "Architecture doc missing P53.2");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P53.1")?.status === "complete", "osPhaseStatus", "P53.1 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P53.2")?.status), "osPhaseStatus", "P53.2 must be tracked");
check(phaseStatus.currentPhase?.startsWith("P53"), "osPhaseStatus", "Current phase must be a P53 phase");
check(Boolean(statusById.get(phaseStatus.nextPhase)), "osPhaseStatus", "Next phase must exist in phase status");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Manual Trigger Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P53.2 - Manual Command Center Trigger

## Summary

- Manual trigger previews: Plan, Review, QA, Fix, Ship, Retro, Guard, Freeze, Explain
- Trigger execution: disabled
- Task activation: disabled
- Agent execution: disabled
- Provider/tool calls: disabled
- Project mutation: disabled

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Exports: ${sections.exports ? "PASS" : "FAIL"}
- Preview: ${sections.preview ? "PASS" : "FAIL"}
- Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

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
console.log(`Preview: ${sections.preview ? "PASS" : "FAIL"}`);
console.log(`Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
