import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createTriggerGatewaySummary,
  getTriggerGatewaySchema,
  getTriggerTypes,
  validateTriggerGatewaySchema,
  validateTriggerType,
} from "../trigger-gateway/index.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/trigger-gateway-schema-report.md");
const sections = {
  modules: true,
  schema: true,
  triggerTypes: true,
  policy: true,
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

console.log("NEXUS Trigger Gateway Schema Check");
console.log("==================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const policy = parseJson("policy/trigger-gateway-policy.json", "policy");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const schema = getTriggerGatewaySchema();
const summary = createTriggerGatewaySummary();
const validation = validateTriggerGatewaySchema(schema);
const triggerTypes = getTriggerTypes();

for (const file of [
  "trigger-gateway/triggerGatewaySchema.js",
  "trigger-gateway/triggerTypes.js",
  "trigger-gateway/index.js",
  "policy/trigger-gateway-policy.json",
]) {
  check(existsSync(join(ROOT, file)), "modules", `Missing file: ${file}`);
}
check(
  packageJson.scripts?.["check:trigger-gateway-schema"] === "node scripts/check-trigger-gateway-schema.js",
  "modules",
  "Missing package script check:trigger-gateway-schema",
);

check(validation.valid, "schema", `Schema validation failed: ${validation.errors.join("; ")}`);
check(summary.triggerTypes >= 9, "schema", "Schema must include at least nine trigger types");
check(summary.executionAllowed === false, "schema", "Trigger execution must be disabled");
check(summary.runtimeListenersAllowed === false, "schema", "Runtime listeners must be disabled");

for (const requiredType of [
  "manual.command_center",
  "manual.command_palette",
  "schedule.cron_preview",
  "repo.github_event_preview",
  "ticket.jira_preview",
  "ticket.linear_preview",
  "chat.slack_preview",
  "chat.teams_preview",
  "webhook.api_preview",
]) {
  const triggerType = triggerTypes.find((entry) => entry.triggerType === requiredType);
  check(Boolean(triggerType), "triggerTypes", `Missing trigger type: ${requiredType}`);
  if (triggerType) {
    check(validateTriggerType(triggerType).valid, "triggerTypes", `${requiredType} must validate`);
    check(triggerType.executionAllowed === false, "triggerTypes", `${requiredType} execution must be disabled`);
    check(triggerType.dryRunOnly === true, "triggerTypes", `${requiredType} must be dry-run only`);
  }
}

for (const field of [
  "triggerExecutionAllowed",
  "runtimeListenersAllowed",
  "realWebhookListenersAllowed",
  "schedulersAllowed",
  "providerCallsAllowed",
  "externalNetworkCallsAllowed",
  "dbWritesAllowed",
  "projectMutationAllowed",
  "workerRuntimeAllowed",
  "toolExecutionAllowed",
  "credentialUseAllowed",
]) {
  check(policy[field] === false, "policy", `Policy must set ${field} false`);
}
check(policy.dryRunOnly === true, "policy", "Policy must be dry-run only");

const docs = read("docs/architecture/TRIGGER_INTEGRATION_GATEWAY.md");
check(docs.includes("P53.1 - Trigger Gateway Schema"), "docs", "Architecture doc missing P53.1");
check(docs.includes("No runtime listeners"), "docs", "Architecture doc must state no runtime listeners");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P52")?.status === "complete", "osPhaseStatus", "P52 must remain complete");
check(["in_progress", "complete"].includes(statusById.get("P53")?.status), "osPhaseStatus", "P53 must be current");
check(["in_progress", "complete"].includes(statusById.get("P53.1")?.status), "osPhaseStatus", "P53.1 must be tracked");
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
const report = `# NEXUS Trigger Gateway Schema Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P53.1 - Trigger Gateway Schema

## Summary

- Trigger types: ${summary.triggerTypes}
- Preview-only trigger types: ${summary.previewOnlyTypes}
- Enabled-now previews: ${summary.enabledNow}
- Trigger execution allowed: ${summary.executionAllowed}
- Runtime listeners allowed: ${summary.runtimeListenersAllowed}

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Trigger types: ${sections.triggerTypes ? "PASS" : "FAIL"}
- Policy: ${sections.policy ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Non-Goals

- No trigger execution.
- No runtime listeners, schedulers, webhooks, or worker runtime.
- No provider calls, external network calls, DB writes, or project mutation.

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
console.log(`Schema: ${sections.schema ? "PASS" : "FAIL"}`);
console.log(`Trigger types: ${sections.triggerTypes ? "PASS" : "FAIL"}`);
console.log(`Policy: ${sections.policy ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
