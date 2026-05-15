import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  createGitHubEventPreview,
  getGitHubTriggerCatalog,
  mapGitHubEventToNexusAction,
  validateGitHubEventPreview,
} from "../integrations/githubTriggerPreview.js";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports/github-trigger-preview-report.md");
const sections = {
  modules: true,
  catalog: true,
  preview: true,
  commandCenter: true,
  docs: true,
  osPhaseStatus: true,
  noForbiddenChanges: true,
  formattingReadability: true,
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

console.log("NEXUS GitHub Trigger Preview Check");
console.log("==================================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);
const packageJson = parseJson("package.json", "modules");
const phaseStatus = parseJson("os-roadmap/phase-status.json", "osPhaseStatus");
const commandCenterSource = read("dashboard/src/pages/CommandCenterV2.jsx");
const source = read("integrations/githubTriggerPreview.js");

check(existsSync(join(ROOT, "integrations/githubTriggerPreview.js")), "modules", "Missing githubTriggerPreview module");
check(
  packageJson.scripts?.["check:github-trigger-preview"] === "node scripts/check-github-trigger-preview.js",
  "modules",
  "Missing package script check:github-trigger-preview",
);
for (const fn of [getGitHubTriggerCatalog, createGitHubEventPreview, validateGitHubEventPreview, mapGitHubEventToNexusAction]) {
  check(typeof fn === "function", "modules", "GitHub trigger export must be a function");
}

const catalog = getGitHubTriggerCatalog();
for (const eventType of [
  "pull_request.opened",
  "pull_request.synchronize",
  "pull_request.review_requested",
  "pull_request_review.submitted",
  "issue_comment.created",
  "check_suite.completed",
  "workflow_run.failed",
]) {
  check(catalog.some((entry) => entry.eventType === eventType), "catalog", `Missing event type: ${eventType}`);
  const preview = createGitHubEventPreview({ eventType, deliveryId: `${eventType}-delivery` });
  const validation = validateGitHubEventPreview(preview);
  check(validation.valid, "preview", `${eventType} preview must validate: ${validation.errors.join("; ")}`);
  check(preview.dryRunOnly === true, "preview", `${eventType} must be dry-run only`);
  check(preview.executionAllowed === false, "preview", `${eventType} execution must be disabled`);
  check(preview.githubApiCallsAllowed === false, "preview", `${eventType} GitHub API calls must be disabled`);
  check(preview.externalNetworkCallsAllowed === false, "preview", `${eventType} network calls must be disabled`);
  check(preview.webhookServerAllowed === false, "preview", `${eventType} webhook server must be disabled`);
  check(preview.credentialUseAllowed === false, "preview", `${eventType} credential use must be disabled`);
  check(preview.prMutationAllowed === false, "preview", `${eventType} PR mutation must be disabled`);
  check(Boolean(preview.dedupeKey), "preview", `${eventType} must have dedupe key`);
}
check(!source.includes("fetch("), "preview", "GitHub preview must not call fetch");
check(!source.includes("https://api.github.com"), "preview", "GitHub preview must not include GitHub API URL");
check(!source.includes("process.env.GITHUB"), "preview", "GitHub preview must not read GitHub token env vars");

check(commandCenterSource.includes("GitHub Events - Preview only"), "commandCenter", "Command Center must show GitHub preview status");
check(commandCenterSource.includes("webhook execution is disabled"), "commandCenter", "Command Center must show webhook disabled copy");

const docs = read("docs/architecture/TRIGGER_INTEGRATION_GATEWAY.md");
check(docs.includes("P53.4 - GitHub Event Trigger Preview"), "docs", "Architecture doc missing P53.4");

const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));
check(statusById.get("P53.3")?.status === "complete", "osPhaseStatus", "P53.3 must be complete");
check(["in_progress", "complete"].includes(statusById.get("P53.4")?.status), "osPhaseStatus", "P53.4 must be tracked");
check(phaseStatus.currentPhase === "P53.4", "osPhaseStatus", "Current phase must be P53.4");
check(phaseStatus.nextPhase === "P53.5", "osPhaseStatus", "Next phase must be P53.5");

for (const file of changedFiles()) {
  check(!file.startsWith("projects/careloop/"), "noForbiddenChanges", `Forbidden private project change: ${file}`);
  check(!file.startsWith("projects/careloop-ios/"), "noForbiddenChanges", `Forbidden private iOS project change: ${file}`);
  check(!file.startsWith("agents/"), "noForbiddenChanges", `Forbidden agent change: ${file}`);
  check(!file.startsWith("providers/"), "noForbiddenChanges", `Forbidden provider change: ${file}`);
  check(!file.startsWith("tools/"), "noForbiddenChanges", `Forbidden tools runtime change: ${file}`);
  check(!file.startsWith("command-execution/"), "noForbiddenChanges", `Forbidden command execution change: ${file}`);
}

for (const file of ["integrations/githubTriggerPreview.js", "scripts/check-github-trigger-preview.js"]) {
  const longLine = read(file).split("\n").find((line) => line.length > 1000);
  check(!longLine, "formattingReadability", `${file} has a line over 1000 chars`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";
const report = `# NEXUS GitHub Trigger Preview Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Scope

P53.4 - GitHub Event Trigger Preview

## Summary

- Preview events: ${catalog.length}
- GitHub API calls: disabled
- Webhook server: disabled
- Credentials: disabled
- PR mutation: disabled

## Checks

- Modules: ${sections.modules ? "PASS" : "FAIL"}
- Catalog: ${sections.catalog ? "PASS" : "FAIL"}
- Preview: ${sections.preview ? "PASS" : "FAIL"}
- Command Center: ${sections.commandCenter ? "PASS" : "FAIL"}
- Docs: ${sections.docs ? "PASS" : "FAIL"}
- OS phase status: ${sections.osPhaseStatus ? "PASS" : "FAIL"}
- No forbidden changes: ${sections.noForbiddenChanges ? "PASS" : "FAIL"}
- Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}
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
console.log(`Formatting/readability: ${sections.formattingReadability ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") process.exitCode = 1;
