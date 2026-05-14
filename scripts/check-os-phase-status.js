import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "os-phase-status-report.md");
const ALLOWED_STATUSES = ["planned", "in_progress", "complete", "blocked", "skipped"];

const sections = {
  nexusPhases: true,
  phaseStatus: true,
  currentPhase: true,
  previousPhase: true,
  nextPhase: true,
  requiredP417Entries: true,
  publicSafeWording: true,
  reportWritten: true,
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

console.log("NEXUS OS Phase Status Check\n===========================");

const branch = gitOutput(["branch", "--show-current"]);
const head = gitOutput(["rev-parse", "--short", "HEAD"]);

const phaseIndexPath = "os-roadmap/nexus-phases.json";
const phaseStatusPath = "os-roadmap/phase-status.json";
const phaseIndexSource = read(phaseIndexPath);
const phaseStatusSource = read(phaseStatusPath);

check(existsSync(join(ROOT, phaseIndexPath)), "nexusPhases", `${phaseIndexPath} is missing`);
check(existsSync(join(ROOT, phaseStatusPath)), "phaseStatus", `${phaseStatusPath} is missing`);
check(phaseStatusSource.trim().length > 0, "phaseStatus", `${phaseStatusPath} is empty`);

let phaseIndex = {};
let phaseStatus = {};

try {
  phaseIndex = JSON.parse(phaseIndexSource);
} catch (error) {
  fail("nexusPhases", `Could not parse ${phaseIndexPath}: ${error.message}`);
}

try {
  phaseStatus = JSON.parse(phaseStatusSource);
} catch (error) {
  fail("phaseStatus", `Could not parse ${phaseStatusPath}: ${error.message}`);
}

check(Array.isArray(phaseIndex.phases), "nexusPhases", "nexus-phases.json must include a phases array");
check(Array.isArray(phaseStatus.phases), "phaseStatus", "phase-status.json must include a phases array");

const indexById = new Map((phaseIndex.phases || []).map((entry) => [entry.phaseId, entry]));
const statusById = new Map((phaseStatus.phases || []).map((entry) => [entry.phaseId, entry]));

check(phaseStatus.currentPhase === "P41.7.5", "currentPhase", "currentPhase must be P41.7.5");
check(phaseStatus.previousPhase === "P41.7.4", "previousPhase", "previousPhase must be P41.7.4");
check(phaseStatus.nextPhase === "P41.7.6", "nextPhase", "nextPhase must be P41.7.6");
check(statusById.has(phaseStatus.currentPhase), "currentPhase", "currentPhase entry must exist");
check(statusById.has(phaseStatus.previousPhase), "previousPhase", "previousPhase entry must exist");
check(statusById.has(phaseStatus.nextPhase), "nextPhase", "nextPhase entry must exist");

for (const entry of phaseStatus.phases || []) {
  check(Boolean(entry.phaseId), "phaseStatus", "Every phase status needs phaseId");
  check(Boolean(entry.title), "phaseStatus", `Every phase status needs title: ${entry.phaseId}`);
  check(ALLOWED_STATUSES.includes(entry.status), "phaseStatus", `Invalid status for ${entry.phaseId}: ${entry.status}`);
  check(
    entry.commandCenterVisible === true || entry.commandCenterVisible === false,
    "phaseStatus",
    `Every phase status needs commandCenterVisible boolean: ${entry.phaseId}`,
  );
}

for (const phaseId of ["P41.7.4", "P41.7.5", "P41.7.6"]) {
  check(indexById.has(phaseId), "requiredP417Entries", `nexus-phases missing ${phaseId}`);
  check(statusById.has(phaseId), "requiredP417Entries", `phase-status missing ${phaseId}`);
}

const p4174 = statusById.get("P41.7.4");
check(p4174?.status === "complete", "requiredP417Entries", "P41.7.4 must be complete");
check(p4174?.branch === "docs/os-usage-foundation", "requiredP417Entries", "P41.7.4 branch mismatch");
check(p4174?.commit === "88d1a4b", "requiredP417Entries", "P41.7.4 commit must be 88d1a4b");

const p4175 = statusById.get("P41.7.5");
check(p4175?.status === "complete" || p4175?.status === "in_progress", "requiredP417Entries", "P41.7.5 must be current or complete");
check(
  p4175?.branch === "docs/command-center-help-links-navigation",
  "requiredP417Entries",
  "P41.7.5 branch mismatch",
);

const p4176 = statusById.get("P41.7.6");
check(p4176?.status === "planned", "requiredP417Entries", "P41.7.6 must be planned");

for (const forbidden of ["CareLoop", "careloop", "projects/careloop", "DemoApp"]) {
  check(!phaseStatusSource.includes(forbidden), "publicSafeWording", `Phase status contains forbidden term: ${forbidden}`);
}

let reportWritten = true;
const result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

const report = `# NEXUS OS Phase Status Report

## Metadata

- Generated at: ${new Date().toISOString()}
- Validation branch: ${branch}
- Validation HEAD: ${head}
- Note: Validation HEAD is the commit checked out when the report was generated. It may differ from the final commit that contains this report.

## Current OS Phase

- Current phase: ${phaseStatus.currentPhase || "unknown"}
- Previous phase: ${phaseStatus.previousPhase || "unknown"}
- Next phase: ${phaseStatus.nextPhase || "unknown"}

## Checks

- Nexus phases: ${sections.nexusPhases ? "PASS" : "FAIL"}
- Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}
- Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}
- Previous phase: ${sections.previousPhase ? "PASS" : "FAIL"}
- Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}
- Required P41.7 entries: ${sections.requiredP417Entries ? "PASS" : "FAIL"}
- Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}
- Report written: ${reportWritten ? "PASS" : "FAIL"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}

## Result

${result}
`;

try {
  writeFileSync(REPORT_PATH, report, "utf8");
} catch (error) {
  reportWritten = false;
  fail("reportWritten", `Could not write ${REPORT_PATH}: ${error.message}`);
}

console.log(`Nexus phases: ${sections.nexusPhases ? "PASS" : "FAIL"}`);
console.log(`Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}`);
console.log(`Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}`);
console.log(`Previous phase: ${sections.previousPhase ? "PASS" : "FAIL"}`);
console.log(`Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}`);
console.log(`Required P41.7 entries: ${sections.requiredP417Entries ? "PASS" : "FAIL"}`);
console.log(`Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${Object.values(sections).every(Boolean) ? "PASS" : "FAIL"}`);

if (!Object.values(sections).every(Boolean)) {
  process.exitCode = 1;
}
