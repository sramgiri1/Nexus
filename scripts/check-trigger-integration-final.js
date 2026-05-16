import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createTriggerGatewaySummary,
  validateTriggerGatewaySchema,
  getTriggerGatewaySchema,
  previewManualTrigger,
  createManualTriggerRequest,
  summarizeScheduledTriggers,
} from "../trigger-gateway/index.js";
import { getGitHubTriggerCatalog, createGitHubEventPreview, validateGitHubEventPreview } from "../integrations/githubTriggerPreview.js";
import { getTicketTriggerCatalog, createTicketTriggerPreview, validateTicketTriggerPreview } from "../integrations/ticketTriggerPreview.js";
import { getChatTriggerCatalog, createChatTriggerPreview, validateChatTriggerPreview } from "../integrations/chatTriggerPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/trigger-integration-final-report.md");
const sections = {
  schema: true,
  manual: true,
  scheduled: true,
  github: true,
  ticket: true,
  chat: true,
  commandCenter: true,
  reports: true,
  osPhaseStatus: true,
  safetyBoundaries: true,
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

console.log("NEXUS Trigger Integration Final Check");
console.log("=====================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "reports");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const policy = parseJson("policy/trigger-gateway-policy.json", "safetyBoundaries");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const routeSource = read("dashboard/src/data/commandCenterRoutes.js");
const routeTests = read("dashboard/tests/routes.spec.js");

const schemaValidation = validateTriggerGatewaySchema(getTriggerGatewaySchema());
const triggerSummary = createTriggerGatewaySummary();
const manualPreview = previewManualTrigger(createManualTriggerRequest({ requestedAction: "plan" }));
const scheduledSummary = summarizeScheduledTriggers();
const githubPreview = createGitHubEventPreview({ eventType: "workflow_run.failed" });
const ticketPreview = createTicketTriggerPreview({ system: "jira_preview", eventType: "issue.created" });
const chatPreview = createChatTriggerPreview({ system: "slack_preview", command: "/nexus plan" });

check(schemaValidation.valid, "schema", `Schema invalid: ${schemaValidation.errors.join("; ")}`);
check(triggerSummary.triggerTypes >= 9, "schema", "Trigger schema must include trigger types");
check(manualPreview.executionAllowed === false && manualPreview.dryRunOnly === true, "manual", "Manual preview must be dry-run only");
check(manualPreview.taskActivationAllowed === false, "manual", "Manual preview must not activate tasks");
check(scheduledSummary.executionAllowedCount === 0, "scheduled", "Scheduled previews must not execute");
check(scheduledSummary.workerRuntimeEnabledCount === 0, "scheduled", "Scheduled previews must not enable workers");
check(validateGitHubEventPreview(githubPreview).valid, "github", "GitHub preview must validate");
check(getGitHubTriggerCatalog().length >= 7, "github", "GitHub catalog must include supported events");
check(validateTicketTriggerPreview(ticketPreview).valid, "ticket", "Ticket preview must validate");
check(getTicketTriggerCatalog().length >= 12, "ticket", "Ticket catalog must include Jira and Linear events");
check(validateChatTriggerPreview(chatPreview).valid, "chat", "Chat preview must validate");
check(getChatTriggerCatalog().length >= 16, "chat", "Chat catalog must include Slack and Teams commands");

for (const scriptName of [
  "check:trigger-integration-final",
  "check:trigger-gateway-schema",
  "check:manual-trigger",
  "check:scheduled-trigger",
  "check:github-trigger-preview",
  "check:ticket-trigger-preview",
  "check:chat-trigger-preview",
]) {
  check(Boolean(packageJson.scripts?.[scriptName]), "reports", `Missing package script ${scriptName}`);
}
for (const report of [
  "reports/trigger-gateway-schema-report.md",
  "reports/manual-trigger-report.md",
  "reports/scheduled-trigger-report.md",
  "reports/github-trigger-preview-report.md",
  "reports/ticket-trigger-preview-report.md",
  "reports/chat-trigger-preview-report.md",
]) {
  check(existsSync(join(ROOT, report)), "reports", `Missing report: ${report}`);
  check(read(report).includes("Validation HEAD"), "reports", `${report} missing Validation HEAD wording`);
}

check(routeSource.includes("/command-center/triggers"), "commandCenter", "Command Center route missing /command-center/triggers");
check(commandCenterSource.includes("TriggerIntegrationPage"), "commandCenter", "TriggerIntegrationPage missing");
check(commandCenterSource.includes("Preview-only trigger gateway"), "commandCenter", "Trigger page missing preview-only copy");
check(commandCenterSource.includes("Execution disabled"), "commandCenter", "Trigger page missing execution disabled copy");
check(routeTests.includes("Trigger Gateway route renders preview-only integration metadata"), "commandCenter", "Route tests missing trigger page coverage");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
for (const phaseId of ["P53.1", "P53.2", "P53.3", "P53.4", "P53.5", "P53.6", "P53.7"]) {
  check(statusById.get(phaseId)?.status === "complete", "osPhaseStatus", `${phaseId} must be complete`);
}
check(statusById.get("P53")?.status === "complete", "osPhaseStatus", "P53 parent must be complete");
check(
  ["P53.7", "P54", "P54.1", "P54.2", "P54.3", "P54.4", "P54.5", "P54.6", "P54.7", "P54.8", "P54.9"].includes(
    phaseStatus.currentPhase,
  ),
  "osPhaseStatus",
  "Current phase must be P53.7 or a later P54 phase",
);
check(["P54", "P54.1", "P54.2", "P54.3", "P54.4", "P54.5", "P54.6", "P54.7", "P54.8", "P54.9", "P55"].includes(phaseStatus.nextPhase), "osPhaseStatus", "Next phase must be P54 or later");

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
  check(policy[field] === false, "safetyBoundaries", `Policy must set ${field} false`);
}
for (const sourceFile of [
  "integrations/githubTriggerPreview.js",
  "integrations/ticketTriggerPreview.js",
  "integrations/chatTriggerPreview.js",
  "trigger-gateway/scheduledTrigger.js",
]) {
  const source = read(sourceFile);
  check(!source.includes("fetch("), "safetyBoundaries", `${sourceFile} must not call fetch`);
  check(!source.includes("child_process"), "safetyBoundaries", `${sourceFile} must not import child_process`);
  check(!source.includes("process.env"), "safetyBoundaries", `${sourceFile} must not read credentials from env`);
}

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Trigger Integration Final Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P53.7 - Trigger Governance Final Validation

## Summary

- Trigger types: ${triggerSummary.triggerTypes}
- Scheduled previews: ${scheduledSummary.previewCount}
- GitHub events: ${getGitHubTriggerCatalog().length}
- Ticket events: ${getTicketTriggerCatalog().length}
- Chat commands: ${getChatTriggerCatalog().length}
- Command Center route: /command-center/triggers

## Checks

- Schema: ${sections.schema ? "PASS" : "FAIL"}
- Manual trigger: ${sections.manual ? "PASS" : "FAIL"}
- Scheduled trigger: ${sections.scheduled ? "PASS" : "FAIL"}
- GitHub preview: ${sections.github ? "PASS" : "FAIL"}
- Ticket preview: ${sections.ticket ? "PASS" : "FAIL"}
- Chat preview: ${sections.chat ? "PASS" : "FAIL"}
- Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}
- Reports: ${sections.reports ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

## Explicit Non-Goals Preserved

- No real external network calls.
- No credentials or secrets.
- No real webhook listeners.
- No real trigger execution.
- No project mutation.
- No provider, tool, or worker execution.

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
console.log(`Schema: ${sections.schema ? "PASS" : "FAIL"}`);
console.log(`Manual trigger: ${sections.manual ? "PASS" : "FAIL"}`);
console.log(`Scheduled trigger: ${sections.scheduled ? "PASS" : "FAIL"}`);
console.log(`GitHub preview: ${sections.github ? "PASS" : "FAIL"}`);
console.log(`Ticket preview: ${sections.ticket ? "PASS" : "FAIL"}`);
console.log(`Chat preview: ${sections.chat ? "PASS" : "FAIL"}`);
console.log(`Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}`);
console.log(`Reports: ${sections.reports ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`Safety boundaries: ${sections.safetyBoundaries ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
