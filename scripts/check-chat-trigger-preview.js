import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createChatTriggerPreview,
  getChatTriggerCatalog,
  mapChatCommandToNexusAction,
  validateChatTriggerPreview,
} from "../integrations/chatTriggerPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/chat-trigger-preview-report.md");
const sections = {
  modules: true,
  catalog: true,
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

console.log("NEXUS Chat Trigger Preview Check");
console.log("================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const source = read("integrations/chatTriggerPreview.js");

check(existsSync(join(ROOT, "integrations/chatTriggerPreview.js")), "modules", "Missing chatTriggerPreview module");
check(
  packageJson.scripts?.["check:chat-trigger-preview"] === "node scripts/check-chat-trigger-preview.js",
  "modules",
  "Missing package script check:chat-trigger-preview",
);
for (const fn of [getChatTriggerCatalog, createChatTriggerPreview, validateChatTriggerPreview, mapChatCommandToNexusAction]) {
  check(typeof fn === "function", "modules", "Chat trigger export must be a function");
}

const catalog = getChatTriggerCatalog();
for (const system of ["slack_preview", "teams_preview"]) {
  check(catalog.some((entry) => entry.system === system), "catalog", `Missing system: ${system}`);
  for (const command of ["/nexus plan", "/nexus review", "/nexus qa", "/nexus fix", "/nexus ship", "/nexus status", "/nexus freeze", "/nexus guard"]) {
    const preview = createChatTriggerPreview({ system, command });
    const validation = validateChatTriggerPreview(preview);
    check(validation.valid, "preview", `${system} ${command} preview must validate: ${validation.errors.join("; ")}`);
    check(preview.dryRunOnly === true, "preview", `${system} ${command} must be dry-run only`);
    check(preview.executionAllowed === false, "preview", `${system} ${command} execution must be disabled`);
    check(preview.chatApiCallsAllowed === false, "preview", `${system} ${command} API calls must be disabled`);
    check(preview.botTokenUseAllowed === false, "preview", `${system} ${command} bot token use must be disabled`);
    check(preview.webhookReceiverAllowed === false, "preview", `${system} ${command} webhook receiver must be disabled`);
    check(preview.channelDataStorageAllowed === false, "preview", `${system} ${command} channel storage must be disabled`);
    check(preview.userDataStorageAllowed === false, "preview", `${system} ${command} user storage must be disabled`);
    check(preview.requiresScopeConfirmation === true, "preview", `${system} ${command} must require scope confirmation`);
    check(preview.requiresProjectConfirmation === true, "preview", `${system} ${command} must require project confirmation`);
  }
}
check(!source.includes("fetch("), "preview", "Chat preview must not call fetch");
check(!source.includes("process.env.SLACK"), "preview", "Chat preview must not read Slack env vars");
check(!source.includes("process.env.TEAMS"), "preview", "Chat preview must not read Teams env vars");

check(commandCenterSource.includes("Slack / Teams - Planned integration"), "commandCenter", "Command Center must show chat integration preview");
check(commandCenterSource.includes("chat execution is disabled"), "commandCenter", "Command Center must show chat execution disabled");

const docs = read("docs/architecture/TRIGGER_INTEGRATION_GATEWAY.md");
check(docs.includes("P53.6 - Slack / Teams Placeholder Trigger Models"), "docs", "Architecture doc missing P53.6");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P53.5")?.status === "complete", "osPhaseStatus", "P53.5 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P53.6")?.status), "osPhaseStatus", "P53.6 must be tracked");
check(phaseStatus.currentPhase === "P53.6", "osPhaseStatus", "Current phase must be P53.6");
check(phaseStatus.nextPhase === "P53.7", "osPhaseStatus", "Next phase must be P53.7");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Chat Trigger Preview Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P53.6 - Slack / Teams Placeholder Trigger Models

## Summary

- Preview systems: Slack, Teams
- Preview commands: ${catalog.length}
- Chat API calls: disabled
- Bot tokens: disabled
- Webhook receiver: disabled
- Channel/user storage: disabled

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Catalog: ${sections.catalog ? "PASS" : "FAIL"}
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
console.log(`Catalog: ${sections.catalog ? "PASS" : "FAIL"}`);
console.log(`Preview: ${sections.preview ? "PASS" : "FAIL"}`);
console.log(`Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}`);
console.log(`Docs: ${sections.docs ? "PASS" : "FAIL"}`);
console.log(`OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}`);
console.log(`No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
