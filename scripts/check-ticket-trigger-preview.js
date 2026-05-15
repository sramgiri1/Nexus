import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createTicketTriggerPreview,
  getTicketTriggerCatalog,
  mapTicketEventToNexusAction,
  validateTicketTriggerPreview,
} from "../integrations/ticketTriggerPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/ticket-trigger-preview-report.md");
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

console.log("NEXUS Ticket Trigger Preview Check");
console.log("==================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const source = read("integrations/ticketTriggerPreview.js");

check(existsSync(join(ROOT, "integrations/ticketTriggerPreview.js")), "modules", "Missing ticketTriggerPreview module");
check(
  packageJson.scripts?.["check:ticket-trigger-preview"] === "node scripts/check-ticket-trigger-preview.js",
  "modules",
  "Missing package script check:ticket-trigger-preview",
);
for (const fn of [getTicketTriggerCatalog, createTicketTriggerPreview, validateTicketTriggerPreview, mapTicketEventToNexusAction]) {
  check(typeof fn === "function", "modules", "Ticket trigger export must be a function");
}

const catalog = getTicketTriggerCatalog();
for (const system of ["jira_preview", "linear_preview"]) {
  check(catalog.some((entry) => entry.system === system), "catalog", `Missing system: ${system}`);
  for (const eventType of ["issue.created", "issue.updated", "issue.assigned", "issue.status_changed", "issue.priority_changed", "comment.created"]) {
    const preview = createTicketTriggerPreview({ system, eventType, ticketId: `${system}-${eventType}` });
    const validation = validateTicketTriggerPreview(preview);
    check(validation.valid, "preview", `${system} ${eventType} preview must validate: ${validation.errors.join("; ")}`);
    check(preview.dryRunOnly === true, "preview", `${system} ${eventType} must be dry-run only`);
    check(preview.executionAllowed === false, "preview", `${system} ${eventType} execution must be disabled`);
    check(preview.ticketApiCallsAllowed === false, "preview", `${system} ${eventType} API calls must be disabled`);
    check(preview.externalNetworkCallsAllowed === false, "preview", `${system} ${eventType} network calls must be disabled`);
    check(preview.credentialUseAllowed === false, "preview", `${system} ${eventType} credentials must be disabled`);
    check(preview.webhookReceiverAllowed === false, "preview", `${system} ${eventType} webhook receiver must be disabled`);
    check(preview.ticketMutationAllowed === false, "preview", `${system} ${eventType} ticket mutation must be disabled`);
    check(Boolean(preview.privacyClassification), "preview", `${system} ${eventType} must require privacy classification`);
    check(Boolean(preview.projectId), "preview", `${system} ${eventType} must require project scope`);
  }
}
check(!source.includes("fetch("), "preview", "Ticket preview must not call fetch");
check(!source.includes("process.env.JIRA"), "preview", "Ticket preview must not read Jira env vars");
check(!source.includes("process.env.LINEAR"), "preview", "Ticket preview must not read Linear env vars");

check(commandCenterSource.includes("Jira / Linear - Planned integration"), "commandCenter", "Command Center must show ticket integration preview");
check(commandCenterSource.includes("no outbound calls"), "commandCenter", "Command Center must show no outbound calls");

const docs = read("docs/architecture/TRIGGER_INTEGRATION_GATEWAY.md");
check(docs.includes("P53.5 - Jira / Linear Placeholder Trigger Models"), "docs", "Architecture doc missing P53.5");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P53.4")?.status === "complete", "osPhaseStatus", "P53.4 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P53.5")?.status), "osPhaseStatus", "P53.5 must be tracked");
check(phaseStatus.currentPhase === "P53.5", "osPhaseStatus", "Current phase must be P53.5");
check(phaseStatus.nextPhase === "P53.6", "osPhaseStatus", "Next phase must be P53.6");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS Ticket Trigger Preview Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P53.5 - Jira / Linear Placeholder Trigger Models

## Summary

- Preview systems: Jira, Linear
- Preview events: ${catalog.length}
- Ticket API calls: disabled
- Credentials: disabled
- Ticket mutation: disabled

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
