import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_PATH = join(ROOT, "reports", "os-phase-status-report.md");
const ALLOWED_STATUSES = ["planned", "in_progress", "complete", "blocked", "skipped"];
const CURRENT_PHASE_IDS = new Set(["P41.8", "P41.8.2A"]);

const sections = {
  nexusPhases: true,
  phaseStatus: true,
  p417Entries: true,
  completedPhaseCommits: true,
  currentPhase: true,
  previousPhase: true,
  nextPhase: true,
  commandCenterVisibility: true,
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

check(phaseStatus.currentPhase === "P41.8.2A", "currentPhase", "currentPhase must be P41.8.2A");
check(phaseStatus.previousPhase === "P41.8.2", "previousPhase", "previousPhase must be P41.8.2");
check(phaseStatus.nextPhase === "P41.8.3", "nextPhase", "nextPhase must be P41.8.3");
check(statusById.has(phaseStatus.currentPhase), "currentPhase", "currentPhase entry must exist");
check(statusById.has(phaseStatus.previousPhase), "previousPhase", "previousPhase entry must exist");
check(statusById.has(phaseStatus.nextPhase), "nextPhase", "nextPhase entry must exist");

for (const entry of phaseStatus.phases || []) {
  check(Boolean(entry.phaseId), "phaseStatus", "Every phase status needs phaseId");
  check(Boolean(entry.title), "phaseStatus", `Every phase status needs title: ${entry.phaseId}`);
  check(ALLOWED_STATUSES.includes(entry.status), "phaseStatus", `Invalid status for ${entry.phaseId}: ${entry.status}`);
  check(
    entry.commandCenterVisible === true || entry.commandCenterVisible === false,
    "commandCenterVisibility",
    `Every phase status needs commandCenterVisible boolean: ${entry.phaseId}`,
  );
}

for (const phaseId of [
  "P41.7.1",
  "P41.7.2",
  "P41.7.3",
  "P41.7.4",
  "P41.7.5",
  "P41.7.6",
  "P41.7.7",
  "P41.7",
  "P41.8",
  "P41.8.1",
  "P41.8.1A",
  "P41.8.2",
  "P41.8.2A",
  "P41.8.3",
  "P41.8.6",
]) {
  check(indexById.has(phaseId), "p417Entries", `nexus-phases missing ${phaseId}`);
  check(statusById.has(phaseId), "p417Entries", `phase-status missing ${phaseId}`);
}

for (const phaseId of ["P41.7.1", "P41.7.2", "P41.7.3", "P41.7.4", "P41.7.5", "P41.7.6"]) {
  const entry = statusById.get(phaseId);
  check(entry?.status === "complete", "p417Entries", `${phaseId} must be complete`);
  check(Boolean(entry?.branch), "completedPhaseCommits", `${phaseId} must have a branch`);
  check(Boolean(entry?.commit), "completedPhaseCommits", `${phaseId} must have a commit`);
  check(entry?.commit !== "pending-final-commit", "completedPhaseCommits", `${phaseId} must have a real commit`);
}

const p4175 = statusById.get("P41.7.5");
check(p4175?.branch === "docs/command-center-help-links-navigation", "p417Entries", "P41.7.5 branch mismatch");
check(p4175?.commit === "49c09bd", "completedPhaseCommits", "P41.7.5 commit must be 49c09bd");

const p4176 = statusById.get("P41.7.6");
check(p4176?.status === "complete", "previousPhase", "P41.7.6 must be complete");
check(p4176?.branch === "docs/docs-coverage-final-validation", "previousPhase", "P41.7.6 branch mismatch");
check(p4176?.commit === "6dc3cff", "completedPhaseCommits", "P41.7.6 commit must be 6dc3cff");
check(p4176?.nextPhase === "P41.7.7", "nextPhase", "P41.7.6 nextPhase must be P41.7.7");

const p4177 = statusById.get("P41.7.7");
check(p4177?.status === "complete", "previousPhase", "P41.7.7 must be complete");
check(p4177?.branch === "ui/header-roadmap-docs-polish", "previousPhase", "P41.7.7 branch mismatch");
check(p4177?.commit === "b9d101a", "completedPhaseCommits", "P41.7.7 commit must be b9d101a");
check(p4177?.nextPhase === "P41.8.1", "nextPhase", "P41.7.7 nextPhase must be P41.8.1");

const p417 = statusById.get("P41.7");
check(p417?.status === "complete", "p417Entries", "P41.7 parent phase must be complete");
check(p417?.branch === "ui/header-roadmap-docs-polish", "p417Entries", "P41.7 parent branch mismatch");
check(p417?.commit === "b9d101a", "completedPhaseCommits", "P41.7 parent commit must be b9d101a");
check(p417?.nextPhase === "P41.8.1", "nextPhase", "P41.7 parent nextPhase must be P41.8.1");

const p418 = statusById.get("P41.8");
check(p418?.status === "in_progress", "currentPhase", "P41.8 must be in_progress");
check(p418?.title === "Centralized Activity Log + Observability Ledger", "nextPhase", "P41.8 title mismatch");
check(p418?.nextPhase === "P41.8.2A", "nextPhase", "P41.8 parent nextPhase must be P41.8.2A");

const p4181 = statusById.get("P41.8.1");
check(p4181?.status === "complete", "previousPhase", "P41.8.1 must be complete");
check(p4181?.title === "Activity Event Schema + Correlation ID Model", "previousPhase", "P41.8.1 title mismatch");
check(p4181?.branch === "observability/activity-event-schema", "previousPhase", "P41.8.1 branch mismatch");
check(p4181?.commit === "30c3bea", "completedPhaseCommits", "P41.8.1 commit must be 30c3bea");
check(p4181?.nextPhase === "P41.8.1A", "nextPhase", "P41.8.1 nextPhase must be P41.8.1A");

const p4181a = statusById.get("P41.8.1A");
check(p4181a?.status === "complete", "previousPhase", "P41.8.1A must be complete");
check(p4181a?.title === "Docs & Guides Usability + Header Simplification", "previousPhase", "P41.8.1A title mismatch");
check(p4181a?.branch === "fix/docs-guides-header-polish", "previousPhase", "P41.8.1A branch mismatch");
check(p4181a?.commit === "ac288b0", "completedPhaseCommits", "P41.8.1A commit must be ac288b0");
check(p4181a?.nextPhase === "P41.8.2", "nextPhase", "P41.8.1A nextPhase must be P41.8.2");

const p4182 = statusById.get("P41.8.2");
check(p4182?.status === "complete", "previousPhase", "P41.8.2 must be complete");
check(p4182?.title === "Central Activity Logger", "previousPhase", "P41.8.2 title mismatch");
check(p4182?.branch === "observability/central-activity-logger", "previousPhase", "P41.8.2 branch mismatch");
check(p4182?.commit === "3a63789", "completedPhaseCommits", "P41.8.2 commit must be 3a63789");
check(p4182?.nextPhase === "P41.8.2A", "nextPhase", "P41.8.2 nextPhase must be P41.8.2A");

const p4182a = statusById.get("P41.8.2A");
check(p4182a?.status === "complete" || p4182a?.status === "in_progress", "currentPhase", "P41.8.2A must be current or complete");
check(p4182a?.title === "Docs & Guides Interaction + Activity Log Placeholder Polish", "currentPhase", "P41.8.2A title mismatch");
check(p4182a?.branch === "fix/docs-guides-activity-log-polish", "currentPhase", "P41.8.2A branch mismatch");
check(Boolean(p4182a?.commit), "currentPhase", "P41.8.2A must have a commit or pending-final-commit placeholder");
check(p4182a?.nextPhase === "P41.8.3", "nextPhase", "P41.8.2A nextPhase must be P41.8.3");

const p4183 = statusById.get("P41.8.3");
check(p4183?.status === "planned", "nextPhase", "P41.8.3 must be planned");
check(p4183?.title === "API/UI/Action Bridge Activity Capture", "nextPhase", "P41.8.3 title mismatch");

for (const entry of phaseStatus.phases || []) {
  if (entry.status !== "complete") continue;
  check(Boolean(entry.branch), "completedPhaseCommits", `Completed phase missing branch: ${entry.phaseId}`);
  check(Boolean(entry.commit), "completedPhaseCommits", `Completed phase missing commit: ${entry.phaseId}`);
  check(Boolean(entry.summary), "completedPhaseCommits", `Completed phase missing summary: ${entry.phaseId}`);
  check(Array.isArray(entry.checksRun), "completedPhaseCommits", `Completed phase missing checksRun: ${entry.phaseId}`);
  check(Array.isArray(entry.knownLimitations), "completedPhaseCommits", `Completed phase missing knownLimitations: ${entry.phaseId}`);
  check(Boolean(entry.nextPhase), "completedPhaseCommits", `Completed phase missing nextPhase: ${entry.phaseId}`);
  check(entry.commandCenterVisible === true, "commandCenterVisibility", `Completed phase must be Command Center visible: ${entry.phaseId}`);
  if (!CURRENT_PHASE_IDS.has(entry.phaseId)) {
    check(entry.commit !== "pending-final-commit", "completedPhaseCommits", `Completed prior phase has pending commit: ${entry.phaseId}`);
  }
}

for (const forbidden of ["CareLoop", "careloop", "projects/careloop", "DemoApp"]) {
  check(!phaseStatusSource.includes(forbidden), "publicSafeWording", `Phase status contains forbidden term: ${forbidden}`);
}

let result = Object.values(sections).every(Boolean) ? "PASS" : "FAIL";

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
- P41.7 entries: ${sections.p417Entries ? "PASS" : "FAIL"}
- Completed phase commits: ${sections.completedPhaseCommits ? "PASS" : "FAIL"}
- Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}
- Previous phase: ${sections.previousPhase ? "PASS" : "FAIL"}
- Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}
- Command Center visibility: ${sections.commandCenterVisibility ? "PASS" : "FAIL"}
- Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}
- Report written: ${sections.reportWritten ? "PASS" : "FAIL"}

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

console.log(`Nexus phases: ${sections.nexusPhases ? "PASS" : "FAIL"}`);
console.log(`Phase status: ${sections.phaseStatus ? "PASS" : "FAIL"}`);
console.log(`P41.7 entries: ${sections.p417Entries ? "PASS" : "FAIL"}`);
console.log(`Completed phase commits: ${sections.completedPhaseCommits ? "PASS" : "FAIL"}`);
console.log(`Current phase: ${sections.currentPhase ? "PASS" : "FAIL"}`);
console.log(`Previous phase: ${sections.previousPhase ? "PASS" : "FAIL"}`);
console.log(`Next phase: ${sections.nextPhase ? "PASS" : "FAIL"}`);
console.log(`Command Center visibility: ${sections.commandCenterVisibility ? "PASS" : "FAIL"}`);
console.log(`Public-safe wording: ${sections.publicSafeWording ? "PASS" : "FAIL"}`);
console.log(`Report written: ${sections.reportWritten ? "PASS" : "FAIL"}`);
console.log(`Result: ${result}`);

if (result !== "PASS") {
  process.exitCode = 1;
}
